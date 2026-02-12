export const useMergePreview = (tokenId: Ref<bigint>) => {
  const previewUrl = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const revokeUrl = () => {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
  }

  const fetchPreview = async () => {
    if (tokenId.value <= 10_000n) {
      revokeUrl()
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/scapes/${tokenId.value}/image`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const blob = await response.blob()
      revokeUrl()
      previewUrl.value = URL.createObjectURL(blob)
    } catch (e) {
      error.value =
        e instanceof Error ? e : new Error('Failed to fetch preview')
      revokeUrl()
    } finally {
      isLoading.value = false
    }
  }

  watch(tokenId, fetchPreview, { immediate: true })
  onUnmounted(revokeUrl)

  return {
    previewUrl,
    isLoading,
    error,
    refetch: fetchPreview,
  }
}
