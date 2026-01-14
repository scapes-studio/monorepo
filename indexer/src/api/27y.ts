import type { Context } from "hono";
import { eq, sql, lt, and, gte } from "drizzle-orm";
import { getOffchainDb } from "../services/database";
import { twentySevenYearScapeDetail } from "../../offchain.schema";

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
