<script setup lang="ts">
import type { ScapeRecord } from "~/composables/useScapesByOwner";

defineProps<{ scapes: ScapeRecord[] }>();
</script>

<template>
  <div class="scapes-grid">
    <ScapesGridItem v-for="scape in scapes" :key="scape.id" :scape="scape" />
  </div>
</template>

<style scoped>
.scapes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  gap: var(--spacer-sm);
}
</style>
