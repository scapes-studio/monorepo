import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as ponderSchema from "../../ponder.schema";

const { Pool } = pg;

export type PonderDb = NodePgDatabase<typeof ponderSchema>;

let viewsDb: PonderDb | null = null;
let pool: pg.Pool | null = null;

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
 * Get database connection targeting the views schema.
 * Used by external services (import-sales, import-listings, etc.) and API handlers to write data.
 * Requires PONDER_VIEWS_SCHEMA env var (e.g., "scapes").
 */
export function getViewsDb(): PonderDb {
  if (viewsDb) {
    return viewsDb;
  }

  const p = getPool();
  viewsDb = drizzle(p, { schema: ponderSchema });

  return viewsDb;
}

/**
 * Execute a database operation with triggers disabled.
 * This is needed because Ponder's views have triggers for live queries
 * that reference tables which may not exist for external writes.
 *
 * Uses session_replication_role = replica to disable triggers.
 */
export async function withTriggersDisabled<T>(
  operation: (db: PonderDb) => Promise<T>,
): Promise<T> {
  const p = getPool();
  const client = await p.connect();

  try {
    // Disable triggers for this session
    await client.query("SET session_replication_role = replica");

    // Create a drizzle instance with this specific client
    const db = drizzle(client, { schema: ponderSchema });

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
