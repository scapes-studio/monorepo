<script setup lang="ts">
import type { PropType } from "vue";

const props = defineProps({
  id: {
    type: [String, Number, BigInt] as PropType<string | number | bigint>,
    required: true,
  },
});

const imageUrl = computed(() => `https://cdn.scapes.xyz/scapes/sm/${props.id}.png`);
</script>

<template>
  <img class="scape-image" :src="imageUrl" :alt="`Scape ${id}`" />
</template>

<style scoped>
.scape-image {
  width: 100%;
  display: block;
  background: var(--gray-z-1);
  image-rendering: pixelated;
}
</style>
