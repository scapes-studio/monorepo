export const useGallery27ByScape = (scapeId: Ref<string | number | undefined>) => {
  const runtimeConfig = useRuntimeConfig();

  const asyncKey = computed(() => `gallery27-by-scape-${scapeId.value ?? "unknown"}`);

  return useAsyncData(
    asyncKey,
    async () => {
      if (!scapeId.value) return null;
      const baseUrl = runtimeConfig.public.apiUrl.replace(/\/$/, "");
      try {
        const result = await $fetch<{ tokenId: number }>(`${baseUrl}/gallery27/by-scape/${scapeId.value}`);
        return result.tokenId;
      } catch {
        return null;
      }
    },
    { watch: [scapeId] },
  );
};
