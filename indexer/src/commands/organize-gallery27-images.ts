import { Command } from "commander";
import { eq, isNotNull } from "drizzle-orm";
import { getOffchainDb } from "../services/database";
import { s3Service } from "../services/s3";
import {
  twentySevenYearScapeDetail,
  twentySevenYearRequest,
} from "../../offchain.schema";

interface ProcessResult {
  requestId: number;
  tokenId: number;
  status: "skipped" | "processed" | "missing_source" | "error";
  message?: string;
}

export const organizeGallery27ImagesCommand = new Command("organize:gallery27-images")
  .description("Extract step images to canonical S3 paths for TwentySevenYear scapes")
  .option("--dry-run", "Show what would be done without making changes")
  .option("--token-id <id>", "Process all requests for a specific Gallery27 token")
  .option("--stats", "Show processing statistics only")
  .action(
    async (options: {
      dryRun?: boolean;
      tokenId?: string;
      stats?: boolean;
    }) => {
      const db = getOffchainDb();

      // Get all requests with imagePath set
      const requests = await db.query.twentySevenYearRequest.findMany({
        where: isNotNull(twentySevenYearRequest.imagePath),
      });

      // Filter by token ID if specified
      const filtered = options.tokenId
        ? requests.filter((r) => r.tokenId === parseInt(options.tokenId!, 10))
        : requests;

      if (filtered.length === 0) {
        console.log("No requests found with imagePath set");
        if (options.tokenId) {
          console.log(`Token ID ${options.tokenId} has no requests with imagePath`);
        }
        process.exit(0);
      }

      // Get unique token IDs to fetch their step values
      const tokenIds = [...new Set(filtered.map((r) => r.tokenId))];
      const scapeDetails = await db.query.twentySevenYearScapeDetail.findMany({
        where: isNotNull(twentySevenYearScapeDetail.step),
      });
      const stepByToken = new Map(
        scapeDetails
          .filter((s) => s.step !== null)
          .map((s) => [s.tokenId, s.step!]),
      );

      // Stats mode
      if (options.stats) {
        console.log("\nOrganize Gallery27 Images Stats:");
        console.log(`  Total requests with imagePath: ${filtered.length}`);
        console.log(`  Unique tokens: ${tokenIds.length}`);

        let processed = 0;
        let needsProcessing = 0;

        for (const request of filtered) {
          const exists = await s3Service.objectExists(request.imagePath!);
          if (exists) {
            processed++;
          } else {
            needsProcessing++;
          }
        }

        console.log(`  Already processed:     ${processed}`);
        console.log(`  Needs processing:      ${needsProcessing}`);
        console.log(`  Progress:              ${((processed / filtered.length) * 100).toFixed(1)}%`);
        process.exit(0);
      }

      // Process mode
      console.log(`\nProcessing ${filtered.length} requests...`);
      if (options.dryRun) {
        console.log("[DRY RUN - No S3 changes will be made]\n");
      }

      const results: ProcessResult[] = [];

      for (const request of filtered) {
        const step = stepByToken.get(request.tokenId);
        const result = await processRequest(request, step, options.dryRun ?? false);
        results.push(result);

        const statusIcon =
          result.status === "processed"
            ? "+"
            : result.status === "skipped"
              ? "-"
              : "!";

        console.log(
          `  [${statusIcon}] Request ${result.requestId} (token ${result.tokenId}): ${result.status}${result.message ? ` - ${result.message}` : ""}`,
        );
      }

      // Summary
      const processed = results.filter((r) => r.status === "processed").length;
      const skipped = results.filter((r) => r.status === "skipped").length;
      const missing = results.filter((r) => r.status === "missing_source").length;
      const errors = results.filter((r) => r.status === "error").length;

      console.log("\nCompleted:");
      console.log(`  Processed:      ${processed}`);
      console.log(`  Skipped:        ${skipped}`);
      console.log(`  Missing source: ${missing}`);
      console.log(`  Errors:         ${errors}`);

      process.exit(errors > 0 ? 1 : 0);
    },
  );

async function processRequest(
  request: {
    id: number;
    tokenId: number;
    imagePath: string | null;
  },
  step: number | undefined,
  dryRun: boolean,
): Promise<ProcessResult> {
  const { id: requestId, tokenId, imagePath } = request;

  if (!imagePath) {
    return {
      requestId,
      tokenId,
      status: "error",
      message: "Missing imagePath",
    };
  }

  try {
    // Check if destination files already exist (means already processed)
    const destSmallExists = await s3Service.objectExists(imagePath);
    const destUpscaledExists = await s3Service.objectExists(`${imagePath}_upscaled`);

    if (destSmallExists && destUpscaledExists) {
      return {
        requestId,
        tokenId,
        status: "skipped",
        message: "Both files already exist",
      };
    }

    // Build source paths based on step number (if available)
    let sourceSmall: string | null = null;
    let sourceUpscaled: string | null = null;
    let sourceSmallExists = false;
    let sourceUpscaledExists = false;

    if (step !== undefined) {
      const stepStr = step.toString().padStart(3, "0");
      sourceSmall = `${imagePath}/${stepStr}_s.jpg`;
      sourceUpscaled = `${imagePath}/${stepStr}_upscaled.png`;
      sourceSmallExists = await s3Service.objectExists(sourceSmall);
      sourceUpscaledExists = await s3Service.objectExists(sourceUpscaled);
    }

    // Fallback to final.png if step files don't exist
    const sourceFinal = `${imagePath}/final.png`;
    let useFinalFallback = false;

    if (!sourceSmallExists) {
      const finalExists = await s3Service.objectExists(sourceFinal);
      if (finalExists) {
        sourceSmall = sourceFinal;
        sourceSmallExists = true;
        useFinalFallback = true;
      }
    }

    if (!sourceSmallExists) {
      return {
        requestId,
        tokenId,
        status: "missing_source",
        message: step !== undefined
          ? `No source files at step ${step} or final.png`
          : `No final.png found`,
      };
    }

    if (dryRun) {
      const actions: string[] = [];
      if (sourceSmallExists && !destSmallExists) {
        actions.push(`copy ${sourceSmall} → ${imagePath}`);
      }
      if (!useFinalFallback && sourceUpscaledExists && !destUpscaledExists) {
        actions.push(`copy ${sourceUpscaled} → ${imagePath}_upscaled`);
      }
      return {
        requestId,
        tokenId,
        status: "processed",
        message: actions.join("; ") + (useFinalFallback ? " (using final.png fallback)" : ""),
      };
    }

    // Copy files
    if (sourceSmallExists && !destSmallExists) {
      await s3Service.copyObject(
        sourceSmall!,
        imagePath,
        useFinalFallback ? "image/png" : "image/jpeg",
      );
    }

    // Only copy upscaled if not using final.png fallback
    if (!useFinalFallback && sourceUpscaledExists && !destUpscaledExists) {
      await s3Service.copyObject(sourceUpscaled!, `${imagePath}_upscaled`, "image/png");
    }

    return {
      requestId,
      tokenId,
      status: "processed",
      message: "Files copied",
    };
  } catch (error) {
    return {
      requestId,
      tokenId,
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
