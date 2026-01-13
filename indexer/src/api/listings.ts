import { db } from "ponder:api";
import { type Context } from "hono";
import { and, asc, count, desc, eq, gt } from "drizzle-orm";
import { seaportListing } from "../../offchain.schema";
import { scape } from "../../ponder.schema";

/**
 * GET /seaport/listings
 * List active seaport listings with scape data
 */
export const getListings = async (c: Context) => {
  const slug = c.req.query("slug") || "scapes";
  const limit = Math.min(Number(c.req.query("limit")) || 100, 1000);
  const offset = Number(c.req.query("offset")) || 0;
  const sort = c.req.query("sort") || "timestamp";
  const order = c.req.query("order") || "asc";
  const now = Math.floor(Date.now() / 1000);

  const conditions = and(
    eq(seaportListing.slug, slug),
    eq(seaportListing.isPrivateListing, false),
    gt(seaportListing.expirationDate, now),
  );

  const orderBy = sort === "price"
    ? (order === "desc" ? desc(seaportListing.price) : asc(seaportListing.price))
    : (order === "desc" ? desc(seaportListing.timestamp) : asc(seaportListing.timestamp));

  const [listings, countResult] = await Promise.all([
    db
      .select({
        id: scape.id,
        owner: scape.owner,
        attributes: scape.attributes,
        rarity: scape.rarity,
        price: seaportListing.price,
        orderHash: seaportListing.orderHash,
        maker: seaportListing.maker,
        expirationDate: seaportListing.expirationDate,
        timestamp: seaportListing.timestamp,
      })
      .from(seaportListing)
      .innerJoin(scape, eq(seaportListing.tokenId, scape.id))
      .where(conditions)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(seaportListing)
      .where(conditions),
  ]);

  const total = countResult[0]?.count ?? 0;

  return c.json({
    data: listings,
    meta: {
      total,
      limit,
      offset,
      hasMore: offset + listings.length < total,
    },
  });
};

/**
 * GET /seaport/listings/:tokenId
 * Get active listing for a specific token
 */
export const getListingByTokenId = async (c: Context) => {
  const tokenId = c.req.param("tokenId");
  const slug = c.req.query("slug") || "scapes";
  const now = Math.floor(Date.now() / 1000);

  const listing = await db
    .select({
      price: seaportListing.price,
      orderHash: seaportListing.orderHash,
      maker: seaportListing.maker,
      expirationDate: seaportListing.expirationDate,
      timestamp: seaportListing.timestamp,
    })
    .from(seaportListing)
    .where(
      and(
        eq(seaportListing.slug, slug),
        eq(seaportListing.tokenId, tokenId),
        eq(seaportListing.isPrivateListing, false),
        gt(seaportListing.expirationDate, now),
      ),
    )
    .limit(1);

  if (!listing[0]) {
    return c.json({ data: null });
  }

  return c.json({ data: listing[0] });
};
