import { Command } from "commander";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { gallery27ABI } from "@scapes-studio/abis";
import { getOffchainDb } from "../services/database";
import { twentySevenYearScapeDetail } from "../../offchain.schema";
import { between } from "drizzle-orm";

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
        );

      // 2. Create viem client
      const client = createPublicClient({
        chain: mainnet,
        transport: http(process.env.PONDER_RPC_URL_1),
      });

      // 3. For each scape, call getAuction and check rewardsClaimed
      let claimed = 0;
      let unclaimed = 0;
      let noScapeId = 0;
      let noAuction = 0;

      for (const scape of scapes) {
        if (!scape.scapeId) {
          noScapeId++;
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
          noAuction++;
          console.log(`gallery27 #${scape.tokenId} (scape #${scape.scapeId}): no auction`);
        } else if (rewardsClaimed) {
          claimed++;
          console.log(`gallery27 #${scape.tokenId} (scape #${scape.scapeId}): claimed (${contract})`);
        } else {
          unclaimed++;
          console.log(`gallery27 #${scape.tokenId} (scape #${scape.scapeId}): unclaimed (${contract})`);
        }
      }

      console.log(
        `\nSummary: ${claimed} claimed, ${unclaimed} unclaimed, ${noAuction} no auction, ${noScapeId} missing scapeId`,
      );
      process.exit(0);
    } catch (error) {
      console.error("Check failed:", error);
      process.exit(1);
    }
  });
