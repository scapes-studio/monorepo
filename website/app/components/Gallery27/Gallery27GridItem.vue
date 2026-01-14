<script setup lang="ts">
import type { Gallery27OwnedScape } from "~/types/gallery27";

const CDN_BASE = "https://cdn.scapes.xyz";

const props = defineProps<{
  scape: Gallery27OwnedScape;
}>();

const formattedDate = computed(() => {
  if (!props.scape.date) return null;
  return new Date(props.scape.date * 1000).toLocaleDateString();
});

// Construct image URL
// - With step: show specific step image
// - Without step: show base path (no suffix)
const imageUrl = computed(() => {
  if (!props.scape.imagePath) return null;
  if (props.scape.step !== null) {
    return `${CDN_BASE}/${props.scape.imagePath}/steps/${props.scape.step.toString().padStart(3, "0")}.png`;
  }
  return `${CDN_BASE}/${props.scape.imagePath}`;
});
</script>

<template>
  <NuxtLink class="gallery27-grid-item" :to="`/gallery27/${scape.tokenId}`">
    <div class="gallery27-grid-item__image">
      <img v-if="imageUrl" :src="imageUrl" :alt="`Day ${scape.tokenId}`" />
      <div v-else class="gallery27-grid-item__placeholder">No image</div>
    </div>
    <div class="gallery27-grid-item__info">
      <span class="gallery27-grid-item__day">Day {{ scape.tokenId }}</span>
      <span v-if="formattedDate" class="gallery27-grid-item__date">{{ formattedDate }}</span>
    </div>
  </NuxtLink>
</template>

<style scoped>
.gallery27-grid-item {
  display: block;
  text-decoration: none;
  color: inherit;
}

.gallery27-grid-item__image {
  aspect-ratio: 1;
  border-radius: var(--spacer-xs);
  overflow: hidden;
  background: var(--gray-z-1);
}

.gallery27-grid-item__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery27-grid-item__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
}

.gallery27-grid-item__info {
  margin-top: var(--spacer-xs);
  text-align: center;
}

.gallery27-grid-item__day {
  display: block;
  font-weight: var(--font-weight-bold);
}

.gallery27-grid-item__date {
  display: block;
  font-size: var(--font-sm);
  color: var(--muted);
}
</style>
