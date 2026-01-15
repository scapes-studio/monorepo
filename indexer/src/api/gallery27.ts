import type { Context } from "hono";
import { eq, sql, lt, and, gte, desc } from "drizzle-orm";
import { db } from "ponder:api";
import schema from "ponder:schema";
import { getOffchainDb } from "../services/database";
import { twentySevenYearScapeDetail, twentySevenYearRequest, ensProfile } from "../../offchain.schema";
import { aiImageService } from "../services/ai-image";
import { s3Service } from "../services/s3";

/**
 * GET /gallery27/:tokenId
 * Get twentySevenYearScape details by token ID
 */
export async function getGallery27Scape(c: Context) {
  const tokenIdParam = c.req.param("tokenId");
  const tokenId = parseInt(tokenIdParam, 10);

  if (isNaN(tokenId) || tokenId < 1 || tokenId > 10000) {
    return c.json({ error: "Invalid tokenId" }, 400);
  }

  // Check onchain table to see if token is minted
  const onchainScape = await db.query.twentySevenYearScape.findFirst({
    where: eq(schema.twentySevenYearScape.id, BigInt(tokenId)),
  });

  const offchainDb = getOffchainDb();

  const scape = await offchainDb.query.twentySevenYearScapeDetail.findFirst({
    where: eq(twentySevenYearScapeDetail.tokenId, tokenId),
  });

  if (!scape) {
    return c.json({ error: "Scape not found" }, 404);
  }

  // Get parent PunkScape owner if scapeId exists
  let punkScapeOwner: string | null = null;
  if (scape.scapeId) {
    const parentScape = await db.query.scape.findFirst({
      where: eq(schema.scape.id, BigInt(scape.scapeId)),
    });
    if (parentScape) {
      punkScapeOwner = parentScape.owner;
    }
  }

  return c.json({
    ...scape,
    punkScapeOwner,
    isMinted: !!onchainScape,
  });
}

/**
 * GET /gallery27/by-scape/:scapeId
 * Look up Gallery27 token by parent PunkScape ID
 */
export async function getGallery27ByScapeId(c: Context) {
  const scapeIdParam = c.req.param("scapeId");
  const scapeId = parseInt(scapeIdParam, 10);

  if (isNaN(scapeId) || scapeId < 1 || scapeId > 10000) {
    return c.json({ error: "Invalid scapeId" }, 400);
  }

  const db = getOffchainDb();

  const scape = await db.query.twentySevenYearScapeDetail.findFirst({
    where: eq(twentySevenYearScapeDetail.scapeId, scapeId),
  });

  if (!scape) {
    return c.json({ error: "No Gallery27 token found for this scape" }, 404);
  }

  return c.json({ tokenId: scape.tokenId });
}

/**
 * GET /gallery27/current
 * Get the currently active scape (auction in progress)
 */
