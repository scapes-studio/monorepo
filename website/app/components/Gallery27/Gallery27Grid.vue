<script setup lang="ts">
import type { Gallery27OwnedScape, Gallery27ListItem } from "~/types/gallery27";

defineProps<{
  scapes: (Gallery27OwnedScape | Gallery27ListItem)[];
}>();
</script>

<template>
  <div class="gallery27-grid">
    <Gallery27GridItem v-for="scape in scapes" :key="scape.tokenId" :scape="scape" />
  </div>
</template>

<style scoped>
.gallery27-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--spacer);
}
</style>
