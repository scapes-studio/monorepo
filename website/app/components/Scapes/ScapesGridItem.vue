<script setup lang="ts">
import type { ScapeRecord } from "~/composables/useScapesByOwner";

const props = defineProps<{
  scape: ScapeRecord;
  price?: bigint | null;
  isSeaport?: boolean;
}>();

const formattedPrice = computed(() => {
  if (!props.price) return null;
  return formatETH(Number(props.price) / 1e18);
});
</script>

<template>
  <NuxtLink class="scape-link" :to="`/scapes/${scape.id}`">
    <ScapeImage :id="scape.id" />
    <div v-if="formattedPrice" class="scape-link__price">
      {{ formattedPrice }} ETH
      <span v-if="isSeaport" class="scape-link__badge">OpenSea</span>
    </div>
  </NuxtLink>
</template>

<style scoped>
.scape-link {
  display: block;
  text-decoration: none;
  color: inherit;
  container-type: inline-size;
  content-visibility: auto;

  img {
    /* border-bottom: calc(100cqw/72) solid beige; */
    /* border-right: calc(100cqw/72) solid beige; */
    box-shadow: 0 0 0 calc(100cqw/72) beige;
  }

  .scape-link__price {
    margin-top: var(--spacer-xs);
    font-size: var(--font-sm);
    font-weight: var(--font-weight-bold);
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
}
</style>
