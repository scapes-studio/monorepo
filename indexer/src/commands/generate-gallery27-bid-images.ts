import { Command } from "commander";
import { generateBidImages } from "../services/gallery27-bid-images";

export const generateGallery27BidImagesCommand = new Command(
  "generate:gallery27-bid-images",
)
  .description("Generate AI images for recent Gallery27 bids that don't have one")
  .option("--backfill-days <n>", "How many days back to consider bids (default 14)")
  .option("--batch-size <n>", "Max generations to start per run", "5")
  .option("--dry-run", "List bids that would be generated, without calling Leonardo")
  .action(
    async (options: {
      backfillDays?: string;
      batchSize?: string;
      dryRun?: boolean;
    }) => {
      const backfillDays =
        options.backfillDays !== undefined
          ? parseInt(options.backfillDays, 10)
          : undefined;
      const batchSize = parseInt(options.batchSize ?? "5", 10);

      if (backfillDays !== undefined && (isNaN(backfillDays) || backfillDays < 0)) {
        console.error("Backfill days must be a non-negative number");
        process.exit(1);
      }
      if (isNaN(batchSize) || batchSize < 1) {
        console.error("Batch size must be a positive number");
        process.exit(1);
      }

      if (!options.dryRun && !process.env.LEONARDO_KEY) {
        console.error("Error: LEONARDO_KEY environment variable is required");
        process.exit(1);
      }

      console.log("Generating Gallery27 bid images...");
      console.log(`  Backfill days: ${backfillDays ?? "default (14)"}`);
      console.log(`  Batch size: ${batchSize}`);
      console.log(`  Dry run: ${options.dryRun ?? false}`);
      console.log();

      try {
        const result = await generateBidImages({
          backfillDays,
          batchSize,
          dryRun: options.dryRun,
        });

        for (const detail of result.details) {
          const label = detail.tokenId !== null ? `#${detail.tokenId}` : "(no day)";
          const suffix =
            detail.status === "failed" ? ` — ${detail.error}` : "";
          const message = detail.message ? ` "${detail.message}"` : "";
          console.log(`  [${detail.status}] ${label} ${detail.txHash}${message}${suffix}`);
        }

        console.log();
        console.log(
          `Considered ${result.considered} bid(s): ` +
            `${result.generated} generated, ${result.skipped} already had images, ` +
            `${result.failed} failed.` +
            (result.capped ? " Batch limit reached; remaining bids next run." : ""),
        );

        process.exit(result.failed > 0 ? 1 : 0);
      } catch (error) {
        console.error("\nError generating bid images:", error);
        process.exit(1);
      }
    },
  );
