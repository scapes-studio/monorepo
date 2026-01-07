import { json, text, bigint, integer, pgSchema, index, unique, timestamp } from "drizzle-orm/pg-core";

// Offchain PostgreSQL schema for Seaport/OpenSea sales
export const offchain = pgSchema("offchain");

// Price structure stored as JSONB
export type Price = {
  wei: string;
  eth: number;
  usd: number;
  currency?: {
    symbol: string;
    amount: string;
  };
};

// Volume stats structure
export type VolumeStats = {
  volume: {
    total: { eth: string; usd: string };
    sixMonth: { eth: string; usd: string };
    month: { eth: string; usd: string };
    day: { eth: string; usd: string };
  };
  count: {
    total: number;
    sixMonth: number;
    month: number;
    day: number;
  };
};

// Individual sales records from OpenSea/Seaport
export const seaportSale = offchain.table(
  "seaport_sale",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    slug: text().notNull(), // 'punkscapes' | 'scapes'
    contract: text().notNull(),
    tokenId: text().notNull(),
    txHash: text().notNull(),
    orderHash: text(),
    block: bigint({ mode: "bigint" }),
    timestamp: integer().notNull(),
    logIndex: integer(),
    seller: text().notNull(),
    buyer: text().notNull(),
    price: json().$type<Price>().notNull(),
  },
  (t) => [
    index("seaport_sale_slug_idx").on(t.slug),
    index("seaport_sale_timestamp_idx").on(t.timestamp),
    index("seaport_sale_token_idx").on(t.tokenId),
    unique("seaport_sale_unique").on(t.slug, t.tokenId, t.txHash, t.logIndex, t.orderHash),
  ]
);

// Sync state for tracking last synced timestamp per collection
export const syncState = offchain.table("sync_state", {
  slug: text().primaryKey(),
  contract: text().notNull(),
  lastSyncedTimestamp: integer(),
  stats: json().$type<VolumeStats>(),
  updatedAt: timestamp().notNull(),
});
