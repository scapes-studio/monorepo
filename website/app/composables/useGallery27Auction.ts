import type { Gallery27AuctionState } from "~/types/gallery27";

export const useGallery27Auction = (tokenId: Ref<string | number | undefined>) => {
  const runtimeConfig = useRuntimeConfig();

  const asyncKey = computed(() => `gallery27-auction-${tokenId.value ?? "unknown"}`);

  const { data, pending, error, refresh } = useAsyncData(
    asyncKey,
    async () => {
      if (!tokenId.value) return null;
      const baseUrl = runtimeConfig.public.apiUrl.replace(/\/$/, "");
      return await $fetch<Gallery27AuctionState>(`${baseUrl}/gallery27/${tokenId.value}/auction`);
    },
    { watch: [tokenId] },
  );

  // Reactive clock (updates every second on client) so isActive
  // flips to false the moment the auction end time passes.
  const now = ref(Math.floor(Date.now() / 1000));
  let tickInterval: ReturnType<typeof setInterval> | null = null;

  if (import.meta.client) {
    tickInterval = setInterval(() => {
      now.value = Math.floor(Date.now() / 1000);
    }, 1000);
  }

  // Check if auction is active (started, not yet ended, not settled)
  const isActive = computed(() => {
    if (!data.value) return false;
    if (data.value.settled) return false;
    if (!data.value.endTimestamp) return false;
    // Auction hasn't started yet
    if (data.value.startTimestamp && now.value < data.value.startTimestamp) return false;
    return now.value < data.value.endTimestamp;
  });

  // Poll interval (13 seconds like the old site)
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const startPolling = () => {
    if (import.meta.server) return;
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
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
  });

  return {
    data,
    pending,
    error,
    refresh,
    isActive,
  };
};
