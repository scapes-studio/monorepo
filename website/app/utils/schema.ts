import * as ponderSchema from '@scapes-studio/indexer/ponder.schema'
import * as offchainSchema from '@scapes-studio/indexer/offchain.schema'

// Combined schema for SQL queries
export const schema = {
  ...ponderSchema,
  ...offchainSchema,
}
