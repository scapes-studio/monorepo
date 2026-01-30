<template>
  <section v-if="hasAttributes" class="attributes">
    <ul class="attributes__list">
      <GridArea v-for="attr in attributeList" :key="attr.trait_type" :rows="1" :width="1" tag="li"
        class="attributes__item">
        <span class="attributes__trait">{{ attr.trait_type }}</span>
        <span class="attributes__value">{{ attr.value }}</span>
      </GridArea>
    </ul>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  attributes: unknown;
}>();

type AttributeEntry = {
  trait_type: string;
  value: string | number;
};

const attributeList = computed(() => {
  if (!props.attributes || !Array.isArray(props.attributes)) {
    return [];
  }
  return props.attributes as AttributeEntry[];
});

const hasAttributes = computed(() => attributeList.value.length > 0);
</script>

<style scoped>
.attributes__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--grid-gutter);
}

.attributes__item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-inline: var(--spacer);
}

.attributes__trait {
  font-size: var(--font-sm);
  color: var(--muted);
  text-transform: uppercase;
}

.attributes__value {
  font-weight: var(--font-weight-bold);
}
</style>
