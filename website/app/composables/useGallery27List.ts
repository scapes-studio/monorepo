import type { Gallery27ListItem, Gallery27ListResponse } from "~/types/gallery27";

const PAGE_SIZE = 50;

export const useGallery27List = () => {
  const runtimeConfig = useRuntimeConfig();
  const apiUrl = runtimeConfig.public.apiUrl.replace(/\/$/, "");

  const additionalScapes = ref<Gallery27ListItem[]>([]);
  const loadMoreLoading = ref(false);
  const loadMoreError = ref<Error | null>(null);
  const loadMoreHasMore = ref<boolean | null>(null);

  const fetchScapes = async (offset: number, limit: number) => {
    const response = await $fetch<Gallery27ListResponse>(`${apiUrl}/27y/all`, {
      query: { limit, offset },
    });
    return response;
  };

  const { data, pending, error: asyncError } = useAsyncData(
    "gallery27-list",
    () => fetchScapes(0, PAGE_SIZE),
    { server: true },
  );

  const scapes = computed(() => {
    const initial = data.value?.scapes ?? [];
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
      const currentOffset = (data.value?.scapes.length ?? 0) + additionalScapes.value.length;
      const result = await fetchScapes(currentOffset, PAGE_SIZE);
      additionalScapes.value.push(...result.scapes);
      loadMoreHasMore.value = result.hasMore;
    } catch (err) {
      loadMoreError.value = err instanceof Error ? err : new Error("Failed to load scapes");
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
