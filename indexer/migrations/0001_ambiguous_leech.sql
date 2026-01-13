CREATE SCHEMA "ens";
--> statement-breakpoint
CREATE TABLE "ens"."profiles" (
	"address" text PRIMARY KEY NOT NULL,
	"ens" text,
	"data" json,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "ens_profile_ens_unique" UNIQUE("ens")
);
