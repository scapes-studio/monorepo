<script setup lang="ts">
import { eq } from "@ponder/client";

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

const route = useRoute();
const scapeId = computed(() => route.params.id as string);
const client = usePonderClient();

const { data, pending, error } = await useAPI<ScapeHistoryResponse>(
  () => `/scapes/${scapeId.value}/history`,
  { watch: [scapeId] },
);

const scapeDataKey = computed(() => `scape-data-${scapeId.value ?? "unknown"}`);
const {
  data: scapeData,
  pending: scapePending,
} = await useAsyncData(
  scapeDataKey,
  async () => {
    const tokenIdValue = BigInt(scapeId.value);

    const result = await client.db
      .select()
      .from(schema.scape)
      .where(eq(schema.scape.id, tokenIdValue))
      .limit(1);

    const row = result[0];
    return row ?? null;
  },
  { watch: [scapeId] },
);

const owner = computed(() => scapeData.value?.owner ?? null);
const attributes = computed(() => scapeData.value?.attributes ?? null);

const history = computed(() => data.value?.history ?? []);
const totalTransfers = computed(() => data.value?.totalTransfers ?? 0);
const totalSales = computed(() => data.value?.totalSales ?? 0);
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
            <AccountLink :address="owner" class="scape-detail__owner-link" />
          </template>
        </div>
        <ScapesMarketplaceData :scape-id="scapeId" class="scape-detail__listings" />
      </div>
    </header>

    <ScapesAttributes :attributes="attributes" />

    <ScapesTransactionHistory :history="history" :pending="pending" :error="error" />
  </section>
</template>

<style scoped>
.scape-detail {
  max-width: var(--content-width-wide);
  margin: 0 auto;
  padding: var(--spacer-lg) var(--spacer);
  display: grid;
  gap: var(--spacer-lg);
}

.scape-detail__header {
  display: grid;
  grid-template-columns: var(--size-10) minmax(0, 1fr);
  gap: var(--spacer-lg);
  align-items: center;
}

.scape-detail__image {
  width: var(--size-10);
}

.scape-detail__meta h1 {
  margin: 0 0 var(--spacer-sm);
}

.scape-detail__stats {
  display: flex;
  gap: var(--spacer);
  font-weight: var(--font-weight-bold);
}

.scape-detail__owner {
  margin-top: var(--spacer-sm);
  color: var(--muted);
}

.scape-detail__owner-link {
  font-weight: var(--font-weight-bold);
  color: inherit;
  text-decoration: none;
  word-break: break-all;
}

.scape-detail__owner-link:hover {
  text-decoration: underline;
}

.scape-detail__listings {
  margin-top: var(--size-3);
}

@media (max-width: 40rem) {
  .scape-detail__header {
    grid-template-columns: 1fr;
  }

  .scape-detail__image {
    width: var(--size-9);
  }
}
</style>
