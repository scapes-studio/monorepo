import { json, text, bigint, integer, pgSchema, index, unique, timestamp, boolean } from "drizzle-orm/pg-core";

// Offchain PostgreSQL schema for Seaport/OpenSea sales
export const offchain = pgSchema("offchain");

// ENS profiles schema
export const ens = pgSchema("ens");

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

export type EnsProfileData = {
  avatar: string;
  description: string;
  links: {
    url: string;
    email: string;
    twitter: string;
    github: string;
  };
};

// Individual sales records from OpenSea/Seaport
export const seaportSale = offchain.table(
  "seaport_sale",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    slug: text().notNull(), // 'punkscapes' | 'scapes'
    contract: text().notNull(),
    tokenId: text("token_id").notNull(),
    txHash: text("tx_hash").notNull(),
    orderHash: text("order_hash"),
    block: bigint({ mode: "bigint" }),
    timestamp: integer().notNull(),
    logIndex: integer("log_index"),
    seller: text().notNull(),
    buyer: text().notNull(),
    price: json().$type<Price>().notNull(),
  },
  (t) => [
    index("seaport_sale_slug_idx").on(t.slug),
    index("seaport_sale_timestamp_idx").on(t.timestamp),
    index("seaport_sale_token_idx").on(t.tokenId),
    index("seaport_sale_tx_hash_idx").on(t.txHash),
    unique("seaport_sale_unique").on(t.slug, t.tokenId, t.txHash, t.logIndex, t.orderHash),
  ]
);

// Individual listing records from OpenSea/Seaport
export const seaportListing = offchain.table(
  "seaport_listing",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    slug: text().notNull(),
    contract: text().notNull(),
    tokenId: text("token_id").notNull(),
    orderHash: text("order_hash").notNull(),
    protocolAddress: text("protocol_address"),
    timestamp: integer().notNull(), // event_timestamp
    startDate: integer("start_date").notNull(),
    expirationDate: integer("expiration_date").notNull(),
    maker: text().notNull(), // seller/lister
    taker: text(), // specific buyer if private listing
    isPrivateListing: boolean("is_private_listing").notNull().default(false),
    price: json().$type<Price>().notNull(),
  },
  (t) => [
    index("seaport_listing_slug_idx").on(t.slug),
    index("seaport_listing_token_idx").on(t.tokenId),
    index("seaport_listing_expiration_idx").on(t.expirationDate),
    unique("seaport_listing_unique").on(t.orderHash),
  ]
);

// Sync state for tracking last synced timestamp per collection
export const syncState = offchain.table("sync_state", {
  slug: text().primaryKey(),
  contract: text().notNull(),
  lastSyncedTimestamp: integer("last_synced_timestamp"),
  stats: json().$type<VolumeStats>(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const ensProfile = ens.table(
  "profiles",
  {
    address: text().primaryKey(),
    ens: text(),
    data: json().$type<EnsProfileData>(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (t) => [unique("ens_profile_ens_unique").on(t.ens)],
);
