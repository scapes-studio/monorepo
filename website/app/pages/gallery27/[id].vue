<template>
  <GridArea
    v-if="scapePending"
    padding
    center
    width="content"
  >
    Loading...
  </GridArea>

  <GridArea
    v-else-if="scapeError"
    padding
    center
    width="content"
  >
    Failed to load scape. Please check the day number.
  </GridArea>

  <section
    v-else-if="scape && tokenId"
    class="gallery27-page"
  >
    <GridArea
      rows="1"
      padding
      tag="header"
    >
      <div>
        <h1>Day {{ tokenId }}</h1>
        <p
          v-if="formattedDate"
          class="gallery27-page__date"
        >
          {{ formattedDate }}
        </p>
      </div>

      <nav class="gallery27-page__nav">
        <NuxtLink
          v-if="tokenId > 1"
          :to="`/gallery27/${tokenId - 1}`"
        >
          Previous
        </NuxtLink>
        <NuxtLink
          v-if="tokenId < 10000"
          :to="`/gallery27/${tokenId + 1}`"
        >
          Next
        </NuxtLink>
      </nav>
    </GridArea>

    <GridArea
      rows="calc(var(--content-columns, 5) * 2)"
      class="main-image"
    >
      <Gallery27Painting
        v-if="displayedImage"
        :image="displayedImage"
        :alt="`Day ${tokenId}`"
      />
      <ScapeImage
        v-else
        :id="fallbackScapeId!"
        class="fallback"
      />
    </GridArea>

    <Gallery27Meta
      :auction="auction ?? null"
      :is-on-chain="scape.isMinted"
      :owner="scape.owner"
      :punk-scape-owner="scape.punkScapeOwner"
      :scape-id="scape.scapeId"
      :description="scape.description"
    />

    <Gallery27Actions
      v-if="scape.scapeId"
      :punk-scape-id="scape.scapeId"
      :token-id="tokenId"
      :auction="auction ?? null"
      :latest-bidder="latestBidder"
      :punk-scape-owner="scape.punkScapeOwner"
      :is-active="isActive"
      :has-ended="hasEnded"
      :is-minted="scape.isMinted"
      :selected-image="selectedImage"
      @action-complete="handleActionComplete"
    />

    <Gallery27BidHistory
      v-if="bidsData && (isActive || hasEnded) && bidsData.bids?.length > 0"
      v-model:selected-bid-id="selectedBidId"
      :bids="bidsData.bids"
      :is-active="isActive"
      :initial-render="bidsData.initialRender"
      :accepted-image="bidsData.acceptedImage"
      class="border-drop_"
    />
  </section>
</template>

<script setup lang="ts">
const route = useRoute()

const tokenId = computed(() => {
  const id = route.params.id
  if (typeof id === 'string') {
    return parseInt(id, 10)
  }
  return undefined
})

const tokenIdRef = computed(() => tokenId.value?.toString())

const {
  data: scape,
  pending: scapePending,
  error: scapeError,
} = await useGallery27Scape(tokenIdRef)

