import type { Gallery27BidsResponse } from '~/types/gallery27'

export const useGallery27Bids = (tokenId: Ref<string | number | undefined>) => {
  const runtimeConfig = useRuntimeConfig()

  const asyncKey = computed(
    () => `gallery27-bids-${tokenId.value ?? 'unknown'}`,
  )

  return useAsyncData(
    asyncKey,
    async () => {
      if (!tokenId.value) return null
      const baseUrl = runtimeConfig.public.apiUrl.replace(/\/$/, '')
      return await $fetch<Gallery27BidsResponse>(
        `${baseUrl}/gallery27/${tokenId.value}/bids`,
      )
    },
    { watch: [tokenId] },
  )
}
