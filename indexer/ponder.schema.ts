import { onchainTable, relations } from "ponder";

// ============================================
// Onchain Tables
// ============================================

export const account = onchainTable("account", (t) => ({
  address: t.hex().primaryKey(),
  balance: t.bigint().notNull(),
  lastChange: t.bigint().notNull(),
}));

export const scape = onchainTable("scape", (t) => ({
  id: t.bigint().primaryKey(),
  owner: t.hex().notNull(),
  attributes: t.json(),
  rarity: t.doublePrecision(),
}));

export const transferEvent = onchainTable("transfer_event", (t) => ({
  id: t.text().primaryKey(),
  timestamp: t.integer().notNull(),
  from: t.hex().notNull(),
  to: t.hex().notNull(),
  scape: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const twentySevenYearScape = onchainTable(
  "twenty_seven_year_scape",
  (t) => ({
    id: t.bigint().primaryKey(),
    owner: t.hex().notNull(),
  }),
);

export const twentySevenYearTransferEvent = onchainTable(
  "twenty_seven_year_transfer_event",
  (t) => ({
    id: t.text().primaryKey(),
    timestamp: t.integer().notNull(),
    from: t.hex().notNull(),
    to: t.hex().notNull(),
    scape: t.bigint().notNull(),
    txHash: t.hex().notNull(),
  }),
);

export const offer = onchainTable("offer", (t) => ({
  tokenId: t.bigint().primaryKey(),
  lister: t.hex().notNull(),
  price: t.bigint().notNull(),
  specificBuyer: t.hex(),
  isActive: t.boolean().notNull(),
  createdAt: t.integer().notNull(),
  updatedAt: t.integer().notNull(),
  txHash: t.hex().notNull(),
}));

export const sale = onchainTable("sale", (t) => ({
  id: t.text().primaryKey(),
  tokenId: t.bigint().notNull(),
  seller: t.hex().notNull(),
  buyer: t.hex().notNull(),
  price: t.bigint().notNull(),
  timestamp: t.integer().notNull(),
  txHash: t.hex().notNull(),
}));

export const gallery27Auction = onchainTable("gallery27_auction", (t) => ({
  punkScapeId: t.bigint().primaryKey(),
  contract: t.text().notNull(),
  latestBidder: t.hex(),
  latestBid: t.bigint(),
  endTimestamp: t.integer(),
  bidCount: t.integer().notNull(),
  createdAt: t.integer().notNull(),
  updatedAt: t.integer().notNull(),
}));

export const gallery27Bid = onchainTable("gallery27_bid", (t) => ({
  id: t.text().primaryKey(),
  punkScapeId: t.bigint().notNull(),
  contract: t.text().notNull(),
  bidder: t.hex().notNull(),
  amount: t.bigint().notNull(),
  message: t.text().notNull(),
  timestamp: t.integer().notNull(),
  blockNumber: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

// ============================================
// Relations
// ============================================

export const accountRelations = relations(account, ({ many }) => ({
  scapes: many(scape),
  twentySevenYearScapes: many(twentySevenYearScape),
  transfersFrom: many(transferEvent, { relationName: "fromAccount" }),
  transfersTo: many(transferEvent, { relationName: "toAccount" }),
  twentySevenYearTransfersFrom: many(twentySevenYearTransferEvent, {
    relationName: "fromAccount",
  }),
  twentySevenYearTransfersTo: many(twentySevenYearTransferEvent, {
    relationName: "toAccount",
  }),
  salesAsSeller: many(sale, { relationName: "sellerAccount" }),
  salesAsBuyer: many(sale, { relationName: "buyerAccount" }),
  gallery27Bids: many(gallery27Bid),
  gallery27AuctionsAsLeader: many(gallery27Auction),
}));

export const scapeRelations = relations(scape, ({ one, many }) => ({
  ownerAccount: one(account, {
    fields: [scape.owner],
    references: [account.address],
  }),
  transfers: many(transferEvent),
  offer: one(offer, { fields: [scape.id], references: [offer.tokenId] }),
  sales: many(sale),
}));

export const transferEventRelations = relations(transferEvent, ({ one }) => ({
  scapeEntity: one(scape, {
    fields: [transferEvent.scape],
    references: [scape.id],
  }),
  fromAccount: one(account, {
    fields: [transferEvent.from],
    references: [account.address],
    relationName: "fromAccount",
  }),
  toAccount: one(account, {
    fields: [transferEvent.to],
    references: [account.address],
    relationName: "toAccount",
  }),
}));

export const twentySevenYearScapeRelations = relations(
  twentySevenYearScape,
  ({ one, many }) => ({
    ownerAccount: one(account, {
      fields: [twentySevenYearScape.owner],
      references: [account.address],
    }),
    transfers: many(twentySevenYearTransferEvent),
  }),
);

export const twentySevenYearTransferEventRelations = relations(
  twentySevenYearTransferEvent,
  ({ one }) => ({
    scapeEntity: one(twentySevenYearScape, {
      fields: [twentySevenYearTransferEvent.scape],
      references: [twentySevenYearScape.id],
    }),
    fromAccount: one(account, {
      fields: [twentySevenYearTransferEvent.from],
      references: [account.address],
      relationName: "fromAccount",
    }),
    toAccount: one(account, {
      fields: [twentySevenYearTransferEvent.to],
      references: [account.address],
      relationName: "toAccount",
    }),
  }),
);

export const offerRelations = relations(offer, ({ one }) => ({
  scape: one(scape, { fields: [offer.tokenId], references: [scape.id] }),
  specificBuyerAccount: one(account, {
    fields: [offer.specificBuyer],
    references: [account.address],
  }),
}));

export const saleRelations = relations(sale, ({ one }) => ({
  scape: one(scape, { fields: [sale.tokenId], references: [scape.id] }),
  sellerAccount: one(account, {
    fields: [sale.seller],
    references: [account.address],
    relationName: "sellerAccount",
  }),
  buyerAccount: one(account, {
    fields: [sale.buyer],
    references: [account.address],
    relationName: "buyerAccount",
  }),
}));

export const gallery27AuctionRelations = relations(
  gallery27Auction,
  ({ one, many }) => ({
    scape: one(scape, {
      fields: [gallery27Auction.punkScapeId],
      references: [scape.id],
    }),
    latestBidderAccount: one(account, {
      fields: [gallery27Auction.latestBidder],
      references: [account.address],
    }),
    bids: many(gallery27Bid),
  }),
);

export const gallery27BidRelations = relations(gallery27Bid, ({ one }) => ({
  auction: one(gallery27Auction, {
    fields: [gallery27Bid.punkScapeId],
    references: [gallery27Auction.punkScapeId],
  }),
  bidderAccount: one(account, {
    fields: [gallery27Bid.bidder],
    references: [account.address],
  }),
}));
