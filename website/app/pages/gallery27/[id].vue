<script setup lang="ts">
const route = useRoute();

const tokenId = computed(() => {
  const id = route.params.id;
  if (typeof id === "string") {
    return parseInt(id, 10);
  }
  return undefined;
});

const tokenIdRef = computed(() => tokenId.value?.toString());

const { data: scape, pending: scapePending, error: scapeError } = await useGallery27Scape(tokenIdRef);

// Radio integration: play the underlying scape when on detail page (client-only)
if (import.meta.client) {
  const { setFixedScape, clearFixedScape } = useScapeRadio();
  watch(
    () => scape.value?.scapeId,
    (scapeId) => {
      if (scapeId) {
        setFixedScape(scapeId);
      }
    },
    { immediate: true },
  );
  onBeforeUnmount(() => {
    clearFixedScape();
  });
}
const { data: auction, pending: auctionPending, isActive, refresh: refreshAuction } = useGallery27Auction(tokenIdRef);
const { data: bidsData, pending: bidsPending, refresh: refreshBids } = await useGallery27Bids(tokenIdRef);

const selectedBidId = ref<string | null>(null);

// Get the selected image for claim flow
const selectedImage = computed(() => {
  if (!bidsData.value || !selectedBidId.value) return null;

  if (selectedBidId.value === "initial") {
    return bidsData.value.initialRender;
  }

  const bid = bidsData.value.bids.find(b => b.id === selectedBidId.value);
  return bid?.image ?? null;
});

// Handle action completion (refresh data)
const handleActionComplete = async () => {
  await Promise.all([refreshAuction(), refreshBids()]);
};

const displayedImage = computed(() => {
  if (!bidsData.value) return null;

  if (selectedBidId.value === "initial") {
    return bidsData.value.initialRender;
  }

  if (selectedBidId.value) {
    const bid = bidsData.value.bids.find(b => b.id === selectedBidId.value);
    return bid?.image ?? null;
  }

  // Default to accepted/winning image, then initial render
  if (bidsData.value.acceptedImage) {
    return bidsData.value.acceptedImage;
  }

  return bidsData.value.initialRender;
});

// Fallback to parent PunkScape image when no AI image is available (future auctions)
const fallbackScapeId = computed(() => scape.value?.scapeId ?? null);
const showFallbackScape = computed(() => !displayedImage.value && fallbackScapeId.value !== null);

// Page meta
useHead({
  title: computed(() => scape.value ? `Day ${scape.value.tokenId} | Gallery27` : "Gallery27"),
});
</script>

<template>
  <div class="gallery27-page">
    <div v-if="scapePending" class="gallery27-page__loading">
      Loading...
    </div>

    <div v-else-if="scapeError" class="gallery27-page__error">
      Failed to load scape. Please check the day number.
    </div>

    <template v-else-if="scape && tokenId">
      <Gallery27Header :token-id="tokenId" :date="scape.date" />

      <div class="gallery27-page__content">
        <div class="gallery27-page__main">
          <Gallery27Painting v-if="displayedImage" :image="displayedImage" :alt="`Day ${tokenId}`" />
          <div v-else-if="showFallbackScape" class="gallery27-page__fallback">
            <ScapesImage :id="fallbackScapeId!" />
          </div>
          <div v-else class="gallery27-page__placeholder">
            No image available
          </div>
        </div>

        <aside class="gallery27-page__sidebar">
          <Gallery27Meta :auction="auction ?? null" :is-on-chain="scape.isMinted" />

          <Gallery27Actions
            v-if="scape.scapeId"
            :punk-scape-id="scape.scapeId"
            :token-id="tokenId"
            :auction="auction ?? null"
            :is-active="isActive"
            :is-minted="scape.isMinted"
            :selected-image="selectedImage"
            @action-complete="handleActionComplete"
          />

          <Gallery27Description :token-id="tokenId" :scape-id="scape.scapeId" :description="scape.description"
            :is-on-chain="scape.isMinted" />

          <Gallery27BidHistory v-if="bidsData" v-model:selected-bid-id="selectedBidId" :bids="bidsData.bids"
            :initial-render="bidsData.initialRender" :accepted-image="bidsData.acceptedImage" />
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.gallery27-page {
  max-width: var(--content-width-wide);
  margin: 0 auto;
  padding: var(--spacer-lg) var(--spacer);
  display: grid;
  gap: var(--spacer-lg);
}

.gallery27-page__loading,
.gallery27-page__error {
  padding: var(--spacer);
  border-radius: var(--size-3);
  background: var(--gray-z-1);
}

.gallery27-page__error {
  background: oklch(from var(--error) l c h / 0.1);
}

.gallery27-page__content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--spacer-lg);
}

@media (max-width: 900px) {
  .gallery27-page__content {
    grid-template-columns: 1fr;
  }
}

.gallery27-page__main {
  display: grid;
  gap: var(--spacer);
}

.gallery27-page__sidebar {
  display: grid;
  gap: var(--spacer-lg);
  align-content: start;
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
