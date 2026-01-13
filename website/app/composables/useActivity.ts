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
  if (filters.offers) types.push("offer");
  return types.join(",");
};

export const useActivity = (filters: Ref<ActivityFilters>) => {
  const activity = ref<ActivityItem[]>([]);
  const total = ref<number | null>(null);
  const loadMoreLoading = ref(false);
  const error = ref<Error | null>(null);
  const hasMore = ref(true);
  const offset = ref(0);

  const reset = () => {
    activity.value = [];
    total.value = null;
    error.value = null;
    offset.value = 0;
    hasMore.value = true;
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
    return `activity-${f.transfers}-${f.sales}-${f.listings}-${f.offers}`;
  });

  const { data, pending, error: asyncError } = useAsyncData(asyncKey, fetchInitial, {
    watch: [filters],
    server: true,
  });

  watch(
    data,
    (value) => {
      if (!value) return;
      activity.value = value.data;
      total.value = value.meta.total;
      offset.value = value.data.length;
      hasMore.value = value.meta.hasMore;
    },
    { immediate: true },
  );

  watch(
    asyncError,
    (value) => {
      error.value = value ?? null;
    },
    { immediate: true },
  );

  watch(filters, () => {
    reset();
  }, { deep: true });

  const loadMore = async () => {
    if (loadMoreLoading.value || pending.value || !hasMore.value) return;
    loadMoreLoading.value = true;
    error.value = null;

    try {
      const typesParam = buildTypesParam(filters.value);
      const $api = useNuxtApp().$api as typeof $fetch;
      const response = await $api<ActivityResponse>(
        `/activity?types=${typesParam}&limit=${PAGE_SIZE}&offset=${offset.value}`,
      );

      activity.value.push(...response.data);
      offset.value += response.data.length;
      hasMore.value = response.meta.hasMore;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Failed to load activity");
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
