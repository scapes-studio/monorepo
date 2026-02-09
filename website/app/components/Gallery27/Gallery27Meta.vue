<template>
  <GridArea v-if="!auction" class="gallery27-meta" padding>
    Loading auction data...
  </GridArea>

  <template v-else>
    <GridArea v-if="scapeId" class="gallery27-meta" padding>
      <span>Scape</span>
      <span v-if="auctionStatus === 'not-started'">
        <NuxtLink :to="`/${scapeId}`">
          #{{ scapeId }}
        </NuxtLink>
      </span>
      <span v-else>
        <NuxtLink :to="`/${scapeId}`" :title="`Scape #${scapeId}`">
          <ScapeImage :id="scapeId" />
        </NuxtLink>
      </span>
    </GridArea>

    <GridArea v-if="auctionStatus === 'not-started' && auction.startTimestamp" class="gallery27-meta" padding>
      <span>Starts in</span>
      <span>
        <ClientOnly>
          <Gallery27Countdown :end-timestamp="auction.startTimestamp" />
        </ClientOnly>
      </span>
    </GridArea>

    <GridArea v-if="auctionStatus === 'active' && auction.endTimestamp" class="gallery27-meta" padding>
      <span>Ends in</span>
      <span>
        <ClientOnly>
          <Gallery27Countdown :end-timestamp="auction.endTimestamp" />
        </ClientOnly>
      </span>
    </GridArea>

    <GridArea v-if="auctionStatus !== 'not-started'" class="gallery27-meta" padding>
      <span>Bids</span>
      <span>{{ auction.bidCount }}</span>
    </GridArea>

    <GridArea v-if="auction.bidCount > 0" class="gallery27-meta" padding>
      <span v-if="auctionStatus === 'active'">Current Bid</span>
      <span v-else>Final Bid</span>
      <span>{{ formattedBid }} ETH</span>
    </GridArea>

    <GridArea v-if="ownerDiffersFromWinner" class="gallery27-meta" padding>
      <span>Owner</span>
      <span>
        <AccountLink :address="owner!" />
      </span>
    </GridArea>

    <GridArea v-else-if="auction.latestBidder" class="gallery27-meta" padding>
      <span>{{ auctionStatus === 'ended' || auctionStatus === 'settled' ? 'Winner' :
        'Leading Bidder' }}</span>
      <span>
        <AccountLink :address="auction.latestBidder" />
      </span>
    </GridArea>
  </template>
</template>

<script setup lang="ts">
import type { Gallery27AuctionState } from "~/types/gallery27";

const props = defineProps<{
  auction: Gallery27AuctionState | null;
  isOnChain: boolean;
  owner: string | null;
  scapeId: number | null;
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

const ownerDiffersFromWinner = computed(() => {
  if (!props.owner || !props.auction?.latestBidder) return false;
  if (auctionStatus.value !== "ended" && auctionStatus.value !== "settled") return false;
  return props.owner.toLowerCase() !== props.auction.latestBidder.toLowerCase();
});
</script>

<style scoped>
.gallery27-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacer);

  &>*:first-child {
    color: var(--muted);
  }
}
</style>
