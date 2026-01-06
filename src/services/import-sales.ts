import { eq, sql } from "drizzle-orm";
import { getDb } from "./database";
import { seaportSale, syncState, type VolumeStats } from "../offchain";
import { openseaService } from "./opensea";

// Collection configurations
export const COLLECTIONS = {
  punkscapes: {
    slug: "punkscapes",
    contract: "0x51Ae5e2533854495f6c587865Af64119db8F59b4",
    // Sales BEFORE this timestamp (Dec 20, 2022 23:58:59 UTC / block 16229345)
    beforeTimestamp: 1671580739,
  },
  scapes: {
    slug: "scapes",
    contract: "0xb7def63A9040ad5dC431afF79045617922f4023A",
    // Sales AFTER this timestamp
    afterTimestamp: 1671580739,
  },
} as const;

export type CollectionSlug = keyof typeof COLLECTIONS;

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ImportSalesService {
  /**
   * Import sales for a collection from OpenSea
   */
  async importSales({
    slug,
    afterTimestamp,
    beforeTimestamp,
    continuation,
    onProgress,
  }: {
    slug: CollectionSlug;
    afterTimestamp?: number;
    beforeTimestamp?: number;
    continuation?: string;
    onProgress?: (count: number) => void;
  }): Promise<number> {
    const config = COLLECTIONS[slug];
    const db = await getDb();

    const { sales, continuation: nextContinuation } = await openseaService.getSales({
      slug: config.slug,
      continuation,
      afterTimestamp,
      beforeTimestamp,
    });

    let importedCount = 0;

    if (sales.length > 0) {
      // Transform sales for database insertion
      const values = sales.map((sale) => ({
        slug: config.slug,
        contract: sale.contract.toLowerCase(),
        tokenId: sale.tokenId,
        txHash: sale.txHash,
        orderHash: sale.orderHash,
        block: null as bigint | null,
        timestamp: sale.timestamp,
        logIndex: sale.logIndex,
        seller: sale.seller.toLowerCase(),
        buyer: sale.buyer.toLowerCase(),
        price: sale.price,
      }));

      // Insert with conflict handling
      await db
        .insert(seaportSale)
        .values(values)
        .onConflictDoNothing();

      importedCount = sales.length;

      if (onProgress) {
        onProgress(importedCount);
      }
    }

    // Continue fetching if there are more pages
    if (nextContinuation && sales.length > 0) {
      await delay(750); // Rate limiting
      const nextCount = await this.importSales({
        slug,
        afterTimestamp,
        beforeTimestamp,
        continuation: nextContinuation,
        onProgress,
      });
      importedCount += nextCount;
    }

    return importedCount;
  }

  /**
   * Import sales for a specific collection with its configured time boundary
   */
  async importCollection(
    slug: CollectionSlug,
    options: {
      force?: boolean;
      onProgress?: (count: number) => void;
    } = {}
  ): Promise<number> {
    const { force = false, onProgress } = options;
    const config = COLLECTIONS[slug];
    const db = await getDb();

    // Get last synced timestamp
    let startTimestamp: number | undefined;

    if (!force) {
      const state = await db.query.syncState.findFirst({
        where: eq(syncState.slug, slug),
      });

      if (state?.lastSyncedTimestamp) {
        // Start from last synced timestamp minus 1 hour for padding
        startTimestamp = state.lastSyncedTimestamp - 3600;
      }
    }

    console.log(
      `Importing ${slug} sales${startTimestamp ? ` from ${new Date(startTimestamp * 1000).toISOString()}` : " (full import)"}`
    );

    // Determine time boundaries based on collection config
    let afterTimestamp = startTimestamp;
    let beforeTimestamp: number | undefined;

    if ("afterTimestamp" in config) {
      // For scapes: sales after the cutoff
      afterTimestamp = Math.max(afterTimestamp || 0, config.afterTimestamp);
    }

    if ("beforeTimestamp" in config) {
      // For punkscapes: sales before the cutoff
      beforeTimestamp = config.beforeTimestamp;
    }

    const importedCount = await this.importSales({
      slug,
      afterTimestamp,
      beforeTimestamp,
      onProgress,
    });

    // Update sync state
    const now = new Date();
    const stats = await this.calculateStats(slug);

    await db
      .insert(syncState)
      .values({
        slug,
        contract: config.contract,
        lastSyncedTimestamp: Math.floor(now.getTime() / 1000),
        stats,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: syncState.slug,
        set: {
          lastSyncedTimestamp: Math.floor(now.getTime() / 1000),
          stats,
          updatedAt: now,
        },
      });

    return importedCount;
  }

  /**
   * Import all collections
   */
  async importAllCollections(
    options: {
      force?: boolean;
      onProgress?: (slug: string, count: number) => void;
    } = {}
  ): Promise<{ slug: string; count: number }[]> {
    const results: { slug: string; count: number }[] = [];

    for (const slug of Object.keys(COLLECTIONS) as CollectionSlug[]) {
      try {
        const count = await this.importCollection(slug, {
          force: options.force,
          onProgress: (c) => options.onProgress?.(slug, c),
        });
        results.push({ slug, count });
        await delay(1000); // Wait between collections
      } catch (error) {
        console.error(`Error importing ${slug}:`, error);
        results.push({ slug, count: 0 });
      }
    }

    return results;
  }

  /**
   * Calculate volume stats for a collection
   */
  async calculateStats(slug: CollectionSlug): Promise<VolumeStats> {
    const db = await getDb();

    const now = Math.floor(Date.now() / 1000);
    const sixMonthsAgo = now - 180 * 24 * 60 * 60;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
    const oneDayAgo = now - 24 * 60 * 60;

    type StatsResult = {
      total_count: string;
      six_month_count: string;
      month_count: string;
      day_count: string;
      total_eth_volume: string;
      total_usd_volume: string;
      six_month_eth_volume: string;
      six_month_usd_volume: string;
      month_eth_volume: string;
      month_usd_volume: string;
      day_eth_volume: string;
      day_usd_volume: string;
    };

    const result = await db.execute(sql`
      SELECT
        COUNT(*) as total_count,
        SUM(CASE WHEN timestamp >= ${sixMonthsAgo} THEN 1 ELSE 0 END) as six_month_count,
        SUM(CASE WHEN timestamp >= ${thirtyDaysAgo} THEN 1 ELSE 0 END) as month_count,
        SUM(CASE WHEN timestamp >= ${oneDayAgo} THEN 1 ELSE 0 END) as day_count,
        ROUND(COALESCE(SUM((price->>'eth')::numeric), 0)::numeric, 4)::text as total_eth_volume,
        ROUND(COALESCE(SUM((price->>'usd')::numeric), 0)::numeric, 2)::text as total_usd_volume,
        ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${sixMonthsAgo} THEN (price->>'eth')::numeric ELSE 0 END), 0)::numeric, 4)::text as six_month_eth_volume,
        ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${sixMonthsAgo} THEN (price->>'usd')::numeric ELSE 0 END), 0)::numeric, 2)::text as six_month_usd_volume,
        ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${thirtyDaysAgo} THEN (price->>'eth')::numeric ELSE 0 END), 0)::numeric, 4)::text as month_eth_volume,
        ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${thirtyDaysAgo} THEN (price->>'usd')::numeric ELSE 0 END), 0)::numeric, 2)::text as month_usd_volume,
        ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${oneDayAgo} THEN (price->>'eth')::numeric ELSE 0 END), 0)::numeric, 4)::text as day_eth_volume,
        ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${oneDayAgo} THEN (price->>'usd')::numeric ELSE 0 END), 0)::numeric, 2)::text as day_usd_volume
      FROM offchain.seaport_sale
      WHERE slug = ${slug}
    `);

    const stats = result.rows[0] as StatsResult;

    return {
      volume: {
        total: {
          eth: stats.total_eth_volume || "0",
          usd: stats.total_usd_volume || "0",
        },
        sixMonth: {
          eth: stats.six_month_eth_volume || "0",
          usd: stats.six_month_usd_volume || "0",
        },
        month: {
          eth: stats.month_eth_volume || "0",
          usd: stats.month_usd_volume || "0",
        },
        day: {
          eth: stats.day_eth_volume || "0",
          usd: stats.day_usd_volume || "0",
        },
      },
      count: {
        total: Number(stats.total_count) || 0,
        sixMonth: Number(stats.six_month_count) || 0,
        month: Number(stats.month_count) || 0,
        day: Number(stats.day_count) || 0,
      },
    };
  }

  /**
   * Get combined stats for all collections
   */
  async getCombinedStats(): Promise<VolumeStats> {
    const db = await getDb();

    const now = Math.floor(Date.now() / 1000);
    const sixMonthsAgo = now - 180 * 24 * 60 * 60;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
    const oneDayAgo = now - 24 * 60 * 60;

    type StatsResult = {
      total_count: string;
      six_month_count: string;
      month_count: string;
      day_count: string;
      total_eth_volume: string;
      total_usd_volume: string;
      six_month_eth_volume: string;
      six_month_usd_volume: string;
      month_eth_volume: string;
      month_usd_volume: string;
      day_eth_volume: string;
      day_usd_volume: string;
    };

    const result = await db.execute(sql`
      SELECT
        COUNT(*) as total_count,
        SUM(CASE WHEN timestamp >= ${sixMonthsAgo} THEN 1 ELSE 0 END) as six_month_count,
        SUM(CASE WHEN timestamp >= ${thirtyDaysAgo} THEN 1 ELSE 0 END) as month_count,
        SUM(CASE WHEN timestamp >= ${oneDayAgo} THEN 1 ELSE 0 END) as day_count,
        ROUND(COALESCE(SUM((price->>'eth')::numeric), 0)::numeric, 4)::text as total_eth_volume,
        ROUND(COALESCE(SUM((price->>'usd')::numeric), 0)::numeric, 2)::text as total_usd_volume,
        ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${sixMonthsAgo} THEN (price->>'eth')::numeric ELSE 0 END), 0)::numeric, 4)::text as six_month_eth_volume,
        ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${sixMonthsAgo} THEN (price->>'usd')::numeric ELSE 0 END), 0)::numeric, 2)::text as six_month_usd_volume,
        ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${thirtyDaysAgo} THEN (price->>'eth')::numeric ELSE 0 END), 0)::numeric, 4)::text as month_eth_volume,
        ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${thirtyDaysAgo} THEN (price->>'usd')::numeric ELSE 0 END), 0)::numeric, 2)::text as month_usd_volume,
        ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${oneDayAgo} THEN (price->>'eth')::numeric ELSE 0 END), 0)::numeric, 4)::text as day_eth_volume,
        ROUND(COALESCE(SUM(CASE WHEN timestamp >= ${oneDayAgo} THEN (price->>'usd')::numeric ELSE 0 END), 0)::numeric, 2)::text as day_usd_volume
      FROM offchain.seaport_sale
    `);

    const stats = result.rows[0] as StatsResult;

    return {
      volume: {
        total: {
          eth: stats.total_eth_volume || "0",
          usd: stats.total_usd_volume || "0",
        },
        sixMonth: {
          eth: stats.six_month_eth_volume || "0",
          usd: stats.six_month_usd_volume || "0",
        },
        month: {
          eth: stats.month_eth_volume || "0",
          usd: stats.month_usd_volume || "0",
        },
        day: {
          eth: stats.day_eth_volume || "0",
          usd: stats.day_usd_volume || "0",
        },
      },
      count: {
        total: Number(stats.total_count) || 0,
        sixMonth: Number(stats.six_month_count) || 0,
        month: Number(stats.month_count) || 0,
        day: Number(stats.day_count) || 0,
      },
    };
  }
}

// Singleton instance
export const importSalesService = new ImportSalesService();
