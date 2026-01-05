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
