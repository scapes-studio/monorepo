<script setup lang="ts">
import type { ScapeRecord } from "~/composables/useScapesByOwner";
import type { ListingSource } from "~/composables/useListedScapes";

type ScapeWithPrice = ScapeRecord & {
  price?: bigint | null;
  source?: ListingSource;
};

defineProps<{ scapes: ScapeWithPrice[] }>();
</script>

<template>
  <div class="scapes-grid">
    <ScapesGridItem v-for="scape in scapes" :key="`${scape.id}`" :scape="scape" :price="scape.price ?? null"
      :is-seaport="scape.source === 'seaport'" />
  </div>
</template>

<style scoped>
.scapes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  gap: 0;
}
</style>
