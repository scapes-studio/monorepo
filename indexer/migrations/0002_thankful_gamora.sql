CREATE TABLE "offchain"."merge_image" (
	"token_id" integer PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"processed_at" integer,
	"created_at" integer NOT NULL
);
