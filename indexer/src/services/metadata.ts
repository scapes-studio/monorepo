import { s3Service } from "./s3";
import { pinataService } from "./pinata";
import {
  generateCelestialLatitude,
  generateCelestialLongitude,
  generateDistance,
} from "../helpers/celestial-coordinates";
import type { TwentySevenYearImageInput } from "../../offchain.schema";

export type ProvenanceData = {
  imageCID: string;
  metadataCID: string;
  metadata: Record<string, unknown>;
};

type ScapeDetailForMetadata = {
  tokenId: number;
  scapeId: number | null;
  description: string | null;
  date: number | null;
};

type ImageRequestForMetadata = {
  imagePath: string | null;
  imageInput: TwentySevenYearImageInput | null;
  createdAt: number | null;
};

class MetadataService {
  /**
   * Get the upscaled image URL from S3.
   * Handles both v1 and v2 image path formats.
   */
  getUpscaledImagePath(imagePath: string): string {
    return `${imagePath}_upscaled`;
  }

  /**
   * Download the upscaled image from S3.
   * Falls back to the regular image if upscaled version doesn't exist.
   */
  async downloadUpscaledImage(
    imagePath: string,
  ): Promise<Buffer> {
    const upscaledPath = this.getUpscaledImagePath(imagePath);

    try {
      return await s3Service.downloadFile(upscaledPath);
    } catch {
      // Fallback to regular image
      return await s3Service.downloadFile(imagePath);
    }
  }

  /**
   * Format a Unix timestamp as a human-readable date string.
   */
  formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  /**
   * Generate provenance data for a 27-year scape NFT.
   * Creates metadata JSON and CIDs, uploads to Pinata.
   */
  async generateProvenanceData(
    scapeDetail: ScapeDetailForMetadata,
    imageRequest: ImageRequestForMetadata,
  ): Promise<ProvenanceData> {
    if (!imageRequest.imagePath) {
      throw new Error("Image path is required");
    }

    // Download the upscaled image
    const imageBuffer = await this.downloadUpscaledImage(
      imageRequest.imagePath,
    );

    // Upload image to Pinata and get the CID
    const filename = `twenty-seven-year-${scapeDetail.tokenId}-${scapeDetail.scapeId ?? 0}`;
    const imageCID = await pinataService.uploadFile(
      imageBuffer,
      filename + ".png",
      "image/png",
    );

    // Get attributes from image input
    const inputAttributes =
      (imageRequest.imageInput?.attributes as Array<Record<string, unknown>>) ||
      [];

    // Generate description
    const scapeId = scapeDetail.scapeId ?? 0;
    const createdAt = imageRequest.createdAt ?? Math.floor(Date.now() / 1000);
    const description = `Day ${scapeDetail.tokenId}.\nPainted at [Scape #${scapeId}](https://scapes.xyz/scapes/${scapeId}).\n\n– Yotukito, ${this.formatDate(createdAt)}`;

    // Build metadata
    const metadata: Record<string, unknown> = {
      id: scapeDetail.tokenId,
      name: `Day ${scapeDetail.tokenId}: ${scapeDetail.description ?? ""}`,
      description,
      image: `ipfs://${imageCID}`,
      external_url: `https://scapes.xyz/gallery27/${scapeDetail.tokenId}`,
      attributes: [
        ...inputAttributes,
        {
          display_type: "date",
          trait_type: "date",
          value: scapeDetail.date ?? createdAt,
        },
        {
          display_type: "number",
          trait_type: "Celestial Latitude",
          value: generateCelestialLatitude(),
        },
        {
          display_type: "number",
          trait_type: "Celestial Longitude",
          value: generateCelestialLongitude(),
        },
        {
          display_type: "number",
          trait_type: "Distance (AU)",
          value: generateDistance(),
        },
      ],
    };

    // Upload metadata to Pinata and get the CID
    const metadataCID = await pinataService.uploadJson(metadata, filename + ".json");

    console.log(
      `Uploaded to Pinata: 27y scape #${scapeDetail.tokenId} (scape #${scapeDetail.scapeId})`,
    );

    return {
      imageCID,
      metadataCID,
      metadata,
    };
  }

}

export const metadataService = new MetadataService();
