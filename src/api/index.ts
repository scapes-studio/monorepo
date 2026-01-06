import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { client, graphql } from "ponder";
import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as offchainSchema from "../offchain";
import { seaportSale, syncState } from "../offchain";

const { Pool } = pg;

// Lazy-initialized offchain database connection
let offchainDb: ReturnType<typeof drizzle<typeof offchainSchema>> | null = null;

async function getOffchainDb() {
  if (offchainDb) return offchainDb;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  offchainDb = drizzle(pool, { schema: offchainSchema });
  return offchainDb;
}

const app = new Hono();

// Ponder built-in routes
app.use("/sql/*", client({ db, schema }));
app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

// ============================================
// Seaport Sales API Endpoints
// ============================================

/**
 * GET /seaport/sales
 * List sales with pagination and optional filtering
 */
app.get("/seaport/sales", async (c) => {
  const offDb = await getOffchainDb();

  const slug = c.req.query("slug");
  const limit = Math.min(Number(c.req.query("limit")) || 20, 100);
  const page = Math.max(Number(c.req.query("page")) || 1, 1);
  const offset = (page - 1) * limit;

  // Build query
  const baseQuery = slug
    ? sql`SELECT * FROM offchain.seaport_sale WHERE slug = ${slug} ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offset}`
    : sql`SELECT * FROM offchain.seaport_sale ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offset}`;

  const countQuery = slug
    ? sql`SELECT COUNT(*) as count FROM offchain.seaport_sale WHERE slug = ${slug}`
    : sql`SELECT COUNT(*) as count FROM offchain.seaport_sale`;

  const [salesResult, countResult] = await Promise.all([
    offDb.execute(baseQuery),
    offDb.execute(countQuery),
  ]);

  const total = Number((countResult.rows[0] as any)?.count || 0);
  const lastPage = Math.ceil(total / limit);

  return c.json({
    data: salesResult.rows,
    meta: {
      total,
      perPage: limit,
      currentPage: page,
      lastPage,
      firstPage: 1,
    },
  });
});

/**
 * GET /seaport/sales/:slug
 * List sales for a specific collection
 */
app.get("/seaport/sales/:slug", async (c) => {
  const offDb = await getOffchainDb();
  const slug = c.req.param("slug");

  const limit = Math.min(Number(c.req.query("limit")) || 20, 100);
  const page = Math.max(Number(c.req.query("page")) || 1, 1);
  const offset = (page - 1) * limit;

  const [salesResult, countResult] = await Promise.all([
    offDb.execute(
      sql`SELECT * FROM offchain.seaport_sale WHERE slug = ${slug} ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offset}`
    ),
    offDb.execute(
      sql`SELECT COUNT(*) as count FROM offchain.seaport_sale WHERE slug = ${slug}`
    ),
  ]);

  const total = Number((countResult.rows[0] as any)?.count || 0);
  const lastPage = Math.ceil(total / limit);

  return c.json({
    data: salesResult.rows,
    meta: {
      total,
      perPage: limit,
      currentPage: page,
      lastPage,
      firstPage: 1,
    },
  });
});

/**
 * GET /seaport/stats/volume
 * Get combined volume stats for all collections
 */
