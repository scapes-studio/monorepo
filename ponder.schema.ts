import { onchainTable } from "ponder";

export const account = onchainTable("account", (t) => ({
  address: t.hex().primaryKey(),
  balance: t.bigint().notNull(),
  lastChange: t.bigint().notNull(),
}));

export const scape = onchainTable("scape", (t) => ({
  id: t.bigint().primaryKey(),
  owner: t.hex().notNull(),
}));

export const transferEvent = onchainTable("transfer_event", (t) => ({
  id: t.text().primaryKey(),
  timestamp: t.integer().notNull(),
  from: t.hex().notNull(),
  to: t.hex().notNull(),
  scape: t.bigint().notNull(),
}));

export const offer = onchainTable("offer", (t) => ({
  tokenId: t.bigint().primaryKey(),
  price: t.bigint().notNull(),
  specificBuyer: t.hex(),
  isActive: t.boolean().notNull(),
  createdAt: t.integer().notNull(),
  updatedAt: t.integer().notNull(),
}));

export const sale = onchainTable("sale", (t) => ({
  id: t.text().primaryKey(),
  tokenId: t.bigint().notNull(),
  seller: t.hex().notNull(),
  buyer: t.hex().notNull(),
  price: t.bigint().notNull(),
  timestamp: t.integer().notNull(),
}));
