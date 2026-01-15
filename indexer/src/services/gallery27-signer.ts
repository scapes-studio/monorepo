import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { keccak256, encodePacked, type Hex, type Address } from "viem";

// V1 contract tokens (specific token IDs that require V1 signer)
export const V1_TOKEN_IDS = [88, 102, 107, 109, 110, 128, 140, 142, 149, 160, 187];

// Contract addresses
export const GALLERY27_V1_ADDRESS = "0x6f051b2B1765eDB6A892be7736C04AaB0468AF27" as const;
export const GALLERY27_ADDRESS = "0x25eF4D7F1D2706808D67a7Ecf577062B055aFD4E" as const;

class Gallery27SignerService {
  private signer: PrivateKeyAccount | null = null;
  private v1Signer: PrivateKeyAccount | null = null;

  private getSigner(): PrivateKeyAccount {
    if (!this.signer) {
      const key = process.env.G27_SIGNER_PRIVATE_KEY;
      if (!key) throw new Error("G27_SIGNER_PRIVATE_KEY not configured");
      this.signer = privateKeyToAccount(key as Hex);
    }
    return this.signer;
  }

  private getV1Signer(): PrivateKeyAccount {
    if (!this.v1Signer) {
      const key = process.env.G27V1_SIGNER_PRIVATE_KEY;
      if (!key) throw new Error("G27V1_SIGNER_PRIVATE_KEY not configured");
      this.v1Signer = privateKeyToAccount(key as Hex);
    }
    return this.v1Signer;
  }

  /**
   * Sign message for initializing an auction.
   * Message: keccak256(abi.encodePacked(uint256 punkScapeId, uint64 auctionEndsAt))
   */
  async signInitializeAuction(
    punkScapeId: bigint,
    auctionEndsAt: bigint,
  ): Promise<Hex> {
    const messageHash = keccak256(
      encodePacked(["uint256", "uint64"], [punkScapeId, auctionEndsAt])
    );
    const signer = this.getSigner();
    return signer.signMessage({ message: { raw: messageHash } });
  }

  /**
   * Sign message for claiming a minted NFT.
   * Message: keccak256(abi.encodePacked(uint256 punkScapeId, uint256 tokenId, string cid))
   */
  async signClaim(
    punkScapeId: bigint,
    tokenId: bigint,
    metadataCid: string,
  ): Promise<Hex> {
    const messageHash = keccak256(
      encodePacked(["uint256", "uint256", "string"], [punkScapeId, tokenId, metadataCid])
    );
    // Use V1 signer for specific token IDs
    const signer = V1_TOKEN_IDS.includes(Number(tokenId))
      ? this.getV1Signer()
      : this.getSigner();
    return signer.signMessage({ message: { raw: messageHash } });
  }

  /**
   * Get the appropriate contract address for a token ID.
   */
  getContractAddress(tokenId: number): Address {
    return V1_TOKEN_IDS.includes(tokenId) ? GALLERY27_V1_ADDRESS : GALLERY27_ADDRESS;
  }
}

export const gallery27SignerService = new Gallery27SignerService();
