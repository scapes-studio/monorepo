import type { Context } from "hono";
import { eq, sql, lt, and, gte, desc } from "drizzle-orm";
import { db } from "ponder:api";
import schema from "ponder:schema";
import { getOffchainDb } from "../services/database";
import { twentySevenYearScapeDetail, twentySevenYearRequest, ensProfile } from "../../offchain.schema";
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

/**
 * GET /27y/:tokenId/auction
 * Get auction state from onchain data
 */
export async function get27yAuction(c: Context) {
  const tokenIdParam = c.req.param("tokenId");
  const tokenId = parseInt(tokenIdParam, 10);

  if (isNaN(tokenId) || tokenId < 1 || tokenId > 10000) {
    return c.json({ error: "Invalid tokenId" }, 400);
  }

  // Get offchain scape detail to find punkScapeId
  const offchainDb = getOffchainDb();
  const scapeDetail = await offchainDb.query.twentySevenYearScapeDetail.findFirst({
    where: eq(twentySevenYearScapeDetail.tokenId, tokenId),
  });

  if (!scapeDetail) {
    return c.json({ error: "Scape not found" }, 404);
  }

  const punkScapeId = scapeDetail.scapeId ?? tokenId;

  // Query onchain auction data
  const auction = await db.query.gallery27Auction.findFirst({
    where: eq(schema.gallery27Auction.punkScapeId, BigInt(punkScapeId)),
  });

  if (!auction) {
    // No auction exists yet - return default state
    return c.json({
      tokenId,
      punkScapeId,
      latestBidder: null,
      latestBid: null,
      endTimestamp: scapeDetail.auctionEndsAt ?? null,
      bidCount: 0,
      settled: scapeDetail.completedAt !== null,
    });
  }

  return c.json({
    tokenId,
    punkScapeId,
    latestBidder: auction.latestBidder,
    latestBid: auction.latestBid?.toString() ?? null,
    endTimestamp: auction.endTimestamp,
    bidCount: auction.bidCount,
    settled: scapeDetail.completedAt !== null,
  });
}

/**
 * GET /27y/:tokenId/bids
 * Get bid history with AI images
 */
export async function get27yBids(c: Context) {
  const tokenIdParam = c.req.param("tokenId");
  const tokenId = parseInt(tokenIdParam, 10);

  if (isNaN(tokenId) || tokenId < 1 || tokenId > 10000) {
    return c.json({ error: "Invalid tokenId" }, 400);
  }

  // Get offchain scape detail to find punkScapeId and initial render
  const offchainDb = getOffchainDb();
  const scapeDetail = await offchainDb.query.twentySevenYearScapeDetail.findFirst({
    where: eq(twentySevenYearScapeDetail.tokenId, tokenId),
  });

  if (!scapeDetail) {
    return c.json({ error: "Scape not found" }, 404);
  }

  const punkScapeId = scapeDetail.scapeId ?? tokenId;

  // Query onchain bids
  const onchainBids = await db
    .select()
    .from(schema.gallery27Bid)
    .where(eq(schema.gallery27Bid.punkScapeId, BigInt(punkScapeId)))
    .orderBy(desc(schema.gallery27Bid.timestamp));

  // Get ENS profiles for all bidders
  const bidderAddresses = [...new Set(onchainBids.map(b => b.bidder.toLowerCase()))];
  const ensProfiles = bidderAddresses.length > 0
    ? await offchainDb
        .select()
        .from(ensProfile)
        .where(sql`LOWER(${ensProfile.address}) IN (${sql.join(bidderAddresses.map(a => sql`${a}`), sql`, `)})`)
    : [];

  const ensMap = new Map(ensProfiles.map(p => [p.address.toLowerCase(), p.ens]));

  // Get offchain requests to match with bids (for AI images)
  const requests = await offchainDb
    .select()
    .from(twentySevenYearRequest)
    .where(eq(twentySevenYearRequest.tokenId, tokenId));

  // Build bid list with images
  const bids = onchainBids.map(bid => {
    // Find matching request by address and message
    const matchingRequest = requests.find(
      r => r.from?.toLowerCase() === bid.bidder.toLowerCase() && r.description === bid.message
    );

    return {
      id: bid.id,
      bidder: bid.bidder,
      bidderEns: ensMap.get(bid.bidder.toLowerCase()) ?? null,
      amount: bid.amount.toString(),
      message: bid.message,
      timestamp: bid.timestamp,
      txHash: bid.txHash,
      image: matchingRequest?.imagePath
        ? {
            id: matchingRequest.id,
            path: matchingRequest.imagePath,
            steps: matchingRequest.imageSteps ?? null,
          }
        : null,
    };
  });

  // Get initial render if set
  let initialRender = null;
  if (scapeDetail.initialRenderId) {
    const initialRequest = await offchainDb.query.twentySevenYearRequest.findFirst({
      where: eq(twentySevenYearRequest.id, scapeDetail.initialRenderId),
    });
    if (initialRequest?.imagePath) {
      initialRender = {
        id: initialRequest.id,
        path: initialRequest.imagePath,
        steps: initialRequest.imageSteps ?? null,
      };
    }
  }

  // Get accepted/winning image if set
  let acceptedImage = null;
  if (scapeDetail.requestId) {
    const acceptedRequest = await offchainDb.query.twentySevenYearRequest.findFirst({
      where: eq(twentySevenYearRequest.id, scapeDetail.requestId),
    });
    if (acceptedRequest?.imagePath) {
      acceptedImage = {
        id: acceptedRequest.id,
        path: acceptedRequest.imagePath,
        steps: acceptedRequest.imageSteps ?? null,
      };
    }
  }

  return c.json({
    bids,
    initialRender,
    acceptedImage,
  });
}

/**
 * GET /profiles/:address/27y-scapes
 * Get 27Y scapes owned by address
 */
export async function get27yScapesByOwner(c: Context) {
  const address = c.req.param("address");

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return c.json({ error: "Invalid address" }, 400);
  }

  const normalizedAddress = address.toLowerCase() as `0x${string}`;

  // Query onchain ownership
  const onchainScapes = await db
    .select()
    .from(schema.twentySevenYearScape)
    .where(eq(schema.twentySevenYearScape.owner, normalizedAddress));

  if (onchainScapes.length === 0) {
    return c.json({ scapes: [] });
  }

  // Get offchain details for owned scapes
  const tokenIds = onchainScapes.map(s => Number(s.id));
  const offchainDb = getOffchainDb();

  const details = await offchainDb
    .select()
    .from(twentySevenYearScapeDetail)
    .where(sql`${twentySevenYearScapeDetail.tokenId} IN (${sql.join(tokenIds.map(id => sql`${id}`), sql`, `)})`);

  const detailsMap = new Map(details.map(d => [d.tokenId, d]));

  const scapes = onchainScapes.map(scape => {
    const detail = detailsMap.get(Number(scape.id));
    return {
      tokenId: Number(scape.id),
      scapeId: detail?.scapeId ?? null,
      date: detail?.date ?? null,
      description: detail?.description ?? null,
      imagePath: detail?.imagePath ?? null,
      step: detail?.step ?? null,
      owner: scape.owner,
    };
  });

  return c.json({ scapes });
}
