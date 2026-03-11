<template>
  <div class="onedaypunk-embed">
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="metadata?.name || `OneDayPunk #${id}`"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'embed',
})

const route = useRoute()
const config = useRuntimeConfig()

const id = computed(() => route.params.id as string)

const METADATA_CID = 'QmVtbahSw69pScLgwGUMTnVPR6FkVMeH5ntQimkn5bSD6y'

const { data: metadata } = await useFetch<{
  name: string
  image: string
}>(
  () => `${config.public.ipfsGateway}${METADATA_CID}/${id.value}/metadata.json`,
)

const imageUrl = computed(() => {
  if (!metadata.value?.image) return null
  const ipfsHash = metadata.value.image.replace('ipfs://', '')
  return `${config.public.ipfsGateway}${ipfsHash}`
})

useHead({
  title: computed(() => metadata.value?.name || `OneDayPunk #${id.value}`),
})
</script>

<style scoped>
.onedaypunk-embed {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100dvh;
}

.onedaypunk-embed img {
  max-width: 100%;
  max-height: 100%;
  image-rendering: pixelated;
}
</style>