// Date formatting (inlined from Gallery27Header)
const formattedDate = computed(() => {
  if (!scape.value?.date) return null
  return new Date(scape.value.date * 1000).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

// Radio integration: play the underlying scape when on detail page (client-only)
if (import.meta.client) {
  const { setFixedScape, clearFixedScape } = useScapeRadio()
  watch(
    () => scape.value?.scapeId,
    (scapeId) => {
      if (scapeId) {
        setFixedScape(scapeId)
      }
    },
    { immediate: true },
  )
  onBeforeUnmount(() => {
    clearFixedScape()
  })
}
const {
  data: auction,
  pending: auctionPending,
  isActive,
  hasEnded,
  refresh: refreshAuction,
} = useGallery27Auction(tokenIdRef)
const {
  data: bidsData,
  pending: bidsPending,
  refresh: refreshBids,
} = await useGallery27Bids(tokenIdRef)

const selectedBidId = ref<string | null>(null)

// Get the selected image for claim flow (defaults to displayed image)
const selectedImage = computed(() => {
  if (!bidsData.value) return null

  if (selectedBidId.value === 'initial') {
    return bidsData.value.initialRender
  }

  if (selectedBidId.value) {
    const bid = bidsData.value.bids.find((b) => b.id === selectedBidId.value)
    return bid?.image ?? null
  }

  // Default to accepted/winning image, then initial render (same as displayedImage)
  if (bidsData.value.acceptedImage) {
    return bidsData.value.acceptedImage
  }

  return bidsData.value.initialRender
})

// Get the latest bidder (winner) - prefer auction data, fallback to first bid
const latestBidder = computed(() => {
  // First try onchain auction data
  if (auction.value?.latestBidder) {
    return auction.value.latestBidder
  }
  // Fallback to first bid in list (bids are ordered by timestamp desc)
  const firstBid = bidsData.value?.bids[0]
  if (firstBid) {
    return firstBid.bidder
  }
  return null
})

// Handle action completion (refresh data)
const handleActionComplete = async () => {
  await Promise.all([refreshAuction(), refreshBids()])
}

const displayedImage = computed(() => {
  if (!bidsData.value) return null

  if (selectedBidId.value === 'initial') {
    return bidsData.value.initialRender
  }

  if (selectedBidId.value) {
    const bid = bidsData.value.bids.find((b) => b.id === selectedBidId.value)
    return bid?.image ?? null
  }

  // Default to accepted/winning image, then initial render
  if (bidsData.value.acceptedImage) {
    return bidsData.value.acceptedImage
  }

  return bidsData.value.initialRender
})

// Fallback to parent PunkScape image when no AI image is available (future auctions)
const fallbackScapeId = computed(() => scape.value?.scapeId ?? null)

// Page meta
const ogDay = computed(() => scape.value?.tokenId)
const ogImage = computed(() => {
  const imagePath = displayedImage.value?.path
  if (imagePath) {
    return `https://cdn.scapes.xyz/${imagePath}`
  }
  if (scape.value?.scapeId) {
    return `https://scapes.xyz/__og-image__/image/${scape.value.scapeId}/og.png`
  }
  return 'https://scapes.xyz/og-default.png'
})
const ogTitle = computed(() =>
  ogDay.value ? `Day ${ogDay.value}` : 'Gallery27',
)
const ogSubtitle = computed(
  () =>
    scape.value?.description ||
    (ogDay.value
      ? `Day ${ogDay.value} of the 27 Year Scapes collection.`
      : '27 Year Scapes gallery.'),
)

const seoOptions = computed(() => ({
  title: ogTitle.value,
  description: ogSubtitle.value,
  image: ogImage.value,
}))
useSeo(seoOptions)
</script>

<style scoped>
.gallery27-page {
  max-width: var(--content-width);
  margin: 0 auto;
  display: grid;
  gap: var(--grid-gutter);
  container-type: inline-size;

  > header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    > div {
      display: flex;
      flex-direction: column;
      justify-content: center;

      > h1 {
        margin: 0;
      }
    }
  }

  > .main-image {
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;

    > .fallback {
      max-width: var(--content-width-small);
    }
  }
}

.gallery27-page__image {
  position: relative;
  justify-self: center;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16%;
}

.gallery27-page__header {
}

.gallery27-page__date {
  margin: 0;
  color: var(--muted);
  font-size: var(--font-sm);
}

.gallery27-page__nav {
  display: flex;
  gap: var(--spacer);
}

.gallery27-page__fallback {
  aspect-ratio: 1;
  border-radius: var(--spacer-xs);
  overflow: hidden;
  background: var(--gray-z-1);
}

.gallery27-page__placeholder {
  aspect-ratio: 1;
  border-radius: var(--spacer-xs);
  background: var(--gray-z-1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
}
</style>
