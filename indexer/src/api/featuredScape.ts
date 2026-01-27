import { db } from "ponder:api";
import { type Context } from "hono";
import { sql } from "drizzle-orm";
import { isAddress } from "viem";

/**
 * GET /profiles/:address/featured-scape
 * Returns the highest-priced active onchain listing owned by the address,
 * or any owned scape if none are listed, or null if the account owns no scapes.
 */
export const getFeaturedScape = async (c: Context) => {
  const address = c.req.param("address");

  if (!isAddress(address)) {
    return c.json({ error: "Invalid address" }, 400);
  }

  const normalizedAddress = address.toLowerCase();

  const query = sql`
    SELECT
      s.id,
      o.price::text as price
    FROM scape s
    LEFT JOIN offer o
      ON o.token_id = s.id
      AND o.is_active = true
      AND o.specific_buyer IS NULL
    WHERE s.owner = ${normalizedAddress}
    ORDER BY o.price DESC NULLS LAST
    LIMIT 1
  `;

  const result = await db.execute(query);
  const row = result.rows[0] as { id: string; price: string | null } | undefined;

  if (!row) {
    return c.json({ data: null });
  }

  return c.json({
    data: {
      tokenId: row.id.toString(),
      price: row.price,
    },
  });
};
