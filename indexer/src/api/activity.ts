import { db } from "ponder:api";
import { type Context } from "hono";
import { sql } from "drizzle-orm";

export type Collection = "scapes" | "twenty-seven-year-scapes";
export type ActivityType = "transfer" | "sale" | "listing";

type BaseActivity = {
  id: string;
  type: ActivityType;
  timestamp: number;
  collection: Collection;
  tokenId: string;
  txHash: string | null;
};

type TransferActivity = BaseActivity & {
  type: "transfer";
  from: string;
  to: string;
};

type SaleActivity = BaseActivity & {
  type: "sale";
  seller: string;
  buyer: string;
  price: { wei: string; eth: number };
  source: "onchain" | "seaport";
};

type ListingActivity = BaseActivity & {
  type: "listing";
  lister: string;
  price: { wei: string; eth: number };
  isActive: boolean;
};

export type ActivityItem = TransferActivity | SaleActivity | ListingActivity;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

// Raw SQL row type from UNION query
type ActivityRow = {
  id: string;
  type: string;
  timestamp: number;
  collection: string;
  token_id: string;
  tx_hash: string | null;
  from_addr: string | null;
  to_addr: string | null;
  seller: string | null;
  buyer: string | null;
  price_wei: string | null;
  is_active: boolean | null;
  source: string | null;
};

/**
 * GET /activity
 * Fetch unified activity feed across all collections and event types
 */
export const getActivity = async (c: Context) => {
  const typesParam = c.req.query("types") || "transfer,sale,listing";
  const types = typesParam.split(",") as ActivityType[];
  const limit = Math.min(
    Math.max(Number(c.req.query("limit")) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  const offset = Math.max(Number(c.req.query("offset")) || 0, 0);

  // Single UNION ALL query across all activity sources
  const unionQuery = sql`
    SELECT * FROM (
      -- Scape transfers
      SELECT
        'transfer-scapes-' || id as id,
        'transfer' as type,
        timestamp,
        'scapes' as collection,
        scape::text as token_id,
        tx_hash,
        "from" as from_addr,
        "to" as to_addr,
        NULL::text as seller,
        NULL::text as buyer,
        NULL::text as price_wei,
        NULL::boolean as is_active,
        NULL::text as source
      FROM transfer_event

      UNION ALL

      -- 27-year scape transfers
      SELECT
        'transfer-27y-' || id as id,
        'transfer' as type,
        timestamp,
        'twenty-seven-year-scapes' as collection,
        scape::text as token_id,
        tx_hash,
        "from" as from_addr,
        "to" as to_addr,
        NULL::text as seller,
        NULL::text as buyer,
        NULL::text as price_wei,
        NULL::boolean as is_active,
        NULL::text as source
      FROM twenty_seven_year_transfer_event

      UNION ALL

      -- Onchain sales
      SELECT
        'sale-onchain-' || id as id,
        'sale' as type,
        timestamp,
        'scapes' as collection,
        token_id::text,
        tx_hash,
        NULL::text as from_addr,
        NULL::text as to_addr,
        seller,
        buyer,
        price::text as price_wei,
        NULL::boolean as is_active,
        'onchain' as source
      FROM sale

      UNION ALL

      -- Seaport sales
      SELECT
        'sale-seaport-' || id as id,
        'sale' as type,
        timestamp,
        slug as collection,
        token_id::text,
        tx_hash,
        NULL::text as from_addr,
        NULL::text as to_addr,
        seller,
        buyer,
        price->>'wei' as price_wei,
        NULL::boolean as is_active,
        'seaport' as source
      FROM offchain.seaport_sale

      UNION ALL

      -- Onchain listings (active only)
      SELECT
        'listing-' || token_id::text as id,
        'listing' as type,
        updated_at as timestamp,
        'scapes' as collection,
        token_id::text,
        tx_hash,
        lister as from_addr,
        NULL::text as to_addr,
        NULL::text as seller,
        NULL::text as buyer,
        price::text as price_wei,
        is_active,
        'onchain' as source
      FROM offer
      WHERE is_active = true
    ) all_activities
    WHERE type IN (${sql.join(types.map((t) => sql`${t}`), sql`, `)})
    ORDER BY timestamp DESC
  `;

  // Main query with pagination
  const dataQuery = sql`
    WITH activities AS (${unionQuery})
    SELECT * FROM activities
    LIMIT ${limit} OFFSET ${offset}
  `;

  // Count query for pagination metadata
  const countQuery = sql`
    WITH activities AS (${unionQuery})
    SELECT COUNT(*)::int as count FROM activities
  `;

  const [results, countResult] = await Promise.all([
    db.execute(dataQuery),
    db.execute(countQuery),
  ]);

  const total = (countResult.rows[0] as { count: number })?.count ?? 0;

  // Transform raw rows to ActivityItem types
  const activities: ActivityItem[] = (results.rows as ActivityRow[]).map(
    (row) => {
      const base = {
        id: row.id,
        timestamp: row.timestamp,
        collection: row.collection as Collection,
        tokenId: row.token_id,
        txHash: row.tx_hash,
      };

      switch (row.type) {
        case "transfer":
          return {
            ...base,
            type: "transfer" as const,
            from: row.from_addr!,
            to: row.to_addr!,
          };
        case "sale":
          return {
            ...base,
            type: "sale" as const,
            seller: row.seller!,
            buyer: row.buyer!,
            price: {
              wei: row.price_wei!,
              eth: Number(row.price_wei!) / 1e18,
            },
            source: row.source as "onchain" | "seaport",
          };
        case "listing":
          return {
            ...base,
            type: "listing" as const,
            lister: row.from_addr!,
            price: {
              wei: row.price_wei!,
              eth: Number(row.price_wei!) / 1e18,
            },
            isActive: row.is_active!,
          };
        default:
          throw new Error(`Unknown activity type: ${row.type}`);
      }
    },
  );

  return c.json({
    data: activities,
    meta: {
      total,
      limit,
      offset,
      hasMore: offset + activities.length < total,
    },
  });
};
