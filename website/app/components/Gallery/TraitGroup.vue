<script setup lang="ts">
import type { TraitGroup } from "~/data/traits"

const props = defineProps<{
  group: TraitGroup
  counts: { count: number; values: Record<string, number> } | undefined
  loading: boolean
  selectedTraits: string[]
}>()

const emit = defineEmits<{
  select: [trait: string]
}>()

const isSelected = (value: string) =>
  props.selectedTraits.includes(`${props.group.name}=${value}`)

const getCount = (value: string) => props.counts?.values[value] ?? 0
</script>

<template>
  <div class="trait-group">
    <h2 class="trait-group__header">
      {{ group.name }}
      <span class="trait-group__count">({{ counts?.count ?? 0 }})</span>
    </h2>
    <ul class="trait-group__list">
      <GalleryTraitGroupValue
        v-for="value in group.values"
        :key="value"
        :category="group.name"
        :value="value"
        :count="getCount(value)"
        :selected="isSelected(value)"
        :loading="loading"
        @toggle="emit('select', `${group.name}=${value}`)"
      />
    </ul>
  </div>
</template>

<style scoped>
.trait-group {
  margin-bottom: var(--spacer);
}

.trait-group__header {
  position: sticky;
  top: 0;
  margin: 0 0 var(--spacer-xs);
  padding: var(--spacer-xs) 0;
  background: var(--background);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.trait-group__count {
  font-weight: var(--font-weight-normal);
  color: var(--muted);
}

.trait-group__list {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
