import { db } from "ponder:api";
import schema from "ponder:schema";
import { type Context } from "hono";
import { desc, gt, or } from "drizzle-orm";
import type { Price } from "../../ponder.types";
import * as offchain from "../../offchain.schema";

export type Collection = "scapes" | "punkscapes" | "twenty-seven-year-scapes";
export type ActivityType = "transfer" | "sale" | "listing" | "offer";

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
  maker: string;
  price: { wei: string; eth: number };
  expirationDate: number;
};

type OfferActivity = BaseActivity & {
  type: "offer";
  price: { wei: string; eth: number };
  isActive: boolean;
};

export type ActivityItem =
  | TransferActivity
  | SaleActivity
  | ListingActivity
  | OfferActivity;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * GET /activity
 * Fetch unified activity feed across all collections and event types
 */
export const getActivity = async (c: Context) => {
  const typesParam = c.req.query("types") || "transfer,sale,listing,offer";
  const types = typesParam.split(",") as ActivityType[];
  const limit = Math.min(
    Math.max(Number(c.req.query("limit")) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  const offset = Math.max(Number(c.req.query("offset")) || 0, 0);

  const activities: ActivityItem[] = [];

  // Fetch more than needed to allow for merging and sorting
  const fetchLimit = limit + offset + 100;

  // Fetch transfers
  if (types.includes("transfer")) {
    const [scapeTransfers, twentySevenYearTransfers] = await Promise.all([
      db
        .select()
        .from(schema.transferEvent)
        .orderBy(desc(schema.transferEvent.timestamp))
        .limit(fetchLimit),
      db
        .select()
        .from(schema.twentySevenYearTransferEvent)
        .orderBy(desc(schema.twentySevenYearTransferEvent.timestamp))
        .limit(fetchLimit),
    ]);

    for (const t of scapeTransfers) {
      activities.push({
        id: `transfer-scapes-${t.id}`,
        type: "transfer",
        timestamp: t.timestamp,
        collection: "scapes",
        tokenId: t.scape.toString(),
        txHash: t.txHash,
        from: t.from,
        to: t.to,
      });
    }

    for (const t of twentySevenYearTransfers) {
      activities.push({
        id: `transfer-27y-${t.id}`,
        type: "transfer",
        timestamp: t.timestamp,
        collection: "twenty-seven-year-scapes",
        tokenId: t.scape.toString(),
        txHash: t.txHash,
        from: t.from,
        to: t.to,
      });
    }
  }

  // Fetch sales
  if (types.includes("sale")) {
    const [seaportSales, onchainSales] = await Promise.all([
      db
        .select()
        .from(offchain.seaportSale)
        .orderBy(desc(offchain.seaportSale.timestamp))
        .limit(fetchLimit),
      db
        .select()
        .from(schema.sale)
        .orderBy(desc(schema.sale.timestamp))
        .limit(fetchLimit),
    ]);

    for (const s of seaportSales) {
      const price = s.price as Price;
      activities.push({
        id: `sale-seaport-${s.id}`,
        type: "sale",
        timestamp: s.timestamp,
        collection: s.slug as Collection,
        tokenId: s.tokenId.toString(),
        txHash: s.txHash,
        seller: s.seller,
        buyer: s.buyer,
        price: { wei: price.wei, eth: price.eth },
        source: "seaport",
      });
    }

    for (const s of onchainSales) {
      activities.push({
        id: `sale-onchain-${s.id}`,
        type: "sale",
        timestamp: s.timestamp,
        collection: "scapes",
        tokenId: s.tokenId.toString(),
        txHash: s.txHash,
        seller: s.seller,
        buyer: s.buyer,
        price: {
          wei: s.price.toString(),
          eth: Number(s.price) / 1e18,
        },
        source: "onchain",
      });
    }
  }

  // Fetch listings (active only)
  if (types.includes("listing")) {
    const now = Math.floor(Date.now() / 1000);
    const listings = await db
      .select()
      .from(offchain.seaportListing)
      .where(gt(offchain.seaportListing.expirationDate, now))
      .orderBy(desc(offchain.seaportListing.timestamp))
      .limit(fetchLimit);

    for (const l of listings) {
      const price = l.price as Price;
      activities.push({
        id: `listing-${l.orderHash}`,
        type: "listing",
        timestamp: l.timestamp,
        collection: l.slug as Collection,
        tokenId: l.tokenId.toString(),
        txHash: null,
        maker: l.maker,
        price: { wei: price.wei, eth: price.eth },
        expirationDate: l.expirationDate,
      });
    }
  }

  // Fetch offers
  if (types.includes("offer")) {
    const offers = await db
      .select()
      .from(schema.offer)
      .where(or(schema.offer.isActive))
      .orderBy(desc(schema.offer.updatedAt))
      .limit(fetchLimit);

    for (const o of offers) {
      activities.push({
        id: `offer-${o.tokenId}`,
        type: "offer",
        timestamp: o.updatedAt,
        collection: "scapes",
        tokenId: o.tokenId.toString(),
        txHash: null,
        price: {
          wei: o.price.toString(),
          eth: Number(o.price) / 1e18,
        },
        isActive: o.isActive,
      });
    }
  }

  // Sort all activities by timestamp descending
  activities.sort((a, b) => b.timestamp - a.timestamp);

  // Apply pagination
  const total = activities.length;
  const paginatedActivities = activities.slice(offset, offset + limit);
  const hasMore = offset + paginatedActivities.length < total;

  return c.json({
    data: paginatedActivities,
    meta: {
      total,
      limit,
      offset,
      hasMore,
    },
  });
};
