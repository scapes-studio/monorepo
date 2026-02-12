<template>
  <GridArea
    rows="2"
    class="history-item"
    @click="$emit('select')"
  >
    <img
      v-if="thumbnailUrl"
      :src="thumbnailUrl"
      :alt="`Bid by ${bid.bidderEns || bid.bidder}`"
    />

    <div class="content">
      <header>
        <AccountLink
          :address="bid.bidder"
          :ens="bid.bidderEns"
        />
        <span class="gallery27-bid-item__amount"
          >{{ formattedAmount }} ETH</span
        >
      </header>

      <p
        v-if="bid.message"
        class="message"
      >
        {{ bid.message }}
      </p>

      <footer>
        <time :datetime="new Date(bid.timestamp * 1000).toISOString()">{{
          formattedTime
        }}</time>
        <a
          :href="etherscanUrl"
          target="_blank"
          rel="noopener"
          >View tx</a
        >
      </footer>
    </div>
  </GridArea>
</template>

<script setup lang="ts">
import type { Gallery27Bid } from '~/types/gallery27'

const CDN_BASE = 'https://cdn.scapes.xyz'

const props = defineProps<{
  bid: Gallery27Bid
  selected?: boolean
}>()

defineEmits<{
  select: []
}>()

const formattedAmount = computed(() => {
  const eth = Number(props.bid.amount) / 1e18
  return formatETH(eth)
})

const formattedTime = computed(() => {
  return new Date(props.bid.timestamp * 1000).toLocaleString()
})

const etherscanUrl = computed(() => {
  return `https://etherscan.io/tx/${props.bid.txHash}`
})

// Construct thumbnail URL
const thumbnailUrl = computed(() => {
  if (!props.bid.image?.path) return null
  return `${CDN_BASE}/${props.bid.image.path}`
})
</script>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
  gap: var(--spacer-sm);
}

.message {
  margin: var(--spacer-xs) 0;
  color: var(--muted);
  font-size: var(--font-sm);
}

footer {
  margin-top: var(--spacer);
  display: flex;
  justify-content: space-between;
  font-size: var(--font-xs);
  color: var(--muted);
}
</style>
