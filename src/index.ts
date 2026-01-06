import { ponder } from "ponder:registry";
import { offer, sale } from "ponder:schema";
import { computeTransfer } from "./utils";
import { zeroAddress } from "viem";

ponder.on("PunkScapes:Transfer", async ({ event, context }) => {
  await computeTransfer(
    {
      scapeId: event.args.id,
      eventId: event.id,
      timestamp: event.block.timestamp,
      from: event.args.from,
      to: event.args.to,
    },
    context,
  );
});

ponder.on("Scapes:Transfer", async ({ event, context }) => {
  await computeTransfer(
    {
      scapeId: event.args.id,
      eventId: event.id,
      timestamp: event.block.timestamp,
      from: event.args.from,
      to: event.args.to,
    },
    context,
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
      price: event.args.value,
      specificBuyer,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoUpdate({
      price: event.args.value,
      specificBuyer,
      isActive: true,
      updatedAt: timestamp,
    });
});

ponder.on("Scapes:OfferWithdrawn", async ({ event, context }) => {
  const timestamp = Number(event.block.timestamp);

  await context.db
    .insert(offer)
    .values({
      tokenId: event.args.tokenId,
      price: 0n,
      specificBuyer: null,
      isActive: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoUpdate({
      isActive: false,
      updatedAt: timestamp,
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
  });

  // Mark offer as inactive (consumed by sale)
  await context.db
    .insert(offer)
    .values({
      tokenId: event.args.tokenId,
      price: event.args.value,
      specificBuyer: null,
      isActive: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoUpdate({
      isActive: false,
      updatedAt: timestamp,
    });
});