export async function getGallery27Current(c: Context) {
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
 * GET /gallery27/next
 * Get the next upcoming scape
 */
export async function getGallery27Next(c: Context) {
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
 * GET /gallery27/:tokenId/initial-image
 * Get the initial image URL for a scape
 */
export async function getGallery27InitialImage(c: Context) {
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
 * GET /gallery27/:tokenId/pregenerations
 * List completed pregenerations for a scape
 */
export async function getGallery27Pregenerations(c: Context) {
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
 * POST /gallery27/:tokenId/pregenerate
 * Trigger image generation for a scape (requires auth)
 */
export async function postGallery27Pregenerate(c: Context) {
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
 * POST /gallery27/:tokenId/pregenerations/choose
 * Choose the initial image for a scape (requires auth)
 */
export async function postGallery27ChooseInitialImage(c: Context) {
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
 * POST /gallery27/images/:taskId/regenerate
 * Regenerate an image with the same parameters (requires auth)
 */
export async function postGallery27RegenerateImage(c: Context) {
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
 * GET /gallery27/:tokenId/auction
 * Get auction state from onchain data
 */
export async function getGallery27Auction(c: Context) {
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
      startTimestamp: scapeDetail.date ?? null,
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
    startTimestamp: scapeDetail.date ?? null,
    endTimestamp: auction.endTimestamp ?? scapeDetail.auctionEndsAt ?? null,
    bidCount: auction.bidCount,
    settled: scapeDetail.completedAt !== null,
  });
}

/**
 * GET /gallery27/:tokenId/bids
 * Get bid history with AI images
 * Note: AI images are hidden for auctions that haven't started yet
 */
export async function getGallery27Bids(c: Context) {
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
  const now = Math.floor(Date.now() / 1000);
  const auctionStarted = scapeDetail.date !== null && scapeDetail.date <= now;

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

  // Build bid list with images (hidden for future auctions)
  const bids = onchainBids.map(bid => {
    // Find matching request by address and message
    const matchingRequest = auctionStarted
      ? requests.find(
        r => r.from?.toLowerCase() === bid.bidder.toLowerCase() && r.description === bid.message
      )
      : null;

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

  // Get initial render if set (hidden for future auctions)
  let initialRender = null;
  if (auctionStarted && scapeDetail.initialRenderId) {
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

  // Get accepted/winning image if set (hidden for future auctions)
  let acceptedImage = null;
  if (auctionStarted && scapeDetail.requestId) {
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
 * GET /gallery27/all
 * Get paginated list of all 27Y scapes with images
 * Note: AI images are hidden for auctions that haven't started yet
 */
export async function getGallery27All(c: Context) {
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 100);
  const offset = Number(c.req.query("offset") ?? 0);
  const now = Math.floor(Date.now() / 1000);

  const offchainDb = getOffchainDb();

  // Get total count
  const countResult = await offchainDb
    .select({ count: sql<number>`count(*)` })
    .from(twentySevenYearScapeDetail);
  const total = Number(countResult[0]?.count ?? 0);

  // Query scapes with left join to get initial render path
  const rawScapes = await offchainDb
    .select({
      tokenId: twentySevenYearScapeDetail.tokenId,
      date: twentySevenYearScapeDetail.date,
      scapeId: twentySevenYearScapeDetail.scapeId,
      imagePath: twentySevenYearScapeDetail.imagePath,
      initialRenderPath: twentySevenYearRequest.imagePath,
    })
    .from(twentySevenYearScapeDetail)
    .leftJoin(
      twentySevenYearRequest,
      eq(twentySevenYearScapeDetail.initialRenderId, twentySevenYearRequest.id)
    )
    .orderBy(twentySevenYearScapeDetail.tokenId)
    .limit(limit)
    .offset(offset);

  // Hide AI images for auctions that haven't started yet
  const scapes = rawScapes.map((scape) => {
    const auctionStarted = scape.date !== null && scape.date <= now;
    return {
      ...scape,
      imagePath: auctionStarted ? scape.imagePath : null,
      initialRenderPath: auctionStarted ? scape.initialRenderPath : null,
    };
  });

  return c.json({
    scapes,
    total,
    hasMore: offset + scapes.length < total,
  });
}

/**
 * GET /gallery27/:tokenId/metadata.json
 * Get NFT metadata for a minted Gallery27 scape
 */
export async function getGallery27Metadata(c: Context) {
  const tokenIdParam = c.req.param("tokenId");
  const tokenId = parseInt(tokenIdParam, 10);

  if (isNaN(tokenId) || tokenId < 1 || tokenId > 10000) {
    return c.json({ error: "Invalid tokenId" }, 400);
  }

  const offchainDb = getOffchainDb();
  const scape = await offchainDb.query.twentySevenYearScapeDetail.findFirst({
    where: eq(twentySevenYearScapeDetail.tokenId, tokenId),
  });

  if (!scape) {
    return c.json({ error: "Scape not found" }, 404);
  }

  if (!scape.data) {
    return c.json({ error: "Scape not minted" }, 403);
  }

  return c.json({
    provenance: `ipfs://${scape.metadataCid}`,
    provenance_gateways: [
      `https://gateway.pinata.cloud/ipfs/${scape.metadataCid}`,
      `https://ipfs.io/ipfs/${scape.metadataCid}`,
      `https://cloudflare-ipfs.com/ipfs/${scape.metadataCid}`,
    ],
    ...scape.data,
  });
}

/**
 * GET /profiles/:address/gallery27-scapes
 * Get 27Y scapes owned by address
 */
export async function getGallery27ScapesByOwner(c: Context) {
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

/**
 * GET /profiles/:address/27y-claimable
 * Get 27Y scapes claimable by address (won auction but not yet claimed)
 */
export async function getGallery27ClaimableByAddress(c: Context) {
  const address = c.req.param("address");

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return c.json({ error: "Invalid address" }, 400);
  }

  const normalizedAddress = address.toLowerCase() as `0x${string}`;
  const now = Math.floor(Date.now() / 1000);
  const offchainDb = getOffchainDb();

  // Get all minted 27Y token IDs to exclude
  const mintedScapes = await db.select({ id: schema.twentySevenYearScape.id }).from(schema.twentySevenYearScape);
  const mintedTokenIds = new Set(mintedScapes.map(s => Number(s.id)));

  // Case 1: User is latestBidder in an auction that has ended
  const auctionsWonByBidding = await db
    .select()
    .from(schema.gallery27Auction)
    .where(
      and(
        eq(schema.gallery27Auction.latestBidder, normalizedAddress),
        lt(schema.gallery27Auction.endTimestamp, now)
      )
    );

  // Case 2: User owns PunkScape with no bids and auction has ended
  // First get PunkScapes owned by user
  const ownedPunkScapes = await db
    .select({ id: schema.scape.id })
    .from(schema.scape)
    .where(eq(schema.scape.owner, normalizedAddress));

  const ownedPunkScapeIds = new Set(ownedPunkScapes.map(s => Number(s.id)));

  // Find auctions with no bids (latestBidder is null) for PunkScapes the user owns
  const auctionsWonByOwnership = ownedPunkScapeIds.size > 0
    ? await offchainDb
        .select()
        .from(twentySevenYearScapeDetail)
        .where(
          and(
            sql`${twentySevenYearScapeDetail.scapeId} IN (${sql.join([...ownedPunkScapeIds].map(id => sql`${id}`), sql`, `)})`,
            lt(twentySevenYearScapeDetail.auctionEndsAt, now)
          )
        )
    : [];

  // Check which of these have no bids (latestBidder is null in gallery27Auction)
  const noBidAuctionScapeIds: number[] = [];
  for (const detail of auctionsWonByOwnership) {
    if (!detail.scapeId) continue;

    const auction = await db.query.gallery27Auction.findFirst({
      where: eq(schema.gallery27Auction.punkScapeId, BigInt(detail.scapeId)),
    });

    // Claimable if no auction exists OR auction has no latestBidder
    if (!auction || !auction.latestBidder) {
      noBidAuctionScapeIds.push(detail.scapeId);
    }
  }

  // Collect all claimable scapeIds (PunkScape IDs)
  const claimableByBiddingScapeIds = auctionsWonByBidding.map(a => Number(a.punkScapeId));
  const allClaimableScapeIds = [...new Set([...claimableByBiddingScapeIds, ...noBidAuctionScapeIds])];

  if (allClaimableScapeIds.length === 0) {
    return c.json({ scapes: [] });
  }

  // Get offchain details for claimable scapes
  const details = await offchainDb
    .select({
      tokenId: twentySevenYearScapeDetail.tokenId,
      scapeId: twentySevenYearScapeDetail.scapeId,
      date: twentySevenYearScapeDetail.date,
      auctionEndsAt: twentySevenYearScapeDetail.auctionEndsAt,
      description: twentySevenYearScapeDetail.description,
      imagePath: twentySevenYearScapeDetail.imagePath,
      initialRenderPath: twentySevenYearRequest.imagePath,
    })
    .from(twentySevenYearScapeDetail)
    .leftJoin(
      twentySevenYearRequest,
      eq(twentySevenYearScapeDetail.initialRenderId, twentySevenYearRequest.id)
    )
    .where(sql`${twentySevenYearScapeDetail.scapeId} IN (${sql.join(allClaimableScapeIds.map(id => sql`${id}`), sql`, `)})`);

  // Filter out already minted and build response
  const claimableBiddingSet = new Set(claimableByBiddingScapeIds);
  const scapes = details
    .filter(d => !mintedTokenIds.has(d.tokenId))
    .map(detail => ({
      tokenId: detail.tokenId,
      scapeId: detail.scapeId,
      date: detail.date,
      auctionEndsAt: detail.auctionEndsAt,
      description: detail.description,
      imagePath: detail.imagePath,
      initialRenderPath: detail.initialRenderPath,
      claimReason: detail.scapeId && claimableBiddingSet.has(detail.scapeId)
        ? "auction_winner" as const
        : "punkscape_owner" as const,
    }));

  return c.json({ scapes });
}
