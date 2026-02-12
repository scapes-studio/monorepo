<template>
  <GridArea
    v-if="isActive || canClaim || canWithdraw"
    class="gallery27-actions"
    rows="2"
    padding
  >
    <header>
      <h1>Auction Status</h1>
      <p v-if="isActive && !isMinted && !latestBidder">
        This auction is open for bidding.
      </p>
      <p v-else-if="isActive && !isMinted">
        Current bid: {{ currentBid }} ETH.
      </p>
      <p v-else-if="canClaim">You won the auction! Claim your scape below.</p>
      <p v-else-if="canWithdraw">You can claim your 50% revenue share!</p>
      <p v-else-if="!isActive && isMinted">This scape has been claimed.</p>
      <p v-else-if="!isActive">This auction has ended.</p>
    </header>

    <EvmConnect
      v-if="!isConnected"
      class-name="small"
    />

    <Gallery27ActionBid
      v-else-if="isActive && !isMinted"
      :punk-scape-id="punkScapeId"
      :auction="auction"
      :latest-bidder="latestBidder"
      @action-complete="emit('actionComplete')"
    />

    <Gallery27ActionClaim
      v-else-if="canClaim"
      :punk-scape-id="punkScapeId"
      :selected-image="selectedImage"
      @action-complete="emit('actionComplete')"
    />

    <Gallery27ActionWithdraw
      v-else-if="canWithdraw"
      :punk-scape-id="punkScapeId"
      :latest-bid="auction!.latestBid!"
      :contract-address="auctionContractAddress!"
      @action-complete="handleWithdrawComplete"
    />
  </GridArea>
</template>

<script setup lang="ts">
import { useConnection } from '@wagmi/vue'
import { formatEther } from 'viem'
import type { Hex } from 'viem'
import type { Gallery27AuctionState, Gallery27Image } from '~/types/gallery27'

const props = defineProps<{
  punkScapeId: number
  tokenId: number
  auction: Gallery27AuctionState | null
  latestBidder: string | null
  punkScapeOwner: string | null
  isActive: boolean
  hasEnded: boolean
  isMinted: boolean
  selectedImage: Gallery27Image | null
}>()

const emit = defineEmits<{
  actionComplete: []
}>()

const { address, isConnected } = useConnection()

const punkScapeIdRef = computed(() => props.punkScapeId)
const { getAuctionFromContract } = useGallery27Actions(punkScapeIdRef)

const rewardsClaimed = ref<boolean | null>(null)
const auctionContractAddress = ref<Hex | null>(null)

const checkRewardsClaimed = async () => {
  try {
    const auction = await getAuctionFromContract()
    rewardsClaimed.value = auction.rewardsClaimed
    auctionContractAddress.value = auction.contractAddress
  } catch {
    rewardsClaimed.value = null
  }
}

watch(
  () => props.hasEnded,
  (hasEnded) => {
    if (hasEnded) checkRewardsClaimed()
  },
  { immediate: true },
)

const isWinner = computed(() => {
  if (!address.value) return false
  if (props.latestBidder) {
    return address.value.toLowerCase() === props.latestBidder.toLowerCase()
  }
  if (props.punkScapeOwner) {
    return address.value.toLowerCase() === props.punkScapeOwner.toLowerCase()
  }
  return false
})

const isPunkScapeOwner = computed(() => {
  if (!address.value || !props.punkScapeOwner) return false
  return address.value.toLowerCase() === props.punkScapeOwner.toLowerCase()
})

const hasBids = computed(() => !!props.latestBidder)

const canClaim = computed(() => {
  return props.hasEnded && !props.isActive && isWinner.value && !props.isMinted
})

const canWithdraw = computed(() => {
  return (
    props.hasEnded &&
    !props.isActive &&
    isPunkScapeOwner.value &&
    hasBids.value &&
    rewardsClaimed.value === false
  )
})

const handleWithdrawComplete = () => {
  rewardsClaimed.value = true
  emit('actionComplete')
}

const currentBid = computed(() => {
  if (!props.auction?.latestBid) return null
  return formatEther(BigInt(props.auction.latestBid))
})
</script>

<style scoped>
.gallery27-actions {
  display: grid;
  gap: var(--spacer-sm);
  margin-top: var(--scape-height-gutter);

  & > header {
    & p {
      color: var(--muted);
      font-size: var(--font-sm);
    }
  }
}
</style>
