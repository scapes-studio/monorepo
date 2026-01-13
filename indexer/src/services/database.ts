import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import { schema } from "../../combined.schema";
import * as offchainSchema from "../../offchain.schema";

const { Pool } = pg;

export type CombinedDb = NodePgDatabase<typeof schema>;
export type OffchainDb = NodePgDatabase<typeof offchainSchema>;

let viewsDb: CombinedDb | null = null;
let offchainDb: OffchainDb | null = null;
let pool: pg.Pool | null = null;
let offchainPool: pg.Pool | null = null;

/**
 * Get the underlying pg Pool for raw queries.
 * The pool is configured to use the views schema via search_path.
 */
export function getPool(): pg.Pool {
  if (!pool) {
    const viewsSchema = process.env.PONDER_VIEWS_SCHEMA;
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: viewsSchema ? `-c search_path=${viewsSchema}` : undefined,
    });
  }
  return pool;
}

/**
 * Get pg Pool for the offchain schema.
 */
export function getOffchainPool(): pg.Pool {
  if (!offchainPool) {
    offchainPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=offchain`,
    });
  }
  return offchainPool;
}

/**
 * Get database connection targeting the views schema.
 * Used by API handlers to query combined onchain + offchain data.
 * Requires PONDER_VIEWS_SCHEMA env var (e.g., "scapes").
 */
export function getViewsDb(): CombinedDb {
  if (viewsDb) {
    return viewsDb;
  }

  const p = getPool();
  viewsDb = drizzle(p, { schema });

  return viewsDb;
}

/**
 * Get database connection for the offchain schema.
 * Used by import services to write offchain data (seaport sales, listings, etc.).
 */
export function getOffchainDb(): OffchainDb {
  if (offchainDb) {
    return offchainDb;
  }

  const p = getOffchainPool();
  offchainDb = drizzle(p, { schema: offchainSchema });

  return offchainDb;
}

/**
 * Execute a database operation with triggers disabled.
 * This is needed because Ponder's views have triggers for live queries
 * that reference tables which may not exist for external writes.
 *
 * Uses session_replication_role = replica to disable triggers.
 *
 * Note: This is only needed for writes to tables in Ponder's views schema.
 * Offchain tables don't have Ponder triggers, so use getOffchainDb() directly.
 */
export async function withTriggersDisabled<T>(
  operation: (db: CombinedDb) => Promise<T>,
): Promise<T> {
  const p = getPool();
  const client = await p.connect();

  try {
    // Disable triggers for this session
    await client.query("SET session_replication_role = replica");

    // Create a drizzle instance with this specific client
    const db = drizzle(client, { schema });

    // Execute the operation
    const result = await operation(db);

    // Re-enable triggers
    await client.query("SET session_replication_role = DEFAULT");

    return result;
  } catch (error) {
    // Make sure to re-enable triggers even on error
    await client.query("SET session_replication_role = DEFAULT").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
