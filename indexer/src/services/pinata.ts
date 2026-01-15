import { PinataSDK } from "pinata";

class PinataService {
  private sdk: PinataSDK | null = null;

  private getSDK(): PinataSDK {
    if (!this.sdk) {
      const jwt = process.env.PINATA_JWT;
      if (!jwt) throw new Error("PINATA_JWT is required");

      this.sdk = new PinataSDK({
        pinataJwt: jwt,
        pinataGateway: process.env.PINATA_GATEWAY,
      });
    }
    return this.sdk;
  }

  /**
   * Upload a file buffer to IPFS via Pinata.
   * Returns the IPFS CID.
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    contentType: string,
  ): Promise<string> {
    const sdk = this.getSDK();
    const file = new File([buffer], filename, { type: contentType });
    const result = await sdk.upload.public.file(file);
    return result.cid;
  }

  /**
   * Upload JSON data to IPFS via Pinata.
   * Returns the IPFS CID.
   */
  async uploadJson(data: object, filename: string): Promise<string> {
    const sdk = this.getSDK();
    const result = await sdk.upload.public.json(data).name(filename);
    return result.cid;
  }

  /**
   * Get the gateway URL for a CID.
   */
  getGatewayUrl(cid: string): string {
    const gateway = process.env.PINATA_GATEWAY;
    if (gateway) {
      return `https://${gateway}/ipfs/${cid}`;
    }
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
}

export const pinataService = new PinataService();
