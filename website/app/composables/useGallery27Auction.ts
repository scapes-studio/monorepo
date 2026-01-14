import type { Gallery27AuctionState } from "~/types/gallery27";

export const useGallery27Auction = (tokenId: Ref<string | number | undefined>) => {
  const runtimeConfig = useRuntimeConfig();

  const asyncKey = computed(() => `gallery27-auction-${tokenId.value ?? "unknown"}`);

  const { data, pending, error, refresh } = useAsyncData(
    asyncKey,
    async () => {
      if (!tokenId.value) return null;
      const baseUrl = runtimeConfig.public.apiUrl.replace(/\/$/, "");
      return await $fetch<Gallery27AuctionState>(`${baseUrl}/27y/${tokenId.value}/auction`);
    },
    { watch: [tokenId] },
  );

  // Check if auction is active
  const isActive = computed(() => {
    if (!data.value?.endTimestamp) return false;
    const now = Math.floor(Date.now() / 1000);
    return now < data.value.endTimestamp && !data.value.settled;
  });

  // Poll interval (13 seconds like the old site)
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const startPolling = () => {
    if (pollInterval) return;
    pollInterval = setInterval(() => {
      if (isActive.value) {
        refresh();
      }
    }, 13000);
  };

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };

  // Auto-start/stop polling based on auction state
  watch(isActive, (active) => {
    if (active) {
      startPolling();
    } else {
      stopPolling();
    }
  }, { immediate: true });

  // Clean up on unmount
  onUnmounted(() => {
    stopPolling();
  });

  return {
    data,
    pending,
    error,
    refresh,
    isActive,
  };
};
