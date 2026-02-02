<template>
  <li class="history-item">
    <GridArea :rows="1" width="full" class="history-item__header">
      <span class="history-item__type">
        <span>{{ label }}</span>
        <template v-if="entry.type === 'sale' && price">
          <span class="muted">
            (<span class="history-item__price">{{ price }}</span>
            <span v-if="entry.sale?.source" class="history-item__source">
              via {{ entry.sale.source }}
            </span>)
          </span>
        </template>
        <template v-else-if="entry.type === 'listing' && price">
          <span class="muted">
            (<span class="history-item__price">{{ price }}</span>)
          </span>
        </template>
      </span>
      <a :href="txUrl(entry.txHash)" class="history-item__time" target="_blank" rel="noopener noreferrer">
        {{ timeAgo }}
      </a>
    </GridArea>

    <GridArea v-if="entry.type === 'listing' || !isSingleLine(entry)" :rows="1" width="full"
      class="history-item__content">
      <!-- Listing event -->
      <template v-if="entry.type === 'listing'">
        <div class="history-item__addresses">
          <div>
            <span class="history-item__label">By</span>
            <AccountLink :address="entry.lister" class="history-item__link" shorten-ens />
          </div>
          <div></div>
        </div>
      </template>

      <!-- Transfer/Sale event -->
      <template v-else>
        <div class="history-item__addresses">
          <template v-if="mint">
            <div></div>
            <div>
              <span class="history-item__label">To</span>
              <AccountLink :address="entry.to" class="history-item__link" shorten-ens />
            </div>
          </template>
          <template v-else-if="migration">
            <div></div>
            <div></div>
          </template>
          <template v-else>
            <div>
              <span class="history-item__label">From</span>
              <AccountLink :address="entry.from" class="history-item__link" shorten-ens />
            </div>
            <div>
              <span class="history-item__label">To</span>
              <AccountLink :address="entry.to" class="history-item__link" shorten-ens />
            </div>
          </template>
        </div>
      </template>
    </GridArea>
  </li>
</template>

<script setup lang="ts">
import { useTimeAgo } from "@vueuse/core";

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

export type ScapeHistoryEntry = TransferEntry | ListingEntry;

const props = defineProps<{ scapeId: string, entry: ScapeHistoryEntry }>();

const txUrl = (hash: string) => `https://etherscan.io/tx/${hash}`;

const salePrice = (entry: TransferEntry) => {
  const saleData = entry.sale?.price;
  if (!saleData) return null;
  if (typeof saleData.eth === "number") {
    return `${formatETH(saleData.eth)} ETH`;
  }
  if (saleData.wei) {
    const ethValue = Number(saleData.wei) / 1e18;
    if (Number.isFinite(ethValue)) {
      return `${formatETH(ethValue)} ETH`;
    }
  }
  return null;
};

const isMigration = (entry: TransferEntry) =>
  entry.from.toLowerCase() === ZERO_ADDRESS && entry.timestamp > MIGRATION_CUTOFF;

const isMint = (entry: TransferEntry) =>
  entry.from.toLowerCase() === ZERO_ADDRESS && !isMigration(entry);

const isMerge = (entry: TransferEntry) =>
  entry.from.toLowerCase() === ZERO_ADDRESS && BigInt(props.scapeId || 0) > 10_000n;

const isSingleLine = (entry: TransferEntry) => isMerge(entry) || isMigration(entry)

const transferLabel = (entry: TransferEntry) => {
  if (isMerge(entry)) return "Mint (Merge)";
  if (isMint(entry)) return "Mint";
  if (isMigration(entry)) return "Onchain Migration";
  return entry.sale ? "Sale" : "Transfer";
};

const timeAgo = useTimeAgo(() => new Date(props.entry.timestamp * 1000));

const migration = computed(() =>
  props.entry.type !== "listing" ? isMigration(props.entry) : false,
);
const mint = computed(() =>
  props.entry.type !== "listing" ? isMint(props.entry) : false,
);
const label = computed(() => {
  if (props.entry.type === "listing") return "Listing";
  return transferLabel(props.entry);
});
const price = computed(() => {
  if (props.entry.type === "listing") {
    return `${formatETH(props.entry.price.eth)} ETH`;
  }
  return salePrice(props.entry);
});
</script>

<style scoped>
.history-item {
  display: grid;
  gap: var(--grid-gutter);
  font-size: var(--font-sm);
  background: var(--background);
}

.history-item__header {
  display: flex;
  align-items: center;
  gap: var(--spacer);
  flex-wrap: wrap;
  padding: var(--spacer);
}

.history-item__type {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: var(--spacer);
  flex: 1;

  a:hover {
    text-decoration: underline;
  }
}

.history-item__time {
  color: var(--muted);
  text-decoration: none;

  @media (min-width: 576px) {
    margin-left: auto;
  }
}

a.history-item__time:hover {
  text-decoration: underline;
}

.history-item__content {
  display: flex;
  gap: var(--spacer);
  align-items: center;
  justify-content: space-between;
  padding-inline: var(--spacer);
}

.history-item__addresses {
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: var(--spacer);

  &>*:last-child {
    text-align: right;
  }
}

.history-item__label {
  display: block;
  text-transform: uppercase;
  color: var(--muted);
}

.history-item__link {
  color: inherit;
  text-decoration: none;
}

.history-item__link:hover {
  text-decoration: underline;
}

.history-item__price {
  white-space: nowrap;
  color: var(--muted);
}

.history-item__source {
  color: var(--muted);
  font-size: var(--font-sm);
}
</style>
