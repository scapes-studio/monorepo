import type { Gallery27ScapeDetail } from '~/types/gallery27'

export const useGallery27Scape = (
  tokenId: Ref<string | number | undefined>,
) => {
  const runtimeConfig = useRuntimeConfig()

  const asyncKey = computed(
    () => `gallery27-scape-${tokenId.value ?? 'unknown'}`,
  )

  return useAsyncData(
    asyncKey,
    async () => {
      if (!tokenId.value) return null
      const baseUrl = runtimeConfig.public.apiUrl.replace(/\/$/, '')
      return await $fetch<Gallery27ScapeDetail>(
        `${baseUrl}/gallery27/${tokenId.value}`,
      )
    },
    { watch: [tokenId] },
  )
}
