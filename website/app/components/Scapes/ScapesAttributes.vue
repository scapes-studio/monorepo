<template>
  <section v-if="hasAttributes" class="attributes">
    <ul class="attributes__list">
      <GridArea v-for="attr in attributeList" :key="attr.trait_type" :rows="1" :width="1" tag="li"
        class="attributes__item">
        <span class="attributes__trait">{{ attr.trait_type }}</span>
        <NuxtLink v-if="isDateAttribute(attr) && gallery27TokenId" :to="`/gallery27/${gallery27TokenId}`"
          class="attributes__value attributes__value--link">
          {{ formatValue(attr) }}
        </NuxtLink>
        <span v-else class="attributes__value">{{ formatValue(attr) }}</span>
      </GridArea>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { DateTime } from 'luxon'

const props = defineProps<{
  attributes: unknown;
  gallery27TokenId?: number | null;
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

const { gallery27TokenId } = toRefs(props);

function isDateAttribute(attr: AttributeEntry): boolean {
  return attr.trait_type === 'date' && typeof attr.value === 'number';
}

function formatValue(attr: AttributeEntry): string | number {
  if (attr.trait_type === 'date' && typeof attr.value === 'number') {
    return DateTime.fromSeconds(attr.value).toLocaleString(DateTime.DATE_MED);
  }
  return attr.value;
}
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attributes__value--link {
  color: inherit;
  text-decoration: none;
}

.attributes__value--link:hover {
  text-decoration: underline;
}
</style>
