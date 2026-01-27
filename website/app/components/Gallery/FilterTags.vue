<template>
  <div v-if="selectedTraits.length > 0" class="filter-tags">
    <button
      v-for="trait in parsedTraits"
      :key="trait.key"
      type="button"
      class="filter-tags__tag"
      @click="removeTrait(trait.key)"
    >
      <img
        :src="getTraitIconUrl(trait.category, trait.value)"
        :alt="trait.value"
        class="filter-tags__icon"
      />
      <span>{{ trait.value }}</span>
      <span class="filter-tags__remove" aria-label="Remove filter">x</span>
    </button>
    <button
      v-if="selectedTraits.length > 1"
      type="button"
      class="filter-tags__clear"
      @click="clearAll"
    >
      Clear all
    </button>
  </div>
</template>

<script setup lang="ts">
import { getTraitIconUrl } from "~/data/traits"

const props = defineProps<{
  selectedTraits: string[]
}>()

const emit = defineEmits<{
  update: [traits: string[]]
}>()

const parsedTraits = computed(() =>
  props.selectedTraits.map((t) => {
    const parts = t.split("=")
    const category = parts[0] ?? ""
    const value = parts[1] ?? ""
    return { category, value, key: t }
  }),
)

const removeTrait = (key: string) => {
  emit(
    "update",
    props.selectedTraits.filter((t) => t !== key),
  )
}

const clearAll = () => {
  emit("update", [])
}
</script>

<style scoped>
.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacer-xs);
  align-items: center;
}

.filter-tags__tag {
  display: flex;
  gap: var(--spacer-xs);
  align-items: center;
  padding: var(--spacer-xs) var(--spacer-sm);
  border: var(--border);
  border-radius: var(--size-10);
  background: var(--background);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: background 0.15s ease;
}

.filter-tags__tag:hover {
  background: var(--gray-z-1);
}

.filter-tags__icon {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: var(--size-2);
  image-rendering: pixelated;
}

.filter-tags__remove {
  margin-left: var(--spacer-xs);
  color: var(--muted);
}

.filter-tags__clear {
  padding: var(--spacer-xs) var(--spacer-sm);
  border: none;
  border-radius: var(--size-10);
  background: transparent;
  font-size: var(--font-sm);
  color: var(--muted);
  cursor: pointer;
}

.filter-tags__clear:hover {
  color: var(--color);
}
</style>
