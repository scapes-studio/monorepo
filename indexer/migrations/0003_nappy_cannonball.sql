CREATE TABLE "offchain"."notification_state" (
	"event_type" text PRIMARY KEY NOT NULL,
	"last_notified_timestamp" integer NOT NULL,
	"last_notified_id" text,
	"updated_at" integer NOT NULL
);
