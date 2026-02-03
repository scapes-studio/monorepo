<template>
  <div class="activity-filters">
    <FormCheckbox v-model="filters.transfers">
      Transfers
    </FormCheckbox>
    <FormCheckbox v-model="filters.sales">
      Sales
    </FormCheckbox>
    <FormCheckbox v-model="filters.listings">
      Listings
    </FormCheckbox>
  </div>
</template>

<script setup lang="ts">
import type { ActivityFilters } from "~/types/activity";

const filters = defineModel<ActivityFilters>({ required: true });
</script>

<style scoped>
.activity-filters {
  display: flex;
  gap: var(--spacer);
  flex-wrap: wrap;
  height: var(--scape-height);
  justify-content: space-evenly;
  background: var(--background);
  font-size: var(--font-sm);
}
</style>
