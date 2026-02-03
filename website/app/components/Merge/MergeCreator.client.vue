<template>
  <div class="merge-creator">
    <GridArea class="merge-creator__preview" width="full" padding rows="calc(var(--content-columns, 5) * 2)">
      <div class="merge-creator__preview-layout">
        <div class="merge-creator__canvas">
          <div v-if="previewLoading" class="merge-creator__placeholder">
            Loading preview...
          </div>
          <div v-else-if="previewError" class="merge-creator__error">
            {{ previewError.message }}
          </div>
          <img
            v-else-if="previewUrl && scapes.length >= 2"
            class="merge-creator__image"
            :src="previewUrl"
            alt="Merge preview"
          />
          <div v-else-if="scapes.length > 0" class="merge-creator__placeholder">
            Select at least 2 Scapes to preview
          </div>
          <div v-else class="merge-creator__placeholder">
            Select Scapes to merge
          </div>
        </div>

        <div class="merge-creator__actions">
          <div class="merge-creator__mode">
            <label class="merge-creator__toggle">
              <input v-model="fadeMode" type="checkbox" />
              <span>{{ fadeMode ? "Fade" : "Merge" }}</span>
            </label>
            <button
              v-if="scapes.length > 0"
              type="button"
              class="merge-creator__clear"
              @click="clear"
            >
              Clear
            </button>
          </div>

          <EvmTransactionFlow
            :text="transactionText"
            :request="mergeRequest"
            @complete="handleMergeComplete"
          >
            <template #start="{ start }">
              <button
                type="button"
                class="merge-creator__merge-btn"
                :disabled="!canMerge"
                @click="start"
              >
                {{ canMerge ? `Merge ${scapes.length} Scapes` : "Select at least 2 Scapes" }}
              </button>
            </template>

            <template #complete>
              <NuxtLink :to="`/scapes/${tokenId}`" class="merge-creator__view-link">
                View your Merge
              </NuxtLink>
            </template>
          </EvmTransactionFlow>
        </div>
      </div>
    </GridArea>

    <GridArea class="merge-creator__selected" width="full" padding :rows="2">
      <div class="merge-creator__selected-header">
        <h3>Selected Scapes</h3>
        <span class="merge-creator__selected-count">{{ scapes.length }}/8</span>
      </div>

      <div v-if="scapes.length === 0" class="merge-creator__status">
        No Scapes selected yet.
      </div>

      <div v-else class="merge-creator__selected-grid">
        <div v-for="(scape, index) in scapes" :key="String(scape[0])" class="merge-creator__selected-item">
          <ScapeImage :id="scape[0]" />
          <div class="merge-creator__selected-controls">
            <button
              type="button"
              class="merge-creator__selected-btn"
              :class="{ active: scape[1] }"
              title="Flip horizontal"
              @click="toggleFlipX(index)"
            >
              Flip
            </button>
            <button
              type="button"
              class="merge-creator__selected-btn merge-creator__selected-btn--remove"
              title="Remove"
              @click="removeScape(index)"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </GridArea>

    <div class="merge-creator__catalog">
      <div class="merge-creator__catalog-header">
        <h3>Select Scapes</h3>
        <div class="merge-creator__catalog-controls">
          <input
            v-model="searchQuery"
            type="text"
            inputmode="numeric"
            placeholder="Search by ID (1-10000)"
            class="merge-creator__search"
          />
          <label v-if="isConnected" class="merge-creator__toggle">
            <input v-model="onlyOwned" type="checkbox" />
            <span>Only owned</span>
          </label>
        </div>
      </div>

      <button
        v-if="searchedId"
        type="button"
        class="merge-creator__search-result"
        :disabled="isFull"
        @click="handleSearchSelect"
      >
        <ScapeImage :id="searchedId" />
        <span class="merge-creator__scape-id">#{{ searchedId }}</span>
      </button>

      <div v-if="loading && availableScapes.length === 0" class="merge-creator__status">
        Loading scapes...
      </div>
      <div v-else-if="scapeError" class="merge-creator__status merge-creator__status--error">
        Unable to load scapes right now.
      </div>
      <div v-else-if="availableScapes.length === 0" class="merge-creator__status">
        No Scapes available.
      </div>

      <ScapesGrid v-else :scapes="availableScapes" :columns="gridColumns">
        <template #item="{ scape, scapeCount }">
          <button
            type="button"
            class="merge-creator__scape"
            :disabled="isFull"
            @click="handleSelect(scape)"
          >
            <ScapeImage :id="scape.id" :scape-count="scapeCount" />
            <span class="merge-creator__scape-id">#{{ scape.id }}</span>
          </button>
        </template>
      </ScapesGrid>

      <button
        v-if="hasMore && availableScapes.length > 0"
        type="button"
        class="merge-creator__load-more"
        :disabled="loading"
        @click="loadMore"
      >
        {{ loading ? "Loading..." : "Load more" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { scapesABI } from "@scapes-studio/abis";
import { writeContract } from "@wagmi/core";
import { useConnection, type Config } from "@wagmi/vue";
import type { Hash } from "viem";

import type { ScapeRecord } from "~/composables/useScapesByOwner";

const SCAPES_CONTRACT = "0xb7def63a9040ad5dc431aff79045617922f4023a" as const;

const { $wagmi } = useNuxtApp();
const router = useRouter();
const { address, isConnected } = useConnection();

const {
  scapes,
  fadeMode,
  tokenId,
  canMerge,
  isFull,
  selectedIds,
  addScape,
  removeScape,
  toggleFlipX,
  clear,
} = useMergeCreator();

const { previewUrl, isLoading: previewLoading, error: previewError } = useMergePreview(tokenId);

const onlyOwned = ref(false);
const searchQuery = ref("");

const ownerAddress = computed(() =>
  onlyOwned.value && address.value ? address.value : null,
);

const selectedTraits = ref<string[]>([]);
const sortBy = ref<"id-asc" | "id-desc">("id-asc");

const galleryData = useScapesGallery(selectedTraits, sortBy, ref(false));
const ownerData = await useScapesByOwner(ownerAddress);

const availableScapes = computed(() => {
  const source = onlyOwned.value ? ownerData.scapes.value : galleryData.scapes.value;
  return source.filter((s) => !selectedIds.value.includes(s.id));
});

const loading = computed(() =>
  onlyOwned.value ? ownerData.loading.value : galleryData.loading.value,
);

const scapeError = computed(() =>
  onlyOwned.value ? ownerData.error.value : galleryData.error.value,
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

const searchedId = computed(() => {
  const num = parseInt(searchQuery.value, 10);
  if (Number.isNaN(num) || num < 1 || num > 10000) return null;
  if (selectedIds.value.includes(BigInt(num))) return null;
  return BigInt(num);
});

const handleSearchSelect = () => {
  if (isFull.value || !searchedId.value) return;
  addScape(searchedId.value);
  searchQuery.value = "";
};

const handleSelect = (scape: ScapeRecord) => {
  if (isFull.value) return;
  addScape(scape.id);
};

const { columns } = useScapeGrid();
const gridColumns = computed(() => Math.max(1, columns.value));

const mergeRequest = async (): Promise<Hash> => {
  return writeContract($wagmi as Config, {
    address: SCAPES_CONTRACT,
    abi: scapesABI,
    functionName: "merge",
    args: [tokenId.value],
  });
};

const handleMergeComplete = () => {
  router.push(`/scapes/${tokenId.value}`);
};

const transactionText = computed(() => ({
  title: {
    confirm: "Create Merge",
    requesting: "Confirm in Wallet",
    waiting: "Creating Merge",
    complete: "Merge Created!",
  },
  lead: {
    confirm: `Merge ${scapes.value.length} Scapes into a new unique artwork.`,
    requesting: "Please confirm the transaction in your wallet.",
    waiting: "Your merge is being created on-chain.",
    complete: "Your merge has been created successfully!",
  },
  action: {
    confirm: "Create Merge",
    error: "Try Again",
  },
}));
</script>

<style scoped>
.merge-creator {
  display: grid;
  gap: var(--grid-gutter);
}

.merge-creator__preview {
  display: grid;
}

.merge-creator__preview-layout {
  display: grid;
  gap: var(--spacer);
  height: 100%;
  grid-template-rows: minmax(0, 1fr) auto;
}

.merge-creator__canvas {
  aspect-ratio: 1;
  background: var(--gray-z-1);
  border-radius: var(--spacer-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 100%;
}

.merge-creator__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.merge-creator__placeholder {
  color: var(--muted);
  font-size: var(--font-sm);
  text-align: center;
  padding: var(--spacer);
}

.merge-creator__error {
  color: var(--error);
  font-size: var(--font-sm);
  text-align: center;
  padding: var(--spacer);
}

.merge-creator__actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacer);
}

.merge-creator__mode {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacer);
  justify-content: space-between;
}

.merge-creator__toggle {
  display: flex;
  align-items: center;
  gap: var(--spacer-xs);
  cursor: pointer;
  font-size: var(--font-sm);
}

.merge-creator__toggle input {
  width: 16px;
  height: 16px;
}

.merge-creator__clear {
  padding: var(--spacer-xs) var(--spacer-sm);
  border: 1px solid var(--border);
  border-radius: var(--spacer-xs);
  background: none;
  cursor: pointer;
  font-size: var(--font-sm);
}

.merge-creator__clear:hover {
  background: var(--gray-z-1);
}

.merge-creator__merge-btn {
  width: 100%;
  padding: var(--spacer) var(--spacer-lg);
  border: none;
  border-radius: var(--spacer-xs);
  background: var(--color);
  color: var(--background);
  font-size: var(--font-lg);
  cursor: pointer;
}

.merge-creator__merge-btn:disabled {
  background: var(--gray-z-2);
  color: var(--muted);
  cursor: not-allowed;
}

.merge-creator__merge-btn:not(:disabled):hover {
  opacity: 0.9;
}

.merge-creator__view-link {
  display: block;
  text-align: center;
  padding: var(--spacer) var(--spacer-lg);
  border: 1px solid var(--color);
  border-radius: var(--spacer-xs);
  color: var(--color);
  text-decoration: none;
}

.merge-creator__view-link:hover {
  background: var(--gray-z-1);
}

.merge-creator__selected {
  display: grid;
  gap: var(--spacer);
}

.merge-creator__selected-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacer);
}

