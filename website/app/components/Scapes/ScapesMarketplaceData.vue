<script setup lang="ts">
type ListingSource = "onchain" | "seaport";

type ListingResponse = {
  data: {
    price: string;
    source: ListingSource;
  } | null;
};

const props = defineProps<{
  scapeId: string;
}>();

const runtimeConfig = useRuntimeConfig();

const listingKey = computed(() => `scape-listing-${props.scapeId}`);
const {
  data: listing,
  status,
  error,
} = await useAsyncData<ListingResponse>(
  listingKey,
  async () => {
    const baseUrl = runtimeConfig.public.apiUrl.replace(/\/$/, "");
    return await $fetch<ListingResponse>(`${baseUrl}/listings/${props.scapeId}`);
  },
  {
    watch: [() => props.scapeId],
  },
);

const isPending = computed(() => status.value === "pending");
const hasError = computed(() => Boolean(error.value));
const isListed = computed(() => listing.value?.data !== null);
const source = computed(() => listing.value?.data?.source ?? null);

const formatEth = (wei: string) => {
  const eth = Number(wei) / 1e18;
  return eth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
};

const formattedPrice = computed(() => {
  const price = listing.value?.data?.price;
  if (!price) return null;
  return formatEth(price);
});

const sourceLabel = computed(() => {
  if (source.value === "onchain") return "Internal marketplace";
  if (source.value === "seaport") return "OpenSea";
  return null;
});
</script>

<template>
  <div class="marketplace-data">
    <span v-if="isPending">Checking listings…</span>
    <span v-else-if="hasError">Listing status unavailable</span>
    <template v-else>
      <span
        v-if="isListed"
        class="marketplace-data__badge"
        :class="{ 'marketplace-data__badge--seaport': source === 'seaport' }"
      >
        {{ sourceLabel }}: {{ formattedPrice }} ETH
      </span>
      <span v-else class="marketplace-data__badge marketplace-data__badge--muted">
        Not listed
      </span>
    </template>
  </div>
</template>

<style scoped>
.marketplace-data {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacer-sm);
  font-weight: var(--font-weight-bold);
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
