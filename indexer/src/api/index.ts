import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { client, graphql } from "ponder";
import { count, desc, eq, sql } from "drizzle-orm";
import { seaportSale } from "../offchain";

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
  const slug = c.req.query("slug");
  const limit = Math.min(Number(c.req.query("limit")) || 20, 100);
  const page = Math.max(Number(c.req.query("page")) || 1, 1);
  const offset = (page - 1) * limit;

  const baseQuery = db
    .select()
    .from(seaportSale)
    .orderBy(desc(seaportSale.timestamp))
    .limit(limit)
    .offset(offset);

  const countQuery = db.select({ count: count() }).from(seaportSale);

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
  const slug = c.req.param("slug");

  const limit = Math.min(Number(c.req.query("limit")) || 20, 100);
  const page = Math.max(Number(c.req.query("page")) || 1, 1);
  const offset = (page - 1) * limit;

  const [sales, countResult] = await Promise.all([
    db
      .select()
      .from(seaportSale)
      .where(eq(seaportSale.slug, slug))
      .orderBy(desc(seaportSale.timestamp))
      .limit(limit)
      .offset(offset),
    db
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
  const now = Math.floor(Date.now() / 1000);
  const sixMonthsAgo = now - 180 * 24 * 60 * 60;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
  const oneDayAgo = now - 24 * 60 * 60;

  const result = await db.execute(sql`
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

  const stats = (result as any).rows[0] as any;

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
  const slug = c.req.param("slug");

  const now = Math.floor(Date.now() / 1000);
  const sixMonthsAgo = now - 180 * 24 * 60 * 60;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
  const oneDayAgo = now - 24 * 60 * 60;

  const result = await db.execute(sql`
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

  const stats = (result as any).rows[0] as any;

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
  const limitNum = Math.min(Number(c.req.query("limit")) || 20, 100);
  const page = Math.max(Number(c.req.query("page")) || 1, 1);
  const offsetNum = (page - 1) * limitNum;

  const tokenId = c.req.query("tokenId");
  const fromAddr = c.req.query("from")?.toLowerCase();
  const toAddr = c.req.query("to")?.toLowerCase();
  const hasSale = c.req.query("hasSale") === "true";

  // Build WHERE conditions using Drizzle
  const conditions: any[] = [];

  if (tokenId) {
    conditions.push(eq(schema.transferEvent.scape, BigInt(tokenId)));
  }
  if (fromAddr) {
    conditions.push(sql`LOWER(${schema.transferEvent.from}) = ${fromAddr}`);
  }
  if (toAddr) {
    conditions.push(sql`LOWER(${schema.transferEvent.to}) = ${toAddr}`);
  }
  if (hasSale) {
    conditions.push(sql`${seaportSale.id} IS NOT NULL`);
  }

  // Query transfers with LEFT JOIN to seaport sales
  const baseQuery = db
    .select({
      transferId: schema.transferEvent.id,
      timestamp: schema.transferEvent.timestamp,
      from: schema.transferEvent.from,
      to: schema.transferEvent.to,
      tokenId: schema.transferEvent.scape,
      txHash: schema.transferEvent.txHash,
      saleId: seaportSale.id,
      salePrice: seaportSale.price,
      seller: seaportSale.seller,
      buyer: seaportSale.buyer,
      slug: seaportSale.slug,
    })
    .from(schema.transferEvent)
    .leftJoin(
      seaportSale,
      sql`${schema.transferEvent.txHash} = ${seaportSale.txHash} AND ${schema.transferEvent.scape}::text = ${seaportSale.tokenId}`
    );

  const whereCondition = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
  const queryWithWhere = whereCondition ? baseQuery.where(whereCondition) : baseQuery;

  const dataQuery = queryWithWhere
    .orderBy(desc(schema.transferEvent.timestamp))
    .limit(limitNum)
    .offset(offsetNum);

  const countBaseQuery = db
    .select({ count: count() })
    .from(schema.transferEvent)
    .leftJoin(
      seaportSale,
      sql`${schema.transferEvent.txHash} = ${seaportSale.txHash} AND ${schema.transferEvent.scape}::text = ${seaportSale.tokenId}`
    );

  const countQuery = whereCondition ? countBaseQuery.where(whereCondition) : countBaseQuery;

  const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);

  const total = countResult[0]?.count ?? 0;
  const lastPage = Math.ceil(total / limitNum);

  // Transform results
  const transfers = dataResult.map((row) => ({
    id: row.transferId,
    timestamp: row.timestamp,
    from: row.from,
    to: row.to,
    tokenId: row.tokenId,
    txHash: row.txHash,
    sale: row.saleId
      ? {
          id: row.saleId,
          price: row.salePrice,
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
      perPage: limitNum,
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
  const tokenId = c.req.param("tokenId");

  const result = await db
    .select({
      transferId: schema.transferEvent.id,
      timestamp: schema.transferEvent.timestamp,
      from: schema.transferEvent.from,
      to: schema.transferEvent.to,
      txHash: schema.transferEvent.txHash,
      // Seaport (offchain) sale data
      seaportSaleId: seaportSale.id,
      seaportSalePrice: seaportSale.price,
      seaportSeller: seaportSale.seller,
      seaportBuyer: seaportSale.buyer,
      seaportSlug: seaportSale.slug,
      // Onchain sale data (Scapes:Sale events)
      onchainSaleId: schema.sale.id,
      onchainSalePrice: schema.sale.price,
      onchainSeller: schema.sale.seller,
      onchainBuyer: schema.sale.buyer,
    })
    .from(schema.transferEvent)
    .leftJoin(
      seaportSale,
      sql`${schema.transferEvent.txHash} = ${seaportSale.txHash} AND ${schema.transferEvent.scape}::text = ${seaportSale.tokenId}`
    )
    .leftJoin(
      schema.sale,
      sql`${schema.transferEvent.txHash} = ${schema.sale.txHash} AND ${schema.transferEvent.scape} = ${schema.sale.tokenId}`
    )
    .where(eq(schema.transferEvent.scape, BigInt(tokenId)))
    .orderBy(desc(schema.transferEvent.timestamp));

  // Transform results - prefer seaport data if available, fall back to onchain sale
  const history = result.map((row) => ({
    id: row.transferId,
    timestamp: row.timestamp,
    from: row.from,
    to: row.to,
    txHash: row.txHash,
    sale: row.seaportSaleId
      ? {
          id: row.seaportSaleId,
          price: row.seaportSalePrice,
          seller: row.seaportSeller,
          buyer: row.seaportBuyer,
          slug: row.seaportSlug,
          source: "seaport" as const,
        }
      : row.onchainSaleId
        ? {
            id: row.onchainSaleId,
            price: { wei: row.onchainSalePrice!.toString() },
            seller: row.onchainSeller,
            buyer: row.onchainBuyer,
            slug: "scapes",
            source: "onchain" as const,
          }
        : null,
  }));

  return c.json({
    tokenId,
    history,
    totalTransfers: history.length,
    totalSales: history.filter((h) => h.sale !== null).length,
  });
});

export default app;
