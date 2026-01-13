import { createPublicClient, parseAbi, http } from "viem";
import { mainnet } from "viem/chains";

const scapesABI = parseAbi([
  "function getScapeImage(uint256 tokenId, bool base64_, uint256 scale) external view returns (string)",
]);

const SCAPES_CONTRACT = "0xb7def63a9040ad5dc431aff79045617922f4023a";

export class ImageService {
  private client = createPublicClient({
    chain: mainnet,
    transport: http(process.env.PONDER_RPC_URL_1),
  });

  async getScapeImage(tokenId: bigint, scale: bigint = 1n): Promise<string> {
    const result = await this.client.readContract({
      address: SCAPES_CONTRACT,
      abi: scapesABI,
      functionName: "getScapeImage",
      args: [tokenId, false, scale],
    });

    // Contract returns a data URI, extract the raw SVG
    const dataUriPrefix = "data:image/svg+xml;utf8,";
    if (result.startsWith(dataUriPrefix)) {
      return result.slice(dataUriPrefix.length);
    }

    return result;
  }
}

export const imageService = new ImageService();
