import { pgSchema, text, integer, boolean, json } from "drizzle-orm/pg-core";
import { hex, bigint } from "./src/utils/drizzle-types";
import type { Price, VolumeStats, EnsProfileData } from "./ponder.types";

export const offchainSchema = pgSchema("offchain");

// Individual sales records from OpenSea/Seaport
// Primary key is a composite of fields that uniquely identify a sale
export const seaportSale = offchainSchema.table("seaport_sale", {
  id: text("id").primaryKey(), // Composite: `${slug}-${tokenId}-${txHash}-${logIndex}`
  slug: text("slug").notNull(),
  contract: hex("contract").notNull(),
  tokenId: bigint("token_id").notNull(),
  txHash: hex("tx_hash").notNull(),
  orderHash: hex("order_hash"),
  block: bigint("block"),
  timestamp: integer("timestamp").notNull(),
  logIndex: integer("log_index"),
  seller: hex("seller").notNull(),
  buyer: hex("buyer").notNull(),
  price: json("price").$type<Price>().notNull(),
});

// Individual listing records from OpenSea/Seaport
// orderHash uniquely identifies a listing
export const seaportListing = offchainSchema.table("seaport_listing", {
  orderHash: hex("order_hash").primaryKey(),
  slug: text("slug").notNull(),
  contract: hex("contract").notNull(),
  tokenId: bigint("token_id").notNull(),
  protocolAddress: hex("protocol_address"),
  timestamp: integer("timestamp").notNull(),
  startDate: integer("start_date").notNull(),
  expirationDate: integer("expiration_date").notNull(),
  maker: hex("maker").notNull(),
  taker: hex("taker"),
  isPrivateListing: boolean("is_private_listing").notNull().default(false),
  price: json("price").$type<Price>().notNull(),
});

// Sync state for tracking last synced timestamp per collection
export const syncState = offchainSchema.table("sync_state", {
  slug: text("slug").primaryKey(),
  contract: hex("contract").notNull(),
  lastSyncedTimestamp: integer("last_synced_timestamp"),
  stats: json("stats").$type<VolumeStats>(),
  updatedAt: integer("updated_at").notNull(),
});

// ENS profile cache
export const ensProfile = offchainSchema.table("ens_profile", {
  address: hex("address").primaryKey(),
  ens: text("ens"),
  data: json("data").$type<EnsProfileData>(),
  updatedAt: integer("updated_at").notNull(),
});
