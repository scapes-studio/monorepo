import { writeContract, readContract } from "@wagmi/core";
import type { Config } from "@wagmi/vue";
import type { Hash, Hex } from "viem";
import { gallery27ABI } from "@scapes-studio/abis";

// Contract addresses (typed as hex strings for viem)
const GALLERY27_V1_ADDRESS: Hex = "0x6f051b2B1765eDB6A892be7736C04AaB0468AF27";
const GALLERY27_ADDRESS: Hex = "0x25eF4D7F1D2706808D67a7Ecf577062B055aFD4E";

// V1 token IDs for claim routing
const V1_TOKEN_IDS = [88, 102, 107, 109, 110, 128, 140, 142, 149, 160, 187];

// Response types from API (JSON loses type info, so we use string)
interface SignInitializeAuctionResponse {
  punkScapeId: number;
  auctionEndsAt: number;
  signature: string;
  contractAddress: string;
}

interface SignClaimResponse {
  tokenId: number;
  punkScapeId: number;
  cid: string;
  metadata: Record<string, unknown> | null;
  signature: string;
  contractAddress: string;
}

export const useGallery27Actions = (punkScapeId: MaybeRefOrGetter<number | null>) => {
  const { $wagmi } = useNuxtApp();
  const runtimeConfig = useRuntimeConfig();

  const getApiUrl = () => runtimeConfig.public.apiUrl.replace(/\/$/, "");

  /**
   * Get the appropriate contract address for a token ID.
   */
  const getContractAddress = (tokenId?: number): Hex => {
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
      chainId: 1,
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
      `${getApiUrl()}/gallery27/sign-initialize-auction`,
      {
        method: "POST",
        body: { punkScapeId: scapeId },
      },
    );

    // Call contract (cast API string responses to proper hex types)
    return writeContract($wagmi as Config, {
      chainId: 1,
      address: response.contractAddress as Hex,
      abi: gallery27ABI,
      functionName: "initializeAuction",
      args: [
        BigInt(scapeId),
        BigInt(response.auctionEndsAt),
        response.signature as Hex,
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
      chainId: 1,
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
      `${getApiUrl()}/gallery27/sign-claim`,
      {
        method: "POST",
        body: { punkScapeId: scapeId, requestId, step },
      },
    );

    // Call contract (cast API string responses to proper hex types)
    return writeContract($wagmi as Config, {
      chainId: 1,
      address: response.contractAddress as Hex,
      abi: gallery27ABI,
      functionName: "claim",
      args: [
        BigInt(scapeId),
        BigInt(response.tokenId),
        response.cid,
        response.signature as Hex,
      ],
    });
  };

  /**
   * Read the full auction tuple from the contract.
   * Tries V2 first, falls back to V1 if endTimestamp === 0n.
   */
  const getAuctionFromContract = async () => {
    const scapeId = toValue(punkScapeId);
    if (!scapeId) throw new Error("PunkScape ID required");

    const scapeIdBigInt = BigInt(scapeId);

    // Try V2 first
    let auction = await readContract($wagmi as Config, {
      chainId: 1,
      address: GALLERY27_ADDRESS,
      abi: gallery27ABI,
      functionName: "getAuction",
      args: [scapeIdBigInt],
    });
    let contractAddress: Hex = GALLERY27_ADDRESS;

    // If no auction on V2 (endTimestamp === 0), try V1
    if (auction[2] === 0n) {
      auction = await readContract($wagmi as Config, {
        chainId: 1,
        address: GALLERY27_V1_ADDRESS,
        abi: gallery27ABI,
        functionName: "getAuction",
        args: [scapeIdBigInt],
      });
      contractAddress = GALLERY27_V1_ADDRESS;
    }

    return {
      latestBidder: auction[0],
      latestBid: auction[1],
      endTimestamp: auction[2],
      settled: auction[3],
      rewardsClaimed: auction[4],
      contractAddress,
    };
  };

  /**
   * Withdraw 50% revenue share (PunkScape owner only).
   * No signature needed.
   */
  const withdraw = async (punkScapeIds: number[], contractAddress?: Hex): Promise<Hash> => {
    if (punkScapeIds.length === 0) throw new Error("At least one PunkScape ID required");

    return writeContract($wagmi as Config, {
      chainId: 1,
      address: contractAddress ?? GALLERY27_ADDRESS,
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
    getAuctionFromContract,
  };
};
