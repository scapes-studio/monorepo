<template>
  <div class="gallery27-painting">
    <img v-if="imageUrl" :src="imageUrl" :alt="alt || 'Gallery27 Painting'" class="gallery27-painting__image" @error="onImageError" />
    <div v-else class="gallery27-painting__placeholder">
      No image available
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Gallery27Image } from "~/types/gallery27";

const props = defineProps<{
  image: Gallery27Image | null;
  alt?: string;
}>();

const CDN_BASE = "https://cdn.scapes.xyz";
const useBasePath = ref(false);

const imageUrl = computed(() => {
  if (!props.image?.path) return null;

  if (useBasePath.value) {
    return `${CDN_BASE}/${props.image.path}`;
  }
  return `${CDN_BASE}/${props.image.path}_upscaled`;
});

const onImageError = () => {
  if (!useBasePath.value) {
    useBasePath.value = true;
  }
};

watch(() => props.image?.path, () => {
  useBasePath.value = false;
});
</script>

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
