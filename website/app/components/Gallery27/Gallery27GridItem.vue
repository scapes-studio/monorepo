<template>
  <NuxtLink
    class="gallery27-grid-item"
    :to="`/gallery27/${scape.tokenId}`"
  >
    <div class="gallery27-grid-item__image">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="`Day ${scape.tokenId}`"
      />
      <div
        v-else
        class="gallery27-grid-item__placeholder"
      >
        No image
      </div>
    </div>
    <div
      v-if="!minimal"
      class="gallery27-grid-item__info"
    >
      <span class="gallery27-grid-item__day">#{{ scape.tokenId }}</span>
      <span
        v-if="formattedDate"
        class="gallery27-grid-item__date"
        >{{ formattedDate }}</span
      >
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type {
  Gallery27OwnedScape,
  Gallery27ListItem,
  Gallery27ClaimableScape,
} from '~/types/gallery27'

type ScapeItem =
  | Gallery27OwnedScape
  | Gallery27ListItem
  | Gallery27ClaimableScape

const props = defineProps<{
  scape: ScapeItem
  minimal?: boolean
}>()

const formattedDate = computed(() => {
  if (!props.scape.date) return null
  return new Date(props.scape.date * 1000).toLocaleDateString()
})

const CDN_BASE = 'https://cdn.scapes.xyz'

const imageUrl = computed(() => {
  const scape = props.scape

  // Priority 1: Winning/accepted image
  if (scape.imagePath) {
    return `${CDN_BASE}/${scape.imagePath}`
  }

  // Priority 2: Initial render (only available on Gallery27ListItem)
  if ('initialRenderPath' in scape && scape.initialRenderPath) {
    return `${CDN_BASE}/${scape.initialRenderPath}`
  }

  // Priority 3: Parent PunkScape image
  if (scape.scapeId) {
    return `${CDN_BASE}/scapes/sm/${scape.scapeId}.png`
  }

  return null
})
</script>

<style scoped>
.gallery27-grid-item {
  --height: calc(var(--scape-height) * 2 + var(--grid-gutter));
  --image-height: calc(var(--scape-height) + var(--scape-height)/2);

  display: block;
  text-decoration: none;
  color: inherit;
  width: var(--scape-width);
  height: var(--height);
  box-shadow: var(--grid-shadow);
}

.gallery27-grid-item__image {
  width: var(--scape-width);
  height: var(--image-height);
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
  display: flex;
  font-size: var(--font-sm);
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--spacer-sm);
  height: calc(var(--height) - var(--image-height));

  & > * {
    display: block;
  }
}

.gallery27-grid-item__day {
  display: block;
}

.gallery27-grid-item__date {
  display: block;
  color: var(--muted);
}
</style>
