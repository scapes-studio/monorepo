import type { Gallery27ClaimableScapesResponse } from "~/types/gallery27";

export const useGallery27ClaimableByOwner = (owner: Ref<string | null | undefined>) => {
  const runtimeConfig = useRuntimeConfig();

  const asyncKey = computed(() => `gallery27-claimable-by-owner-${owner.value?.toLowerCase() ?? "unknown"}`);

  return useAsyncData(
    asyncKey,
    async () => {
      if (!owner.value) return null;
      const baseUrl = runtimeConfig.public.apiUrl.replace(/\/$/, "");
      return await $fetch<Gallery27ClaimableScapesResponse>(`${baseUrl}/profiles/${owner.value}/gallery27-claimable`);
    },
    { watch: [owner] },
  );
};
