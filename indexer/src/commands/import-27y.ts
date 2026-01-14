import { Command } from "commander";
import { import27yService } from "../services/import-27y";

export const import27yCommand = new Command("import:27y")
  .description("Import twentySevenYear scapes and requests from legacy database")
  .option("--scapes-only", "Only import scape details")
  .option("--requests-only", "Only import requests")
  .action(async (options: { scapesOnly?: boolean; requestsOnly?: boolean }) => {
    try {
      if (options.scapesOnly) {
        console.log("Importing twentySevenYearScape details...\n");

        const count = await import27yService.importScapeDetails({
          onProgress: (c) => {
            console.log(`  Imported batch of ${c} scapes`);
          },
        });

        console.log(`\nTotal: ${count} scapes imported`);
      } else if (options.requestsOnly) {
        console.log("Importing twentySevenYearRequests...\n");

        const count = await import27yService.importRequests({
          onProgress: (c) => {
            console.log(`  Imported batch of ${c} requests`);
          },
        });

        console.log(`\nTotal: ${count} requests imported`);
      } else {
        console.log("Importing all twentySevenYear data...\n");

        const results = await import27yService.importAll({
          onProgress: (type, count) => {
            console.log(`  [${type}] Imported batch of ${count}`);
          },
        });

        console.log(`\nTotal: ${results.scapes} scapes, ${results.requests} requests imported`);
      }

      process.exit(0);
    } catch (error) {
      console.error("Import failed:", error);
      process.exit(1);
    }
  });
