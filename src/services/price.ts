import { createPublicClient, parseAbi, http } from "viem";
import { mainnet } from "viem/chains";
import { Cache } from "./cache";

// Chainlink Price Oracle ABI
const priceOracleABI = parseAbi([
  "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
]);

// Chainlink ETH/USD Price Feed on Mainnet
const ETH_USD_FEED = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";

// Cache TTL: 60 seconds
const PRICE_CACHE_TTL = 60_000;

export class PriceService {
  private client = createPublicClient({
    chain: mainnet,
    transport: http(process.env.PONDER_RPC_URL_1),
  });

  private cache = new Cache<number>();

  /**
   * Get the ETH/USD price from Chainlink oracle
   */
  async getEthUsdPrice(): Promise<number | null> {
    return this.cache.getOrFetch(
      "ETH_USD",
      async () => {
        try {
          const data = await this.client.readContract({
            address: ETH_USD_FEED,
            abi: priceOracleABI,
            functionName: "latestRoundData",
          });

          // Chainlink prices have 8 decimals for USD pairs
          return Number(data[1]) / 10 ** 8;
        } catch (error) {
          console.error("Error fetching ETH_USD price:", error);
          return null;
        }
      },
      PRICE_CACHE_TTL
    );
  }
}

// Singleton instance
export const priceService = new PriceService();
