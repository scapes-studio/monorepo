<script setup lang="ts">
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const MIGRATION_CUTOFF = 1671404400;

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

const props = defineProps<{ entry: ScapeHistoryEntry }>();

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

const accountUrl = (address: string) => `/people/${address}`;
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

const isMigration = (entry: ScapeHistoryEntry) =>
  entry.from.toLowerCase() === ZERO_ADDRESS && entry.timestamp > MIGRATION_CUTOFF;

const isMint = (entry: ScapeHistoryEntry) =>
  entry.from.toLowerCase() === ZERO_ADDRESS && !isMigration(entry);

const transferLabel = (entry: ScapeHistoryEntry) => {
  if (isMint(entry)) return "Mint";
  if (isMigration(entry)) return "Onchain Migration";
  return entry.sale ? "Sale" : "Transfer";
};

const formattedTimestamp = computed(() => formatTimestamp(props.entry.timestamp));
const migration = computed(() => isMigration(props.entry));
const mint = computed(() => isMint(props.entry));
const label = computed(() => transferLabel(props.entry));
const price = computed(() => salePrice(props.entry));
</script>

<template>
  <li class="scape-detail__history-item">
    <div class="scape-detail__history-header">
      <span class="scape-detail__history-type">{{ label }}</span>
      <span class="scape-detail__history-time">{{ formattedTimestamp }}</span>
    </div>

    <div v-if="!migration" class="scape-detail__history-addresses">
      <div v-if="!mint">
        <span class="scape-detail__history-label">From</span>
        <NuxtLink :to="accountUrl(entry.from)" class="scape-detail__history-link">
          {{ shortenHex(entry.from) }}
        </NuxtLink>
      </div>
      <div>
        <span class="scape-detail__history-label">To</span>
        <NuxtLink :to="accountUrl(entry.to)" class="scape-detail__history-link">
          {{ shortenHex(entry.to) }}
        </NuxtLink>
      </div>
    </div>

    <div class="scape-detail__history-meta">
      <a :href="txUrl(entry.txHash)" class="scape-detail__history-link" target="_blank" rel="noopener noreferrer">
        Tx {{ shortenHex(entry.txHash, 10, 6) }}
      </a>
      <span v-if="price">Price {{ price }}</span>
      <span v-if="entry.sale?.source" class="scape-detail__history-source">via {{ entry.sale.source }}</span>
    </div>
  </li>
</template>

<style scoped>
.scape-detail__history-item {
  padding: var(--spacer);
  border-radius: var(--spacer);
  border: var(--border);
  display: grid;
  gap: var(--size-3);
}

.scape-detail__history-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--spacer);
}

.scape-detail__history-type {
  font-weight: var(--font-weight-bold);
  display: inline-flex;
  align-items: center;
  gap: var(--spacer-sm);
}

.scape-detail__history-time {
  color: var(--muted);
  font-size: var(--font-sm);
}

.scape-detail__history-addresses {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--spacer);
}

.scape-detail__history-label {
  display: block;
  font-size: var(--font-xs);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing);
  color: var(--muted);
  margin-bottom: var(--spacer-xs);
}

.scape-detail__history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacer);
  font-weight: var(--font-weight-bold);
}

.scape-detail__history-link {
  color: inherit;
  text-decoration: none;
  font-weight: var(--font-weight-bold);
}

.scape-detail__history-link:hover {
  text-decoration: underline;
}

.scape-detail__history-source {
  color: var(--muted);
  font-weight: var(--font-weight-bold);
}
</style>
