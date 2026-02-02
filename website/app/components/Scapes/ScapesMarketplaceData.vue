<template>
  <div class="marketplace-data">
    <span v-if="isPending">Checking listings…</span>
    <span v-else-if="hasError">Listing status unavailable</span>
    <template v-else>
      <span v-if="isListed" class="marketplace-data__badge"
        :class="{ 'marketplace-data__badge--seaport': source === 'seaport' }">
        {{ formattedPrice }} ETH
      </span>
      <span v-else class="marketplace-data__badge marketplace-data__badge--muted">
        Not listed
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ListingData } from "~/composables/useScapeListing";

const props = defineProps<{
  listing: ListingData;
  isPending?: boolean;
  hasError?: boolean;
}>();

const isListed = computed(() => props.listing !== null);
const source = computed(() => props.listing?.source ?? null);

const formatEth = (wei: string) => {
  const eth = Number(wei) / 1e18;
  return eth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
};

const formattedPrice = computed(() => {
  const price = props.listing?.price;
  if (!price) return null;
  return formatEth(price);
});

const sourceLabel = computed(() => {
  if (source.value === "onchain") return "Internal marketplace";
  if (source.value === "seaport") return "OpenSea";
  return null;
});
</script>

<style scoped>
.marketplace-data {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacer-sm);
}

.marketplace-data__badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacer-xs) var(--spacer-sm);
  border-radius: var(--size-10);
  background: var(--gray-z-2);
  font-size: var(--font-sm);
}

.marketplace-data__badge--seaport {
  background: oklch(60% 0.15 250 / 0.14);
}

.marketplace-data__badge--muted {
  background: var(--gray-z-1);
  color: var(--muted);
}
</style>
