import * as ponderSchema from "@scapes-studio/indexer/ponder.schema";
import * as offchainSchema from "@scapes-studio/indexer/offchain.schema";

// Combined schema export (no setDatabaseSchema - Ponder handles routing internally)
export const schema = {
  ...ponderSchema,
  ...offchainSchema,
};
