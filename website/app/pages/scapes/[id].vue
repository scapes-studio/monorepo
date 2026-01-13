<script setup lang="ts">
const route = useRoute();

type SalePrice = {
  wei?: string;
  eth?: number;
  usd?: number;
  currency?: {
    symbol?: string;
    amount?: string;
  };
};

type SaleDetails = {
  id: string | number;
  price?: SalePrice;
  seller?: string;
  buyer?: string;
  slug?: string;
  source?: string;
};

type ScapeHistoryEntry = {
  id: string;
  timestamp: number;
  from: string;
  to: string;
  txHash: string;
  sale: SaleDetails | null;
};

type ScapeHistoryResponse = {
  collection: string;
  tokenId: string;
  history: ScapeHistoryEntry[];
  totalTransfers: number;
  totalSales: number;
};

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

const scapeId = computed(() => route.params.id as string | undefined);
const client = usePonderClient();

const { data, pending, error } = await useAPI<ScapeHistoryResponse>(
  () => `/scapes/${scapeId.value}/history`,
  { watch: [scapeId] },
);

const {
  data: internalOffer,
  pending: internalOfferPending,
  error: internalOfferError,
} = await useAsyncData<InternalOfferData>(
  "scape-internal-offer",
  async () => {
    if (!scapeId.value) {
      return { listed: false, price: null };
    }

    const tokenIdValue = BigInt(scapeId.value);

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
  { watch: [scapeId] },
);

const {
  data: seaportListing,
  pending: seaportListingPending,
  error: seaportListingError,
} = await useAsyncData<SeaportListingData>(
  "scape-seaport-listing",
  async () => {
    if (!scapeId.value) {
      return { listed: false, price: null };
    }

    const now = Math.floor(Date.now() / 1000);

    const result = await client.db
      .select({ price: schema.seaportListing.price })
      .from(schema.seaportListing)
      .where(
        and(
          eq(schema.seaportListing.slug, "scapes"),
          eq(schema.seaportListing.tokenId, scapeId.value),
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
  { watch: [scapeId] },
);

const {
  data: scapeData,
  pending: scapePending,
} = await useAsyncData(
  "scape-owner",
  async () => {
    if (!scapeId.value) {
      return null;
    }

    const tokenIdValue = BigInt(scapeId.value);

    const result = await client.db
      .select({ owner: schema.scape.owner })
      .from(schema.scape)
      .where(eq(schema.scape.id, tokenIdValue))
      .limit(1);

    const row = result[0];
    return row ?? null;
  },
  { watch: [scapeId] },
);

const owner = computed(() => scapeData.value?.owner ?? null);

const history = computed(() => data.value?.history ?? []);
const totalTransfers = computed(() => data.value?.totalTransfers ?? 0);
const totalSales = computed(() => data.value?.totalSales ?? 0);

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
  <section class="scape-detail">
    <header class="scape-detail__header">
      <div class="scape-detail__image">
        <ScapesImage :id="scapeId" />
      </div>
      <div class="scape-detail__meta">
        <h1>Scape #{{ scapeId }}</h1>
        <div class="scape-detail__stats">
          <span>{{ totalTransfers }} transfers</span>
          <span>{{ totalSales }} sales</span>
        </div>
        <div class="scape-detail__owner">
          <span v-if="scapePending">Loading owner…</span>
          <template v-else-if="owner">
            Owned by
            <NuxtLink :to="`/accounts/${owner}`" class="scape-detail__owner-link">
              {{ owner }}
            </NuxtLink>
          </template>
        </div>
        <div class="scape-detail__listings">
          <span v-if="listingsPending">Checking listings…</span>
          <span v-else-if="listingsError">Listing status unavailable</span>
          <template v-else>
            <span v-if="isInternallyListed" class="scape-detail__badge">
              Internal marketplace: {{ internalOfferPrice }} ETH
            </span>
            <span v-if="isSeaportListed" class="scape-detail__badge scape-detail__badge--seaport">
              Seaport: {{ seaportListingPrice }} ETH
            </span>
            <span v-if="isNotListed" class="scape-detail__badge scape-detail__badge--muted">
              Not listed
            </span>
          </template>
        </div>
      </div>
    </header>

    <ScapesTransactionHistory :history="history" :pending="pending" :error="error" />
  </section>
</template>

<style scoped>
.scape-detail {
  max-width: 72rem;
  margin: 0 auto;
  padding: var(--spacer-lg) var(--spacer);
  display: grid;
  gap: var(--spacer-lg);
}

.scape-detail__header {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: var(--spacer-lg);
  align-items: center;
}

.scape-detail__image {
  width: 180px;
}

.scape-detail__meta h1 {
  margin: 0 0 0.5rem;
}

.scape-detail__stats {
  display: flex;
  gap: var(--spacer);
  font-weight: 600;
}

.scape-detail__owner {
  margin-top: 0.5rem;
  color: rgba(0, 0, 0, 0.6);
}

.scape-detail__owner-link {
  font-weight: 600;
  color: inherit;
  text-decoration: none;
  word-break: break-all;
}

.scape-detail__owner-link:hover {
  text-decoration: underline;
}

.scape-detail__listings {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
  font-weight: 600;
}

.scape-detail__badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  font-size: 0.85rem;
}

.scape-detail__badge--seaport {
  background: rgba(0, 122, 255, 0.14);
}

.scape-detail__badge--muted {
  background: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.6);
}

@media (max-width: 640px) {
  .scape-detail__header {
    grid-template-columns: 1fr;
  }

  .scape-detail__image {
    width: 140px;
  }
}
</style>
