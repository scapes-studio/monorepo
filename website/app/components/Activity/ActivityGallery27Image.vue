<template>
  <Gallery27GridItem v-if="scape" :scape="scape" />
  <div v-else class="activity-gallery27-image__placeholder" />
</template>

<script setup lang="ts">
import type { Gallery27ListItem } from "~/types/gallery27"

const props = defineProps<{ tokenId: string }>()

const tokenIdRef = computed(() => props.tokenId)
const { data } = useGallery27Scape(tokenIdRef)

const scape = computed<Gallery27ListItem | null>(() => {
  if (!data.value) return null
  return {
    tokenId: data.value.tokenId,
    date: data.value.date,
    scapeId: data.value.scapeId,
    imagePath: data.value.imagePath,
    initialRenderPath: null,
  }
})
</script>

<style scoped>
.gallery27-grid-item {
  aspect-ratio: 3/1;

  &:deep(.gallery27-grid-item__image) {
    aspect-ratio: 3/1;
  }
}

.activity-gallery27-image__placeholder {
  aspect-ratio: 3/1;
  background: var(--gray-z-1);
}
</style>
