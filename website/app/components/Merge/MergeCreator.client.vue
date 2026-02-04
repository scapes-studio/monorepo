<template>
  <section class="merge-creator">
    <!-- Preview -->
    <div class="merge-creator__canvas">
      <Loading v-if="previewLoading" txt="Loading preview..." />
      <Alert v-else-if="previewError" type="error">
        {{ previewError.message }}
      </Alert>
      <template v-else-if="scapes.length > 0">
        <img v-if="previewUrl && scapes.length >= 2" class="merge-creator__image" :src="previewUrl"
          alt="Merge preview" />
        <p v-else class="muted">
          Select at least 2 Scapes to preview
        </p>

        <div class="scape-actions">
          <div v-for="(scape, index) in scapes" :key="String(scape[0])">
            <Button class="small" :class="{ primary: scape[1] }" title="Flip horizontal" @click="toggleFlipX(index)">
              Flip
            </Button>
            <Button class="small danger" title="Remove" @click="removeScape(index)">
              ×
            </Button>
          </div>
        </div>
      </template>
      <p v-else class="muted">
        Select Scapes to merge
      </p>
    </div>

    <!-- Actions -->
    <GridArea padding class="actions">
      <div>
        <FormCheckbox v-model="fadeMode" class="small">
          {{ fadeMode ? "Fade" : "Merge" }}
        </FormCheckbox>

        <Button v-if="scapes.length > 0" class="small tertiary" @click="clear">
          Clear
        </Button>
      </div>

      <EvmTransactionFlow :text="transactionText" :request="mergeRequest" @complete="handleMergeComplete">
        <template #start="{ start }">
          <Button class="primary small" :disabled="!canMerge" @click="start">
            {{ canMerge ? `Merge ${scapes.length} Scapes` : "Select at least 2 Scapes" }}
          </Button>
        </template>

        <template #complete>
          <Button :to="`/scapes/${tokenId}`" class="tertiary">
            View your Merge
          </Button>
        </template>
      </EvmTransactionFlow>
    </GridArea>

    <!-- Select Scapes -->
    <header class="merge-creator__header">
      <h3>Select Scapes</h3>
      <Actions>
        <FormItem class="small">
          <input v-model="searchQuery" type="text" inputmode="numeric" placeholder="Search by ID (1-10000)" />
        </FormItem>
        <FormCheckbox v-if="isConnected" v-model="onlyOwned" class="small">
          Only owned
        </FormCheckbox>
      </Actions>
    </header>

    <Card v-if="searchedId" class="merge-creator__search-result" :class="{ disabled: isFull }"
      @click="handleSearchSelect">
      <ScapeImage :id="searchedId" />
      <span>#{{ searchedId }}</span>
    </Card>

    <Loading v-if="loading && availableScapes.length === 0" txt="Loading scapes..." />
    <div v-else-if="scapeError" class="merge-creator__status merge-creator__status--error">
      Unable to load scapes right now.
    </div>
    <div v-else-if="availableScapes.length === 0" class="merge-creator__status">
      No Scapes available.
    </div>

    <ScapesGrid v-else :scapes="availableScapes" :columns="contentColumns">
      <template #item="{ scape, scapeCount }">
        <button type="button" class="merge-creator__scape-btn" :disabled="isFull" @click="handleSelect(scape)">
          <ScapeImage :id="scape.id" :scape-count="scapeCount" />
        </button>
      </template>
    </ScapesGrid>

    <Button v-if="hasMore && availableScapes.length > 0" class="merge-creator__load-more small tertiary"
      :disabled="loading" @click="loadMore">
      {{ loading ? "Loading..." : "Load more" }}
    </Button>
  </section>
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
  return source.filter((s) => s.id <= 10000n && !selectedIds.value.includes(s.id));
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

const { contentColumns } = useScapeGrid();

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
  --grid-columns: var(--content-columns);

  display: grid;
  gap: var(--grid-gutter);
  width: var(--content-width);
  margin: auto;
}

.merge-creator__canvas {
  background: var(--background);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacer);
  overflow: hidden;
  width: 100%;
  min-height: calc(var(--scape-height-gutter) * var(--content-columns) - var(--grid-gutter));
  padding: var(--spacer);
}

.merge-creator__image {
  width: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.scape-actions {
  display: flex;
  justify-content: space-evenly;
  width: 100%;

  &>div {
    display: flex;
  }
}

.actions {
  display: flex;
  gap: var(--spacer);
  align-items: center;
  justify-content: space-between;

  &>div {
    display: flex;
    gap: var(--spacer);
    align-items: center;
  }
}

.merge-creator__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: var(--scape-height);
  margin: var(--scape-height-gutter) 0 0;
  background: var(--background);
  padding: var(--spacer);

  &:first-of-type {
    margin-top: 0;
  }

  h3 {
    margin: 0;
  }
}

.merge-creator__status {
  padding: var(--spacer);
  border-radius: var(--radius);
  background: var(--gray-z-1);
}

.merge-creator__status--error {
  background: oklch(from var(--error) l c h / 0.1);
}

.merge-creator__search-result {
  display: flex;
  align-items: center;
  gap: var(--spacer-sm);
  cursor: pointer;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}

.merge-creator__scape-btn {
  display: block;
  width: 100%;
  height: var(--scape-height);
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    opacity: 0.8;
  }
}

.merge-creator__load-more {
  justify-self: center;
}
</style>