.merge-creator__selected-header h3,
.merge-creator__catalog-header h3 {
  margin: 0;
  font-size: var(--font-lg);
}

.merge-creator__selected-count {
  font-size: var(--font-sm);
  color: var(--muted);
}

.merge-creator__selected-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(calc(var(--scape-width) / 2), 1fr));
  gap: var(--spacer-xs);
}

.merge-creator__selected-item {
  display: grid;
  gap: var(--spacer-xs);
  text-align: center;
}

.merge-creator__selected-controls {
  display: flex;
  gap: var(--spacer-xs);
  justify-content: center;
}

.merge-creator__selected-btn {
  padding: 0 var(--spacer-sm);
  border: 1px solid var(--border);
  border-radius: var(--spacer-xs);
  background: var(--background);
  color: var(--color);
  font-size: var(--font-xs);
  cursor: pointer;
}

.merge-creator__selected-btn.active {
  background: var(--color);
  color: var(--background);
}

.merge-creator__selected-btn--remove {
  border-color: var(--error);
  color: var(--error);
}

.merge-creator__catalog {
  display: grid;
  gap: var(--spacer);
}

.merge-creator__catalog-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacer);
}

.merge-creator__catalog-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacer);
}

.merge-creator__search {
  padding: var(--spacer-sm);
  border: 1px solid var(--border);
  border-radius: var(--spacer-xs);
  background: var(--background);
  font-size: var(--font-sm);
}

