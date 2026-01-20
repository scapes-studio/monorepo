<script setup lang="ts">
import type { ScapeRecord } from '~/composables/useScapesByOwner'
import type { ListingSource } from '~/composables/useListedScapes'

type ScapeWithPrice = ScapeRecord & {
  price?: bigint | null
  source?: ListingSource
}

defineProps<{ items: ScapeWithPrice[] }>()
</script>

<template>
  <div class="scapes-grid-row">
    <ScapesGridItem v-for="scape in items" :key="`${scape.id}`" :scape="scape" :price="scape.price ?? null"
      :is-seaport="scape.source === 'seaport'" />
  </div>
</template>

<style scoped>
.scapes-grid-row {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), var(--scape-width));
  gap: var(--grid-gutter);
  padding: 0;
}
</style>
