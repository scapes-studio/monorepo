import type { Gallery27OwnedScapesResponse } from "~/types/gallery27";

export const use27YScapesByOwner = (owner: Ref<string | null | undefined>) => {
  const runtimeConfig = useRuntimeConfig();

  const asyncKey = computed(() => `27y-scapes-by-owner-${owner.value?.toLowerCase() ?? "unknown"}`);

  return useAsyncData(
    asyncKey,
    async () => {
      if (!owner.value) return null;
      const baseUrl = runtimeConfig.public.apiUrl.replace(/\/$/, "");
      return await $fetch<Gallery27OwnedScapesResponse>(`${baseUrl}/profiles/${owner.value}/27y-scapes`);
    },
    { watch: [owner] },
  );
};
