import { db } from "ponder:api";
import { type Context } from "hono";
import { count, desc, eq } from "drizzle-orm";
import * as ponderSchema from "../../ponder.schema";

const { seaportSale } = ponderSchema;

/**
 * GET /seaport/sales
 * List sales with pagination and optional filtering
 */
export const getSales = async (c: Context) => {
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
};

/**
 * GET /seaport/sales/:slug
 * List sales for a specific collection
 */
export const getSalesBySlug = async (c: Context) => {
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
};
