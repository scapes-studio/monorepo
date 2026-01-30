<template>
  <li class="activity-item">
    <GridArea :rows="1" background width="full" class="activity-item__header">
      <span class="activity-item__type">
        <NuxtLink :to="scapeUrl(item.tokenId, item.collection)">
          <span>{{ typeLabel }} <span class="muted">#{{ item.tokenId }}</span></span>
          <template v-if="item.type === 'sale'">
            <span class="muted">
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
        </NuxtLink>
        <span class="image">
          <ScapesGridItem v-if="item.collection === 'scapes'" :scape="{ id: BigInt(item.tokenId) }" />
          <ActivityGallery27Image v-else-if="item.collection === 'twenty-seven-year-scapes'" :token-id="item.tokenId" />
        </span>
        <a v-if="item.txHash" :href="txUrl(item.txHash)" class="activity-item__time" target="_blank"
          rel="noopener noreferrer">{{ timeAgo }}</a>
        <span v-else class="activity-item__time">{{ timeAgo }}</span>
      </span>
    </GridArea>

    <GridArea :rows="1" width="full" class="activity-item__content" background>
      <template v-if="item.type === 'transfer'">
        <div class="activity-item__addresses">
          <template v-if="isMint">
            <div></div>
            <div>
              <span class="activity-item__label">To</span>
              <AccountLink :address="item.to" class="activity-item__link" />
            </div>
          </template>
          <template v-else-if="isBurn">
            <div></div>
            <div>
              <span class="activity-item__label">From</span>
              <AccountLink :address="item.from" class="activity-item__link" />
            </div>
          </template>
          <template v-else>
            <div>
              <span class="activity-item__label">From</span>
              <AccountLink :address="item.from" class="activity-item__link" />
            </div>
            <div>
              <span class="activity-item__label">To</span>
              <AccountLink :address="item.to" class="activity-item__link" />
            </div>
          </template>
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
          <div></div>
        </div>
      </template>
    </GridArea>
  </li>
</template>

<script setup lang="ts">
import { useTimeAgo } from '@vueuse/core'
import type { ActivityItem } from "~/types/activity"

const props = defineProps<{ item: ActivityItem }>();

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const timeAgo = useTimeAgo(() => new Date(props.item.timestamp * 1000));

const isMint = computed(() =>
  props.item.type === "transfer" && props.item.from.toLowerCase() === ZERO_ADDRESS
);

const isBurn = computed(() =>
  props.item.type === "transfer" && props.item.to.toLowerCase() === ZERO_ADDRESS
);

const typeLabel = computed(() => {
  if (isMint.value) return "Mint";
  if (isBurn.value) return "Burn";
  switch (props.item.type) {
    case "transfer":
      return "Transfer";
    case "sale":
      return "Sale";
    case "listing":
      return "Listing";
    default:
      return props.item.type;
  }
});

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
  font-size: var(--font-sm);
}

.activity-item__header {
  display: flex;
  align-items: center;
  gap: var(--spacer);
  flex-wrap: wrap;
  padding: var(--spacer);
}

.activity-item__type {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: var(--spacer);
  flex: 1;

  & .image {
    height: 1.4em;
    width: 4.2em;
    display: inline-block;
    border-radius: 0.2em;
    overflow: hidden;
  }

  a:hover {
    text-decoration: underline;
  }
}

.activity-item__time {
  color: var(--muted);
  text-decoration: none;

  @media (min-width: 576px) {
    margin-left: auto;
  }
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
}

.activity-item__addresses {
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: var(--spacer);


  &>*:last-child {
    text-align: right;
  }
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
  color: var(--muted);
}

.activity-item__source {
  color: var(--muted);
  font-size: var(--font-sm);
}
</style>
