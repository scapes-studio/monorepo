<script setup lang="ts">
import type { Gallery27AuctionState } from "~/types/gallery27";

const props = defineProps<{
  auction: Gallery27AuctionState | null;
  isOnChain: boolean
}>();

const formattedBid = computed(() => {
  if (!props.auction?.latestBid) return null;
  const eth = Number(props.auction.latestBid) / 1e18;
  return formatETH(eth);
});

const auctionStatus = computed(() => {
  if (!props.auction) return "loading";
  if (props.auction.settled) return "settled";

  const now = Math.floor(Date.now() / 1000);

  // Check if auction has started
  if (props.auction.startTimestamp && now < props.auction.startTimestamp) {
    return "not-started";
  }

  if (!props.auction.endTimestamp) return "not-started";
  if (props.isOnChain || (now >= props.auction.endTimestamp)) return "ended";
  return "active";
});
</script>

<template>
  <div class="gallery27-meta">
    <div v-if="!auction" class="gallery27-meta__loading">
      Loading auction data...
    </div>

    <template v-else>
      <div class="gallery27-meta__row">
        <span class="gallery27-meta__label">Status</span>
        <span class="gallery27-meta__value">
          <template v-if="auctionStatus === 'settled'">Settled</template>
          <template v-else-if="auctionStatus === 'ended'">Ended</template>
          <template v-else-if="auctionStatus === 'active'">Active</template>
          <template v-else>Not Started</template>
        </span>
      </div>

      <div v-if="auction.bidCount > 0" class="gallery27-meta__row">
        <span class="gallery27-meta__label">Current Bid</span>
        <span class="gallery27-meta__value">{{ formattedBid }} ETH</span>
      </div>

      <div v-if="auctionStatus !== 'not-started'" class="gallery27-meta__row">
        <span class="gallery27-meta__label">Bids</span>
        <span class="gallery27-meta__value">{{ auction.bidCount }}</span>
      </div>

      <div v-if="auctionStatus === 'not-started' && auction.startTimestamp" class="gallery27-meta__row">
        <span class="gallery27-meta__label">Starts in</span>
        <span class="gallery27-meta__value">
          <ClientOnly>
            <Gallery27Countdown :end-timestamp="auction.startTimestamp" />
          </ClientOnly>
        </span>
      </div>

      <div v-if="auctionStatus === 'active' && auction.endTimestamp" class="gallery27-meta__row">
        <span class="gallery27-meta__label">Ends in</span>
        <span class="gallery27-meta__value">
          <ClientOnly>
            <Gallery27Countdown :end-timestamp="auction.endTimestamp" />
          </ClientOnly>
        </span>
      </div>

      <div v-if="auction.latestBidder" class="gallery27-meta__row">
        <span class="gallery27-meta__label">{{ auctionStatus === 'ended' || auctionStatus === 'settled' ? 'Winner' :
          'Leading Bidder' }}</span>
        <span class="gallery27-meta__value">
          <AccountLink :address="auction.latestBidder" />
        </span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.gallery27-meta {
  display: grid;
  gap: var(--spacer-sm);
}

.gallery27-meta__loading {
  color: var(--muted);
}

.gallery27-meta__row {
  display: flex;
  justify-content: space-between;
  gap: var(--spacer);
}

.gallery27-meta__label {
  color: var(--muted);
}

.gallery27-meta__value {
  font-weight: var(--font-weight-bold);
}
</style>
