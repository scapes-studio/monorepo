import { Command } from "commander";
import { mergeImagesService } from "../services/merge-images";

export const processMergeImagesCommand = new Command("process:merge-images")
  .description("Process pending merge images and upload to S3")
  .option("--batch-size <n>", "Number of images to process", "10")
  .option("--token-id <id>", "Process a specific token ID")
  .option("--force", "Reprocess even if already done")
  .option("--stats", "Show processing statistics only")
  .action(
    async (options: {
      batchSize?: string;
      tokenId?: string;
      force?: boolean;
      stats?: boolean;
    }) => {
      // Stats only mode
      if (options.stats) {
        const stats = await mergeImagesService.getStats();
        console.log("\nMerge Image Processing Stats:");
        console.log(`  Total merges:  ${stats.total}`);
        console.log(`  Processed:     ${stats.processed}`);
        console.log(`  Failed:        ${stats.failed}`);
        console.log(`  Pending:       ${stats.pending}`);
        console.log(
          `  Progress:      ${((stats.processed / stats.total) * 100).toFixed(1)}%`,
        );
        process.exit(0);
      }

      // Single token mode
      if (options.tokenId) {
        const tokenId = parseInt(options.tokenId, 10);

        if (isNaN(tokenId) || tokenId <= 10000) {
          console.error("Token ID must be a number greater than 10000");
          process.exit(1);
        }

        console.log(`Processing merge image for token ${tokenId}...`);

        const result = await mergeImagesService.processImage(tokenId);

        if (result.success) {
          console.log(`  Token ${tokenId}: processed successfully`);
        } else {
          console.error(`  Token ${tokenId}: failed - ${result.error}`);
          process.exit(1);
        }

        process.exit(0);
      }

      // Batch mode
      const batchSize = parseInt(options.batchSize || "10", 10);

      console.log(`Processing up to ${batchSize} pending merge images...\n`);

      const results = await mergeImagesService.processBatch({
        limit: batchSize,
        onProgress: (result) => {
          if (result.success) {
            console.log(`  Token ${result.tokenId}: processed`);
          } else {
            console.log(`  Token ${result.tokenId}: failed - ${result.error}`);
          }
        },
      });

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      console.log(`\nCompleted: ${successful} processed, ${failed} failed`);

      // Show updated stats
      const stats = await mergeImagesService.getStats();
      console.log(`\nOverall progress: ${stats.processed}/${stats.total} (${((stats.processed / stats.total) * 100).toFixed(1)}%)`);

      process.exit(failed > 0 ? 1 : 0);
    },
  );
