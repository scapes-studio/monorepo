/**
 * Gallery27 Bid Image Reconciler
 *
 * Generates an AI image for each Gallery27 bid from its message.
 *
 * This runs as a cron job (not a Ponder event handler) because Ponder replays
 * the entire on-chain event history on every restart/redeploy — triggering
 * generation from a handler would re-fire for every historical bid.
 *
 * Instead it diffs the already-indexed `gallery27Bid` table against the offchain
 * `twentySevenYearRequest` table, keyed on the bid's transaction hash. The
 * offchain table is drizzle-managed and survives Ponder reindexes, so the tx
 * hash acts as a durable cursor: the reconciler is idempotent and self-healing
 * (a missed or failed bid is simply retried on the next tick).
 */

import { eq, gte, desc } from "drizzle-orm";
import { getViewsDb, getOffchainDb } from "./database";
import { schema } from "../../combined.schema";
import {
  twentySevenYearScapeDetail,
  twentySevenYearRequest,
} from "../../offchain.schema";
import { aiImageService } from "./ai-image";

const DEFAULT_BACKFILL_DAYS = 14;
const DEFAULT_BATCH_SIZE = 5;
const SECONDS_PER_DAY = 86400;

export interface GenerateBidImagesOptions {
  /** How many days back to consider bids (default 14, env G27_BID_IMAGE_BACKFILL_DAYS). */
  backfillDays?: number;
  /** Max generations to start per run (default 5). Leftovers picked up next tick. */
  batchSize?: number;
  /** Only report what would be generated, without calling Leonardo. */
  dryRun?: boolean;
}

export type BidImageStatus =
  | "generated"
  | "skipped" // already has a request for this bid
  | "failed"
  | "no-scape" // bid for a punkScapeId without a 27Y day
  | "not-started"; // auction has not started yet (image hidden anyway)

export interface BidImageDetail {
  txHash: string;
  tokenId: number | null;
  bidder: string;
  message: string;
  status: BidImageStatus;
  requestId?: number;
  taskId?: string;
  error?: string;
}

export interface BidImageResult {
  considered: number;
  generated: number;
  skipped: number;
  failed: number;
  capped: boolean; // batch limit reached, more bids remain
  details: BidImageDetail[];
}

function resolveBackfillDays(override?: number): number {
  if (override !== undefined) return override;
  const fromEnv = Number(process.env.G27_BID_IMAGE_BACKFILL_DAYS);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_BACKFILL_DAYS;
}

/**
 * Generate AI images for recent bids that don't have one yet.
 */
export async function generateBidImages(
  options: GenerateBidImagesOptions = {},
): Promise<BidImageResult> {
  const backfillDays = resolveBackfillDays(options.backfillDays);
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  const dryRun = options.dryRun ?? false;

  const viewsDb = getViewsDb();
  const offchainDb = getOffchainDb();

  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - backfillDays * SECONDS_PER_DAY;

  // Newest bids first so the most relevant ones get images when the batch caps.
  const bids = await viewsDb
    .select({
      punkScapeId: schema.gallery27Bid.punkScapeId,
      bidder: schema.gallery27Bid.bidder,
      amount: schema.gallery27Bid.amount,
      message: schema.gallery27Bid.message,
      txHash: schema.gallery27Bid.txHash,
    })
    .from(schema.gallery27Bid)
    .where(gte(schema.gallery27Bid.timestamp, cutoff))
    .orderBy(desc(schema.gallery27Bid.timestamp));

  const result: BidImageResult = {
    considered: bids.length,
    generated: 0,
    skipped: 0,
    failed: 0,
    capped: false,
    details: [],
  };

  for (const bid of bids) {
    const txHash = bid.txHash.toLowerCase();
    const bidder = bid.bidder.toLowerCase();

    // Idempotency: a request already exists for this bid tx → nothing to do.
    const existing = await offchainDb.query.twentySevenYearRequest.findFirst({
      where: eq(twentySevenYearRequest.transactionHash, txHash),
    });
    if (existing) {
      result.skipped++;
      continue;
    }

    // Map the PunkScape (bid.punkScapeId) to its 27Y day.
    const detail = await offchainDb.query.twentySevenYearScapeDetail.findFirst({
      where: eq(twentySevenYearScapeDetail.scapeId, Number(bid.punkScapeId)),
    });
    if (!detail) {
      result.details.push({
        txHash,
        tokenId: null,
        bidder,
        message: bid.message,
        status: "no-scape",
      });
      continue;
    }

    // Images are hidden until the auction starts; don't generate before then.
    if (detail.date === null || detail.date > now) {
      result.details.push({
        txHash,
        tokenId: detail.tokenId,
        bidder,
        message: bid.message,
        status: "not-started",
      });
      continue;
    }

    // Cap generations per run; remaining bids are handled on the next tick.
    if (result.generated >= batchSize) {
      result.capped = true;
      break;
    }

    if (dryRun) {
      result.generated++;
      result.details.push({
        txHash,
        tokenId: detail.tokenId,
        bidder,
        message: bid.message,
        status: "generated",
      });
      continue;
    }

    try {
      const gen = await aiImageService.generateForScape({
        tokenId: detail.tokenId,
        scapeId: detail.scapeId ?? detail.tokenId,
        message: bid.message,
        bidderAddress: bidder,
        transactionHash: txHash,
        bidValue: bid.amount.toString(),
      });
      result.generated++;
      result.details.push({
        txHash,
        tokenId: detail.tokenId,
        bidder,
        message: bid.message,
        status: "generated",
        requestId: gen.requestId,
        taskId: gen.taskId,
      });
    } catch (error) {
      result.failed++;
      result.details.push({
        txHash,
        tokenId: detail.tokenId,
        bidder,
        message: bid.message,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}
