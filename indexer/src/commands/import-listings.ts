import { Command } from "commander";
import { runMigrations } from "../services/database";
import { importListingsService } from "../services/import-listings";

export const importListingsCommand = new Command("import:listings")
  .description("Import listings from OpenSea API (scapes collection only)")
  .option("--cleanup-only", "Only delete expired listings without importing")
  .action(async (options: { cleanupOnly?: boolean }) => {
    console.log("Running database migrations...");
    await runMigrations();

    if (options.cleanupOnly) {
      console.log("Cleaning up expired listings...");
      const deleted = await importListingsService.deleteExpiredListings();
      console.log(`Deleted ${deleted} expired listings`);
      process.exit(0);
    }

    console.log("Importing scapes listings (full replacement)...\n");

    let batchCount = 0;
    const { imported } = await importListingsService.importListings({
      onProgress: (count) => {
        batchCount += count;
        console.log(`  Fetched batch of ${count} listings (total: ${batchCount})`);
      },
    });

    console.log(`\nImport complete:`);
    console.log(`  Active listings imported: ${imported}`);

    // Display stats
    console.log("\nListing Stats:");
    const stats = await importListingsService.getListingStats();
    console.log(`  Total active listings: ${stats.total}`);
    console.log(
      `  Price range: ${stats.priceRange.minEth.toFixed(4)} - ${stats.priceRange.maxEth.toFixed(4)} ETH`
    );
    console.log(`  Average price: ${stats.priceRange.avgEth.toFixed(4)} ETH`);

    process.exit(0);
  });
