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

<template>
  <section v-if="hasAttributes" class="attributes">
    <h2 class="attributes__title">Attributes</h2>
    <ul class="attributes__list">
      <li v-for="attr in attributeList" :key="attr.trait_type" class="attributes__item">
        <span class="attributes__trait">{{ attr.trait_type }}</span>
        <span class="attributes__value">{{ attr.value }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.attributes {
  padding: var(--spacer);
  background: var(--gray-z-1);
  border-radius: var(--size-2);
}

.attributes__title {
  margin: 0 0 var(--spacer);
  font-size: var(--font-lg);
}

.attributes__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: var(--size-3);
  list-style: none;
  margin: 0;
  padding: 0;
}

.attributes__item {
  display: flex;
  flex-direction: column;
  padding: var(--size-3);
  background: var(--background);
  border-radius: var(--size-1);
  border: var(--border);
}

.attributes__trait {
  font-size: var(--font-xs);
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing);
}

.attributes__value {
  font-weight: var(--font-weight-bold);
  margin-top: var(--spacer-xs);
}
</style>
