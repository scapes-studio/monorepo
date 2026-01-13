import { db } from "ponder:api";
import { type Context } from "hono";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { seaportListing } from "../../offchain.schema";
import { offer, scape } from "../../ponder.schema";

type ListingSource = "onchain" | "seaport";

/**
 * GET /listings
 * List all active listings (onchain + seaport) with scape data using a single UNION query
 */
export const getListings = async (c: Context) => {
  const limit = Math.min(Number(c.req.query("limit")) || 100, 1000);
  const offset = Number(c.req.query("offset")) || 0;
  const sort = c.req.query("sort") || "price";
  const order = c.req.query("order") || "asc";
  const includeSeaport = c.req.query("includeSeaport") !== "false";
  const now = Math.floor(Date.now() / 1000);

  const sortColumn = sort === "price" ? "price" : "source";
  const sortDir = order === "desc" ? "DESC" : "ASC";

  // Single UNION query across both schemas
  const unionQuery = includeSeaport
    ? sql`
        SELECT DISTINCT ON (id) * FROM (
          SELECT
            s.id,
            s.owner,
            s.attributes,
            s.rarity,
            o.price::text as price,
            'onchain' as source
          FROM offer o
          JOIN scape s ON o.token_id = s.id
          WHERE o.is_active = true AND o.specific_buyer IS NULL

          UNION ALL

          SELECT
            s.id,
            s.owner,
            s.attributes,
            s.rarity,
            (l.price->>'wei')::text as price,
            'seaport' as source
          FROM offchain.seaport_listing l
          JOIN scape s ON l.token_id::bigint = s.id
          WHERE l.slug = 'scapes'
            AND l.is_private_listing = false
            AND l.expiration_date > ${now}
        ) combined
        ORDER BY id, price::numeric ASC
      `
    : sql`
        SELECT
          s.id,
          s.owner,
          s.attributes,
          s.rarity,
          o.price::text as price,
          'onchain' as source
        FROM offer o
        JOIN scape s ON o.token_id = s.id
        WHERE o.is_active = true AND o.specific_buyer IS NULL
      `;

  // Wrap with final sort and pagination
  const finalQuery = sql`
    WITH listings AS (${unionQuery})
    SELECT * FROM listings
    ORDER BY ${sql.raw(sortColumn === "price" ? "price::numeric" : sortColumn)} ${sql.raw(sortDir)}
    LIMIT ${limit} OFFSET ${offset}
  `;

  const countQuery = sql`
    WITH listings AS (${unionQuery})
    SELECT COUNT(*)::int as count FROM listings
  `;

  const [results, countResult] = await Promise.all([
    db.execute(finalQuery),
    db.execute(countQuery),
  ]);

  const total = (countResult.rows[0] as { count: number })?.count ?? 0;

  const serialized = results.rows.map((r: any) => ({
    id: r.id.toString(),
    owner: r.owner,
    attributes: r.attributes,
    rarity: r.rarity,
    price: r.price,
    source: r.source as ListingSource,
  }));

  return c.json({
    data: serialized,
    meta: {
      total,
      limit,
      offset,
      hasMore: offset + serialized.length < total,
    },
  });
};

/**
 * GET /listings/:tokenId
 * Get active listing for a specific token (checks both sources)
 */
export const getListingByTokenId = async (c: Context) => {
  const tokenId = c.req.param("tokenId");
  const now = Math.floor(Date.now() / 1000);

  const [onchainResult, seaportResult] = await Promise.all([
    db
      .select({ price: offer.price })
      .from(offer)
      .where(and(
        eq(offer.tokenId, BigInt(tokenId)),
        eq(offer.isActive, true),
        isNull(offer.specificBuyer),
      ))
      .limit(1),
    db
      .select({ price: seaportListing.price })
      .from(seaportListing)
      .where(and(
        eq(seaportListing.slug, "scapes"),
        eq(seaportListing.tokenId, tokenId),
        eq(seaportListing.isPrivateListing, false),
        gt(seaportListing.expirationDate, now),
      ))
      .limit(1),
  ]);

  const onchain = onchainResult[0];
  const seaport = seaportResult[0];

  if (!onchain && !seaport) {
    return c.json({ data: null });
  }

  const onchainPrice = onchain?.price ?? null;
  const seaportPrice = seaport ? BigInt((seaport.price as { wei: string }).wei) : null;

  let price: string;
  let source: ListingSource;

  if (onchainPrice !== null && seaportPrice !== null) {
    if (seaportPrice < onchainPrice) {
      price = seaportPrice.toString();
      source = "seaport";
    } else {
      price = onchainPrice.toString();
      source = "onchain";
    }
  } else if (onchainPrice !== null) {
    price = onchainPrice.toString();
    source = "onchain";
  } else {
    price = seaportPrice!.toString();
    source = "seaport";
  }

  return c.json({ data: { price, source } });
};
