<template>
  <NuxtLink class="scape-link" :class="{ 'scape-link--tall': doubleHeight }" :to="`/scapes/${scape.id}`"
    :style="spanStyle">
    <ScapeImage :id="scape.id" :scape-count="scapeCount ?? 1" />
    <div v-if="formattedPrice" class="scape-link__price">
      {{ formattedPrice }} ETH
      <span v-if="isSeaport" class="scape-link__badge">OpenSea</span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { ScapeRecord } from "~/composables/useScapesByOwner";

const props = defineProps<{
  scape: ScapeRecord;
  price?: bigint | null;
  isSeaport?: boolean;
  columns?: number;
  scapeCount?: number;
  doubleHeight?: boolean;
}>();

const formattedPrice = computed(() => {
  if (!props.price) return null;
  return formatETH(Number(props.price) / 1e18);
});

const spanStyle = computed(() => {
  const cols = props.columns ?? 1;
  return cols > 1 ? { gridColumn: `span ${cols}` } : undefined;
});
</script>

<style scoped>
.scape-link {
  display: block;
  text-decoration: none;
  color: inherit;
  container-type: inline-size;
  content-visibility: auto;
  background: var(--background);

  img {
    background: var(--grid-color);
    box-shadow: 0 0 0 calc(100cqw/72) var(--grid-color);
    object-fit: contain;
  }

  .scape-link__price {
    margin-top: var(--spacer-sm);
    font-size: var(--font-sm);
    text-align: center;
  }

  .scape-link__badge {
    display: inline-block;
    margin-left: var(--spacer-xs);
    padding: 0 var(--spacer-xs);
    border-radius: var(--size-2);
    background: var(--gray-z-2);
    font-size: var(--font-xs);
    font-weight: var(--font-weight-normal);
    color: var(--muted);
  }

  &.scape-link--tall {
    min-height: calc(var(--scape-height) * 2);
  }
}
</style>
