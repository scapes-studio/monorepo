import type {
  ActivityItem,
  ActivityFilters,
  ActivityResponse,
  ActivityType,
} from "~/types/activity";

const PAGE_SIZE = 50;

const buildTypesParam = (filters: ActivityFilters): string => {
  const types: ActivityType[] = [];
  if (filters.transfers) types.push("transfer");
  if (filters.sales) types.push("sale");
  if (filters.listings) types.push("listing");
  return types.join(",");
};

export const useActivity = (filters: Ref<ActivityFilters>) => {
  // Track additional items loaded via loadMore (separate from initial data)
  const additionalActivity = ref<ActivityItem[]>([]);
  const loadMoreLoading = ref(false);
  const loadMoreError = ref<Error | null>(null);
  const loadMoreHasMore = ref<boolean | null>(null);

  const reset = () => {
    additionalActivity.value = [];
    loadMoreError.value = null;
    loadMoreHasMore.value = null;
    loadMoreLoading.value = false;
  };

  const fetchInitial = async (): Promise<ActivityResponse | null> => {
    const typesParam = buildTypesParam(filters.value);
    if (!typesParam) {
      return { data: [], meta: { total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false } };
    }

    const $api = useNuxtApp().$api as typeof $fetch;
    const response = await $api<ActivityResponse>(
      `/activity?types=${typesParam}&limit=${PAGE_SIZE}&offset=0`,
    );

    return response;
  };

  const asyncKey = computed(() => {
    const f = filters.value;
    return `activity-${f.transfers}-${f.sales}-${f.listings}`;
  });

  const { data, pending, error: asyncError } = useAsyncData(asyncKey, fetchInitial, {
    watch: [filters],
    server: true,
  });

  // Reset additional state when filters change
  watch(filters, () => {
    reset();
  }, { deep: true });

  // Use computed for values derived from data to avoid hydration mismatch
  // Computed is lazy and reads data.value at render time when it's populated
  const activity = computed(() => {
    const initial = data.value?.data ?? [];
    return [...initial, ...additionalActivity.value];
  });

  const total = computed(() => data.value?.meta.total ?? null);

  const hasMore = computed(() => {
    // If we've done a loadMore, use that state
    if (loadMoreHasMore.value !== null) {
      return loadMoreHasMore.value;
    }
    // Otherwise, derive from initial data
    return data.value?.meta.hasMore ?? true;
  });

  const error = computed(() => loadMoreError.value ?? asyncError.value ?? null);

  const loadMore = async () => {
    if (loadMoreLoading.value || pending.value || !hasMore.value) return;
    loadMoreLoading.value = true;
    loadMoreError.value = null;

    try {
      const typesParam = buildTypesParam(filters.value);
      const $api = useNuxtApp().$api as typeof $fetch;
      const currentOffset = (data.value?.data.length ?? 0) + additionalActivity.value.length;
      const response = await $api<ActivityResponse>(
        `/activity?types=${typesParam}&limit=${PAGE_SIZE}&offset=${currentOffset}`,
      );

      additionalActivity.value.push(...response.data);
      loadMoreHasMore.value = response.meta.hasMore;
    } catch (err) {
      loadMoreError.value = err instanceof Error ? err : new Error("Failed to load activity");
    } finally {
      loadMoreLoading.value = false;
    }
  };

  const loading = computed(() => pending.value || loadMoreLoading.value);

  return {
    activity,
    total,
    loading,
    error,
    hasMore,
    loadMore,
    pageSize: PAGE_SIZE,
  };
};