app.get("/seaport/stats/volume", async (c) => {
  const offDb = await getOffchainDb();

  const now = Math.floor(Date.now() / 1000);
  const sixMonthsAgo = now - 180 * 24 * 60 * 60;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
  const oneDayAgo = now - 24 * 60 * 60;

  const result = await offDb.execute(sql`
    SELECT
      COUNT(*) as total_count,
      SUM(CASE WHEN timestamp >= ${sixMonthsAgo} THEN 1 ELSE 0 END) as six_month_count,
      SUM(CASE WHEN timestamp >= ${thirtyDaysAgo} THEN 1 ELSE 0 END) as month_count,
      SUM(CASE WHEN timestamp >= ${oneDayAgo} THEN 1 ELSE 0 END) as day_count,
      ROUND(COALESCE(SUM((price->>'eth')::numeric), 0)::numeric, 4)::text as total_eth,
      ROUND(COALESCE(SUM((price->>'usd')::numeric), 0)::numeric, 2)::text as total_usd,
      ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${sixMonthsAgo} THEN (price->>'eth')::numeric ELSE 0 END), 0)::numeric, 4)::text as six_month_eth,
      ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${sixMonthsAgo} THEN (price->>'usd')::numeric ELSE 0 END), 0)::numeric, 2)::text as six_month_usd,
      ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${thirtyDaysAgo} THEN (price->>'eth')::numeric ELSE 0 END), 0)::numeric, 4)::text as month_eth,
      ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${thirtyDaysAgo} THEN (price->>'usd')::numeric ELSE 0 END), 0)::numeric, 2)::text as month_usd,
      ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${oneDayAgo} THEN (price->>'eth')::numeric ELSE 0 END), 0)::numeric, 4)::text as day_eth,
      ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${oneDayAgo} THEN (price->>'usd')::numeric ELSE 0 END), 0)::numeric, 2)::text as day_usd
    FROM offchain.seaport_sale
  `);

  const stats = result.rows[0] as any;

  return c.json({
    total: {
      eth: stats.total_eth || "0",
      usd: stats.total_usd || "0",
      count: Number(stats.total_count) || 0,
    },
    sixMonth: {
      eth: stats.six_month_eth || "0",
      usd: stats.six_month_usd || "0",
      count: Number(stats.six_month_count) || 0,
    },
    month: {
      eth: stats.month_eth || "0",
      usd: stats.month_usd || "0",
      count: Number(stats.month_count) || 0,
    },
    day: {
      eth: stats.day_eth || "0",
      usd: stats.day_usd || "0",
      count: Number(stats.day_count) || 0,
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /seaport/stats/volume/:slug
 * Get volume stats for a specific collection
 */
app.get("/seaport/stats/volume/:slug", async (c) => {
  const offDb = await getOffchainDb();
  const slug = c.req.param("slug");

  const now = Math.floor(Date.now() / 1000);
  const sixMonthsAgo = now - 180 * 24 * 60 * 60;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
  const oneDayAgo = now - 24 * 60 * 60;

  const result = await offDb.execute(sql`
    SELECT
      COUNT(*) as total_count,
      SUM(CASE WHEN timestamp >= ${sixMonthsAgo} THEN 1 ELSE 0 END) as six_month_count,
      SUM(CASE WHEN timestamp >= ${thirtyDaysAgo} THEN 1 ELSE 0 END) as month_count,
      SUM(CASE WHEN timestamp >= ${oneDayAgo} THEN 1 ELSE 0 END) as day_count,
      ROUND(COALESCE(SUM((price->>'eth')::numeric), 0)::numeric, 4)::text as total_eth,
      ROUND(COALESCE(SUM((price->>'usd')::numeric), 0)::numeric, 2)::text as total_usd,
      ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${sixMonthsAgo} THEN (price->>'eth')::numeric ELSE 0 END), 0)::numeric, 4)::text as six_month_eth,
      ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${sixMonthsAgo} THEN (price->>'usd')::numeric ELSE 0 END), 0)::numeric, 2)::text as six_month_usd,
      ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${thirtyDaysAgo} THEN (price->>'eth')::numeric ELSE 0 END), 0)::numeric, 4)::text as month_eth,
      ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${thirtyDaysAgo} THEN (price->>'usd')::numeric ELSE 0 END), 0)::numeric, 2)::text as month_usd,
      ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${oneDayAgo} THEN (price->>'eth')::numeric ELSE 0 END), 0)::numeric, 4)::text as day_eth,
      ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${oneDayAgo} THEN (price->>'usd')::numeric ELSE 0 END), 0)::numeric, 2)::text as day_usd
    FROM offchain.seaport_sale
    WHERE slug = ${slug}
  `);

  const stats = result.rows[0] as any;

  return c.json({
    slug,
    total: {
      eth: stats.total_eth || "0",
      usd: stats.total_usd || "0",
      count: Number(stats.total_count) || 0,
    },
    sixMonth: {
      eth: stats.six_month_eth || "0",
      usd: stats.six_month_usd || "0",
      count: Number(stats.six_month_count) || 0,
    },
    month: {
      eth: stats.month_eth || "0",
      usd: stats.month_usd || "0",
      count: Number(stats.month_count) || 0,
    },
    day: {
      eth: stats.day_eth || "0",
      usd: stats.day_usd || "0",
      count: Number(stats.day_count) || 0,
    },
    timestamp: new Date().toISOString(),
  });
});

export default app;
