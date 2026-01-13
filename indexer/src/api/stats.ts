import { db } from "ponder:api";
import { type Context } from "hono";
import { sql } from "drizzle-orm";
import * as ponderSchema from "../../ponder.schema";

const { seaportSale } = ponderSchema;

/**
 * GET /seaport/stats/volume
 * Get combined volume stats for all collections
 */
export const getVolumeStats = async (c: Context) => {
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
    FROM ${seaportSale}
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
};

/**
 * GET /seaport/stats/volume/:slug
 * Get volume stats for a specific collection
 */
export const getVolumeStatsBySlug = async (c: Context) => {
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
    FROM ${seaportSale}
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
};
