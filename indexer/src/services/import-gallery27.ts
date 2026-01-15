import pg from "pg";
import { getOffchainDb, getOffchainPool } from "./database";
import {
  twentySevenYearScapeDetail,
  twentySevenYearRequest,
} from "../../offchain.schema";

const { Pool } = pg;

// Get legacy database pool
function getLegacyPool(): pg.Pool {
  const connectionString = process.env.PUNKSCAPE_DATABASE_URL;
  if (!connectionString) {
    throw new Error("PUNKSCAPE_DATABASE_URL is required for gallery27 import");
  }
  return new Pool({ connectionString });
}

// Types for legacy database rows
interface LegacyScape {
  token_id: number;
  scape_id: number | null;
  date: Date | null;
  auction_ends_at: Date | null;
  description: string | null;
  request_id: number | null;
  image_path: string | null;
  step: number | null;
  image_cid: string | null;
  metadata_cid: string | null;
  data: Record<string, unknown> | null;
  owner: string | null;
  initial_render_id: number | null;
  created_at: Date | null;
  updated_at: Date | null;
}

interface LegacyRequest {
  id: number;
  token_id: number;
  from: string | null;
  transaction_hash: string | null;
  value: string | null;
  description: string | null;
  ai_image_id: number | null;
  created_at: Date | null;
  started_processing_at: Date | null;
  completed_at: Date | null;
  // Joined from ai_images
  image_path: string | null;
  image_input: Record<string, unknown> | null;
  image_steps: number | null;
  image_task_id: string | null;
}

// Convert Date to Unix timestamp
function dateToTimestamp(date: Date | null): number | null {
  if (!date) return null;
  return Math.floor(date.getTime() / 1000);
}

export class ImportGallery27Service {
  /**
   * Import all twentySevenYearScape details from legacy database
   */
  async importScapeDetails(options: {
    onProgress?: (count: number) => void;
  } = {}): Promise<number> {
    const legacyPool = getLegacyPool();
    const db = getOffchainDb();

    try {
      // Query all scapes from legacy database
      const result = await legacyPool.query<LegacyScape>(`
        SELECT
          token_id,
          scape_id,
          date,
          auction_ends_at,
          description,
          request_id,
          image_path,
          step,
          image_cid,
          metadata_cid,
          data,
          owner,
          initial_render_id,
          created_at,
          updated_at
        FROM twenty_seven_year_scapes
        ORDER BY token_id
      `);

      const scapes = result.rows;
      console.log(`Found ${scapes.length} scapes in legacy database`);

      // Insert in batches of 500
      const batchSize = 500;
      let totalInserted = 0;

      for (let i = 0; i < scapes.length; i += batchSize) {
        const batch = scapes.slice(i, i + batchSize);

        const values = batch.map((scape) => ({
          tokenId: scape.token_id,
          scapeId: scape.scape_id,
          date: dateToTimestamp(scape.date),
          auctionEndsAt: dateToTimestamp(scape.auction_ends_at),
          description: scape.description,
          requestId: scape.request_id,
          imagePath: scape.image_path,
          step: scape.step,
          imageCid: scape.image_cid,
          metadataCid: scape.metadata_cid,
          data: scape.data,
          owner: scape.owner?.toLowerCase() ?? null,
          initialRenderId: scape.initial_render_id,
          completedAt: null as number | null, // Not in legacy schema
          createdAt: dateToTimestamp(scape.created_at),
          updatedAt: dateToTimestamp(scape.updated_at),
        }));

        await db
          .insert(twentySevenYearScapeDetail)
          .values(values)
          .onConflictDoNothing();

        totalInserted += batch.length;
        options.onProgress?.(batch.length);
      }

      return totalInserted;
    } finally {
      await legacyPool.end();
    }
  }

  /**
   * Import all twentySevenYearRequests from legacy database
   */
  async importRequests(options: {
    onProgress?: (count: number) => void;
  } = {}): Promise<number> {
    const legacyPool = getLegacyPool();
    const db = getOffchainDb();

    try {
      // Query all requests with joined ai_images data
      const result = await legacyPool.query<LegacyRequest>(`
        SELECT
          r.id,
          r.token_id,
          r."from",
          r.transaction_hash,
          r.value,
          r.description,
          r.ai_image_id,
          r.created_at,
          r.started_processing_at,
          r.completed_at,
          ai.path as image_path,
          ai.input as image_input,
          ai.steps as image_steps,
          ai.task_id as image_task_id
        FROM twenty_seven_year_requests r
        LEFT JOIN ai_images ai ON r.ai_image_id = ai.id
        ORDER BY r.id
      `);

      const requests = result.rows;
      console.log(`Found ${requests.length} requests in legacy database`);

      // Insert in batches of 500
      const batchSize = 500;
      let totalInserted = 0;

      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);

        const values = batch.map((request) => ({
          id: request.id,
          tokenId: request.token_id,
          from: request.from?.toLowerCase() ?? null,
          transactionHash: request.transaction_hash,
          value: request.value,
          description: request.description,
          imagePath: request.image_path,
          imageInput: request.image_input,
          imageSteps: request.image_steps,
          imageTaskId: request.image_task_id,
          createdAt: dateToTimestamp(request.created_at),
          startedProcessingAt: dateToTimestamp(request.started_processing_at),
          completedAt: dateToTimestamp(request.completed_at),
        }));

        await db
          .insert(twentySevenYearRequest)
          .values(values)
          .onConflictDoNothing();

        totalInserted += batch.length;
        options.onProgress?.(batch.length);
      }

      // Reset the serial sequence to avoid conflicts with future inserts
      const offchainPool = getOffchainPool();
      await offchainPool.query(`
        SELECT setval(
          'twenty_seven_year_request_id_seq',
          (SELECT COALESCE(MAX(id), 0) FROM twenty_seven_year_request)
        )
      `);

      return totalInserted;
    } finally {
      await legacyPool.end();
    }
  }

  /**
   * Import all twentySevenYear data (scapes and requests)
   */
  async importAll(options: {
    onProgress?: (type: string, count: number) => void;
  } = {}): Promise<{ scapes: number; requests: number }> {
    console.log("Importing twentySevenYearScape details...");
    const scapes = await this.importScapeDetails({
      onProgress: (c) => options.onProgress?.("scapes", c),
    });

    console.log("\nImporting twentySevenYearRequests...");
    const requests = await this.importRequests({
      onProgress: (c) => options.onProgress?.("requests", c),
    });

    return { scapes, requests };
  }
}

// Singleton instance
export const importGallery27Service = new ImportGallery27Service();
