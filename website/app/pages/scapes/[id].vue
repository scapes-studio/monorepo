<script setup lang="ts">
import { sql } from "@ponder/client";

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

type ListingStatusRow = {
  listed: number;
};

type ListingStatus = {
  listed: boolean;
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
} = await useAsyncData<ListingStatus>(
  "scape-internal-offer",
  async () => {
    if (!scapeId.value) {
      return { listed: false };
    }

    const tokenIdValue = BigInt(scapeId.value);

    const result = await client.db.execute(sql`
      SELECT 1 AS listed
      FROM offer
      WHERE "token_id" = ${tokenIdValue}
        AND "is_active" = true
      LIMIT 1
    `);

    const rows = (result as { rows?: ListingStatusRow[] }).rows ?? (result as ListingStatusRow[]);

    return { listed: rows.length > 0 };
  },
  { watch: [scapeId] },
);

const {
  data: seaportListing,
  pending: seaportListingPending,
  error: seaportListingError,
} = await useAsyncData<ListingStatus>(
  "scape-seaport-listing",
  async () => {
    if (!scapeId.value) {
      return { listed: false };
    }

    const now = Math.floor(Date.now() / 1000);

    const result = await client.db.execute(sql`
      SELECT 1 AS listed
      FROM offchain.seaport_listing
      WHERE slug = 'scapes'
        AND token_id = '${scapeId.value}'
        AND start_date <= ${now}
        AND expiration_date > ${now}
      LIMIT 1
    `);

    const rows = (result as { rows?: ListingStatusRow[] }).rows ?? (result as ListingStatusRow[]);

    return { listed: rows.length > 0 };
  },
  { watch: [scapeId] },
);

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
        <div class="scape-detail__listings">
          <span v-if="listingsPending">Checking listings…</span>
          <span v-else-if="listingsError">Listing status unavailable</span>
          <template v-else>
            <span v-if="isInternallyListed" class="scape-detail__badge">
              Listed on internal marketplace
            </span>
            <span v-if="isSeaportListed" class="scape-detail__badge scape-detail__badge--seaport">
              Listed on Seaport
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
