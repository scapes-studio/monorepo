import { priceService } from "./price";
import type { Price } from "../../ponder.types";

// Known stablecoin addresses (mainnet) - treated as 1:1 USD
const STABLECOINS: Record<string, { symbol: string; decimals: number }> = {
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": { symbol: "USDC", decimals: 6 },
  "0xdac17f958d2ee523a2206206994597c13d831ec7": { symbol: "USDT", decimals: 6 },
  "0x6b175474e89094c44da98b954eedeac495271d0f": { symbol: "DAI", decimals: 18 },
};

// ETH and WETH addresses
const ETH_TOKENS = [
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
  "0x0000000000000000000000000000000000000000", // Native ETH
];

// OpenSea API types
interface OpenSeaPayment {
  quantity: string;
  token_address: string;
  decimals: number;
  symbol: string;
}

interface OpenSeaNFT {
  identifier: string;
  collection: string;
  contract: string;
  token_standard: string;
}

interface OpenSeaAssetEvent {
  event_type: string;
  event_timestamp: number;
  transaction: string;
  order_hash: string;
  chain: string;
  payment: OpenSeaPayment;
  seller: string;
  buyer: string;
  quantity: number;
  nft: OpenSeaNFT;
}

interface OpenSeaEventsResponse {
  asset_events: OpenSeaAssetEvent[];
  next?: string;
}

// Internal sale type
export interface Sale {
  tokenId: string;
  contract: string;
  txHash: string;
  orderHash?: string;
  timestamp: number;
  logIndex: number;
  seller: string;
  buyer: string;
  amount: string;
  price: Price;
}

interface GetSalesResponse {
  sales: Sale[];
  continuation?: string;
}

// OpenSea active listings API types (from /listings/collection/{slug}/all)
interface OpenSeaListingOffer {
  itemType: number;
  token: string;
  identifierOrCriteria: string;
  startAmount: string;
  endAmount: string;
}

interface OpenSeaListingParameters {
  offerer: string;
  offer: OpenSeaListingOffer[];
  startTime: string;
  endTime: string;
}

interface OpenSeaListingProtocolData {
  parameters: OpenSeaListingParameters;
}

interface OpenSeaListingPrice {
  current: {
    currency: string;
    decimals: number;
    value: string;
  };
}

interface OpenSeaActiveListing {
  order_hash: string;
  chain: string;
  protocol_data: OpenSeaListingProtocolData;
  protocol_address: string;
  remaining_quantity: number;
  price: OpenSeaListingPrice;
  type: string;
  status: string;
}

interface OpenSeaActiveListingsResponse {
  listings: OpenSeaActiveListing[];
  next?: string;
}

// Internal listing type
export interface Listing {
  tokenId: string;
  contract: string;
  orderHash: string;
  protocolAddress: string;
  timestamp: number;
  startDate: number;
  expirationDate: number;
  maker: string;
  taker: string | null;
  isPrivateListing: boolean;
  price: Price;
}

interface GetListingsResponse {
  listings: Listing[];
  continuation?: string;
}

export class OpenSeaService {
  private baseUrl = "https://api.opensea.io/api/v2";
  private apiKeyWarningShown = false;

  private get apiKey(): string {
    const key = process.env.OPENSEA_API_KEY || "";
    if (!key && !this.apiKeyWarningShown) {
      console.warn("Warning: OPENSEA_API_KEY not set in environment variables");
      this.apiKeyWarningShown = true;
    }
    return key;
  }

