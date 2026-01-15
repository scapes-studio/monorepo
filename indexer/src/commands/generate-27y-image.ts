import { Command } from "commander";
import { eq, gte, isNull, and } from "drizzle-orm";
import { getOffchainDb } from "../services/database";
import { aiImageService } from "../services/ai-image";
import { generatePrompt } from "../services/prompt-generator";
import { twentySevenYearScapeDetail } from "../../offchain.schema";

export const generate27yImageCommand = new Command("generate:27y-image")
  .description("Generate AI image for a TwentySevenYear scape")
  .option("--token-id <id>", "Token ID of the TwentySevenYear scape")
  .option("--days-ahead <n>", "Generate for scape N days from now")
  .option("--force", "Force generation even if initial image exists")
  .option("--message <text>", "Custom prompt addition")
  .option("--count <n>", "Number of images to generate", "1")
  .option("--dry-run", "Only generate prompt, don't call Leonardo API")
  .action(
    async (options: {
      tokenId?: string;
      daysAhead?: string;
      force?: boolean;
      message?: string;
      count?: string;
      dryRun?: boolean;
    }) => {
      const db = getOffchainDb();
      const count = parseInt(options.count ?? "1", 10);
      let tokenId: number;
      let scapeDetail: typeof twentySevenYearScapeDetail.$inferSelect | undefined;

      // Determine token ID from options
      if (options.daysAhead !== undefined) {
        const daysAhead = parseInt(options.daysAhead, 10);
        if (isNaN(daysAhead) || daysAhead < 0) {
          console.error("Days ahead must be a non-negative number");
          process.exit(1);
        }

        // Calculate target date (start of day + daysAhead)
        const targetDate = new Date();
        targetDate.setUTCHours(0, 0, 0, 0);
        targetDate.setUTCDate(targetDate.getUTCDate() + daysAhead);
        const targetTimestamp = Math.floor(targetDate.getTime() / 1000);

        // Find the first scape at or after target date
        const whereCondition = options.force
          ? gte(twentySevenYearScapeDetail.date, targetTimestamp)
          : and(
              gte(twentySevenYearScapeDetail.date, targetTimestamp),
              isNull(twentySevenYearScapeDetail.initialRenderId),
            );

        scapeDetail = await db.query.twentySevenYearScapeDetail.findFirst({
          where: whereCondition,
          orderBy: (t, { asc }) => asc(t.tokenId),
        }) ?? undefined;

        if (!scapeDetail) {
          console.log("No scape found for the specified criteria.");
          console.log(
            options.force
              ? `No scapes found at or after ${targetDate.toISOString().split("T")[0]}`
              : `All scapes at or after ${targetDate.toISOString().split("T")[0]} already have initial images.`,
          );
          process.exit(0);
        }

        tokenId = scapeDetail.tokenId;
        const scapeDate = scapeDetail.date
          ? new Date(scapeDetail.date * 1000).toISOString().split("T")[0]
          : "unknown";
        console.log(`Found scape #${tokenId} for date ${scapeDate}`);
      } else if (options.tokenId !== undefined) {
        tokenId = parseInt(options.tokenId, 10);
        if (isNaN(tokenId) || tokenId < 1 || tokenId > 10000) {
          console.error("Token ID must be a number between 1 and 10000");
          process.exit(1);
        }

        // Fetch scape detail for token-id mode
        scapeDetail = await db.query.twentySevenYearScapeDetail.findFirst({
          where: eq(twentySevenYearScapeDetail.tokenId, tokenId),
        }) ?? undefined;
      } else {
        console.error("Either --token-id or --days-ahead must be provided");
        process.exit(1);
      }

      if (isNaN(count) || count < 1 || count > 10) {
        console.error("Count must be between 1 and 10");
        process.exit(1);
      }

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
