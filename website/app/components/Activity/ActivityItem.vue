<template>
  <li class="activity-item">
    <div class="activity-item__header">
      <div class="image">
        <ScapesGridItem v-if="item.collection === 'scapes'" :scape="{ id: BigInt(item.tokenId) }" />
        <ActivityGallery27Image v-else-if="item.collection === 'twenty-seven-year-scapes'" :token-id="item.tokenId" />
      </div>
      <span class="activity-item__type">
        <span>{{ typeLabel(item.type) }} </span>
        <template v-if="item.type === 'sale'">
          <span>
            (<span class="activity-item__price">{{ formatETH(item.price.eth) }} ETH</span>
            <span class="activity-item__source" v-if="item.source === 'seaport'">
              via {{ item.source }}
            </span>)
          </span>
        </template>
        <template v-if="item.type === 'listing'">
          <span>
            (<span class="activity-item__price">{{ formatETH(item.price.eth) }} ETH</span>)
          </span>
        </template>
      </span>
      <a v-if="item.txHash" :href="txUrl(item.txHash)" class="activity-item__time" target="_blank"
        rel="noopener noreferrer">{{ timeAgo }}</a>
      <span v-else class="activity-item__time">{{ timeAgo }}</span>
    </div>

    <div class="activity-item__content">
      <template v-if="item.type === 'transfer'">
        <div class="activity-item__addresses">
          <div>
            <span class="activity-item__label">From</span>
            <AccountLink :address="item.from" class="activity-item__link" />
          </div>
          <div>
            <span class="activity-item__label">To</span>
            <AccountLink :address="item.to" class="activity-item__link" />
          </div>
        </div>
      </template>

      <template v-else-if="item.type === 'sale'">
        <div class="activity-item__addresses">
          <div>
            <span class="activity-item__label">From</span>
            <AccountLink :address="item.seller" class="activity-item__link" />
          </div>
          <div>
            <span class="activity-item__label">To</span>
            <AccountLink :address="item.buyer" class="activity-item__link" />
          </div>
        </div>
      </template>

      <template v-else-if="item.type === 'listing'">
        <div class="activity-item__addresses">
          <div>
            <span class="activity-item__label">By</span>
            <AccountLink :address="item.lister" class="activity-item__link" />
          </div>
        </div>
      </template>
    </div>
  </li>
</template>

<script setup lang="ts">
import { useTimeAgo } from '@vueuse/core'
import type { ActivityItem } from "~/types/activity"

const props = defineProps<{ item: ActivityItem }>();

const timeAgo = useTimeAgo(() => new Date(props.item.timestamp * 1000));

const typeLabel = (type: string) => {
  switch (type) {
    case "transfer":
      return "Transfer";
    case "sale":
      return "Sale";
    case "listing":
      return "Listing";
    default:
      return type;
  }
};

const scapeUrl = (tokenId: string, collection: string) => {
  if (collection === "twenty-seven-year-scapes") {
    return `/twenty-seven-year-scapes/${tokenId}`;
  }
  return `/scapes/${tokenId}`;
};
const txUrl = (hash: string) => `https://etherscan.io/tx/${hash}`;
</script>

<style scoped>
.activity-item {
  display: grid;
  gap: var(--grid-gutter);
  background: var(--background);
  font-size: var(--font-sm);
}

.activity-item__header {
  display: flex;
  align-items: center;
  gap: var(--spacer);
  flex-wrap: wrap;
  height: var(--scape-height);

  &>.image {
    width: var(--scape-width);
  }
}

.activity-item__type {
  display: flex;
  gap: var(--spacer-sm);
}

.activity-item__time {
  color: var(--muted);
  margin-left: auto;
  text-decoration: none;
  padding-right: var(--spacer);
}

a.activity-item__time:hover {
  text-decoration: underline;
}

.activity-item__content {
  display: flex;
  gap: var(--spacer);
  align-items: center;
  justify-content: space-between;
  padding-inline: var(--spacer);
  height: var(--scape-height);
}

.activity-item__addresses {
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: var(--spacer);
}

.activity-item__label {
  display: block;
  text-transform: uppercase;
  color: var(--muted);
}

.activity-item__link {
  color: inherit;
  text-decoration: none;
}

.activity-item__link:hover {
  text-decoration: underline;
}

.activity-item__price {
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
}

.activity-item__source {
  color: var(--muted);
  font-size: var(--font-sm);
}
</style>
