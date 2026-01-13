<script setup lang="ts">
import type { ActivityFilters } from "~/types/activity";

const filters = defineModel<ActivityFilters>({ required: true });
</script>

<template>
  <div class="activity-filters">
    <label class="activity-filters__toggle">
      <input v-model="filters.transfers" type="checkbox" />
      Transfers
    </label>
    <label class="activity-filters__toggle">
      <input v-model="filters.sales" type="checkbox" />
      Sales
    </label>
    <label class="activity-filters__toggle">
      <input v-model="filters.listings" type="checkbox" />
      Listings
    </label>
    <label class="activity-filters__toggle">
      <input v-model="filters.offers" type="checkbox" />
      Offers
    </label>
  </div>
</template>

<style scoped>
.activity-filters {
  display: flex;
  gap: var(--spacer);
  flex-wrap: wrap;
}

.activity-filters__toggle {
  display: flex;
  gap: var(--spacer-xs);
  align-items: center;
  font-size: var(--font-sm);
  cursor: pointer;
}

.activity-filters__toggle input {
  cursor: pointer;
}
</style>
