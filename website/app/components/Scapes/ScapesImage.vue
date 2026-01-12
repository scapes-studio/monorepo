<script setup lang="ts">
const props = defineProps<{ id: string | number }>();

const imageUrl = computed(() => `https://cdn.scapes.xyz/scapes/sm/${props.id}.png`);
</script>

<template>
  <img class="scape-image" :src="imageUrl" :alt="`Scape ${id}`" />
</template>

<style scoped>
.scape-image {
  width: 100%;
  display: block;
  background: rgba(0, 0, 0, 0.05);
  image-rendering: pixelated;
}
</style>
