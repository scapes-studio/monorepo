import { ponder } from "ponder:registry";
import { computeTransfer } from "./utils";

ponder.on("ERC721:Transfer", async ({ event, context }) => {
  await computeTransfer(
    {
      tokenId: event.args.id,
      eventId: event.id,
      timestamp: event.block.timestamp,
      from: event.args.from,
      to: event.args.to,
    },
    context,
  );
});
