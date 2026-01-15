<script setup lang="ts">
import type { Gallery27Bid, Gallery27Image } from "~/types/gallery27";

const CDN_BASE = "https://cdn.scapes.xyz";

const props = defineProps<{
  bids: Gallery27Bid[];
  initialRender: Gallery27Image | null;
}>();

const selectedBidId = defineModel<string | null>("selectedBidId");

const initialRenderThumbnail = computed(() => {
  if (!props.initialRender?.path) return null;
  return `${CDN_BASE}/${props.initialRender.path}`;
});

const selectedImage = computed(() => {
  if (selectedBidId.value === "initial") {
    return props.initialRender;
  }
  if (selectedBidId.value) {
    const bid = props.bids.find(b => b.id === selectedBidId.value);
    return bid?.image ?? null;
  }
  return null;
});

defineExpose({ selectedImage });
</script>

<template>
  <div class="gallery27-bid-history">
    <h3>Bid History ({{ bids.length }})</h3>

    <div
      v-if="initialRender"
      class="gallery27-bid-history__initial"
      :class="{ 'gallery27-bid-history__initial--selected': selectedBidId === 'initial' }"
      @click="selectedBidId = 'initial'"
    >
      <div v-if="initialRenderThumbnail" class="gallery27-bid-history__initial-thumbnail">
        <img :src="initialRenderThumbnail" alt="Initial Render" />
      </div>
      <div class="gallery27-bid-history__initial-label">Initial Render</div>
    </div>

    <div v-if="bids.length === 0" class="gallery27-bid-history__empty">
      No bids yet
    </div>

    <div v-else class="gallery27-bid-history__list">
      <Gallery27BidItem
        v-for="bid in bids"
        :key="bid.id"
        :bid="bid"
        :selected="selectedBidId === bid.id"
        @select="selectedBidId = bid.id"
      />
    </div>
  </div>
</template>

<style scoped>
.gallery27-bid-history {
  display: grid;
  gap: var(--spacer);
}

.gallery27-bid-history h3 {
  margin: 0;
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
  font-weight: var(--font-weight-bold);
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
