import { db } from "ponder:api";
import { type Context } from "hono";
import { sql } from "drizzle-orm";
import * as ponderSchema from "../../ponder.schema";

const { scape } = ponderSchema;

type AttributeCount = {
  category: string;
  value: string;
  count: string;
};

/**
 * GET /scapes/attributes
 * Get trait counts for all scapes, optionally filtered by selected traits.
 *
 * Query params:
 * - traits: Comma-separated trait filters (e.g., "Atmosphere=Dusk,Buildings=Mansion Lvl 1")
 *
 * Returns array of { category, value, count } objects.
 */
export const getAttributeCounts = async (c: Context) => {
  const traitsParam = c.req.query("traits");

  // Build WHERE clause for trait filters
  let whereClause = sql`TRUE`;

  if (traitsParam) {
    const traits = traitsParam.split(",").filter(Boolean);
    if (traits.length > 0) {
      const conditions = traits.map((trait) => {
        const [category, value] = trait.split("=");
        return sql`${scape.attributes}::jsonb @> ${JSON.stringify([{ trait_type: category, value }])}::jsonb`;
      });

      whereClause = conditions.reduce((acc, cond) => sql`${acc} AND ${cond}`);
    }
  }

  const result = await db.execute(sql`
    SELECT
      attr->>'trait_type' as category,
      attr->>'value' as value,
      COUNT(DISTINCT ${scape.id})::text as count
    FROM ${scape}, jsonb_array_elements(${scape.attributes}::jsonb) as attr
    WHERE ${whereClause}
      AND attr->>'trait_type' IS NOT NULL
    GROUP BY 1, 2
    ORDER BY 1, 3 DESC
  `);

  const rows = (result as unknown as { rows: AttributeCount[] }).rows;

  return c.json(rows);
};
