import { db } from "ponder:api";
import schema from "ponder:schema";
import { type Context } from "hono";
import { desc, eq, sql } from "drizzle-orm";
import { seaportSale } from "../../offchain.schema";

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
    sql`${transferTable.scape} = ${seaportSale.tokenId}`,
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

type TransferEvent = {
  type: "transfer" | "sale";
  id: string;
  timestamp: number;
  from: string;
  to: string;
  txHash: string;
  sale: {
    id: string | number;
    price: unknown;
    seller: string | null;
    buyer: string | null;
    slug: string | null;
    source: "seaport" | "onchain";
  } | null;
};

type ListingEvent = {
  type: "listing";
  id: string;
  timestamp: number;
  lister: string;
  price: { wei: string; eth: number };
  isActive: boolean;
  txHash: string;
};

type HistoryEvent = TransferEvent | ListingEvent;

/**
 * Creates a history handler for a specific collection
 * Returns all transfers and listings ordered by timestamp desc
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

    // Query transfers with sales
    const transferResult = collection.includeOnchainSales
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
          .where(eq(transferTable.scape, tokenIdValue));

    // Query onchain offers (only for scapes collection which has the offer table)
    const onchainOffers =
      collectionKey === "scapes"
        ? await db
            .select({
              tokenId: schema.offer.tokenId,
              lister: schema.offer.lister,
              price: schema.offer.price,
              isActive: schema.offer.isActive,
              updatedAt: schema.offer.updatedAt,
              txHash: schema.offer.txHash,
            })
            .from(schema.offer)
            .where(eq(schema.offer.tokenId, tokenIdValue))
        : [];

    // Transform transfers - prefer seaport data if available, fall back to onchain sale
    const transfers: TransferEvent[] = transferResult.map((row) => {
      const sale = row.seaportSaleId
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
              id: row.onchainSaleId as string,
              price: { wei: row.onchainSalePrice!.toString() },
              seller: row.onchainSeller as string,
              buyer: row.onchainBuyer as string,
              slug: collection.key,
              source: "onchain" as const,
            }
          : null;

      return {
        type: sale ? ("sale" as const) : ("transfer" as const),
        id: row.transferId,
        timestamp: row.timestamp,
        from: row.from,
        to: row.to,
        txHash: row.txHash,
        sale,
      };
    });

    // Transform onchain offers
    const listings: ListingEvent[] = onchainOffers.map((row) => {
      const priceWei = row.price.toString();
      const priceEth = Number(row.price) / 1e18;
      return {
        type: "listing" as const,
        id: `listing-${row.tokenId}`,
        timestamp: row.updatedAt,
        lister: row.lister,
        price: { wei: priceWei, eth: priceEth },
        isActive: row.isActive,
        txHash: row.txHash,
      };
    });

    // Combine and sort by timestamp desc
    const history: HistoryEvent[] = [...transfers, ...listings].sort(
      (a, b) => b.timestamp - a.timestamp,
    );

    return c.json({
      collection: collection.key,
      tokenId,
      history,
      totalTransfers: transfers.length,
      totalSales: transfers.filter((t) => t.sale !== null).length,
      totalListings: listings.length,
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
