import { setDatabaseSchema } from "@ponder/client";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as ponderSchema from "../../ponder.schema";

const { Pool } = pg;

export type PonderDb = NodePgDatabase<typeof ponderSchema>;

let viewsDb: PonderDb | null = null;
let pool: pg.Pool | null = null;
let schemaInitialized = false;

/**
 * Get the underlying pg Pool for raw queries
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
 * Initialize the schema to target the views schema.
 * This modifies the ponder schema tables to use the views schema name.
 */
function initViewsSchema() {
  const viewsSchema = process.env.PONDER_VIEWS_SCHEMA;
  if (!schemaInitialized && viewsSchema) {
    setDatabaseSchema(ponderSchema, viewsSchema);
    schemaInitialized = true;
  }
}

/**
 * Get database connection targeting the views schema.
 * Used by external services (import-sales, import-listings, etc.) to write data.
 * Requires PONDER_VIEWS_SCHEMA env var (e.g., "scapes").
 */
export function getViewsDb(): PonderDb {
  if (viewsDb) {
    return viewsDb;
  }

  initViewsSchema();

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
  operation: (db: PonderDb) => Promise<T>
): Promise<T> {
  const p = getPool();
  const client = await p.connect();

  try {
    // Disable triggers for this session
    await client.query("SET session_replication_role = replica");

    // Create a drizzle instance with this specific client
    initViewsSchema();
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

