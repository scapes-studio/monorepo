/**
 * Gallery27 Onchain Action API Routes
 *
 * POST /27y/sign-initialize-auction - Get signature for auction initialization
 * POST /27y/sign-claim - Get signature for claiming minted NFT
 */
import type { Context } from "hono";
import { eq } from "drizzle-orm";
import { db } from "ponder:api";
import schema from "ponder:schema";
import { getOffchainDb } from "../services/database";
import { twentySevenYearScapeDetail, twentySevenYearRequest } from "../../offchain.schema";
import {
  gallery27SignerService,
  V1_TOKEN_IDS,
  GALLERY27_V1_ADDRESS,
  GALLERY27_ADDRESS,
} from "../services/gallery27-signer";
import { metadataService } from "../services/metadata";

/**
 * POST /27y/sign-initialize-auction
 * Get a signature to initialize an auction on-chain.
 *
 * Request body: { punkScapeId: number }
 * Response: { punkScapeId, auctionEndsAt, signature, contractAddress }
 */
export async function postSignInitializeAuction(c: Context) {
  const body = await c.req.json<{ punkScapeId: number }>().catch(() => null);

  if (!body?.punkScapeId) {
    return c.json({ error: "punkScapeId is required" }, 400);
  }

  const offchainDb = getOffchainDb();
  const now = Math.floor(Date.now() / 1000);

  // Find scape by scapeId (not tokenId)
  const scapeDetail = await offchainDb.query.twentySevenYearScapeDetail.findFirst({
    where: eq(twentySevenYearScapeDetail.scapeId, body.punkScapeId),
  });

  if (!scapeDetail) {
    return c.json({ error: "Scape not found" }, 404);
  }

  // Verify auction is currently active (between date and auctionEndsAt)
  const isActive =
    scapeDetail.date !== null &&
    scapeDetail.date <= now &&
    scapeDetail.auctionEndsAt !== null &&
    scapeDetail.auctionEndsAt >= now;

  if (!isActive) {
    return c.json({ error: "Auction is not currently running" }, 403);
  }

  // Check if auction already initialized onchain
  const existingAuction = await db.query.gallery27Auction.findFirst({
    where: eq(schema.gallery27Auction.punkScapeId, BigInt(body.punkScapeId)),
  });

  if (existingAuction?.latestBidder) {
    return c.json({ error: "Auction already initialized" }, 403);
  }

  // Generate signature (auctionEndsAt validated as non-null above in isActive check)
  const auctionEndsAt = BigInt(scapeDetail.auctionEndsAt!);
  const signature = await gallery27SignerService.signInitializeAuction(
    BigInt(body.punkScapeId),
    auctionEndsAt,
  );

  return c.json({
    punkScapeId: body.punkScapeId,
    auctionEndsAt: Number(auctionEndsAt),
    signature,
    contractAddress: GALLERY27_ADDRESS,
  });
}

/**
 * POST /27y/sign-claim
 * Get a signature to claim a minted NFT on-chain.
 *
 * Request body: { punkScapeId: number, requestId: number, step: number }
 * Response: { tokenId, punkScapeId, cid, metadata, signature, contractAddress }
 */
export async function postSignClaim(c: Context) {
  const body = await c.req
    .json<{
      punkScapeId: number;
      requestId: number;
      step: number;
    }>()
    .catch(() => null);

  if (!body?.punkScapeId || !body?.requestId || body?.step === undefined) {
    return c.json({ error: "punkScapeId, requestId, and step are required" }, 400);
  }

  const offchainDb = getOffchainDb();
  const now = Math.floor(Date.now() / 1000);

  // Find scape by scapeId
  const scapeDetail = await offchainDb.query.twentySevenYearScapeDetail.findFirst({
    where: eq(twentySevenYearScapeDetail.scapeId, body.punkScapeId),
  });

  if (!scapeDetail) {
    return c.json({ error: "Scape not found" }, 404);
  }

  // Verify auction has ended
  if (!scapeDetail.auctionEndsAt || scapeDetail.auctionEndsAt > now) {
    return c.json({ error: "Auction has not completed yet" }, 403);
  }

  // Check if already minted
  const onchainScape = await db.query.twentySevenYearScape.findFirst({
    where: eq(schema.twentySevenYearScape.id, BigInt(scapeDetail.tokenId)),
  });

  if (onchainScape) {
    return c.json({ error: "Scape already minted" }, 403);
  }

  // Get the image request
  const imageRequest = await offchainDb.query.twentySevenYearRequest.findFirst({
    where: eq(twentySevenYearRequest.id, body.requestId),
  });

  if (!imageRequest) {
    return c.json({ error: "Image request not found" }, 404);
  }

  if (!imageRequest.imagePath) {
    return c.json({ error: "Image not yet generated" }, 400);
  }

  // Generate metadata if not already generated
  let metadataCid = scapeDetail.metadataCid;
  let metadata = scapeDetail.data;

  if (!metadataCid) {
    try {
      const provenance = await metadataService.generateProvenanceData(
        {
          tokenId: scapeDetail.tokenId,
          scapeId: scapeDetail.scapeId,
          description: scapeDetail.description,
          date: scapeDetail.date,
        },
        {
          imagePath: imageRequest.imagePath,
          imageInput: imageRequest.imageInput,
          createdAt: imageRequest.createdAt,
        },
      );

      metadataCid = provenance.metadataCID;
      metadata = provenance.metadata;

      // Update scape detail with generated metadata
      await offchainDb
        .update(twentySevenYearScapeDetail)
        .set({
          requestId: body.requestId,
          step: body.step || null,
          imagePath: imageRequest.imagePath,
          imageCid: provenance.imageCID,
          metadataCid: provenance.metadataCID,
          data: provenance.metadata,
          updatedAt: now,
        })
        .where(eq(twentySevenYearScapeDetail.tokenId, scapeDetail.tokenId));
    } catch (error) {
      console.error("Failed to generate metadata:", error);
      return c.json({ error: "Failed to generate metadata" }, 500);
    }
  } else if (scapeDetail.requestId !== body.requestId || scapeDetail.step !== body.step) {
    // Update scape detail with chosen request (if not already set)
    await offchainDb
      .update(twentySevenYearScapeDetail)
      .set({
        requestId: body.requestId,
        step: body.step || null,
        imagePath: imageRequest.imagePath,
        updatedAt: now,
      })
      .where(eq(twentySevenYearScapeDetail.tokenId, scapeDetail.tokenId));
  }

  // Sign the claim
  const signature = await gallery27SignerService.signClaim(
    BigInt(body.punkScapeId),
    BigInt(scapeDetail.tokenId),
    metadataCid,
  );

  // Determine contract address
  const contractAddress = V1_TOKEN_IDS.includes(scapeDetail.tokenId)
    ? GALLERY27_V1_ADDRESS
    : GALLERY27_ADDRESS;

  return c.json({
    tokenId: scapeDetail.tokenId,
    punkScapeId: body.punkScapeId,
    cid: metadataCid,
    metadata: metadata ?? null,
    signature,
    contractAddress,
  });
}
