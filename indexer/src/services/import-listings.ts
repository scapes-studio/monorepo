import { eq, sql } from "drizzle-orm";
import { getOffchainDb } from "./database";
import { seaportListing } from "../../offchain.schema";
import { openseaService, type Listing } from "./opensea";

// Listing collections configuration
export const LISTING_COLLECTIONS = {
  scapes: {
    slug: "scapes",
    contract: "0xb7def63A9040ad5dC431afF79045617922f4023A",
  },
  "twenty-seven-year-scapes": {
    slug: "twenty-seven-year-scapes",
    contract: "0x5D3d01a47a62BfF2eB86eBA75F3A23c38dC22fBA",
  },
} as const;

export type ListingCollectionSlug = keyof typeof LISTING_COLLECTIONS;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ImportListingsService {
  /**
   * Fetch all listings from OpenSea (paginated)
   */
  private async fetchAllListings({
    slug,
    onProgress,
  }: {
    slug: ListingCollectionSlug;
    onProgress?: (count: number) => void;
  }): Promise<Listing[]> {
    const config = LISTING_COLLECTIONS[slug];
    const allListings: Listing[] = [];
    let continuation: string | undefined;

    do {
      const { listings, continuation: nextContinuation } = await openseaService.getListings({
        slug: config.slug,
        continuation,
      });

      allListings.push(...listings);
      continuation = nextContinuation;

      if (onProgress && listings.length > 0) {
        onProgress(listings.length);
      }

      if (continuation) {
        await delay(750); // Rate limiting
      }
    } while (continuation);

    return allListings;
  }

  /**
   * Import listings with full replacement strategy:
   * 1. Fetch all active listings from OpenSea (/listings/collection/{slug}/all returns only active)
   * 2. Replace all listings in database within a transaction
   */
  async importListings({
    slug,
    onProgress,
  }: {
    slug: ListingCollectionSlug;
    onProgress?: (count: number) => void;
  }): Promise<{ imported: number }> {
    const config = LISTING_COLLECTIONS[slug];
    const db = getOffchainDb();

    console.log(`Fetching active listings from OpenSea for ${slug}...`);

    const allListings = await this.fetchAllListings({ slug, onProgress });

    console.log(`Fetched ${allListings.length} active listings`);

    if (allListings.length === 0) {
      // Clear all listings if none are active - no triggers to disable for offchain tables
      await db.delete(seaportListing).where(eq(seaportListing.slug, config.slug));
      return { imported: 0 };
    }

    // Transform listings for database insertion
    const values = allListings.map((listing) => ({
      slug: config.slug,
      contract: listing.contract.toLowerCase(),
      tokenId: String(listing.tokenId),
      orderHash: listing.orderHash,
      protocolAddress: listing.protocolAddress,
      timestamp: listing.timestamp,
      startDate: listing.startDate,
      expirationDate: listing.expirationDate,
      maker: listing.maker.toLowerCase(),
      taker: listing.taker?.toLowerCase() || null,
      isPrivateListing: listing.isPrivateListing,
      price: listing.price,
    }));

    // Full replacement - no triggers to disable for offchain tables
    // Delete existing listings for this slug
    await db.delete(seaportListing).where(eq(seaportListing.slug, config.slug));

    // Insert new listings in batches (Postgres has param limits)
    const BATCH_SIZE = 500;
    for (let i = 0; i < values.length; i += BATCH_SIZE) {
      const batch = values.slice(i, i + BATCH_SIZE);
      await db.insert(seaportListing).values(batch);
    }

    return { imported: allListings.length };
  }

  /**
   * Get listing stats
   */
  async getListingStats(slug?: ListingCollectionSlug): Promise<{
    total: number;
    priceRange: { minEth: number; maxEth: number; avgEth: number };
  }> {
    const db = getOffchainDb();

    const result = await db.execute(sql`
      SELECT
        COUNT(*) as total,
        MIN((price->>'eth')::numeric) as min_eth,
        MAX((price->>'eth')::numeric) as max_eth,
        AVG((price->>'eth')::numeric) as avg_eth
      FROM ${seaportListing}
      ${slug ? sql`WHERE slug = ${slug}` : sql``}
    `);

    const stats = result.rows[0] as {
      total: string;
      min_eth: string;
      max_eth: string;
      avg_eth: string;
    };

    return {
      total: Number(stats.total) || 0,
      priceRange: {
        minEth: Number(stats.min_eth) || 0,
        maxEth: Number(stats.max_eth) || 0,
        avgEth: Number(stats.avg_eth) || 0,
      },
    };
  }

  /**
   * Delete expired listings (cleanup utility)
   */
  async deleteExpiredListings(): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    const db = getOffchainDb();

    const result = await db.execute(sql`
      DELETE FROM ${seaportListing}
      WHERE expiration_date <= ${now}
      RETURNING order_hash
    `);

    return result.rowCount || 0;
  }
}

// Singleton instance
export const importListingsService = new ImportListingsService();
