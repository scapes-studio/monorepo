CREATE SCHEMA "offchain";
--> statement-breakpoint
CREATE TABLE "offchain"."seaport_listing" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "offchain"."seaport_listing_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"contract" text NOT NULL,
	"token_id" text NOT NULL,
	"order_hash" text NOT NULL,
	"protocol_address" text,
	"timestamp" integer NOT NULL,
	"start_date" integer NOT NULL,
	"expiration_date" integer NOT NULL,
	"maker" text NOT NULL,
	"taker" text,
	"is_private_listing" boolean DEFAULT false NOT NULL,
	"price" json NOT NULL,
	CONSTRAINT "seaport_listing_unique" UNIQUE("order_hash")
);
--> statement-breakpoint
CREATE TABLE "offchain"."seaport_sale" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "offchain"."seaport_sale_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"contract" text NOT NULL,
	"token_id" text NOT NULL,
	"tx_hash" text NOT NULL,
	"order_hash" text,
	"block" bigint,
	"timestamp" integer NOT NULL,
	"log_index" integer,
	"seller" text NOT NULL,
	"buyer" text NOT NULL,
	"price" json NOT NULL,
	CONSTRAINT "seaport_sale_unique" UNIQUE("slug","token_id","tx_hash","log_index","order_hash")
);
--> statement-breakpoint
CREATE TABLE "offchain"."sync_state" (
	"slug" text PRIMARY KEY NOT NULL,
	"contract" text NOT NULL,
	"last_synced_timestamp" integer,
	"stats" json,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "seaport_listing_slug_idx" ON "offchain"."seaport_listing" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "seaport_listing_token_idx" ON "offchain"."seaport_listing" USING btree ("token_id");--> statement-breakpoint
CREATE INDEX "seaport_listing_expiration_idx" ON "offchain"."seaport_listing" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "seaport_sale_slug_idx" ON "offchain"."seaport_sale" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "seaport_sale_timestamp_idx" ON "offchain"."seaport_sale" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "seaport_sale_token_idx" ON "offchain"."seaport_sale" USING btree ("token_id");--> statement-breakpoint
CREATE INDEX "seaport_sale_tx_hash_idx" ON "offchain"."seaport_sale" USING btree ("tx_hash");