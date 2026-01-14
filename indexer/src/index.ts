import { ponder } from "ponder:registry";
import {
  gallery27Auction,
  gallery27Bid,
  offer,
  sale,
  scape,
  transferEvent,
  twentySevenYearScape,
  twentySevenYearTransferEvent,
} from "ponder:schema";
import { computeTransfer, importScapeMetadata, saveAccounts } from "./utils";
import { zeroAddress } from "viem";

const baseTransferTables = {
  scapeTable: scape,
  transferEventTable: transferEvent,
};

const twentySevenYearTables = {
  scapeTable: twentySevenYearScape,
  transferEventTable: twentySevenYearTransferEvent,
};

ponder.on("PunkScapes:Transfer", async ({ event, context }) => {
  await computeTransfer(
    {
      scapeId: event.args.id,
      eventId: event.id,
      timestamp: event.block.timestamp,
      from: event.args.from,
      to: event.args.to,
      txHash: event.transaction.hash,
    },
    context,
    baseTransferTables,
  );

  if (event.args.from === zeroAddress) {
    await importScapeMetadata(context.db, event.args.id, event.args.to);
  }
});

ponder.on("Scapes:Transfer", async ({ event, context }) => {
  await computeTransfer(
    {
      scapeId: event.args.id,
      eventId: event.id,
      timestamp: event.block.timestamp,
      from: event.args.from,
      to: event.args.to,
      txHash: event.transaction.hash,
    },
    context,
    baseTransferTables,
  );
});

ponder.on("TwentySevenYearScapes:Transfer", async ({ event, context }) => {
  await computeTransfer(
    {
      scapeId: event.args.id,
      eventId: event.id,
      timestamp: event.block.timestamp,
      from: event.args.from,
      to: event.args.to,
      txHash: event.transaction.hash,
    },
    context,
    twentySevenYearTables,
  );
});

// Marketplace event handlers

ponder.on("Scapes:OfferCreated", async ({ event, context }) => {
  const timestamp = Number(event.block.timestamp);
  const specificBuyer = event.args.to === zeroAddress ? null : event.args.to;

  await context.db
    .insert(offer)
    .values({
      tokenId: event.args.tokenId,
      lister: event.transaction.from,
      price: event.args.value,
      specificBuyer,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
      txHash: event.transaction.hash,
    })
    .onConflictDoUpdate({
      lister: event.transaction.from,
      price: event.args.value,
      specificBuyer,
      isActive: true,
      updatedAt: timestamp,
      txHash: event.transaction.hash,
    });
});

ponder.on("Scapes:OfferWithdrawn", async ({ event, context }) => {
  const timestamp = Number(event.block.timestamp);

  await context.db
    .insert(offer)
    .values({
      tokenId: event.args.tokenId,
      lister: event.transaction.from,
      price: 0n,
      specificBuyer: null,
      isActive: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      txHash: event.transaction.hash,
    })
    .onConflictDoUpdate({
      isActive: false,
      updatedAt: timestamp,
      txHash: event.transaction.hash,
    });
});

ponder.on("Scapes:Sale", async ({ event, context }) => {
  const timestamp = Number(event.block.timestamp);

  // Record the sale
  await context.db.insert(sale).values({
    id: event.id,
    tokenId: event.args.tokenId,
    seller: event.args.from,
    buyer: event.args.to,
    price: event.args.value,
    timestamp,
    txHash: event.transaction.hash,
  });

  // Mark offer as inactive (consumed by sale)
  await context.db
    .insert(offer)
    .values({
      tokenId: event.args.tokenId,
      lister: event.args.from,
      price: event.args.value,
      specificBuyer: null,
      isActive: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      txHash: event.transaction.hash,
    })
    .onConflictDoUpdate({
      isActive: false,
      updatedAt: timestamp,
      txHash: event.transaction.hash,
    });
});

// Gallery27 event handlers

type Gallery27Contract = "Gallery27V1" | "Gallery27";

function createGallery27BidHandler(contract: Gallery27Contract) {
  return async ({
    event,
    context,
  }: {
    event: {
      id: string;
      args: {
        punkScapeId: bigint;
        bid: bigint;
        from: `0x${string}`;
        message: string;
      };
      block: { timestamp: bigint; number: bigint };
      transaction: { hash: `0x${string}` };
    };
    context: { db: Parameters<typeof saveAccounts>[0] };
  }) => {
    const timestamp = Number(event.block.timestamp);

    // Save bidder account
    await saveAccounts(context.db, [event.args.from], event.block.timestamp);

    // Insert bid record
    await context.db.insert(gallery27Bid).values({
      id: event.id,
      punkScapeId: event.args.punkScapeId,
      contract,
      bidder: event.args.from,
      amount: event.args.bid,
      message: event.args.message,
      timestamp,
      blockNumber: event.block.number,
      txHash: event.transaction.hash,
    });

    // Upsert auction state
    await context.db
      .insert(gallery27Auction)
      .values({
        punkScapeId: event.args.punkScapeId,
        contract,
        latestBidder: event.args.from,
        latestBid: event.args.bid,
        endTimestamp: null,
        bidCount: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .onConflictDoUpdate((row) => ({
        latestBidder: event.args.from,
        latestBid: event.args.bid,
        bidCount: row.bidCount + 1,
        updatedAt: timestamp,
      }));
  };
}

function createGallery27AuctionExtendedHandler(contract: Gallery27Contract) {
  return async ({
    event,
    context,
  }: {
    event: {
      args: { punkScapeId: bigint; endTimestamp: bigint };
      block: { timestamp: bigint };
    };
    context: { db: Parameters<typeof saveAccounts>[0] };
  }) => {
    const timestamp = Number(event.block.timestamp);

    await context.db
      .insert(gallery27Auction)
      .values({
        punkScapeId: event.args.punkScapeId,
        contract,
        latestBidder: null,
        latestBid: null,
        endTimestamp: Number(event.args.endTimestamp),
        bidCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .onConflictDoUpdate({
        endTimestamp: Number(event.args.endTimestamp),
        updatedAt: timestamp,
      });
  };
}

ponder.on("Gallery27V1:Bid", createGallery27BidHandler("Gallery27V1"));
ponder.on("Gallery27:Bid", createGallery27BidHandler("Gallery27"));

ponder.on(
  "Gallery27V1:AuctionExtended",
  createGallery27AuctionExtendedHandler("Gallery27V1"),
);
ponder.on(
  "Gallery27:AuctionExtended",
  createGallery27AuctionExtendedHandler("Gallery27"),
);
