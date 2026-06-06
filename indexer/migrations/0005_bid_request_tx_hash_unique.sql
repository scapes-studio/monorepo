UPDATE "offchain"."twenty_seven_year_request" SET "transaction_hash" = NULL WHERE "transaction_hash" = '';
--> statement-breakpoint
CREATE UNIQUE INDEX "twenty_seven_year_request_transaction_hash_unique" ON "offchain"."twenty_seven_year_request" USING btree ("transaction_hash") WHERE "offchain"."twenty_seven_year_request"."transaction_hash" IS NOT NULL;