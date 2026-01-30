<template>
  <section class="history">
    <GridArea :rows="1" width="full" center class="history__title">
      <h2>Transfer History</h2>
    </GridArea>

    <GridArea v-if="pending" :rows="1" width="full" center :background="false" class="history__status">
      Loading scape history…
    </GridArea>
    <GridArea v-else-if="error" :rows="1" width="full" center :background="false" class="history__status history__status--error">
      Unable to load scape history right now.
    </GridArea>
    <GridArea v-else-if="history.length === 0" :rows="1" width="full" center :background="false" class="history__status">
      No transfers yet.
    </GridArea>

    <ul v-else class="history__list">
      <ScapesTransactionHistoryEvent v-for="entry in history" :key="entry.id" :entry="entry" />
    </ul>
  </section>
</template>

<script setup lang="ts">
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

type TransferEntry = {
  type: "transfer" | "sale";
  id: string;
  timestamp: number;
  from: string;
  to: string;
  txHash: string;
  sale: SaleDetails | null;
};

type ListingEntry = {
  type: "listing";
  id: string;
  timestamp: number;
  lister: string;
  price: { wei: string; eth: number };
  isActive: boolean;
  txHash: string;
};

type ScapeHistoryEntry = TransferEntry | ListingEntry;

const props = defineProps<{ history?: ScapeHistoryEntry[]; pending?: boolean; error?: unknown | null }>();

const history = computed(() => props.history ?? []);
const pending = computed(() => props.pending ?? false);
const error = computed(() => props.error ?? null);
</script>

<style scoped>
.history {
  display: grid;
  gap: var(--grid-gutter);
}

.history__title h2 {
  margin: 0;
}

.history__status {
  background: var(--gray-z-1);
}

.history__status--error {
  background: oklch(from var(--error) l c h / 0.1);
}

.history__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--grid-gutter);
}
</style>
