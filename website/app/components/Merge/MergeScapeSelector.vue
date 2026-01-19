<script setup lang="ts">
import type { ScapeRecord } from "~/composables/useScapesByOwner";

const props = defineProps<{
  selectedIds: bigint[];
  isFull: boolean;
}>();

const emit = defineEmits<{
  select: [id: bigint];
}>();

const { address, isConnected } = useConnection();
const onlyOwned = ref(false);
const searchQuery = ref("");

const ownerAddress = computed(() =>
  onlyOwned.value && address.value ? address.value : null,
);

const selectedTraits = ref<string[]>([]);
const sortBy = ref<"id-asc" | "id-desc">("id-asc");

const galleryData = useScapesGallery(selectedTraits, sortBy, ref(false));
const ownerData = await useScapesByOwner(ownerAddress);

const searchedId = computed(() => {
  const num = parseInt(searchQuery.value, 10);
  if (isNaN(num) || num < 1 || num > 10000) return null;
  if (props.selectedIds.includes(BigInt(num))) return null;
  return BigInt(num);
});

const scapes = computed(() => {
  const source = onlyOwned.value ? ownerData.scapes.value : galleryData.scapes.value;
  return source.filter((s) => !props.selectedIds.includes(s.id));
});

const loading = computed(() =>
  onlyOwned.value ? ownerData.loading.value : galleryData.loading.value,
);

const hasMore = computed(() =>
  onlyOwned.value ? ownerData.hasMore.value : galleryData.hasMore.value,
);

const loadMore = () => {
  if (onlyOwned.value) {
    ownerData.loadMore();
  } else {
    galleryData.loadMore();
  }
};

const handleSelect = (scape: ScapeRecord) => {
  if (props.isFull) return;
  emit("select", scape.id);
};

const handleSearchSelect = () => {
  if (props.isFull || !searchedId.value) return;
  emit("select", searchedId.value);
  searchQuery.value = "";
};
</script>

<template>
  <div class="merge-selector">
    <div class="merge-selector__header">
      <h3>Select Scapes</h3>
    </div>

    <input v-model="searchQuery" type="text" inputmode="numeric" placeholder="Search by ID (1-10000)"
      class="merge-selector__search" />

    <button v-if="searchedId" type="button" class="merge-selector__search-result" :disabled="isFull"
      @click="handleSearchSelect">
      <ScapesImage :id="searchedId" />
      <span class="merge-selector__id">#{{ searchedId }}</span>
    </button>

    <label v-if="isConnected" class="merge-selector__toggle">
      <input v-model="onlyOwned" type="checkbox" />
      <span>Only owned</span>
    </label>

    <div v-if="loading && scapes.length === 0" class="merge-selector__loading">
      Loading scapes...
    </div>

    <div v-else-if="scapes.length === 0" class="merge-selector__empty">
      <template v-if="onlyOwned">
        No owned Scapes found
      </template>
      <template v-else>
        No Scapes available
      </template>
    </div>

    <div v-else class="merge-selector__grid">
      <button v-for="scape in scapes" :key="`${scape.id}`" type="button" class="merge-selector__item" :disabled="isFull"
        @click="handleSelect(scape)">
        <ScapesImage :id="scape.id" />
        <span class="merge-selector__id">#{{ scape.id }}</span>
      </button>
    </div>

    <button v-if="hasMore && scapes.length > 0" type="button" class="merge-selector__load-more" :disabled="loading"
      @click="loadMore">
      {{ loading ? "Loading..." : "Load more" }}
    </button>
  </div>
</template>

<style scoped>
.merge-selector {
  display: flex;
  flex-direction: column;
  gap: var(--spacer);
}

.merge-selector__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacer);
}

.merge-selector__header h3 {
  margin: 0;
  font-size: var(--font-lg);
}

.merge-selector__toggle {
  display: flex;
  align-items: center;
  gap: var(--spacer-xs);
  cursor: pointer;
  font-size: var(--font-sm);
}

.merge-selector__toggle input {
  width: 16px;
  height: 16px;
}

.merge-selector__search {
  padding: var(--spacer-sm);
  border: 1px solid var(--border);
  border-radius: var(--spacer-xs);
  background: var(--background);
  font-size: var(--font-sm);
}

.merge-selector__search:focus {
  outline: none;
  border-color: var(--color);
}

.merge-selector__search-result {
  display: flex;
  align-items: center;
  gap: var(--spacer-sm);
  padding: var(--spacer-sm);
  border: 2px solid var(--color);
  border-radius: var(--spacer-xs);
  background: var(--gray-z-1);
  cursor: pointer;
  text-align: left;
}

.merge-selector__search-result:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.merge-selector__search-result img {
  width: 48px;
  height: 48px;
  border-radius: var(--spacer-xs);
}

.merge-selector__loading,
.merge-selector__empty {
  text-align: center;
  color: var(--muted);
  padding: var(--spacer-lg);
}

.merge-selector__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr));
  gap: var(--spacer-xs);
}

.merge-selector__item {
  display: block;
  padding: 0;
  border: 2px solid transparent;
  border-radius: var(--spacer-xs);
  background: none;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s;
}

.merge-selector__item:hover:not(:disabled) {
  border-color: var(--color);
}

.merge-selector__item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.merge-selector__item img {
  border-radius: var(--spacer-xs);
}

.merge-selector__id {
  display: block;
  font-size: var(--font-xs);
  color: var(--muted);
  margin-top: var(--spacer-xs);
}

.merge-selector__load-more {
  padding: var(--spacer-sm) var(--spacer);
  border: 1px solid var(--border);
  border-radius: var(--spacer-xs);
  background: var(--background);
  cursor: pointer;
  font-size: var(--font-sm);
}

.merge-selector__load-more:hover:not(:disabled) {
  background: var(--gray-z-1);
}

.merge-selector__load-more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
