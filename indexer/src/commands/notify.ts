import { Command } from "commander";
import {
  NotificationService,
  type NotificationEventType,
  type NotificationChannel,
} from "../services/notifications";

const ALL_EVENT_TYPES: NotificationEventType[] = [
  "merge",
  "offer",
  "sale",
  "g27_bid",
  "g27_claim",
];

const ALL_CHANNELS: NotificationChannel[] = ["discord", "twitter"];

export const notifyCommand = new Command("notify")
  .description("Send bot notifications for new events")
  .option(
    "--types <types>",
    `Comma-separated event types (${ALL_EVENT_TYPES.join(",")})`
  )
  .option(
    "--channels <channels>",
    `Comma-separated channels (${ALL_CHANNELS.join(",")})`
  )
  .option("--dry-run", "Print notifications without sending")
  .action(
    async (options: {
      types?: string;
      channels?: string;
      dryRun?: boolean;
    }) => {
      const eventTypes = options.types
        ? (options.types.split(",") as NotificationEventType[])
        : ALL_EVENT_TYPES;
      const channels = options.channels
        ? (options.channels.split(",") as NotificationChannel[])
        : ALL_CHANNELS;

      // Validate event types
      for (const type of eventTypes) {
        if (!ALL_EVENT_TYPES.includes(type)) {
          console.error(`Unknown event type: ${type}`);
          console.error(`Available types: ${ALL_EVENT_TYPES.join(", ")}`);
          process.exit(1);
        }
      }

      // Validate channels
      for (const channel of channels) {
        if (!ALL_CHANNELS.includes(channel)) {
          console.error(`Unknown channel: ${channel}`);
          console.error(`Available channels: ${ALL_CHANNELS.join(", ")}`);
          process.exit(1);
        }
      }

      console.log("Processing notifications...");
      console.log(`  Event types: ${eventTypes.join(", ")}`);
      console.log(`  Channels: ${channels.join(", ")}`);
      console.log(`  Dry run: ${options.dryRun ?? false}`);
      console.log();

      const service = new NotificationService({
        dryRun: options.dryRun,
        channels,
      });

      try {
        const results = await service.processNotifications(eventTypes);

        console.log("\nResults:");
        let totalCount = 0;
        for (const { type, count } of results) {
          console.log(`  ${type}: ${count} notifications`);
          totalCount += count;
        }
        console.log(`\nTotal: ${totalCount} notifications sent`);
      } catch (error) {
        console.error("\nError processing notifications:", error);
        process.exit(1);
      }

      process.exit(0);
    }
  );
