import { createRequire } from "module";
import sharp from "sharp";
import { eq, isNull, or, sql, and, gt, notInArray } from "drizzle-orm";
import { s3Service } from "./s3";
import { imageService } from "./image";
import { getOffchainDb, getViewsDb } from "./database";
import { mergeImage } from "../../offchain.schema";

const require = createRequire(import.meta.url);
const Merge = require("@scapes-studio/scape-renderer/build/src/Merge").default;

export type MergeImageStatus = "pending" | "processed" | "failed";

export interface ProcessResult {
  tokenId: number;
  success: boolean;
  error?: string;
}

export interface ProcessBatchOptions {
  limit?: number;
  onProgress?: (result: ProcessResult) => void;
}

const MERGE_TOKEN_ID_START = 10001;

export class MergeImagesService {
  /**
   * Find pending merge token IDs.
   * A merge is pending if:
   * - tokenId > 10000
   * - Not in merge_image table, OR status is 'failed'
   */
  async findPendingMerges(limit = 50): Promise<number[]> {
    const viewsDb = getViewsDb();
    const offchainDb = getOffchainDb();

    // Get all processed/pending token IDs from merge_image
    const existingRecords = await offchainDb
      .select({ tokenId: mergeImage.tokenId })
      .from(mergeImage)
      .where(eq(mergeImage.status, "processed"));

    const processedIds = existingRecords.map((r) => r.tokenId);

    // Query scapes with tokenId > 10000 that aren't processed
    const pendingScapes = await viewsDb.execute(
      sql`SELECT id::integer as "tokenId" FROM scape
          WHERE id > ${MERGE_TOKEN_ID_START - 1}
          ${processedIds.length > 0 ? sql`AND id NOT IN (${sql.join(processedIds.map(id => sql`${id}`), sql`, `)})` : sql``}
          ORDER BY id ASC
          LIMIT ${limit}`,
    );

    return (pendingScapes.rows as Array<{ tokenId: number }>).map(
      (r) => r.tokenId,
    );
  }

  /**
   * Process a single merge image: render, resize, and upload to S3.
   */
  async processImage(tokenId: number): Promise<ProcessResult> {
    const offchainDb = getOffchainDb();
    const now = Math.floor(Date.now() / 1000);

    try {
      // Ensure we have a record in the DB
      await offchainDb
        .insert(mergeImage)
        .values({
          tokenId,
          status: "pending",
          createdAt: now,
        })
        .onConflictDoUpdate({
          target: mergeImage.tokenId,
          set: {
            status: "pending",
            errorMessage: null,
          },
        });

      // 1. Render the merge PNG (original size)
      const merge = Merge.fromId(tokenId.toString());
      const pngBuffer: Buffer = await merge.render();

      if (!pngBuffer) {
        throw new Error("Renderer returned empty buffer");
      }

      // Get original dimensions
      const metadata = await sharp(pngBuffer).metadata();
      const originalWidth = metadata.width || 0;
      const originalHeight = metadata.height || 0;

      // 2. Generate large PNG (360px height, nearest-neighbor upscale)
      const largeHeight = 360;
      const largeWidth = Math.round(
        originalWidth * (largeHeight / originalHeight),
      );
      const largePng = await sharp(pngBuffer)
        .resize(largeWidth, largeHeight, {
          kernel: sharp.kernel.nearest,
        })
        .png()
        .toBuffer();

      // 3. Generate preview PNG (1200x630, black bg, centered)
      const previewWidth = 1200;
      const previewHeight = 630;

      // Scale image to fit within preview bounds
      const scaleRatio = Math.min(
        previewWidth / originalWidth,
        previewHeight / originalHeight,
      );
      const scaledWidth = Math.round(originalWidth * scaleRatio);
      const scaledHeight = Math.round(originalHeight * scaleRatio);

      const scaledImage = await sharp(pngBuffer)
        .resize(scaledWidth, scaledHeight, {
          kernel: sharp.kernel.nearest,
        })
        .toBuffer();

      // Create black background and composite the scaled image
      const previewPng = await sharp({
        create: {
          width: previewWidth,
          height: previewHeight,
          channels: 3,
          background: { r: 0, g: 0, b: 0 },
        },
      })
        .composite([
          {
            input: scaledImage,
            left: Math.round((previewWidth - scaledWidth) / 2),
            top: Math.round((previewHeight - scaledHeight) / 2),
          },
        ])
        .png()
        .toBuffer();

      // 4. Fetch SVG from contract
      const svgContent = await imageService.getScapeImage(BigInt(tokenId));

      // 5. Upload all files to S3
      const uploads = await Promise.all([
        s3Service.uploadFile(
          `scapes/sm/${tokenId}.svg`,
          Buffer.from(svgContent),
          "image/svg+xml",
        ),
        s3Service.uploadFile(
          `scapes/sm/${tokenId}.png`,
          pngBuffer,
          "image/png",
        ),
        s3Service.uploadFile(
          `scapes/lg/${tokenId}.png`,
          largePng,
          "image/png",
        ),
        s3Service.uploadFile(
          `scapes/preview/${tokenId}.png`,
          previewPng,
          "image/png",
        ),
      ]);

      // 6. Update DB record as processed
      await offchainDb
        .update(mergeImage)
        .set({
          status: "processed",
          processedAt: now,
          errorMessage: null,
        })
        .where(eq(mergeImage.tokenId, tokenId));

      return { tokenId, success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Update DB record as failed
      await offchainDb
        .update(mergeImage)
        .set({
          status: "failed",
          errorMessage,
        })
        .where(eq(mergeImage.tokenId, tokenId));

      return { tokenId, success: false, error: errorMessage };
    }
  }

  /**
   * Process a batch of pending merge images.
   */
  async processBatch(options: ProcessBatchOptions = {}): Promise<ProcessResult[]> {
    const { limit = 10, onProgress } = options;

    const pendingIds = await this.findPendingMerges(limit);
    const results: ProcessResult[] = [];

    for (const tokenId of pendingIds) {
      const result = await this.processImage(tokenId);
      results.push(result);

      if (onProgress) {
        onProgress(result);
      }
    }

    return results;
  }

  /**
   * Get statistics about merge image processing.
   */
  async getStats(): Promise<{
    total: number;
    processed: number;
    failed: number;
    pending: number;
  }> {
    const offchainDb = getOffchainDb();
    const viewsDb = getViewsDb();

    // Get total merges from scapes table
    const totalResult = await viewsDb.execute(
      sql`SELECT COUNT(*)::integer as count FROM scape WHERE id > ${MERGE_TOKEN_ID_START - 1}`,
    );
    const total = (totalResult.rows[0] as { count: number }).count;

    // Get counts by status
    const statusCounts = await offchainDb.execute(
      sql`SELECT status, COUNT(*)::integer as count FROM offchain.merge_image GROUP BY status`,
    );

    const counts = { processed: 0, failed: 0 };
    for (const row of statusCounts.rows as Array<{
      status: string;
      count: number;
    }>) {
      if (row.status === "processed") counts.processed = row.count;
      if (row.status === "failed") counts.failed = row.count;
    }

    return {
      total,
      processed: counts.processed,
      failed: counts.failed,
      pending: total - counts.processed - counts.failed,
    };
  }
}

export const mergeImagesService = new MergeImagesService();
