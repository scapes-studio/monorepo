import { writeContract, readContract } from "@wagmi/core";
import type { Config } from "@wagmi/vue";
import type { Hash, Address } from "viem";
import { gallery27ABI } from "@scapes-studio/abis";

// Contract addresses
const GALLERY27_V1_ADDRESS = "0x6f051b2B1765eDB6A892be7736C04AaB0468AF27" as const;
const GALLERY27_ADDRESS = "0x25eF4D7F1D2706808D67a7Ecf577062B055aFD4E" as const;

// V1 token IDs for claim routing
const V1_TOKEN_IDS = [88, 102, 107, 109, 110, 128, 140, 142, 149, 160, 187];

// Response types from API
interface SignInitializeAuctionResponse {
  punkScapeId: number;
  auctionEndsAt: number;
  signature: `0x${string}`;
  contractAddress: Address;
}

interface SignClaimResponse {
  tokenId: number;
  punkScapeId: number;
  cid: string;
  metadata: Record<string, unknown> | null;
  signature: `0x${string}`;
  contractAddress: Address;
}

export const useGallery27Actions = (punkScapeId: MaybeRefOrGetter<number | null>) => {
  const { $wagmi } = useNuxtApp();
  const runtimeConfig = useRuntimeConfig();

  const getApiUrl = () => runtimeConfig.public.apiUrl.replace(/\/$/, "");

  /**
   * Get the appropriate contract address for a token ID.
   */
  const getContractAddress = (tokenId?: number): Address => {
    if (tokenId && V1_TOKEN_IDS.includes(tokenId)) {
      return GALLERY27_V1_ADDRESS;
    }
    return GALLERY27_ADDRESS;
  };

  /**
   * Read the current minimum bid price from the contract.
   */
  const getCurrentBidPrice = async (): Promise<bigint> => {
    const scapeId = toValue(punkScapeId);
    if (!scapeId) throw new Error("PunkScape ID required");

    return readContract($wagmi as Config, {
      address: GALLERY27_ADDRESS,
      abi: gallery27ABI,
      functionName: "currentBidPrice",
      args: [BigInt(scapeId)],
    });
  };

  /**
   * Initialize auction with first bid.
   * Fetches signature from API, then calls contract.
   */
  const initializeAuction = async (message: string, value: bigint): Promise<Hash> => {
    const scapeId = toValue(punkScapeId);
    if (!scapeId) throw new Error("PunkScape ID required");

    // Get signature from API
    const response = await $fetch<SignInitializeAuctionResponse>(
      `${getApiUrl()}/27y/sign-initialize-auction`,
      {
        method: "POST",
        body: { punkScapeId: scapeId },
      },
    );

    // Call contract
    return writeContract($wagmi as Config, {
      address: response.contractAddress,
      abi: gallery27ABI,
      functionName: "initializeAuction",
      args: [
        BigInt(scapeId),
        BigInt(response.auctionEndsAt),
        response.signature,
        message,
      ],
      value,
    });
  };

  /**
   * Place a bid on an existing auction.
   * No signature needed.
   */
  const bid = async (message: string, value: bigint): Promise<Hash> => {
    const scapeId = toValue(punkScapeId);
    if (!scapeId) throw new Error("PunkScape ID required");

    return writeContract($wagmi as Config, {
      address: GALLERY27_ADDRESS,
      abi: gallery27ABI,
      functionName: "bid",
      args: [BigInt(scapeId), message],
      value,
    });
  };

  /**
   * Claim the minted NFT (winner only).
   * Fetches signature from API, then calls contract.
   */
  const claim = async (requestId: number, step: number): Promise<Hash> => {
    const scapeId = toValue(punkScapeId);
    if (!scapeId) throw new Error("PunkScape ID required");

    // Get signature and metadata CID from API
    const response = await $fetch<SignClaimResponse>(
      `${getApiUrl()}/27y/sign-claim`,
      {
        method: "POST",
        body: { punkScapeId: scapeId, requestId, step },
      },
    );

    return writeContract($wagmi as Config, {
      address: response.contractAddress,
      abi: gallery27ABI,
      functionName: "claim",
      args: [
        BigInt(scapeId),
        BigInt(response.tokenId),
        response.cid,
        response.signature,
      ],
    });
  };

  /**
   * Withdraw 50% revenue share (PunkScape owner only).
   * No signature needed.
   */
  const withdraw = async (punkScapeIds: number[]): Promise<Hash> => {
    if (punkScapeIds.length === 0) throw new Error("At least one PunkScape ID required");

    // Use main contract for withdrawals
    return writeContract($wagmi as Config, {
      address: GALLERY27_ADDRESS,
      abi: gallery27ABI,
      functionName: "withdraw",
      args: [punkScapeIds.map(id => BigInt(id))],
    });
  };

  return {
    initializeAuction,
    bid,
    claim,
    withdraw,
    getCurrentBidPrice,
    getContractAddress,
  };
};
