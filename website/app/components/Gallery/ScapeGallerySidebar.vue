<template>
  <aside class="sidebar">
    <div class="sidebar__scroll">
      <GalleryTraitGroup v-for="group in TRAITS" :key="group.name" :group="group" :counts="traitCounts[group.name]"
        :loading="countsLoading" :selected-traits="selectedTraits" @select="handleTraitSelect" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { TRAITS, type TraitCounts } from "~/data/traits"

const props = defineProps<{
  selectedTraits: string[]
  traitCounts: TraitCounts
  countsLoading: boolean
}>()

const emit = defineEmits<{
  "update-traits": [traits: string[]]
}>()

const handleTraitSelect = (trait: string) => {
  let newTraits = [...props.selectedTraits]
  const [category] = trait.split("=")

  if (props.selectedTraits.includes(trait)) {
    // Deselect
    newTraits = newTraits.filter((t) => t !== trait)
  } else {
    // Remove any existing selection in same category (single-select per category)
    newTraits = newTraits.filter((t) => !t.startsWith(`${category}=`))
    newTraits.push(trait)
  }

  emit("update-traits", newTraits)
}
</script>

<style scoped>
.sidebar {
  display: none;
}

@media (min-width: 48rem) {
  .sidebar {
    display: block;
    position: sticky;
    top: 0;
    background: var(--background);
  }
}

.sidebar__scroll {
  position: sticky;
  top: var(--spacer);
  max-height: calc(100vh - 2 * var(--spacer));
  overflow-y: auto;

  .trait-group {
    background: var(--background);
  }
}
</style>
