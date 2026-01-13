<script setup lang="ts">
import { and, eq, gt, lte } from "@ponder/client";

type ListingPrice = {
  wei: string;
  eth: number;
  usd: number;
  currency?: {
    symbol: string;
    amount: string;
  };
};

type InternalOfferData = {
  listed: boolean;
  price: bigint | null;
};

type SeaportListingData = {
  listed: boolean;
  price: ListingPrice | null;
};

const props = defineProps<{
  scapeId: string;
}>();

const client = usePonderClient();

const internalOfferKey = computed(() => `scape-internal-offer-${props.scapeId}`);
const {
  data: internalOffer,
  pending: internalOfferPending,
  error: internalOfferError,
} = await useAsyncData<InternalOfferData>(
  internalOfferKey,
  async () => {
    const tokenIdValue = BigInt(props.scapeId);

    const result = await client.db
      .select({ price: schema.offer.price })
      .from(schema.offer)
      .where(and(eq(schema.offer.tokenId, tokenIdValue), eq(schema.offer.isActive, true)))
      .limit(1);

    const row = result[0];
    if (!row) {
      return { listed: false, price: null };
    }

    return { listed: true, price: row.price };
  },
  { watch: () => props.scapeId },
);

const seaportListingKey = computed(() => `scape-seaport-listing-${props.scapeId}`);
const {
  data: seaportListing,
  pending: seaportListingPending,
  error: seaportListingError,
} = await useAsyncData<SeaportListingData>(
  seaportListingKey,
  async () => {
    const now = Math.floor(Date.now() / 1000);

    const result = await client.db
      .select({ price: schema.seaportListing.price })
      .from(schema.seaportListing)
      .where(
        and(
          eq(schema.seaportListing.slug, "scapes"),
          eq(schema.seaportListing.tokenId, props.scapeId),
          lte(schema.seaportListing.startDate, now),
          gt(schema.seaportListing.expirationDate, now),
        ),
      )
      .limit(1);

    const row = result[0];
    if (!row) {
      return { listed: false, price: null };
    }

    return { listed: true, price: row.price };
  },
  { watch: () => props.scapeId },
);

const isInternallyListed = computed(() => internalOffer.value?.listed ?? false);
const isSeaportListed = computed(() => seaportListing.value?.listed ?? false);
const listingsPending = computed(
  () => internalOfferPending.value || seaportListingPending.value,
);
const listingsError = computed(
  () => Boolean(internalOfferError.value || seaportListingError.value),
);
const isNotListed = computed(
  () => !listingsPending.value && !listingsError.value && !isInternallyListed.value && !isSeaportListed.value,
);

const formatEth = (wei: bigint) => {
  const eth = Number(wei) / 1e18;
  return eth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
};

const internalOfferPrice = computed(() => {
  const price = internalOffer.value?.price;
  if (!price) return null;
  return formatEth(price);
});

const seaportListingPrice = computed(() => {
  const price = seaportListing.value?.price;
  if (!price) return null;
  return price.eth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
});
</script>

<template>
  <div class="marketplace-data">
    <span v-if="listingsPending">Checking listings…</span>
    <span v-else-if="listingsError">Listing status unavailable</span>
    <template v-else>
      <span v-if="isInternallyListed" class="marketplace-data__badge">
        Internal marketplace: {{ internalOfferPrice }} ETH
      </span>
      <span v-if="isSeaportListed" class="marketplace-data__badge marketplace-data__badge--seaport">
        Seaport: {{ seaportListingPrice }} ETH
      </span>
      <span v-if="isNotListed" class="marketplace-data__badge marketplace-data__badge--muted">
        Not listed
      </span>
    </template>
  </div>
</template>

<style scoped>
.marketplace-data {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-weight: 600;
}

.marketplace-data__badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  font-size: 0.85rem;
}

.marketplace-data__badge--seaport {
  background: rgba(0, 122, 255, 0.14);
}

.marketplace-data__badge--muted {
  background: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.6);
}
</style>
