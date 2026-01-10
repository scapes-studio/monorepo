import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import { zeroAddress } from "viem";

/**
 * Helper to save account addresses with balance tracking
 */
export async function saveAccounts(
  db: Context["db"],
  addresses: `0x${string}`[],
  timestamp: bigint,
) {
  const uniqueAddresses = [
    ...new Set(addresses.filter((address) => address !== zeroAddress)),
  ];

  for (const address of uniqueAddresses) {
    await db
      .insert(schema.account)
      .values({
        address,
        balance: 0n,
        lastChange: timestamp,
      })
      .onConflictDoUpdate({
        lastChange: timestamp,
      });
  }
}

/**
 * Centralized helper to process ERC721 transfers
 * Handles minting, burning, and regular transfers
 * Updates token ownership and account balances
 */
type ScapeTable = typeof schema.scape | typeof schema.twentySevenYearScape;
type TransferTable =
  | typeof schema.transferEvent
  | typeof schema.twentySevenYearTransferEvent;

export async function computeTransfer(
  {
    scapeId,
    eventId,
    timestamp,
    from,
    to,
    txHash,
  }: {
    scapeId: bigint;
    eventId: string;
    timestamp: bigint;
    from: `0x${string}`;
    to: `0x${string}`;
    txHash: `0x${string}`;
  },
  { db }: Context,
  {
    scapeTable,
    transferEventTable,
  }: {
    scapeTable: ScapeTable;
    transferEventTable: TransferTable;
  },
) {
  const isMint = from === zeroAddress;
  const isBurn = to === zeroAddress;

  // Save accounts (excludes zero address)
  await saveAccounts(db, [from, to], timestamp);

  // Update scape ownership
  await db
    .insert(scapeTable)
    .values({
      id: scapeId,
      owner: to,
    })
    .onConflictDoUpdate({ owner: to });

  // Store the transfer event
  await db.insert(transferEventTable).values({
    id: eventId,
    from,
    to,
    scape: scapeId,
    timestamp: Number(timestamp),
    txHash,
  });

  // Update sender balance (decrease by 1, skip for mints)
  if (!isMint) {
    await db
      .update(schema.account, { address: from })
      .set((row) => ({
        balance: row.balance - 1n,
        lastChange: timestamp,
      }));
  }

  // Update recipient balance (increase by 1, skip for burns)
  if (!isBurn) {
    await db
      .update(schema.account, { address: to })
      .set((row) => ({
        balance: row.balance + 1n,
        lastChange: timestamp,
      }));
  }
}
