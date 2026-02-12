<template>
  <GridArea
    padding
    class="bid-history-header"
  >
    <h1>
      History <small class="muted">Every bid transforms the visual</small>
    </h1>
    <span class="muted"> {{ bids.length }} bids </span>
  </GridArea>

  <Gallery27BidItem
    v-for="bid in bids"
    :key="bid.id"
    :bid="bid"
    :selected="activeBidId === bid.id"
    @select="selectedBidId = bid.id"
  />

  <GridArea
    v-if="initialRender"
    class="initial-render history-item"
    :class="{
      'gallery27-bid-history__initial--selected': activeBidId === 'initial',
    }"
    @click="selectedBidId = 'initial'"
    rows="2"
  >
    <img
      v-if="initialRenderThumbnail"
      :src="initialRenderThumbnail"
      alt="Initial Render"
    />
    <div class="content">
      <h2>Initial Render</h2>
      <p class="muted">Every scape starts with an initial render.</p>
    </div>
  </GridArea>

  <GridArea
    v-if="bids.length === 0"
    padding
    center
    class="muted"
  >
    {{ isActive ? 'No bids yet' : 'No bids' }}
  </GridArea>
</template>

<script setup lang="ts">
import type { Gallery27Bid, Gallery27Image } from '~/types/gallery27'

const CDN_BASE = 'https://cdn.scapes.xyz'

const props = defineProps<{
  bids: Gallery27Bid[]
  isActive: boolean
  initialRender: Gallery27Image | null
  acceptedImage: Gallery27Image | null
}>()

const selectedBidId = defineModel<string | null>('selectedBidId')

const initialRenderThumbnail = computed(() => {
  if (!props.initialRender?.path) return null
  return `${CDN_BASE}/${props.initialRender.path}`
})

// Determine which item is currently "active" (displayed in the painting)
const activeBidId = computed(() => {
  if (selectedBidId.value) return selectedBidId.value

  // Default: find bid matching accepted image, or fall back to initial
  if (props.acceptedImage) {
    const acceptedBid = props.bids.find(
      (b) => b.image?.id === props.acceptedImage?.id,
    )
    if (acceptedBid) return acceptedBid.id
  }

  return 'initial'
})

const selectedImage = computed(() => {
  if (selectedBidId.value === 'initial') {
    return props.initialRender
  }
  if (selectedBidId.value) {
    const bid = props.bids.find((b) => b.id === selectedBidId.value)
    return bid?.image ?? null
  }
  return null
})

defineExpose({ selectedImage })
</script>

<style scoped>
.bid-history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--scape-height-gutter);

  & > h1 {
    margin: 0;

    & > small {
      display: block;
      font-size: var(--font-sm);
    }
  }
}

.history-item {
  display: grid;
  grid-template-columns: calc(
      var(--scape-height-gutter) * 2 - var(--grid-gutter)
    ) 1fr;
  gap: var(--spacer);
  padding: var(--spacer);
  align-items: center;
  transition: background var(--speed);

  &:hover {
    background: var(--gray-z-0) !important;
  }

  &:deep(img) {
    height: 100%;
    object-fit: cover;
  }

  & > .content {
    display: grid;
    gap: var(--spacer-xs);
    align-items: center;

    & h2 {
      white-space: nowrap;
    }

    & p {
      font-size: var(--font-sm);
    }
  }
}

.gallery27-bid-history__initial {
  display: flex;
  align-items: center;
  gap: var(--spacer);
  padding: var(--spacer-sm);
  border-radius: var(--spacer-xs);
  cursor: pointer;
}

.gallery27-bid-history__initial:hover,
.gallery27-bid-history__initial--selected {
  background: var(--gray-z-1);
}

.gallery27-bid-history__initial-thumbnail {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: var(--spacer-xs);
  overflow: hidden;
}

.gallery27-bid-history__initial-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery27-bid-history__initial-label {
}

.gallery27-bid-history__empty {
  color: var(--muted);
  padding: var(--spacer);
}

.gallery27-bid-history__list {
  display: grid;
  gap: var(--spacer-xs);
}
</style>
