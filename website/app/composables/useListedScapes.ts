import { and, asc, desc, eq, gt, isNull, sql } from "@ponder/client";
import type { ScapeRecord } from "~/composables/useScapesByOwner";

export type ListingSource = "onchain" | "seaport";

export type ListedScape = ScapeRecord & {
  price: bigint;
  source: ListingSource;
};

export type SortOption = "price-asc" | "price-desc" | "recent";

type ListedScapesPayload = {
  total: number;
  scapes: ListedScape[];
};

const PAGE_SIZE = 100;

type FetchOptions = {
  sortBy: SortOption;
  includeSeaport: boolean;
};

export const useListedScapes = (
  sortBy: Ref<SortOption> = ref("price-asc"),
  includeSeaport: Ref<boolean> = ref(false),
) => {
  const client = usePonderClient();

  // Track additional items loaded via loadMore (separate from initial data)
  const additionalScapes = ref<ListedScape[]>([]);
  const loadMoreLoading = ref(false);
  const loadMoreError = ref<Error | null>(null);
  const loadMoreHasMore = ref<boolean | null>(null);

  const reset = () => {
    additionalScapes.value = [];
    loadMoreError.value = null;
    loadMoreHasMore.value = null;
    loadMoreLoading.value = false;
  };

  const activeOfferConditions = and(
    eq(schema.offer.isActive, true),
    isNull(schema.offer.specificBuyer),
  );

  const activeSeaportConditions = (now: number) =>
    and(
      eq(schema.seaportListing.slug, "scapes"),
      eq(schema.seaportListing.isPrivateListing, false),
      gt(schema.seaportListing.expirationDate, now),
    );

  const fetchOnchainScapes = async (startOffset: number, limit: number) => {
    const results = await client.db
      .select({
        id: schema.scape.id,
        owner: schema.scape.owner,
        attributes: schema.scape.attributes,
        rarity: schema.scape.rarity,
        price: schema.offer.price,
      })
      .from(schema.offer)
      .innerJoin(schema.scape, eq(schema.offer.tokenId, schema.scape.id))
      .where(activeOfferConditions)
      .orderBy(asc(schema.offer.price))
      .limit(limit)
      .offset(startOffset);

    return results.map((r) => ({ ...r, source: "onchain" as const }));
  };

  const fetchSeaportScapes = async (startOffset: number, limit: number) => {
    const now = Math.floor(Date.now() / 1000);
    const results = await client.db
      .select({
        id: schema.scape.id,
        owner: schema.scape.owner,
        attributes: schema.scape.attributes,
        rarity: schema.scape.rarity,
        price: schema.seaportListing.price,
      })
      .from(schema.seaportListing)
      .innerJoin(schema.scape, sql`${schema.seaportListing.tokenId} = ${schema.scape.id}`)
      .where(activeSeaportConditions(now))
      .orderBy(asc(schema.seaportListing.timestamp))
      .limit(limit)
      .offset(startOffset);

    return results.map((r) => ({
      ...r,
      price: BigInt((r.price as { wei: string }).wei),
      source: "seaport" as const,
    }));
  };

  const mergeAndSort = (
    onchain: ListedScape[],
    seaport: ListedScape[],
    sort: SortOption,
  ): ListedScape[] => {
    // Dedupe: if same tokenId exists in both, prefer the cheaper one
    const onchainById = new Map(onchain.map((s) => [s.id, s]));
    const merged: ListedScape[] = [];
    const seenIds = new Set<bigint>();

    for (const s of seaport) {
      const onchainListing = onchainById.get(s.id);
      if (onchainListing) {
        merged.push(s.price < onchainListing.price ? s : onchainListing);
        seenIds.add(s.id);
      }
    }

    // Add remaining onchain listings not in seaport
    for (const s of onchain) {
      if (!seenIds.has(s.id)) {
        merged.push(s);
      }
    }

    // Add seaport listings not in onchain
    for (const s of seaport) {
      if (!onchainById.has(s.id)) {
        merged.push(s);
      }
    }

    // Sort the merged results
    switch (sort) {
      case "price-asc":
        return merged.sort((a, b) => (a.price < b.price ? -1 : a.price > b.price ? 1 : 0));
      case "price-desc":
        return merged.sort((a, b) => (a.price > b.price ? -1 : a.price < b.price ? 1 : 0));
      case "recent":
        // For recent, onchain comes first (has updatedAt), then seaport
        return merged.sort((a, b) => {
          if (a.source === "onchain" && b.source === "seaport") return -1;
          if (a.source === "seaport" && b.source === "onchain") return 1;
          return 0;
        });
    }
  };

  const fetchScapes = async (
    startOffset: number,
    options: FetchOptions,
  ): Promise<ListedScape[]> => {
    if (!options.includeSeaport) {
      return fetchOnchainScapes(startOffset, PAGE_SIZE);
    }

    // When including seaport, fetch both and merge
    // For simplicity, fetch more and slice to PAGE_SIZE after deduping
    const [onchain, seaport] = await Promise.all([
      fetchOnchainScapes(0, 1000),
      fetchSeaportScapes(0, 1000),
    ]);

    const merged = mergeAndSort(onchain, seaport, options.sortBy);
    return merged.slice(startOffset, startOffset + PAGE_SIZE);
  };

  const fetchInitial = async (): Promise<ListedScapesPayload> => {
    const options: FetchOptions = {
      sortBy: sortBy.value,
      includeSeaport: includeSeaport.value,
    };

    if (!options.includeSeaport) {
      const [countResult, scapesResult] = await Promise.all([
        client.db.$count(schema.offer, activeOfferConditions),
        fetchOnchainScapes(0, PAGE_SIZE),
      ]);

      return {
        total: countResult ?? 0,
        scapes: scapesResult,
      };
    }

    // When including seaport, fetch all and count after deduping
    const [onchain, seaport] = await Promise.all([
      fetchOnchainScapes(0, 1000),
      fetchSeaportScapes(0, 1000),
    ]);

    const merged = mergeAndSort(onchain, seaport, options.sortBy);

    return {
      total: merged.length,
      scapes: merged.slice(0, PAGE_SIZE),
    };
  };

  const asyncKey = computed(() => `listed-scapes-${sortBy.value}-${includeSeaport.value}`);
  const { data, pending, error: asyncError } = useAsyncData(asyncKey, fetchInitial, {
    watch: [sortBy, includeSeaport],
    server: true,
  });

  // Reset additional state when filters change
  watch([sortBy, includeSeaport], () => {
    reset();
  });

  // Use computed for values derived from data to avoid hydration mismatch
  // Computed is lazy and reads data.value at render time when it's populated
  const scapes = computed(() => {
    const initial = data.value?.scapes ?? [];
    return [...initial, ...additionalScapes.value];
  });

  const total = computed(() => data.value?.total ?? null);

  const hasMore = computed(() => {
    // If we've done a loadMore, use that state
    if (loadMoreHasMore.value !== null) {
      return loadMoreHasMore.value;
    }
    // Otherwise, derive from initial data
    const initialCount = data.value?.scapes.length ?? 0;
    return initialCount >= PAGE_SIZE;
  });

  const error = computed(() => loadMoreError.value ?? asyncError.value ?? null);

  const loadMore = async () => {
    if (loadMoreLoading.value || pending.value || !hasMore.value) return;
    loadMoreLoading.value = true;
    loadMoreError.value = null;

    try {
      const options: FetchOptions = {
        sortBy: sortBy.value,
        includeSeaport: includeSeaport.value,
      };
      const currentOffset = (data.value?.scapes.length ?? 0) + additionalScapes.value.length;
      const result = await fetchScapes(currentOffset, options);
      additionalScapes.value.push(...result);
      if (result.length < PAGE_SIZE) {
        loadMoreHasMore.value = false;
      }
    } catch (err) {
      loadMoreError.value = err instanceof Error ? err : new Error("Failed to load listings");
    } finally {
      loadMoreLoading.value = false;
    }
  };

  const loading = computed(() => pending.value || loadMoreLoading.value);

  return {
    scapes,
    total,
    loading,
    error,
    hasMore,
    loadMore,
    pageSize: PAGE_SIZE,
  };
};
