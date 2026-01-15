import type { Gallery27OwnedScapesResponse } from "~/types/gallery27";

export const useGallery27ScapesByOwner = (owner: Ref<string | null | undefined>) => {
  const runtimeConfig = useRuntimeConfig();

  const asyncKey = computed(() => `gallery27-scapes-by-owner-${owner.value?.toLowerCase() ?? "unknown"}`);

  return useAsyncData(
    asyncKey,
    async () => {
      if (!owner.value) return null;
      const baseUrl = runtimeConfig.public.apiUrl.replace(/\/$/, "");
      return await $fetch<Gallery27OwnedScapesResponse>(`${baseUrl}/profiles/${owner.value}/gallery27-scapes`);
    },
    { watch: [owner] },
  );
};
