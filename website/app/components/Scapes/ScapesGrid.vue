<template>
  <div class="scapes-grid">
    <ScapesGridItem v-for="scape in scapes" :key="`${scape.id}`" :scape="scape" :price="scape.price ?? null"
      :is-seaport="scape.source === 'seaport'" :columns="scapeSpan(scape).columnSpan"
      :scape-count="scapeSpan(scape).scapeCount" />
  </div>
</template>

<script setup lang="ts">
import type { ScapeRecord } from "~/composables/useScapesByOwner";
import type { ListingSource } from "~/composables/useListedScapes";

type ScapeWithPrice = ScapeRecord & {
  price?: bigint | null;
  source?: ListingSource;
};

const props = defineProps<{
  scapes: ScapeWithPrice[];
  columns?: number;
}>();

function scapeSpan(scape: ScapeWithPrice) {
  const count = mergeScapeCount(scape.id);
  const maxCols = props.columns ?? Infinity;
  return {
    scapeCount: count,
    columnSpan: Math.min(count, maxCols),
  };
}
</script>

<style scoped>
.scapes-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), var(--scape-width));
  gap: var(--grid-gutter);
  grid-auto-flow: dense;
}
</style>
