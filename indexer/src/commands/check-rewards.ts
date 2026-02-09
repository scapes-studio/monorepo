import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { Command } from "commander";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { gallery27ABI } from "@scapes-studio/abis";
import { getOffchainDb } from "../services/database";
import { twentySevenYearScapeDetail } from "../../offchain.schema";
import { asc, between } from "drizzle-orm";

const GALLERY27_V2 = "0x25eF4D7F1D2706808D67a7Ecf577062B055aFD4E";
const GALLERY27_V1 = "0x6f051b2B1765eDB6A892be7736C04AaB0468AF27";

export const checkRewardsCommand = new Command("check:rewards")
  .description("Check which gallery27 auctions have claimed rewards")
  .requiredOption("--from <id>", "Start gallery27 token ID", parseInt)
  .requiredOption("--to <id>", "End gallery27 token ID", parseInt)
  .action(async (options: { from: number; to: number }) => {
    try {
      const db = getOffchainDb();

      // 1. Query offchain DB for token ID -> scapeId mapping
      const scapes = await db
        .select()
        .from(twentySevenYearScapeDetail)
        .where(
          between(twentySevenYearScapeDetail.tokenId, options.from, options.to),
        )
        .orderBy(asc(twentySevenYearScapeDetail.tokenId));

      // 2. Create viem client
      const client = createPublicClient({
        chain: mainnet,
        transport: http(process.env.PONDER_RPC_URL_1),
      });

      // 3. Load existing results from file (for resuming)
      type Result = {
        tokenId: number;
        scapeId: number | null;
        status: "claimed" | "unclaimed" | "no_auction" | "no_scape_id";
        contract: string | null;
      };

      const outputPath = `check-rewards-${options.from}-${options.to}.json`;
      let results: Result[] = [];
      const processed = new Set<number>();

      if (existsSync(outputPath)) {
        const existing = JSON.parse(readFileSync(outputPath, "utf-8"));
        results = existing.results ?? [];
        for (const r of results) processed.add(r.tokenId);
        console.log(`Resuming: ${processed.size} already processed\n`);
      }

      const save = () => {
        let claimed = 0, unclaimed = 0, noAuction = 0, noScapeId = 0;
        for (const r of results) {
          if (r.status === "claimed") claimed++;
          else if (r.status === "unclaimed") unclaimed++;
          else if (r.status === "no_auction") noAuction++;
          else if (r.status === "no_scape_id") noScapeId++;
        }
        const summary = { claimed, unclaimed, noAuction, noScapeId };
        writeFileSync(outputPath, JSON.stringify({ summary, results }, null, 2));
      };

      // 4. For each scape, call getAuction and check rewardsClaimed
      for (const scape of scapes) {
        if (processed.has(scape.tokenId)) continue;

        if (!scape.scapeId) {
          results.push({ tokenId: scape.tokenId, scapeId: null, status: "no_scape_id", contract: null });
          save();
          continue;
        }

        const scapeIdBigInt = BigInt(scape.scapeId);

        // Try V2 first
        let auction = await client.readContract({
          address: GALLERY27_V2,
          abi: gallery27ABI,
          functionName: "getAuction",
          args: [scapeIdBigInt],
        });
        let contract = "V2";

        // If no auction on V2 (endTimestamp === 0), try V1
        if (auction[2] === 0n) {
          auction = await client.readContract({
            address: GALLERY27_V1,
            abi: gallery27ABI,
            functionName: "getAuction",
            args: [scapeIdBigInt],
          });
          contract = "V1";
        }

        // auction = [latestBidder, latestBid, endTimestamp, settled, rewardsClaimed]
        const endTimestamp = auction[2];
        const rewardsClaimed = auction[4];

        if (endTimestamp === 0n) {
          results.push({ tokenId: scape.tokenId, scapeId: scape.scapeId, status: "no_auction", contract: null });
          console.log(`gallery27 #${scape.tokenId} (scape #${scape.scapeId}): no auction`);
        } else if (rewardsClaimed) {
          results.push({ tokenId: scape.tokenId, scapeId: scape.scapeId, status: "claimed", contract });
          console.log(`gallery27 #${scape.tokenId} (scape #${scape.scapeId}): claimed (${contract})`);
        } else {
          results.push({ tokenId: scape.tokenId, scapeId: scape.scapeId, status: "unclaimed", contract });
          console.log(`gallery27 #${scape.tokenId} (scape #${scape.scapeId}): unclaimed (${contract})`);
        }

        save();
      }

      const { summary } = JSON.parse(readFileSync(outputPath, "utf-8"));
      console.log(
        `\nSummary: ${summary.claimed} claimed, ${summary.unclaimed} unclaimed, ${summary.noAuction} no auction, ${summary.noScapeId} missing scapeId`,
      );
      console.log(`Results written to ${outputPath}`);
      process.exit(0);
    } catch (error) {
      console.error("Check failed:", error);
      process.exit(1);
    }
  });
