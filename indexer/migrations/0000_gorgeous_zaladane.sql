CREATE SCHEMA "offchain";
--> statement-breakpoint
CREATE TABLE "offchain"."ens_profile" (
	"address" text PRIMARY KEY NOT NULL,
	"ens" text,
	"data" json,
	"updated_at" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offchain"."seaport_listing" (
	"order_hash" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"contract" text NOT NULL,
	"token_id" numeric(78, 0) NOT NULL,
	"protocol_address" text,
	"timestamp" integer NOT NULL,
	"start_date" integer NOT NULL,
	"expiration_date" integer NOT NULL,
	"maker" text NOT NULL,
	"taker" text,
	"is_private_listing" boolean DEFAULT false NOT NULL,
	"price" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offchain"."seaport_sale" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"contract" text NOT NULL,
	"token_id" numeric(78, 0) NOT NULL,
	"tx_hash" text NOT NULL,
	"order_hash" text,
	"block" numeric(78, 0),
	"timestamp" integer NOT NULL,
	"log_index" integer,
	"seller" text NOT NULL,
	"buyer" text NOT NULL,
	"price" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offchain"."sync_state" (
	"slug" text PRIMARY KEY NOT NULL,
	"contract" text NOT NULL,
	"last_synced_timestamp" integer,
	"stats" json,
	"updated_at" integer NOT NULL
);
