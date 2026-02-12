type FeaturedScapeResponse = {
  data: {
    tokenId: string
    price: string | null
  } | null
}

export const useFeaturedScape = (address: MaybeRefOrGetter<string | null>) => {
  const runtimeConfig = useRuntimeConfig()

  const asyncKey = computed(
    () => `featured-scape-${toValue(address)?.toLowerCase() ?? 'none'}`,
  )

  const { data, status } = useAsyncData<FeaturedScapeResponse>(
    asyncKey,
    async () => {
      const addr = toValue(address)
      if (!addr) return { data: null }

      const baseUrl = runtimeConfig.public.apiUrl.replace(/\/$/, '')
      return await $fetch<FeaturedScapeResponse>(
        `${baseUrl}/profiles/${addr}/featured-scape`,
      )
    },
    {
      watch: [() => toValue(address)],
    },
  )

  const bannerImageUrl = computed(() => {
    const tokenId = data.value?.data?.tokenId
    if (!tokenId) return null
    return `https://cdn.scapes.xyz/scapes/sm/${tokenId}.png`
  })

  return {
    bannerImageUrl,
    isPending: computed(() => status.value === 'pending'),
  }
}
