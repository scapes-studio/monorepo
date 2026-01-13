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

type ScapeHistoryEntry = {
  id: string;
  timestamp: number;
  from: string;
  to: string;
  txHash: string;
  sale: SaleDetails | null;
};

const props = defineProps<{ history?: ScapeHistoryEntry[]; pending?: boolean; error?: unknown | null }>();

const history = computed(() => props.history ?? []);
const pending = computed(() => props.pending ?? false);
const error = computed(() => props.error ?? null);
</script>

<template>
  <section class="scape-detail__history">
    <header class="scape-detail__section-title">
      <h2>Transfer History</h2>
    </header>

    <div v-if="pending" class="scape-detail__status">Loading scape history…</div>
    <div v-else-if="error" class="scape-detail__status scape-detail__status--error">
      Unable to load scape history right now.
    </div>
    <div v-else-if="history.length === 0" class="scape-detail__status">No transfers yet.</div>

    <ul v-else class="scape-detail__history-list">
      <ScapesTransactionHistoryEvent v-for="entry in history" :key="entry.id" :entry="entry" />
    </ul>
  </section>
</template>

<style scoped>
.scape-detail__history {
  display: grid;
  gap: var(--spacer);
}

.scape-detail__section-title h2 {
  margin: 0;
}

.scape-detail__status {
  padding: var(--spacer);
  border-radius: var(--size-3);
  background: var(--gray-z-1);
}

.scape-detail__status--error {
  background: oklch(from var(--error) l c h / 0.1);
}

.scape-detail__history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--spacer);
}
</style>
