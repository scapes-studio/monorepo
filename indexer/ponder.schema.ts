import { onchainTable } from "ponder";
import type { EnsProfileData, Price, VolumeStats } from "./ponder.types";

export const account = onchainTable("account", (t) => ({
  address: t.hex().primaryKey(),
  balance: t.bigint().notNull(),
  lastChange: t.bigint().notNull(),
}));

export const scape = onchainTable("scape", (t) => ({
  id: t.bigint().primaryKey(),
  owner: t.hex().notNull(),
  attributes: t.json(),
  rarity: t.doublePrecision(),
}));

export const transferEvent = onchainTable("transfer_event", (t) => ({
  id: t.text().primaryKey(),
  timestamp: t.integer().notNull(),
  from: t.hex().notNull(),
  to: t.hex().notNull(),
  scape: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const twentySevenYearScape = onchainTable(
  "twenty_seven_year_scape",
  (t) => ({
    id: t.bigint().primaryKey(),
    owner: t.hex().notNull(),
  }),
);

export const twentySevenYearTransferEvent = onchainTable(
  "twenty_seven_year_transfer_event",
  (t) => ({
    id: t.text().primaryKey(),
    timestamp: t.integer().notNull(),
    from: t.hex().notNull(),
    to: t.hex().notNull(),
    scape: t.bigint().notNull(),
    txHash: t.hex().notNull(),
  }),
);

export const offer = onchainTable("offer", (t) => ({
  tokenId: t.bigint().primaryKey(),
  price: t.bigint().notNull(),
  specificBuyer: t.hex(),
  isActive: t.boolean().notNull(),
  createdAt: t.integer().notNull(),
  updatedAt: t.integer().notNull(),
}));

export const sale = onchainTable("sale", (t) => ({
  id: t.text().primaryKey(),
  tokenId: t.bigint().notNull(),
  seller: t.hex().notNull(),
  buyer: t.hex().notNull(),
  price: t.bigint().notNull(),
  timestamp: t.integer().notNull(),
  txHash: t.hex().notNull(),
}));

// ============================================
// Offchain Tables (written by external services via views)
// ============================================

// Individual sales records from OpenSea/Seaport
// Primary key is a composite of fields that uniquely identify a sale
export const seaportSale = onchainTable("seaport_sale", (t) => ({
  id: t.text().primaryKey(), // Composite: `${slug}-${tokenId}-${txHash}-${logIndex}`
  slug: t.text().notNull(),
  contract: t.hex().notNull(),
  tokenId: t.bigint("token_id").notNull(),
  txHash: t.hex("tx_hash").notNull(),
  orderHash: t.hex("order_hash"),
  block: t.bigint(),
  timestamp: t.integer().notNull(),
  logIndex: t.integer("log_index"),
  seller: t.hex().notNull(),
  buyer: t.hex().notNull(),
  price: t.json().$type<Price>().notNull(),
}));

// Individual listing records from OpenSea/Seaport
// orderHash uniquely identifies a listing
export const seaportListing = onchainTable("seaport_listing", (t) => ({
  orderHash: t.hex("order_hash").primaryKey(),
  slug: t.text().notNull(),
  contract: t.hex().notNull(),
  tokenId: t.bigint("token_id").notNull(),
  protocolAddress: t.hex("protocol_address"),
  timestamp: t.integer().notNull(),
  startDate: t.integer("start_date").notNull(),
  expirationDate: t.integer("expiration_date").notNull(),
  maker: t.hex().notNull(),
  taker: t.hex(),
  isPrivateListing: t.boolean("is_private_listing").notNull().default(false),
  price: t.json().$type<Price>().notNull(),
}));

// Sync state for tracking last synced timestamp per collection
export const syncState = onchainTable("sync_state", (t) => ({
  slug: t.text().primaryKey(),
  contract: t.hex().notNull(),
  lastSyncedTimestamp: t.integer("last_synced_timestamp"),
  stats: t.json().$type<VolumeStats>(),
  updatedAt: t.integer("updated_at").notNull(),
}));

// ENS profile cache
export const ensProfile = onchainTable("ens_profile", (t) => ({
  address: t.hex().primaryKey(),
  ens: t.text(),
  data: t.json().$type<EnsProfileData>(),
  updatedAt: t.integer("updated_at").notNull(),
}));
