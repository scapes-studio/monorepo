import { type Context } from "hono";
import { imageService } from "../services/image";

/**
 * GET /scapes/:tokenId/image
 * Get the SVG image for a scape or merge
 */
export async function getScapeImage(c: Context) {
  const tokenId = c.req.param("tokenId");
  const scale = c.req.query("scale");

  try {
    const tokenIdBigInt = BigInt(tokenId);
    const scaleBigInt = scale ? BigInt(scale) : 1n;

    const svg = await imageService.getScapeImage(tokenIdBigInt, scaleBigInt);

    return c.text(svg, 200, {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    });
  } catch (error) {
    console.error("Error fetching scape image:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: "Failed to fetch image", details: message }, 500);
  }
}
