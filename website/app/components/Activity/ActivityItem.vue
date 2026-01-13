<script setup lang="ts">
import type { ActivityItem } from "~/types/activity";

const props = defineProps<{ item: ActivityItem }>();

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

const collectionLabel = (collection: string) => {
  switch (collection) {
    case "scapes":
      return "Scapes";
    case "punkscapes":
      return "PunkScapes";
    case "twenty-seven-year-scapes":
      return "27Y Scapes";
    default:
      return collection;
  }
};

const typeLabel = (type: string) => {
  switch (type) {
    case "transfer":
      return "Transfer";
    case "sale":
      return "Sale";
    case "listing":
      return "Listed";
    case "offer":
      return "Offer";
    default:
      return type;
  }
};

const accountUrl = (address: string) => `/people/${address}`;
const scapeUrl = (tokenId: string, collection: string) => {
  if (collection === "twenty-seven-year-scapes") {
    return `/twenty-seven-year-scapes/${tokenId}`;
  }
  return `/scapes/${tokenId}`;
};
const txUrl = (hash: string) => `https://etherscan.io/tx/${hash}`;

const formattedTimestamp = computed(() => formatTimestamp(props.item.timestamp));
</script>

<template>
  <li class="activity-item">
    <div class="activity-item__header">
      <span class="activity-item__type">{{ typeLabel(item.type) }}</span>
      <span class="activity-item__collection">{{ collectionLabel(item.collection) }}</span>
      <span class="activity-item__time">{{ formattedTimestamp }}</span>
    </div>

    <div class="activity-item__content">
      <NuxtLink :to="scapeUrl(item.tokenId, item.collection)" class="activity-item__token">
        #{{ item.tokenId }}
      </NuxtLink>

      <template v-if="item.type === 'transfer'">
        <div class="activity-item__addresses">
          <div>
            <span class="activity-item__label">From</span>
            <NuxtLink :to="accountUrl(item.from)" class="activity-item__link">
              {{ shortenHex(item.from) }}
            </NuxtLink>
          </div>
          <div>
            <span class="activity-item__label">To</span>
            <NuxtLink :to="accountUrl(item.to)" class="activity-item__link">
              {{ shortenHex(item.to) }}
            </NuxtLink>
          </div>
        </div>
      </template>

      <template v-else-if="item.type === 'sale'">
        <div class="activity-item__addresses">
          <div>
            <span class="activity-item__label">Seller</span>
            <NuxtLink :to="accountUrl(item.seller)" class="activity-item__link">
              {{ shortenHex(item.seller) }}
            </NuxtLink>
          </div>
          <div>
            <span class="activity-item__label">Buyer</span>
            <NuxtLink :to="accountUrl(item.buyer)" class="activity-item__link">
              {{ shortenHex(item.buyer) }}
            </NuxtLink>
          </div>
        </div>
        <span class="activity-item__price">{{ formatETH(item.price.eth) }} ETH</span>
        <span class="activity-item__source">via {{ item.source }}</span>
      </template>

      <template v-else-if="item.type === 'listing'">
        <div class="activity-item__addresses">
          <div>
            <span class="activity-item__label">By</span>
            <NuxtLink :to="accountUrl(item.maker)" class="activity-item__link">
              {{ shortenHex(item.maker) }}
            </NuxtLink>
          </div>
        </div>
        <span class="activity-item__price">{{ formatETH(item.price.eth) }} ETH</span>
      </template>

      <template v-else-if="item.type === 'offer'">
        <span class="activity-item__price">{{ formatETH(item.price.eth) }} ETH</span>
        <span v-if="!item.isActive" class="activity-item__inactive">Inactive</span>
      </template>
    </div>

    <div v-if="item.txHash" class="activity-item__meta">
      <a :href="txUrl(item.txHash)" class="activity-item__link" target="_blank" rel="noopener noreferrer">
        Tx {{ shortenHex(item.txHash, 10, 6) }}
      </a>
    </div>
  </li>
</template>

<style scoped>
.activity-item {
  padding: var(--spacer);
  border-radius: var(--spacer);
  border: var(--border);
  display: grid;
  gap: var(--size-3);
}

.activity-item__header {
  display: flex;
  align-items: baseline;
  gap: var(--spacer);
  flex-wrap: wrap;
}

.activity-item__type {
  font-weight: var(--font-weight-bold);
}

.activity-item__collection {
  padding: 0 var(--spacer-xs);
  border-radius: var(--size-2);
  background: var(--gray-z-2);
  font-size: var(--font-xs);
  color: var(--muted);
}

.activity-item__time {
  color: var(--muted);
  font-size: var(--font-sm);
  margin-left: auto;
}

.activity-item__content {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacer);
  align-items: center;
}

.activity-item__token {
  font-weight: var(--font-weight-bold);
  color: inherit;
  text-decoration: none;
}

.activity-item__token:hover {
  text-decoration: underline;
}

.activity-item__addresses {
  display: flex;
  gap: var(--spacer);
}

.activity-item__label {
  display: block;
  font-size: var(--font-xs);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing);
  color: var(--muted);
  margin-bottom: var(--spacer-xs);
}

.activity-item__link {
  color: inherit;
  text-decoration: none;
  font-weight: var(--font-weight-bold);
}

.activity-item__link:hover {
  text-decoration: underline;
}

.activity-item__price {
  font-weight: var(--font-weight-bold);
}

.activity-item__source {
  color: var(--muted);
  font-size: var(--font-sm);
}

.activity-item__inactive {
  color: var(--error);
  font-size: var(--font-sm);
}

.activity-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacer);
  font-size: var(--font-sm);
}
</style>