  /**
   * Get sales for a collection using OpenSea API
   */
  async getSales({
    slug,
    continuation,
    afterTimestamp,
    beforeTimestamp,
    limit = 200,
  }: {
    slug: string;
    continuation?: string;
    afterTimestamp?: number;
    beforeTimestamp?: number;
    limit?: number;
  }): Promise<GetSalesResponse> {
    // Build query parameters
    const params = new URLSearchParams({
      event_type: "sale",
    });

    if (limit) {
      params.append("limit", limit.toString());
    }

    if (afterTimestamp) {
      params.append("after", afterTimestamp.toString());
    }

    if (beforeTimestamp) {
      params.append("before", beforeTimestamp.toString());
    }

    if (continuation) {
      params.append("next", continuation);
    }

    const url = `${this.baseUrl}/events/collection/${slug}?${params.toString()}`;

    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          "x-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenSea API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as OpenSeaEventsResponse;

      // Get current ETH/USD price for USD value calculation
      const ethUsdPrice = await priceService.getEthUsdPrice();

      // Transform OpenSea events to internal sale format
      const sales: Sale[] = data.asset_events.map((event) => {
        const payment = event.payment;
        const tokenAddress = payment?.token_address?.toLowerCase() || "";
        const rawAmount = payment?.quantity || "0";
        const decimals = payment?.decimals || 18;

        let nativeAmount = 0;
        let usdAmount = 0;
        let weiAmount = "0";

        if (!payment) {
          // No payment info - leave amounts as 0
        } else if (ETH_TOKENS.includes(tokenAddress)) {
          // ETH or WETH payment - raw amount is already in wei
          nativeAmount = this.weiToEth(rawAmount, decimals);
          usdAmount = ethUsdPrice ? nativeAmount * ethUsdPrice : 0;
          weiAmount = rawAmount;
        } else if (STABLECOINS[tokenAddress]) {
          // Stablecoin payment - amount IS the USD value
          usdAmount = this.weiToEth(rawAmount, decimals);
          nativeAmount = ethUsdPrice ? usdAmount / ethUsdPrice : 0;
          weiAmount = this.ethToWei(nativeAmount);
        } else {
          // Unknown token - set ETH/USD/wei to 0
          nativeAmount = 0;
          usdAmount = 0;
          weiAmount = "0";
        }

        // If order_hash is missing, generate a deterministic fallback
        const orderHash =
          event.order_hash ||
          `${event.transaction}-${event.nft.contract}-${event.nft.identifier}`;

        return {
          tokenId: event.nft.identifier,
          contract: event.nft.contract,
          txHash: event.transaction,
          orderHash,
          timestamp: event.event_timestamp,
          logIndex: 0,
          seller: event.seller,
          buyer: event.buyer,
          amount: event.quantity.toString(),
          price: {
            wei: weiAmount,
            eth: nativeAmount,
            usd: usdAmount,
            currency: payment
              ? {
                  symbol: payment.symbol,
                  amount: rawAmount,
                }
              : undefined,
          },
        };
      });

      return {
        sales,
        continuation: data.next,
      };
    } catch (error) {
      console.error("Error fetching sales from OpenSea:", error);
      throw error;
    }
  }

  /**
   * Get active listings for a collection using OpenSea API
   * Uses /listings/collection/{slug}/all endpoint which returns only active listings
   */
  async getListings({
    slug,
    continuation,
    limit = 200,
  }: {
    slug: string;
    continuation?: string;
    limit?: number;
  }): Promise<GetListingsResponse> {
    const params = new URLSearchParams();

    if (limit) {
      params.append("limit", limit.toString());
    }

    if (continuation) {
      params.append("next", continuation);
    }

    const queryString = params.toString();
    const url = `${this.baseUrl}/listings/collection/${slug}/all${queryString ? `?${queryString}` : ""}`;

    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          "x-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenSea API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as OpenSeaActiveListingsResponse;
      const ethUsdPrice = await priceService.getEthUsdPrice();

      const listings: Listing[] = data.listings
        .filter((listing) => listing.protocol_data.parameters.offer.length > 0)
        .map((listing) => {
        const params = listing.protocol_data.parameters;
        const offer = params.offer[0]!; // First offer item contains the NFT
        const price = listing.price.current;

        // Price is in wei for ETH
        const weiAmount = price.value;
        const nativeAmount = this.weiToEth(weiAmount, price.decimals);
        const usdAmount = ethUsdPrice ? nativeAmount * ethUsdPrice : 0;

        return {
          tokenId: offer.identifierOrCriteria,
          contract: offer.token,
          orderHash: listing.order_hash,
          protocolAddress: listing.protocol_address,
          timestamp: Number(params.startTime), // Use startTime as timestamp
          startDate: Number(params.startTime),
          expirationDate: Number(params.endTime),
          maker: params.offerer,
          taker: null, // Active listings endpoint doesn't include taker
          isPrivateListing: false, // Not available in this endpoint
          price: {
            wei: weiAmount,
            eth: nativeAmount,
            usd: usdAmount,
            currency: {
              symbol: price.currency,
              amount: weiAmount,
            },
          },
        };
      });

      return {
        listings,
        continuation: data.next,
      };
    } catch (error) {
      console.error("Error fetching listings from OpenSea:", error);
      throw error;
    }
  }

  /**
   * Convert wei (or other token amount) to ETH using decimals
   */
  private weiToEth(amount: string, decimals: number): number {
    const divisor = Math.pow(10, decimals);
    return Number(amount) / divisor;
  }

  /**
   * Convert ETH amount to wei string (18 decimals)
   */
  private ethToWei(amount: number): string {
    return BigInt(Math.round(amount * 1e18)).toString();
  }
}

// Singleton instance
export const openseaService = new OpenSeaService();
