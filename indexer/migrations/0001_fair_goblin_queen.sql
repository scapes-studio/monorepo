CREATE TABLE "offchain"."twenty_seven_year_request" (
	"id" serial PRIMARY KEY NOT NULL,
	"token_id" integer NOT NULL,
	"from" text,
	"transaction_hash" text,
	"value" numeric(128, 0),
	"description" text,
	"image_path" text,
	"image_input" json,
	"image_steps" integer,
	"image_task_id" text,
	"created_at" bigint,
	"started_processing_at" bigint,
	"completed_at" bigint
);
--> statement-breakpoint
CREATE TABLE "offchain"."twenty_seven_year_scape_detail" (
	"token_id" integer PRIMARY KEY NOT NULL,
	"scape_id" integer,
	"date" bigint,
	"auction_ends_at" bigint,
	"description" text,
	"request_id" integer,
	"image_path" text,
	"step" integer,
	"image_cid" text,
	"metadata_cid" text,
	"data" json,
	"owner" text,
	"initial_render_id" integer,
	"completed_at" bigint,
	"created_at" bigint,
	"updated_at" bigint
);
