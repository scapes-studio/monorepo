import { db } from "ponder:api";
import schema from "ponder:schema";
import { type Context } from "hono";
import { desc, eq, sql } from "drizzle-orm";
import * as ponderSchema from "../../ponder.schema";

const { seaportSale } = ponderSchema;

type CollectionKey = "scapes" | "twenty-seven-year-scapes";

type CollectionConfig = {
  key: CollectionKey;
  transferEventTable:
    | typeof schema.transferEvent
    | typeof schema.twentySevenYearTransferEvent;
  seaportSlugs: readonly string[];
  includeOnchainSales: boolean;
};

const COLLECTIONS: Record<CollectionKey, CollectionConfig> = {
  scapes: {
    key: "scapes",
    transferEventTable: schema.transferEvent,
    seaportSlugs: ["scapes", "punkscapes"],
    includeOnchainSales: true,
  },
  "twenty-seven-year-scapes": {
    key: "twenty-seven-year-scapes",
    transferEventTable: schema.twentySevenYearTransferEvent,
    seaportSlugs: ["twenty-seven-year-scapes"],
    includeOnchainSales: false,
  },
};

function buildSeaportJoinCondition(
  transferTable:
    | typeof schema.transferEvent
    | typeof schema.twentySevenYearTransferEvent,
  seaportSlugs: readonly string[],
) {
  const clauses = [
    sql`${transferTable.txHash} = ${seaportSale.txHash}`,
    sql`${transferTable.scape}::text = ${seaportSale.tokenId}`,
  ];

  if (seaportSlugs.length === 1) {
    clauses.push(sql`${seaportSale.slug} = ${seaportSlugs[0]}`);
  } else if (seaportSlugs.length > 1) {
    const slugList = sql.join(
      seaportSlugs.map((slug) => sql`${slug}`),
      sql`, `,
    );
    clauses.push(sql`${seaportSale.slug} IN (${slugList})`);
  }

  return sql.join(clauses, sql` AND `);
}

/**
 * Creates a history handler for a specific collection
 * Returns all transfers ordered by timestamp desc, with sale data where applicable
 */
function createHistoryHandler(collectionKey: CollectionKey) {
  const collection = COLLECTIONS[collectionKey];
  const transferTable = collection.transferEventTable;

  return async (c: Context) => {
    const tokenId = c.req.param("tokenId");
    const tokenIdValue = BigInt(tokenId);

    const seaportJoinCondition = buildSeaportJoinCondition(
      transferTable,
      collection.seaportSlugs,
    );

    const baseSelectFields = {
      transferId: transferTable.id,
      timestamp: transferTable.timestamp,
      from: transferTable.from,
      to: transferTable.to,
      txHash: transferTable.txHash,
      seaportSaleId: seaportSale.id,
      seaportSalePrice: seaportSale.price,
      seaportSeller: seaportSale.seller,
      seaportBuyer: seaportSale.buyer,
      seaportSlug: seaportSale.slug,
    } as const;

    const result = collection.includeOnchainSales
      ? await db
          .select({
            ...baseSelectFields,
            onchainSaleId: schema.sale.id,
            onchainSalePrice: schema.sale.price,
            onchainSeller: schema.sale.seller,
            onchainBuyer: schema.sale.buyer,
          })
          .from(transferTable)
          .leftJoin(seaportSale, seaportJoinCondition)
          .leftJoin(
            schema.sale,
            sql`${transferTable.txHash} = ${schema.sale.txHash} AND ${transferTable.scape} = ${schema.sale.tokenId}`,
          )
          .where(eq(transferTable.scape, tokenIdValue))
          .orderBy(desc(transferTable.timestamp))
      : await db
          .select({
            ...baseSelectFields,
            onchainSaleId: sql`NULL`,
            onchainSalePrice: sql`NULL`,
            onchainSeller: sql`NULL`,
            onchainBuyer: sql`NULL`,
          })
          .from(transferTable)
          .leftJoin(seaportSale, seaportJoinCondition)
          .where(eq(transferTable.scape, tokenIdValue))
          .orderBy(desc(transferTable.timestamp));

    // Transform results - prefer seaport data if available, fall back to onchain sale
    const history = result.map((row) => ({
      id: row.transferId,
      timestamp: row.timestamp,
      from: row.from,
      to: row.to,
      txHash: row.txHash,
      sale: row.seaportSaleId
        ? {
            id: row.seaportSaleId,
            price: row.seaportSalePrice,
            seller: row.seaportSeller,
            buyer: row.seaportBuyer,
            slug: row.seaportSlug,
            source: "seaport" as const,
          }
        : collection.includeOnchainSales && row.onchainSaleId
          ? {
              id: row.onchainSaleId,
              price: { wei: row.onchainSalePrice!.toString() },
              seller: row.onchainSeller,
              buyer: row.onchainBuyer,
              slug: collection.key,
              source: "onchain" as const,
            }
          : null,
    }));

    return c.json({
      collection: collection.key,
      tokenId,
      history,
      totalTransfers: history.length,
      totalSales: history.filter((h) => h.sale !== null).length,
    });
  };
}

/**
 * GET /scapes/:tokenId/history
 * Get complete transfer history for a specific scape
 */
export const getScapeHistory = createHistoryHandler("scapes");

/**
 * GET /twenty-seven-year-scapes/:tokenId/history
 * Get complete transfer history for a specific 27-year scape
 */
export const getTwentySevenYearScapeHistory = createHistoryHandler(
  "twenty-seven-year-scapes",
);
