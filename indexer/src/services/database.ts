import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as offchainSchema from "../offchain";

const { Pool } = pg;

let db: ReturnType<typeof drizzle<typeof offchainSchema>> | null = null;

/**
 * Get or create the database connection for offchain data
 */
export async function getDb() {
  if (db) {
    return db;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  db = drizzle(pool, { schema: offchainSchema });

  // Ensure the offchain schema exists
  await pool.query(`CREATE SCHEMA IF NOT EXISTS offchain`);

  return db;
}

/**
 * Initialize offchain tables
 */
export async function initOffchainTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Create the offchain schema if it doesn't exist
  await pool.query(`CREATE SCHEMA IF NOT EXISTS offchain`);

  // Create seaport_sale table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS offchain.seaport_sale (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL,
      contract TEXT NOT NULL,
      token_id TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      order_hash TEXT,
      block BIGINT,
      timestamp INTEGER NOT NULL,
      log_index INTEGER,
      seller TEXT NOT NULL,
      buyer TEXT NOT NULL,
      price JSONB NOT NULL,
      UNIQUE(slug, token_id, tx_hash, log_index, order_hash)
    )
  `);

  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS seaport_sale_slug_idx ON offchain.seaport_sale(slug);
    CREATE INDEX IF NOT EXISTS seaport_sale_timestamp_idx ON offchain.seaport_sale(timestamp);
    CREATE INDEX IF NOT EXISTS seaport_sale_token_idx ON offchain.seaport_sale(token_id);
  `);

  // Create sync_state table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS offchain.sync_state (
      slug TEXT PRIMARY KEY,
      contract TEXT NOT NULL,
      last_synced_timestamp INTEGER,
      stats JSONB,
      updated_at TIMESTAMP NOT NULL
    )
  `);

  // Create seaport_listing table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS offchain.seaport_listing (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL,
      contract TEXT NOT NULL,
      token_id TEXT NOT NULL,
      order_hash TEXT NOT NULL UNIQUE,
      protocol_address TEXT,
      timestamp INTEGER NOT NULL,
      start_date INTEGER NOT NULL,
      expiration_date INTEGER NOT NULL,
      maker TEXT NOT NULL,
      taker TEXT,
      is_private_listing BOOLEAN NOT NULL DEFAULT FALSE,
      price JSONB NOT NULL
    )
  `);

  // Create indexes for listings
  await pool.query(`
    CREATE INDEX IF NOT EXISTS seaport_listing_slug_idx ON offchain.seaport_listing(slug);
    CREATE INDEX IF NOT EXISTS seaport_listing_token_idx ON offchain.seaport_listing(token_id);
    CREATE INDEX IF NOT EXISTS seaport_listing_expiration_idx ON offchain.seaport_listing(expiration_date);
  `);

  await pool.end();
}
