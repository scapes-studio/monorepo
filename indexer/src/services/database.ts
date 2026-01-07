import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as offchainSchema from "../offchain";
import { combinedSchema, initViewsSchema } from "../combined-schema";

const { Pool } = pg;

export type OffchainDb = ReturnType<typeof drizzle<typeof offchainSchema>>;
export type CombinedDb = ReturnType<typeof drizzle<typeof combinedSchema>>;

let db: OffchainDb | null = null;
let combinedDb: CombinedDb | null = null;
let pool: pg.Pool | null = null;

/**
 * Get or create the database connection for offchain data.
 * This is a singleton - the same connection is reused across calls.
 */
export function getOffchainDb(): OffchainDb {
  if (db) {
    return db;
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  db = drizzle(pool, { schema: offchainSchema });

  return db;
}

/**
 * Get the underlying pg Pool for raw queries (e.g., schema creation)
 */
export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

/**
 * Get database connection with combined schema for cross-schema queries.
 * This includes both Ponder onchain tables (via views schema) and offchain tables.
 * Requires --views-schema=scapes when running Ponder.
 */
export function getCombinedDb(): CombinedDb {
  if (combinedDb) {
    return combinedDb;
  }

  // Initialize views schema before using combined schema
  initViewsSchema();

  const p = getPool();
  combinedDb = drizzle(p, { schema: combinedSchema });

  return combinedDb;
}