.merge-creator__search:focus {
  outline: none;
  border-color: var(--color);
}

.merge-creator__search-result {
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

.merge-creator__search-result:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.merge-creator__search-result img {
  width: calc(var(--scape-width) / 3);
  height: calc(var(--scape-width) / 3);
  border-radius: var(--spacer-xs);
}

.merge-creator__scape {
  display: block;
  width: 100%;
  padding: 0;
  border: 2px solid transparent;
  border-radius: var(--spacer-xs);
  background: none;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s;
}

.merge-creator__scape:hover:not(:disabled) {
  border-color: var(--color);
}

.merge-creator__scape:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.merge-creator__scape-id {
  display: block;
  font-size: var(--font-xs);
  color: var(--muted);
  margin-top: var(--spacer-xs);
}

.merge-creator__status {
  text-align: center;
  color: var(--muted);
  padding: var(--spacer-lg);
  background: var(--gray-z-1);
  border-radius: var(--spacer-xs);
}

.merge-creator__status--error {
  background: oklch(from var(--error) l c h / 0.1);
  color: var(--error);
}

.merge-creator__load-more {
  padding: var(--spacer-sm) var(--spacer);
  border: 1px solid var(--border);
  border-radius: var(--spacer-xs);
  background: var(--background);
  cursor: pointer;
  font-size: var(--font-sm);
}

.merge-creator__load-more:hover:not(:disabled) {
  background: var(--gray-z-1);
}

.merge-creator__load-more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
