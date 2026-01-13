import { setDatabaseSchema } from "@ponder/client";
import { relations } from "drizzle-orm";
import * as ponderSchema from "./ponder.schema";
import * as offchainSchema from "./offchain.schema";

// Set Ponder schema location for views pattern
const viewsSchema = process.env.PONDER_VIEWS_SCHEMA || "public";
setDatabaseSchema(ponderSchema, viewsSchema);

// Cross-schema relations for seaportSale
export const seaportSaleRelations = relations(
  offchainSchema.seaportSale,
  ({ one }) => ({
    sellerAccount: one(ponderSchema.account, {
      fields: [offchainSchema.seaportSale.seller],
      references: [ponderSchema.account.address],
      relationName: "sellerAccount",
    }),
    buyerAccount: one(ponderSchema.account, {
      fields: [offchainSchema.seaportSale.buyer],
      references: [ponderSchema.account.address],
      relationName: "buyerAccount",
    }),
  }),
);

// Cross-schema relations for seaportListing
export const seaportListingRelations = relations(
  offchainSchema.seaportListing,
  ({ one }) => ({
    scape: one(ponderSchema.scape, {
      fields: [offchainSchema.seaportListing.tokenId],
      references: [ponderSchema.scape.id],
    }),
    makerAccount: one(ponderSchema.account, {
      fields: [offchainSchema.seaportListing.maker],
      references: [ponderSchema.account.address],
      relationName: "makerAccount",
    }),
    takerAccount: one(ponderSchema.account, {
      fields: [offchainSchema.seaportListing.taker],
      references: [ponderSchema.account.address],
      relationName: "takerAccount",
    }),
  }),
);

// Cross-schema relations for ensProfile
export const ensProfileRelations = relations(
  offchainSchema.ensProfile,
  ({ one }) => ({
    account: one(ponderSchema.account, {
      fields: [offchainSchema.ensProfile.address],
      references: [ponderSchema.account.address],
    }),
  }),
);

// Combined schema export
export const schema = {
  ...ponderSchema,
  ...offchainSchema,
  seaportSaleRelations,
  seaportListingRelations,
  ensProfileRelations,
};
