import { Command } from "commander";
import { eq } from "drizzle-orm";
import { getOffchainDb } from "../services/database";
import { aiImageService } from "../services/ai-image";
import { generatePrompt } from "../services/prompt-generator";
import { twentySevenYearScapeDetail } from "../../offchain.schema";

export const generate27yImageCommand = new Command("generate:27y-image")
  .description("Generate AI image for a TwentySevenYear scape")
  .requiredOption("--token-id <id>", "Token ID of the TwentySevenYear scape")
  .option("--message <text>", "Custom prompt addition")
  .option("--count <n>", "Number of images to generate", "1")
  .option("--dry-run", "Only generate prompt, don't call Leonardo API")
  .action(
    async (options: {
      tokenId: string;
      message?: string;
      count?: string;
      dryRun?: boolean;
    }) => {
      const tokenId = parseInt(options.tokenId, 10);
      const count = parseInt(options.count ?? "1", 10);

      if (isNaN(tokenId) || tokenId < 1 || tokenId > 10000) {
        console.error("Token ID must be a number between 1 and 10000");
        process.exit(1);
      }

      if (isNaN(count) || count < 1 || count > 10) {
        console.error("Count must be between 1 and 10");
        process.exit(1);
      }

      // Get scape detail to find scapeId
      const db = getOffchainDb();
      const scapeDetail = await db.query.twentySevenYearScapeDetail.findFirst({
        where: eq(twentySevenYearScapeDetail.tokenId, tokenId),
      });

      const scapeId = scapeDetail?.scapeId ?? tokenId;

      console.log(`\nTwentySevenYear Scape #${tokenId} (PunkScape #${scapeId})`);
      console.log("=".repeat(50));

      if (options.dryRun) {
        // Dry run - just generate prompt
        const prompt = generatePrompt(scapeId, options.message);
        console.log("\n[DRY RUN - No API call made]\n");
        console.log("System Prompt:");
        console.log(`  ${prompt.systemPrompt}\n`);
        if (prompt.userPrompt) {
          console.log("User Prompt:");
          console.log(`  ${prompt.userPrompt}\n`);
        }
        console.log("Combined Prompt:");
        console.log(`  ${prompt.prompt}\n`);
        console.log("Attributes:");
        for (const attr of prompt.attributes) {
          console.log(`  ${attr.trait_type}: ${attr.value}`);
        }
        console.log(`\nInit Strength: ${prompt.initStrength.toFixed(3)}`);
        process.exit(0);
      }

      // Check for Leonardo API key
      if (!process.env.LEONARDO_KEY) {
        console.error("\nError: LEONARDO_KEY environment variable is required");
        process.exit(1);
      }

      console.log(`\nGenerating ${count} image(s)...`);
      const results: { requestId: number; taskId: string }[] = [];

      for (let i = 0; i < count; i++) {
        try {
          console.log(`\n[${i + 1}/${count}] Starting generation...`);

          const result = await aiImageService.generateForScape({
            tokenId,
            scapeId,
            message: options.message,
          });

          results.push({
            requestId: result.requestId,
            taskId: result.taskId,
          });

          console.log(`  Request ID: ${result.requestId}`);
          console.log(`  Task ID: ${result.taskId}`);
          console.log(`  Prompt: ${result.prompt.prompt.slice(0, 100)}...`);
          console.log(`  Init Strength: ${result.prompt.initStrength.toFixed(3)}`);
        } catch (error) {
          console.error(
            `  Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      console.log("\n" + "=".repeat(50));
      console.log(`\nCompleted: ${results.length}/${count} generations started`);

      if (results.length > 0) {
        console.log("\nGeneration tasks started successfully.");
        console.log("Images will be ready when Leonardo sends webhooks.");
        console.log("\nTask IDs:");
        for (const r of results) {
          console.log(`  - ${r.taskId} (request #${r.requestId})`);
        }
      }

      process.exit(results.length === count ? 0 : 1);
    },
  );
