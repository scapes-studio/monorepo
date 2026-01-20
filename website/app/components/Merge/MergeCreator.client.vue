<script setup lang="ts">
import { writeContract } from "@wagmi/core";
import type { Config } from "@wagmi/vue";
import type { Hash } from "viem";
import { scapesABI } from "@scapes-studio/abis";

const SCAPES_CONTRACT = "0xb7def63a9040ad5dc431aff79045617922f4023a" as const;

const { $wagmi } = useNuxtApp();
const router = useRouter();

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

const transactionFlow = ref<{ initializeRequest: (request?: () => Promise<Hash>) => Promise<unknown> } | null>(null);

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

<template>
  <div class="merge-creator">
    <header class="merge-creator__header">
      <h1>Create Merge</h1>
      <div class="merge-creator__controls">
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
    </header>

    <div class="merge-creator__content">
      <div class="merge-creator__preview-section">
        <MergePreview
          :scapes="scapes"
          :preview-url="previewUrl"
          :is-loading="previewLoading"
          :error="previewError"
          @toggle-flip-x="toggleFlipX"
          @remove="removeScape"
        />

        <EvmTransactionFlow
          ref="transactionFlow"
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

      <div class="merge-creator__selector-section">
        <MergeScapeSelector
          :selected-ids="selectedIds"
          :is-full="isFull"
          @select="addScape"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.merge-creator {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--spacer);
}

.merge-creator__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacer);
  margin-bottom: var(--spacer-lg);
}

.merge-creator__header h1 {
  margin: 0;
  font-size: var(--font-xl);
}

.merge-creator__controls {
  display: flex;
  align-items: center;
  gap: var(--spacer);
}

.merge-creator__toggle {
  display: flex;
  align-items: center;
  gap: var(--spacer-xs);
  cursor: pointer;
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

.merge-creator__content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacer-lg);
}

@media (max-width: 48rem) {
  .merge-creator__content {
    grid-template-columns: 1fr;
  }
}

.merge-creator__preview-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacer);
}

.merge-creator__merge-btn {
  width: 100%;
  padding: var(--spacer) var(--spacer-lg);
  border: none;
  border-radius: var(--spacer-xs);
  background: var(--color);
  color: var(--background);
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
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
  font-weight: var(--font-weight-bold);
}

.merge-creator__view-link:hover {
  background: var(--gray-z-1);
}

.merge-creator__selector-section {
  min-height: 400px;
}
</style>
