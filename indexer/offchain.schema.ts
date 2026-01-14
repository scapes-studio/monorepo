import { pgSchema, text, integer, boolean, json, numeric, serial, bigint } from "drizzle-orm/pg-core";
import type { Price, VolumeStats, EnsProfileData } from "./ponder.types";

// Types for twentySevenYear tables
export type TwentySevenYearScapeData = Record<string, unknown>;
export type TwentySevenYearImageInput = { prompt?: string;[key: string]: unknown };

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

// Merge image processing status
export const mergeImage = offchainSchema.table("merge_image", {
  tokenId: integer("token_id").primaryKey(),
  status: text("status").notNull().default("pending"), // pending | processed | failed
  errorMessage: text("error_message"),
  processedAt: integer("processed_at"),
  createdAt: integer("created_at").notNull(),
});

// TwentySevenYear scape details (offchain metadata)
export const twentySevenYearScapeDetail = offchainSchema.table("twenty_seven_year_scape_detail", {
  tokenId: integer("token_id").primaryKey(),
  scapeId: integer("scape_id"),                    // Parent PunkScape
  date: bigint("date", { mode: "number" }),        // Unix timestamp (bigint for dates beyond 2038)
  auctionEndsAt: bigint("auction_ends_at", { mode: "number" }),
  description: text("description"),
  requestId: integer("request_id"),                // FK to winning request
  imagePath: text("image_path"),                   // S3 path
  step: integer("step"),                           // AI generation step used
  imageCid: text("image_cid"),                     // IPFS CID for image
  metadataCid: text("metadata_cid"),               // IPFS CID for metadata
  data: json("data").$type<TwentySevenYearScapeData>(),
  owner: text("owner"),
  initialRenderId: integer("initial_render_id"),
  completedAt: bigint("completed_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }),
  updatedAt: bigint("updated_at", { mode: "number" }),
});

// TwentySevenYear rendering requests (bids and pre-generations)
export const twentySevenYearRequest = offchainSchema.table("twenty_seven_year_request", {
  id: serial("id").primaryKey(),
  tokenId: integer("token_id").notNull(),          // FK to twentySevenYearScapeDetail
  from: text("from"),                              // Bidder address (null for pre-gens)
  transactionHash: text("transaction_hash"),
  value: numeric("value", { precision: 128, scale: 0 }), // Bid in wei (null for pre-gens)
  description: text("description"),                // Bid prompt
  // Embedded AI image fields
  imagePath: text("image_path"),                   // S3 path
  imageInput: json("image_input").$type<TwentySevenYearImageInput>(),
  imageSteps: integer("image_steps"),
  imageTaskId: text("image_task_id"),              // Leonardo AI task ID
  createdAt: bigint("created_at", { mode: "number" }),
  startedProcessingAt: bigint("started_processing_at", { mode: "number" }),
  completedAt: bigint("completed_at", { mode: "number" }),
});
