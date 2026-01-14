<script setup lang="ts">
import type { Gallery27Image } from "~/types/gallery27";

const CDN_BASE = "https://cdn.scapes.xyz";

const props = defineProps<{
  image: Gallery27Image | null;
  alt?: string;
}>();

// Construct image URL - show upscaled version
// - With steps: ${path}/${pad(step, 3)}_upscaled.png
// - Without steps: ${path}_upscaled
const imageUrl = computed(() => {
  if (!props.image?.path) return null;

  // If image has steps, show upscaled step version
  if (props.image.steps && props.image.steps > 0) {
    const finalStep = props.image.steps - 1;
    return `${CDN_BASE}/${props.image.path}/${finalStep.toString().padStart(3, "0")}_upscaled.png`;
  }

  // No steps - show upscaled version
  return `${CDN_BASE}/${props.image.path}_upscaled`;
});
</script>

<template>
  <div class="gallery27-painting">
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="alt || 'Gallery27 Painting'"
      class="gallery27-painting__image"
    />
    <div v-else class="gallery27-painting__placeholder">
      No image available
    </div>
  </div>
</template>

<style scoped>
.gallery27-painting {
  width: 100%;
  aspect-ratio: 1;
  background: var(--gray-z-1);
  border-radius: var(--spacer-xs);
  overflow: hidden;
}

.gallery27-painting__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery27-painting__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
}
</style>
