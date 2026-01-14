import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Merge = require("@scapes-studio/scape-renderer/build/src/Merge").default;

export default defineEventHandler(async (event) => {
  const tokenId = getRouterParam(event, "tokenId");

  if (!tokenId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Token ID is required",
    });
  }

  try {
    const merge = Merge.fromId(tokenId);
    const pngBuffer = await merge.render();

    if (!pngBuffer) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to render image",
      });
    }

    setHeaders(event, {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    });

    return pngBuffer;
  } catch (error) {
    console.error("Error rendering merge image:", error);
    throw createError({
      statusCode: 500,
      statusMessage:
        error instanceof Error ? error.message : "Failed to render image",
    });
  }
});
