<script setup lang="ts">
import type { Gallery27Bid } from "~/types/gallery27";

const CDN_BASE = "https://cdn.scapes.xyz";

const props = defineProps<{
  bid: Gallery27Bid;
  selected?: boolean;
}>();

defineEmits<{
  select: [];
}>();

const formattedAmount = computed(() => {
  const eth = Number(props.bid.amount) / 1e18;
  return formatETH(eth);
});

const formattedTime = computed(() => {
  return new Date(props.bid.timestamp * 1000).toLocaleString();
});

const etherscanUrl = computed(() => {
  return `https://etherscan.io/tx/${props.bid.txHash}`;
});

// Construct thumbnail URL
// - With steps: ${path}/final.png
// - Without steps: just ${path}
const thumbnailUrl = computed(() => {
  if (!props.bid.image?.path) return null;
  if (props.bid.image.steps && props.bid.image.steps > 0) {
    return `${CDN_BASE}/${props.bid.image.path}/final.png`;
  }
  return `${CDN_BASE}/${props.bid.image.path}`;
});
</script>

<template>
  <div
    class="gallery27-bid-item"
    :class="{ 'gallery27-bid-item--selected': selected }"
    @click="$emit('select')"
  >
    <div v-if="thumbnailUrl" class="gallery27-bid-item__thumbnail">
      <img :src="thumbnailUrl" :alt="`Bid by ${bid.bidderEns || bid.bidder}`" />
    </div>

    <div class="gallery27-bid-item__content">
      <div class="gallery27-bid-item__header">
        <AccountLink :address="bid.bidder" :ens="bid.bidderEns" />
        <span class="gallery27-bid-item__amount">{{ formattedAmount }} ETH</span>
      </div>

      <p v-if="bid.message" class="gallery27-bid-item__message">{{ bid.message }}</p>

      <div class="gallery27-bid-item__footer">
        <time :datetime="new Date(bid.timestamp * 1000).toISOString()">{{ formattedTime }}</time>
        <a :href="etherscanUrl" target="_blank" rel="noopener">View tx</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery27-bid-item {
  display: flex;
  gap: var(--spacer);
  padding: var(--spacer-sm);
  border-radius: var(--spacer-xs);
  cursor: pointer;
}

.gallery27-bid-item:hover,
.gallery27-bid-item--selected {
  background: var(--gray-z-1);
}

.gallery27-bid-item__thumbnail {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: var(--spacer-xs);
  overflow: hidden;
}

.gallery27-bid-item__thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery27-bid-item__content {
  flex: 1;
  min-width: 0;
}

.gallery27-bid-item__header {
  display: flex;
  justify-content: space-between;
  gap: var(--spacer-sm);
}

.gallery27-bid-item__amount {
  font-weight: var(--font-weight-bold);
}

.gallery27-bid-item__message {
  margin: var(--spacer-xs) 0;
  color: var(--muted);
  font-size: var(--font-sm);
}

.gallery27-bid-item__footer {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-xs);
  color: var(--muted);
}
</style>
