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
  background: rgba(0, 0, 0, 0.02);
  border-radius: 0.5rem;
}

.attributes__title {
  margin: 0 0 var(--spacer);
  font-size: 1.125rem;
}

.attributes__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.attributes__item {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  background: white;
  border-radius: 0.375rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.attributes__trait {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.attributes__value {
  font-weight: 600;
  margin-top: 0.25rem;
}
</style>
