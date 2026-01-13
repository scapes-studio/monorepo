export type ListingSource = "onchain" | "seaport";

export type ListedScape = {
  id: bigint;
  owner: `0x${string}`;
  attributes: unknown;
  rarity: number | null;
  price: bigint;
  source: ListingSource;
};

export type SortOption = "price-asc" | "price-desc" | "recent";

type ListingsResponse = {
  data: Array<{
    id: string;
    owner: string;
    attributes: unknown;
    rarity: number | null;
    price: string;
    source: ListingSource;
  }>;
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

const PAGE_SIZE = 100;

export const useListedScapes = (
  sortBy: Ref<SortOption> = ref("price-asc"),
  includeSeaport: Ref<boolean> = ref(false),
) => {
  const runtimeConfig = useRuntimeConfig();
  const apiUrl = runtimeConfig.public.apiUrl;

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

  const fetchListings = async (offset: number, limit: number) => {
    const sort = sortBy.value === "recent" ? "recent" : "price";
    const order = sortBy.value === "price-desc" ? "desc" : "asc";

    const response = await $fetch<ListingsResponse>(`${apiUrl}/listings`, {
      query: {
        limit,
        offset,
        sort,
        order,
        includeSeaport: includeSeaport.value,
      },
    });

    return {
      listings: response.data.map((r) => ({
        id: BigInt(r.id),
        owner: r.owner as `0x${string}`,
        attributes: r.attributes,
        rarity: r.rarity,
        price: BigInt(r.price),
        source: r.source,
      })),
      total: response.meta.total,
      hasMore: response.meta.hasMore,
    };
  };

  const asyncKey = computed(() => `listed-scapes-${sortBy.value}-${includeSeaport.value}`);
  const { data, pending, error: asyncError } = useAsyncData(
    asyncKey,
    () => fetchListings(0, PAGE_SIZE),
    {
      watch: [sortBy, includeSeaport],
      server: true,
    },
  );

  watch([sortBy, includeSeaport], () => {
    reset();
  });

  const scapes = computed(() => {
    const initial = data.value?.listings ?? [];
    return [...initial, ...additionalScapes.value];
  });

  const total = computed(() => data.value?.total ?? null);

  const hasMore = computed(() => {
    if (loadMoreHasMore.value !== null) {
      return loadMoreHasMore.value;
    }
    return data.value?.hasMore ?? false;
  });

  const error = computed(() => loadMoreError.value ?? asyncError.value ?? null);

  const loadMore = async () => {
    if (loadMoreLoading.value || pending.value || !hasMore.value) return;
    loadMoreLoading.value = true;
    loadMoreError.value = null;

    try {
      const currentOffset = (data.value?.listings.length ?? 0) + additionalScapes.value.length;
      const result = await fetchListings(currentOffset, PAGE_SIZE);
      additionalScapes.value.push(...result.listings);
      loadMoreHasMore.value = result.hasMore;
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
