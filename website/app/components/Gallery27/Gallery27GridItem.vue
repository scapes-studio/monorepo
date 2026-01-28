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

<script setup lang="ts">
import type { Gallery27OwnedScape, Gallery27ListItem, Gallery27ClaimableScape } from "~/types/gallery27";

type ScapeItem = Gallery27OwnedScape | Gallery27ListItem | Gallery27ClaimableScape;

const props = defineProps<{
  scape: ScapeItem;
}>();

const formattedDate = computed(() => {
  if (!props.scape.date) return null;
  return new Date(props.scape.date * 1000).toLocaleDateString();
});

const CDN_BASE = "https://cdn.scapes.xyz";

const imageUrl = computed(() => {
  const scape = props.scape;

  // Priority 1: Winning/accepted image
  if (scape.imagePath) {
    return `${CDN_BASE}/${scape.imagePath}`;
  }

  // Priority 2: Initial render (only available on Gallery27ListItem)
  if ("initialRenderPath" in scape && scape.initialRenderPath) {
    return `${CDN_BASE}/${scape.initialRenderPath}`;
  }

  // Priority 3: Parent PunkScape image
  if (scape.scapeId) {
    return `${CDN_BASE}/scapes/sm/${scape.scapeId}.png`;
  }

  return null;
});
</script>

<style scoped>
.gallery27-grid-item {
  display: block;
  text-decoration: none;
  color: inherit;
}

.gallery27-grid-item__image {
  aspect-ratio: 3/2;
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
