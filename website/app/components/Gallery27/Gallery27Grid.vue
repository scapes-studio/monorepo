<template>
  <div class="gallery27-grid">
    <Gallery27GridItem v-for="scape in scapes" :key="scape.tokenId" :scape="scape" />
  </div>
</template>

<script setup lang="ts">
import type { Gallery27OwnedScape, Gallery27ListItem, Gallery27ClaimableScape } from "~/types/gallery27";

defineProps<{
  scapes: (Gallery27OwnedScape | Gallery27ListItem | Gallery27ClaimableScape)[];
}>();
</script>

<style scoped>
.gallery27-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), var(--scape-width));
  gap: var(--grid-gutter);
  justify-content: center;
}
</style>
