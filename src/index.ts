import { ponder } from "ponder:registry";
import { computeTransfer } from "./utils";

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
