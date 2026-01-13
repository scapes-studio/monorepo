import { pgSchema, text, integer, boolean, json, numeric } from "drizzle-orm/pg-core";
import type { Price, VolumeStats, EnsProfileData } from "./ponder.types";

export const offchainSchema = pgSchema("offchain");

// Individual sales records from OpenSea/Seaport
// Primary key is a composite of fields that uniquely identify a sale
export const seaportSale = offchainSchema.table("seaport_sale", {
  id: text("id").primaryKey(), // Composite: `${slug}-${tokenId}-${txHash}-${logIndex}`
  slug: text("slug").notNull(),
  contract: text("contract").notNull(),
  tokenId: numeric("token_id", { precision: 78, scale: 0 }).notNull(),
  txHash: text("tx_hash").notNull(),
  orderHash: text("order_hash"),
  block: numeric("block", { precision: 78, scale: 0 }),
  timestamp: integer("timestamp").notNull(),
  logIndex: integer("log_index"),
  seller: text("seller").notNull(),
  buyer: text("buyer").notNull(),
  price: json("price").$type<Price>().notNull(),
});

// Individual listing records from OpenSea/Seaport
// orderHash uniquely identifies a listing
export const seaportListing = offchainSchema.table("seaport_listing", {
  orderHash: text("order_hash").primaryKey(),
  slug: text("slug").notNull(),
  contract: text("contract").notNull(),
  tokenId: numeric("token_id", { precision: 78, scale: 0 }).notNull(),
  protocolAddress: text("protocol_address"),
  timestamp: integer("timestamp").notNull(),
  startDate: integer("start_date").notNull(),
  expirationDate: integer("expiration_date").notNull(),
  maker: text("maker").notNull(),
  taker: text("taker"),
  isPrivateListing: boolean("is_private_listing").notNull().default(false),
  price: json("price").$type<Price>().notNull(),
});

// Sync state for tracking last synced timestamp per collection
export const syncState = offchainSchema.table("sync_state", {
  slug: text("slug").primaryKey(),
  contract: text("contract").notNull(),
  lastSyncedTimestamp: integer("last_synced_timestamp"),
  stats: json("stats").$type<VolumeStats>(),
  updatedAt: integer("updated_at").notNull(),
});

// ENS profile cache
export const ensProfile = offchainSchema.table("ens_profile", {
  address: text("address").primaryKey(),
  ens: text("ens"),
  data: json("data").$type<EnsProfileData>(),
  updatedAt: integer("updated_at").notNull(),
});
