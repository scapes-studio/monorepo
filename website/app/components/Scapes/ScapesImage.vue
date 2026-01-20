<script setup lang="ts">
import type { PropType } from "vue";

const props = defineProps({
  id: {
    type: [String, Number, BigInt] as PropType<string | number | bigint>,
    required: true,
  },
});

const imageUrl = computed(() => `https://cdn.scapes.xyz/scapes/sm/${props.id}.png`);
const loaded = ref(false);
</script>

<template>
  <img class="scape-image" :class="{ loaded }" :src="imageUrl" :alt="`Scape ${id}`" loading="lazy" @load="loaded = true" />
</template>

<style scoped>
.scape-image {
  width: 100%;
  aspect-ratio: 3/1;
  display: block;
  background: var(--gray-z-1);
  image-rendering: pixelated;
  opacity: 0;
  transition: opacity var(--speed) ease;
}

.scape-image.loaded {
  opacity: 1;
}
</style>
