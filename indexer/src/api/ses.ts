import { db } from "ponder:api";
import { createRequire } from "module";
import { type Context } from "hono";
import { eq } from "drizzle-orm";
import * as ponderSchema from "../../ponder.schema";

const require = createRequire(import.meta.url);
const Merge =
  require("@scapes-studio/scape-renderer/build/src/Merge").default;

const { scape } = ponderSchema;

const MERGE_TOKEN_ID_START = 10001;
const S3_BASE_URL = "https://nyc3.digitaloceanspaces.com/punkscapes";
const IPFS_SES_DISKS_CID = "QmUXx3VBE89j5mHYzJkKZMGrb1aL84FR9au6zn3kdnpHoi";
const SES_APP_URL = "https://dev-scapes.scapes.xyz/ses";

type ScapeAttribute = {
  trait_type: string;
  value: string;
};

/**
 * GET /ses/:tokenId
 * Get SES (Scape Entertainment System) metadata for a scape or merge
 */
export async function getSESMetadata(c: Context) {
  const tokenId = c.req.param("tokenId");

  try {
    const tokenIdBigInt = BigInt(tokenId);

    // Query the scape
    const scapeResult = await db
      .select()
      .from(scape)
      .where(eq(scape.id, tokenIdBigInt))
      .limit(1);

    const scapeData = scapeResult[0];
    if (!scapeData) {
      return c.json({ error: "Scape not found" }, 404);
    }
    const isMerge = tokenIdBigInt >= BigInt(MERGE_TOKEN_ID_START);

    // Get component scape IDs if it's a merge
    let componentIds: bigint[] = [tokenIdBigInt];
    if (isMerge) {
      const merge = Merge.fromId(tokenId);
      componentIds = merge.mergeConfig[0].map(
        (part: [bigint, boolean, boolean]) => part[0],
      );
    }

    const name = isMerge ? componentIds.join("-") : tokenId;
    const description = isMerge
      ? `Scape Merge #${tokenId}`
      : `Scape #${tokenId}`;
    const query = isMerge ? `?merge=${tokenId}` : "";

    // Image URL: S3 for merges, IPFS for regular scapes
    const imageUrl = isMerge
      ? `${S3_BASE_URL}/scapes/ses/${tokenId}.png`
      : `ipfs://${IPFS_SES_DISKS_CID}/${tokenId}.png`;

    // Animation URL points to the SES app
    const animationUrl = `${SES_APP_URL}/${query}#${componentIds[0]}`;

    // Attributes: only for non-merges, include the Atmosphere as Color
    let attributes: Array<{ trait_type: string; value: string }> = [];
    if (!isMerge && scapeData.attributes) {
      const scapeAttributes = scapeData.attributes as ScapeAttribute[];
      const atmosphere = scapeAttributes.find(
        (a) => a.trait_type === "Atmosphere",
      );
      if (atmosphere) {
        attributes = [{ trait_type: "Color", value: atmosphere.value }];
      }
    }

    return c.json({
      name: `SES ${name}`,
      description: `Scape Entertainment System based on ${description}`,
      image: imageUrl,
      animation_url: animationUrl,
      attributes,
    });
  } catch (error) {
    console.error("Error fetching SES metadata:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: "Failed to fetch SES metadata", details: message }, 500);
  }
}
