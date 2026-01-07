import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { client, graphql } from "ponder";
import { count, desc, eq, sql } from "drizzle-orm";
import { seaportSale } from "../offchain";
import { getOffchainDb, getPool } from "../services/database";

// Views schema name - must match --views-schema flag when running Ponder
const VIEWS_SCHEMA = process.env.PONDER_VIEWS_SCHEMA ?? "scapes";

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
  const offDb = getOffchainDb();

  const slug = c.req.query("slug");
  const limit = Math.min(Number(c.req.query("limit")) || 20, 100);
  const page = Math.max(Number(c.req.query("page")) || 1, 1);
  const offset = (page - 1) * limit;

  const baseQuery = offDb
    .select()
    .from(seaportSale)
    .orderBy(desc(seaportSale.timestamp))
    .limit(limit)
    .offset(offset);

  const countQuery = offDb.select({ count: count() }).from(seaportSale);

  const [sales, countResult] = slug
    ? await Promise.all([
        baseQuery.where(eq(seaportSale.slug, slug)),
        countQuery.where(eq(seaportSale.slug, slug)),
      ])
    : await Promise.all([baseQuery, countQuery]);

  const total = countResult[0]?.count ?? 0;
  const lastPage = Math.ceil(total / limit);

  return c.json({
    data: sales,
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
  const offDb = getOffchainDb();
  const slug = c.req.param("slug");

  const limit = Math.min(Number(c.req.query("limit")) || 20, 100);
  const page = Math.max(Number(c.req.query("page")) || 1, 1);
  const offset = (page - 1) * limit;

  const [sales, countResult] = await Promise.all([
    offDb
      .select()
      .from(seaportSale)
      .where(eq(seaportSale.slug, slug))
      .orderBy(desc(seaportSale.timestamp))
      .limit(limit)
      .offset(offset),
    offDb
      .select({ count: count() })
      .from(seaportSale)
      .where(eq(seaportSale.slug, slug)),
  ]);

  const total = countResult[0]?.count ?? 0;
  const lastPage = Math.ceil(total / limit);

  return c.json({
    data: sales,
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
  const offDb = getOffchainDb();

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
  const offDb = getOffchainDb();
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

// ============================================
// Transfer History API Endpoints
// ============================================

/**
 * GET /transfers
 * List all transfers with optional sale data (LEFT JOIN with seaport sales)
 * Query params:
 *   - limit: number (default 20, max 100)
 *   - page: number (default 1)
 *   - tokenId: filter by token ID
 *   - from: filter by sender address
 *   - to: filter by recipient address
 *   - hasSale: "true" to only show transfers with sales
 */
app.get("/transfers", async (c) => {
  const pool = getPool();

  const limit = Math.min(Number(c.req.query("limit")) || 20, 100);
  const page = Math.max(Number(c.req.query("page")) || 1, 1);
  const offset = (page - 1) * limit;

  const tokenId = c.req.query("tokenId");
  const from = c.req.query("from")?.toLowerCase();
  const to = c.req.query("to")?.toLowerCase();
  const hasSale = c.req.query("hasSale") === "true";

  // Build WHERE conditions
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (tokenId) {
    conditions.push(`t.scape = $${paramIndex}::bigint`);
    params.push(tokenId);
    paramIndex++;
  }
  if (from) {
    conditions.push(`LOWER(t."from") = $${paramIndex}`);
    params.push(from);
    paramIndex++;
  }
  if (to) {
    conditions.push(`LOWER(t."to") = $${paramIndex}`);
    params.push(to);
    paramIndex++;
  }
  if (hasSale) {
    conditions.push(`s.id IS NOT NULL`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Query transfers with LEFT JOIN to seaport sales
  const query = `
    SELECT
      t.id as transfer_id,
      t.timestamp,
      t."from",
      t."to",
      t.scape as token_id,
      t.tx_hash,
      s.id as sale_id,
      s.price as sale_price,
      s.seller,
      s.buyer,
      s.slug
    FROM ${VIEWS_SCHEMA}.transfer_event t
    LEFT JOIN offchain.seaport_sale s
      ON t.tx_hash = s.tx_hash
      AND t.scape::text = s.token_id
    ${whereClause}
    ORDER BY t.timestamp DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const countQuery = `
    SELECT COUNT(*) as count
    FROM ${VIEWS_SCHEMA}.transfer_event t
    LEFT JOIN offchain.seaport_sale s
      ON t.tx_hash = s.tx_hash
      AND t.scape::text = s.token_id
    ${whereClause}
  `;

  const [dataResult, countResult] = await Promise.all([
    pool.query(query, [...params, limit, offset]),
    pool.query(countQuery, params),
  ]);

  const total = Number(countResult.rows[0]?.count ?? 0);
  const lastPage = Math.ceil(total / limit);

  // Transform results
  const transfers = dataResult.rows.map((row: any) => ({
    id: row.transfer_id,
    timestamp: row.timestamp,
    from: row.from,
    to: row.to,
    tokenId: row.token_id,
    txHash: row.tx_hash,
    sale: row.sale_id
      ? {
          id: row.sale_id,
          price: row.sale_price,
          seller: row.seller,
          buyer: row.buyer,
          slug: row.slug,
        }
      : null,
  }));

  return c.json({
    data: transfers,
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
 * GET /scapes/:tokenId/history
 * Get complete transfer history for a specific scape
 * Returns all transfers ordered by timestamp desc, with sale data where applicable
 */
app.get("/scapes/:tokenId/history", async (c) => {
  const pool = getPool();
  const tokenId = c.req.param("tokenId");

  const query = `
    SELECT
      t.id as transfer_id,
      t.timestamp,
      t."from",
      t."to",
      t.scape as token_id,
      t.tx_hash,
      s.id as sale_id,
      s.price as sale_price,
      s.seller,
      s.buyer,
      s.slug
    FROM ${VIEWS_SCHEMA}.transfer_event t
    LEFT JOIN offchain.seaport_sale s
      ON t.tx_hash = s.tx_hash
      AND t.scape::text = s.token_id
    WHERE t.scape = $1::bigint
    ORDER BY t.timestamp DESC
  `;

  const result = await pool.query(query, [tokenId]);

  // Transform results
  const history = result.rows.map((row: any) => ({
    id: row.transfer_id,
    timestamp: row.timestamp,
    from: row.from,
    to: row.to,
    txHash: row.tx_hash,
    sale: row.sale_id
      ? {
          id: row.sale_id,
          price: row.sale_price,
          seller: row.seller,
          buyer: row.buyer,
          slug: row.slug,
        }
      : null,
  }));

  return c.json({
    tokenId,
    history,
    totalTransfers: history.length,
    totalSales: history.filter((h: any) => h.sale !== null).length,
  });
});

export default app;
