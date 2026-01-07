import { setDatabaseSchema } from "@ponder/client";
import { relations } from "drizzle-orm";
import * as ponderSchema from "../ponder.schema";
import * as offchainSchema from "./offchain";

// Set the database schema for Ponder tables to use the views schema
// This allows stable queries across deployments when using --views-schema=scapes
const VIEWS_SCHEMA = process.env.PONDER_VIEWS_SCHEMA ?? "scapes";
setDatabaseSchema(ponderSchema, VIEWS_SCHEMA);

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
export const combinedSchema = {
  ...ponderSchema,
  ...offchainSchema,
  seaportSaleRelations,
  seaportListingRelations,
};
