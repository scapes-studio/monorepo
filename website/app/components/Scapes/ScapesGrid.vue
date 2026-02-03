<template>
  <div class="scapes-grid">
    <template v-for="scape in scapes" :key="`${scape.id}`">
      <div v-if="hasItemSlot" class="scapes-grid__item" :style="spanStyle(scape)">
        <slot name="item" :scape="scape" :column-span="scapeSpan(scape).columnSpan"
          :scape-count="scapeSpan(scape).scapeCount" />
      </div>
      <ScapesGridItem v-else :scape="scape" :price="scape.price ?? null" :is-seaport="scape.source === 'seaport'"
        :columns="scapeSpan(scape).columnSpan" :scape-count="scapeSpan(scape).scapeCount" :double-height="showPrices" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useSlots } from "vue";

import type { ScapeRecord } from "~/composables/useScapesByOwner";
import type { ListingSource } from "~/types/listings";

type ScapeWithPrice = ScapeRecord & {
  price?: bigint | null;
  source?: ListingSource;
};

const props = defineProps<{
  scapes: ScapeWithPrice[];
  columns?: number;
  showPrices?: boolean;
}>();

const slots = useSlots();
const hasItemSlot = computed(() => !!slots.item);

function scapeSpan(scape: ScapeWithPrice) {
  const count = mergeScapeCount(scape.id);
  const maxCols = props.columns ?? Infinity;
  return {
    scapeCount: count,
    columnSpan: Math.min(count, maxCols),
  };
}

const spanStyle = (scape: ScapeWithPrice) => {
  const span = scapeSpan(scape).columnSpan;
  return span > 1 ? { gridColumn: `span ${span}` } : undefined;
};
</script>

<style scoped>
.scapes-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), var(--scape-width));
  gap: var(--grid-gutter);
  grid-auto-flow: dense;
}

.scapes-grid__item {
  display: block;
}
</style>
