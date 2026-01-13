import { setDatabaseSchema } from "@ponder/client";
import { relations } from "drizzle-orm";
import * as ponderSchema from "./ponder.schema";
import * as offchainSchema from "./offchain.schema";

// Views schema name for external queries (CLI commands, external clients)
// NOTE: setDatabaseSchema is called lazily to avoid mutating schema during Ponder runtime
const VIEWS_SCHEMA = process.env.PONDER_VIEWS_SCHEMA;

let schemaInitialized = false;

/**
 * Initialize the views schema for external queries.
 * Must be called before using combinedSchema for production queries.
 */
export function initViewsSchema() {
  if (!schemaInitialized && VIEWS_SCHEMA) {
    setDatabaseSchema(ponderSchema, VIEWS_SCHEMA);
    schemaInitialized = true;
  }
}

// Define relations between offchain sales and onchain scapes
export const seaportSaleRelations = relations(
  offchainSchema.seaportSale,
  ({ one }) => ({
    scape: one(ponderSchema.scape, {
      fields: [offchainSchema.seaportSale.tokenId],
      references: [ponderSchema.scape.id],
    }),
  })
);

export const seaportListingRelations = relations(
  offchainSchema.seaportListing,
  ({ one }) => ({
    scape: one(ponderSchema.scape, {
      fields: [offchainSchema.seaportListing.tokenId],
      references: [ponderSchema.scape.id],
    }),
  })
);

// Combined schema for querying both onchain and offchain data
// NOTE: Call initViewsSchema() before using this for production queries
export const combinedSchema = {
  ...ponderSchema,
  ...offchainSchema,
  seaportSaleRelations,
  seaportListingRelations,
};
