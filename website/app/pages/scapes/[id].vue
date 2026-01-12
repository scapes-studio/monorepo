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

const scapeId = computed(() => route.params.id as string | undefined);

const { data, pending, error } = await useAPI<ScapeHistoryResponse>(
  () => `/scapes/${scapeId.value}/history`,
  { watch: [scapeId] },
);

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

@media (max-width: 640px) {
  .scape-detail__header {
    grid-template-columns: 1fr;
  }

  .scape-detail__image {
    width: 140px;
  }
}
</style>
