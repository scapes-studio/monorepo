import type { Context } from "hono";
import { eq, sql, lt, and, gte } from "drizzle-orm";
import { getOffchainDb } from "../services/database";
import { twentySevenYearScapeDetail, twentySevenYearRequest } from "../../offchain.schema";
import { aiImageService } from "../services/ai-image";
import { s3Service } from "../services/s3";

/**
 * GET /27y/:tokenId
 * Get twentySevenYearScape details by token ID
 */
export async function get27yScape(c: Context) {
  const tokenIdParam = c.req.param("tokenId");
  const tokenId = parseInt(tokenIdParam, 10);

  if (isNaN(tokenId) || tokenId < 1 || tokenId > 10000) {
    return c.json({ error: "Invalid tokenId" }, 400);
  }

  const db = getOffchainDb();

  const scape = await db.query.twentySevenYearScapeDetail.findFirst({
    where: eq(twentySevenYearScapeDetail.tokenId, tokenId),
  });

  if (!scape) {
    return c.json({ error: "Scape not found" }, 404);
  }

  return c.json(scape);
}

/**
 * GET /27y/current
 * Get the currently active scape (auction in progress)
 */
export async function get27yCurrent(c: Context) {
  const db = getOffchainDb();
  const now = Math.floor(Date.now() / 1000);

  const scape = await db.query.twentySevenYearScapeDetail.findFirst({
    where: and(
      lt(twentySevenYearScapeDetail.date, now),
      gte(twentySevenYearScapeDetail.auctionEndsAt, now)
    ),
  });

  if (!scape) {
    return c.json({ error: "No active scape found" }, 404);
  }

  return c.json(scape);
}

/**
 * GET /27y/next
 * Get the next upcoming scape
 */
export async function get27yNext(c: Context) {
  const db = getOffchainDb();
  const now = Math.floor(Date.now() / 1000);

  // Find the scape with the earliest date > now
  const result = await db
    .select()
    .from(twentySevenYearScapeDetail)
    .where(gte(twentySevenYearScapeDetail.date, now))
    .orderBy(twentySevenYearScapeDetail.date)
    .limit(1);

  const scape = result[0];

  if (!scape) {
    return c.json({ error: "No upcoming scape found" }, 404);
  }

  return c.json(scape);
}

/**
 * Verify team token authentication
 */
function verifyTeamToken(c: Context): boolean {
  const teamToken = process.env.TEAM_TOKEN;
  if (!teamToken) {
    return true; // No token configured, allow all
  }
  const authHeader = c.req.header("authorization");
  return authHeader === `Bearer ${teamToken}`;
}

/**
 * GET /27y/:tokenId/initial-image
 * Get the initial image URL for a scape
 */
export async function get27yInitialImage(c: Context) {
  const tokenIdParam = c.req.param("tokenId");
  const tokenId = parseInt(tokenIdParam, 10);

  if (isNaN(tokenId) || tokenId < 1 || tokenId > 10000) {
    return c.json({ error: "Invalid tokenId" }, 400);
  }

  const db = getOffchainDb();

  const scape = await db.query.twentySevenYearScapeDetail.findFirst({
    where: eq(twentySevenYearScapeDetail.tokenId, tokenId),
  });

  if (!scape || !scape.initialRenderId) {
    return c.json({ error: "Initial image not set" }, 404);
  }

  const request = await db.query.twentySevenYearRequest.findFirst({
    where: eq(twentySevenYearRequest.id, scape.initialRenderId),
  });

  if (!request || !request.imagePath) {
    return c.json({ error: "Initial image not found" }, 404);
  }

  return c.json({
    url: s3Service.getPublicUrl(request.imagePath),
  });
}

/**
 * GET /27y/:tokenId/pregenerations
 * List completed pregenerations for a scape
 */
export async function get27yPregenerations(c: Context) {
  const tokenIdParam = c.req.param("tokenId");
  const tokenId = parseInt(tokenIdParam, 10);
  const count = parseInt(c.req.query("count") ?? "10", 10);

  if (isNaN(tokenId) || tokenId < 1 || tokenId > 10000) {
    return c.json({ error: "Invalid tokenId" }, 400);
  }

  const pregenerations = await aiImageService.getPregenerations(tokenId, count);

  // Add image URLs
  const result = pregenerations.map((p: Record<string, unknown>) => ({
    ...p,
    imageUrl: p.image_path ? s3Service.getPublicUrl(p.image_path as string) : null,
    upscaledImageUrl: p.image_path
      ? s3Service.getPublicUrl(`${p.image_path}_upscaled`)
      : null,
  }));

  return c.json(result);
}

/**
 * POST /27y/:tokenId/pregenerate
 * Trigger image generation for a scape (requires auth)
 */
export async function post27yPregenerate(c: Context) {
  if (!verifyTeamToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const tokenIdParam = c.req.param("tokenId");
  const tokenId = parseInt(tokenIdParam, 10);

  if (isNaN(tokenId) || tokenId < 1 || tokenId > 10000) {
    return c.json({ error: "Invalid tokenId" }, 400);
  }

  const body = await c.req.json<{ count?: number; message?: string }>().catch(() => ({
    count: 1,
    message: "",
  }));
  const count = Math.min(Math.max(body.count ?? 1, 1), 10);
  const message = body.message ?? "";

  // Get scape detail to find scapeId
  const db = getOffchainDb();
  const scapeDetail = await db.query.twentySevenYearScapeDetail.findFirst({
    where: eq(twentySevenYearScapeDetail.tokenId, tokenId),
  });

  const scapeId = scapeDetail?.scapeId ?? tokenId;

  // Generate images
  const results = [];
  for (let i = 0; i < count; i++) {
    try {
      const result = await aiImageService.generateForScape({
        tokenId,
        scapeId,
        message,
      });
      results.push({
        requestId: result.requestId,
        taskId: result.taskId,
      });
    } catch (error) {
      console.error(`Failed to generate image ${i + 1}/${count}:`, error);
    }
  }

  return c.json(results);
}

/**
 * POST /27y/:tokenId/pregenerations/choose
 * Choose the initial image for a scape (requires auth)
 */
export async function post27yChooseInitialImage(c: Context) {
  if (!verifyTeamToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const tokenIdParam = c.req.param("tokenId");
  const tokenId = parseInt(tokenIdParam, 10);

  if (isNaN(tokenId) || tokenId < 1 || tokenId > 10000) {
    return c.json({ error: "Invalid tokenId" }, 400);
  }

  const body = await c.req.json<{ task: string }>().catch(() => ({ task: "" }));
  if (!body.task) {
    return c.json({ error: "Missing task ID" }, 400);
  }

  try {
    await aiImageService.chooseInitialImage(tokenId, body.task);
    return c.json({ status: "ok" });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      400,
    );
  }
}

/**
 * POST /27y/images/:taskId/regenerate
 * Regenerate an image with the same parameters (requires auth)
 */
export async function post27yRegenerateImage(c: Context) {
  if (!verifyTeamToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const taskId = c.req.param("taskId");
  if (!taskId) {
    return c.json({ error: "Missing task ID" }, 400);
  }

  try {
    const result = await aiImageService.regenerateImage(taskId);
    return c.json({
      requestId: result.requestId,
      taskId: result.taskId,
    });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      400,
    );
  }
}
