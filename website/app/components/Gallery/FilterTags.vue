<template>
  <Tags v-if="selectedTraits.length > 0">
    <Tag v-for="trait in parsedTraits" :key="trait.key" dismissable @dismiss="removeTrait(trait.key)">
      <img :src="getTraitIconUrl(trait.category, trait.value)" :alt="trait.value" />
      <span>{{ trait.value }}</span>
    </Tag>
    <Button v-if="selectedTraits.length > 1" type="button" @click="clearAll">
      Clear all
    </Button>
    <div></div>
  </Tags>
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
.tags {
  flex-wrap: nowrap;
  gap: var(--spacer);
  padding-right: var(--spacer);

  &>button {
    font-size: var(--font-sm);

    &+div {
      content: '';
      width: var(--spacer-xs);
      flex-shrink: 0;
    }
  }
}

.tag {
  display: flex;
  flex-shrink: 0;
  gap: calc(var(--spacer-sm) + var(--grid-gutter));

  &:deep(>span) {
    padding: 0;
    display: flex;
    align-items: center;
    gap: var(--spacer-sm);
    flex-shrink: 0;
  }

  &:deep(>button) {
    padding: 0 !important;
  }

  & img {
    inline-size: fit-content;
    height: calc(var(--scape-height) - 2 * var(--spacer) + var(--grid-gutter) * 2);
    aspect-ratio: 1/1;
    image-rendering: pixelated;
    background-color: var(--gray-z-8);
    object-fit: cover;
    flex-shrink: 0;
  }
}
</style>
