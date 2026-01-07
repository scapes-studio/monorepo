import { Command } from "commander";
import {
  importSalesService,
  COLLECTIONS,
  type CollectionSlug,
} from "../services/import-sales";

export const importSalesCommand = new Command("import:sales")
  .description("Import sales from OpenSea API")
  .option("--slug <slug>", "Collection slug to import (punkscapes or scapes)")
  .option("--all", "Import all collections")
  .option("--force", "Force full re-import (ignore last sync timestamp)")
  .action(async (options: { slug?: string; all?: boolean; force?: boolean }) => {

    let totalImported = 0;

    if (options.all) {
      console.log("Importing all collections...\n");

      const results = await importSalesService.importAllCollections({
        force: options.force,
        onProgress: (slug, count) => {
          console.log(`  [${slug}] Imported batch of ${count} sales`);
        },
      });

      for (const { slug, count } of results) {
        console.log(`\n${slug}: ${count} sales imported`);
        totalImported += count;
      }
    } else if (options.slug) {
      const slug = options.slug as CollectionSlug;

      if (!COLLECTIONS[slug]) {
        console.error(`Unknown collection: ${slug}`);
        console.error(`Available collections: ${Object.keys(COLLECTIONS).join(", ")}`);
        process.exit(1);
      }

      console.log(`Importing ${slug}...\n`);

      const count = await importSalesService.importCollection(slug, {
        force: options.force,
        onProgress: (c) => {
          console.log(`  Imported batch of ${c} sales`);
        },
      });

      totalImported = count;
      console.log(`\n${slug}: ${count} sales imported`);
    } else {
      console.error("Please specify --slug <slug> or --all");
      process.exit(1);
    }

    console.log(`\nTotal: ${totalImported} sales imported`);

    // Calculate and display stats
    console.log("\nCalculating stats...");
    const stats = await importSalesService.getCombinedStats();
    console.log("\nCombined Volume Stats:");
    console.log(`  Total:   ${stats.volume.total.eth} ETH ($${stats.volume.total.usd})`);
    console.log(`  6 Month: ${stats.volume.sixMonth.eth} ETH ($${stats.volume.sixMonth.usd})`);
    console.log(`  30 Day:  ${stats.volume.month.eth} ETH ($${stats.volume.month.usd})`);
    console.log(`  24 Hour: ${stats.volume.day.eth} ETH ($${stats.volume.day.usd})`);

    process.exit(0);
  });
