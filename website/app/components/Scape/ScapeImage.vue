<template>
  <img
    ref="imgRef"
    class="scape-image"
    :class="{ loaded }"
    :src="imageUrl"
    :alt="`Scape ${id}`"
    :style="{ aspectRatio }"
    @load="handleLoad"
  />
</template>

<script setup lang="ts">
import type { PropType } from "vue";

const emit = defineEmits<{
  (event: "loaded"): void;
}>();

const props = defineProps({
  id: {
    type: [String, Number, BigInt] as PropType<string | number | bigint>,
    required: true,
  },
  scapeCount: {
    type: Number,
    default: 1,
  },
});

const imageUrl = computed(() => `https://cdn.scapes.xyz/scapes/sm/${props.id}.png`);
const aspectRatio = computed(() => `${3 * props.scapeCount}/1`);
const loaded = ref(false);
const imgRef = ref<HTMLImageElement>();

const handleLoad = () => {
  loaded.value = true;
  emit("loaded");
};

onMounted(() => {
  if (imgRef.value?.complete) {
    handleLoad();
  }
});
</script>

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
