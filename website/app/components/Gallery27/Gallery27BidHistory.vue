<script setup lang="ts">
import type { Gallery27Bid, Gallery27Image } from "~/types/gallery27";

const props = defineProps<{
  bids: Gallery27Bid[];
  initialRender: Gallery27Image | null;
}>();

const selectedBidId = defineModel<string | null>("selectedBidId");

const selectedImage = computed(() => {
  if (selectedBidId.value) {
    const bid = props.bids.find(b => b.id === selectedBidId.value);
    return bid?.image ?? null;
  }
  // Default to latest bid's image or initial render
  if (props.bids.length > 0 && props.bids[0]?.image) {
    return props.bids[0].image;
  }
  return props.initialRender;
});

defineExpose({ selectedImage });
</script>

<template>
  <div class="gallery27-bid-history">
    <h3>Bid History ({{ bids.length }})</h3>

    <div v-if="initialRender" class="gallery27-bid-history__initial">
      <button
        class="gallery27-bid-history__initial-btn"
        :class="{ 'gallery27-bid-history__initial-btn--selected': !selectedBidId }"
        @click="selectedBidId = null"
      >
        Initial Render
      </button>
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

.gallery27-bid-history__initial-btn {
  padding: var(--spacer-sm) var(--spacer);
  border: var(--border);
  border-radius: var(--spacer-xs);
  background: transparent;
  cursor: pointer;
}

.gallery27-bid-history__initial-btn--selected {
  background: var(--gray-z-1);
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
