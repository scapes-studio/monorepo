<script setup lang="ts">
import type { ScapeRecord } from "~/composables/useScapesByOwner";

type ScapeWithPrice = ScapeRecord & {
  price?: bigint | null;
};

defineProps<{ scapes: ScapeWithPrice[] }>();
</script>

<template>
  <div class="scapes-grid">
    <ScapesGridItem
      v-for="scape in scapes"
      :key="`${scape.id}`"
      :scape="scape"
      :price="scape.price ?? null"
    />
  </div>
</template>

<style scoped>
.scapes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  gap: var(--spacer-sm);
}
</style>
