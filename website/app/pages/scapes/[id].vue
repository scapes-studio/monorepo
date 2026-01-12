<script setup lang="ts">
const route = useRoute();

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

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

const formatTimestamp = (timestamp: number) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp * 1000));

const shortenHex = (value: string, start = 6, end = 4) => {
  if (!value) return "";
  if (value.length <= start + end) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
};

const addressUrl = (address: string) => `https://etherscan.io/address/${address}`;
const txUrl = (hash: string) => `https://etherscan.io/tx/${hash}`;

const salePrice = (entry: ScapeHistoryEntry) => {
  const price = entry.sale?.price;
  if (!price) return null;
  if (typeof price.eth === "number") {
    return `${formatETH(price.eth)} ETH`;
  }
  if (price.wei) {
    const ethValue = Number(price.wei) / 1e18;
    if (Number.isFinite(ethValue)) {
      return `${formatETH(ethValue)} ETH`;
    }
  }
  return null;
};

const MIGRATION_CUTOFF = 1671404400;

const isMigration = (entry: ScapeHistoryEntry) =>
  entry.from.toLowerCase() === ZERO_ADDRESS && entry.timestamp > MIGRATION_CUTOFF;

const transferLabel = (entry: ScapeHistoryEntry) => {
  if (isMint(entry)) return 'Mint'
  if (isMigration(entry)) return "Onchain Migration";
  return entry.sale ? "Sale" : "Transfer";
};
const isMint = (entry: ScapeHistoryEntry) =>
  entry.from.toLowerCase() === ZERO_ADDRESS && !isMigration(entry);
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
        <li v-for="entry in history" :key="entry.id" class="scape-detail__history-item">
          <div class="scape-detail__history-header">
            <span class="scape-detail__history-type">
              {{ transferLabel(entry) }}
            </span>
            <span class="scape-detail__history-time">{{ formatTimestamp(entry.timestamp) }}</span>
          </div>

          <div v-if="!isMigration(entry)" class="scape-detail__history-addresses">
            <div v-if="!isMint(entry)">
              <span class="scape-detail__history-label">From</span>
              <a :href="addressUrl(entry.from)" class="scape-detail__history-link" target="_blank"
                rel="noopener noreferrer">
                {{ shortenHex(entry.from) }}
              </a>
            </div>
            <div>
              <span class="scape-detail__history-label">To</span>
              <a :href="addressUrl(entry.to)" class="scape-detail__history-link" target="_blank"
                rel="noopener noreferrer">
                {{ shortenHex(entry.to) }}
              </a>
            </div>
          </div>

          <div class="scape-detail__history-meta">
            <a :href="txUrl(entry.txHash)" class="scape-detail__history-link" target="_blank" rel="noopener noreferrer">
              Tx {{ shortenHex(entry.txHash, 10, 6) }}
            </a>
            <span v-if="salePrice(entry)">Price {{ salePrice(entry) }}</span>
            <span v-if="entry.sale?.source" class="scape-detail__history-source">
              via {{ entry.sale.source }}
            </span>
          </div>
        </li>
      </ul>
    </section>
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

.scape-detail__history {
  display: grid;
  gap: var(--spacer);
}

.scape-detail__section-title h2 {
  margin: 0;
}

.scape-detail__status {
  padding: var(--spacer);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.04);
}

.scape-detail__status--error {
  background: rgba(255, 0, 0, 0.08);
}

.scape-detail__history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--spacer);
}

.scape-detail__history-item {
  padding: var(--spacer);
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  display: grid;
  gap: 0.75rem;
}

.scape-detail__history-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--spacer);
}

.scape-detail__history-type {
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.scape-detail__history-tag {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
}

.scape-detail__history-time {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.9rem;
}

.scape-detail__history-addresses {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacer);
}

.scape-detail__history-label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 0.25rem;
}

.scape-detail__history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacer);
  font-weight: 600;
}

.scape-detail__history-link {
  color: inherit;
  text-decoration: none;
  font-weight: 600;
}

.scape-detail__history-link:hover {
  text-decoration: underline;
}

.scape-detail__history-source {
  color: rgba(0, 0, 0, 0.6);
  font-weight: 500;
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
