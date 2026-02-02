<template>
  <div class="scapes-action">
    <Button class="small" @click="open = true">
      List for Sale
    </Button>

    <Dialog v-model:open="open" title="List for Sale" class="scapes-action__dialog">
      <div class="scapes-action__form">
        <div class="scapes-action__input-group">
          <input
            v-model="listPriceInput"
            type="number"
            step="0.001"
            min="0"
            placeholder="Price in ETH"
            class="scapes-action__input"
          />
          <span class="scapes-action__input-suffix">ETH</span>
        </div>
        <div class="scapes-action__form-actions">
          <Button class="small" @click="handleCancel">
            Cancel
          </Button>
          <Button class="small" :disabled="!isPriceValid" @click="handleContinue">
            Continue
          </Button>
        </div>
      </div>
    </Dialog>

    <EvmTransactionFlow
      ref="transactionFlowRef"
      :text="listText"
      :request="listRequest"
      @complete="handleListComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { parseEther } from "viem";
import type { Hash } from "viem";

const props = defineProps<{
  scapeId: string;
}>();

const emit = defineEmits<{
  listingChange: [];
}>();

const { makeOffer } = useMarketplaceActions(() => props.scapeId);

const open = ref(false);
const listPriceInput = ref("");

const isPriceValid = computed(() => Number(listPriceInput.value) > 0);

const transactionFlowRef = ref<{ initializeRequest: (request?: () => Promise<Hash>) => Promise<unknown> } | null>(null);

const listRequest = async (): Promise<Hash> => {
  const priceWei = parseEther(String(listPriceInput.value));
  return makeOffer(priceWei);
};

const handleContinue = async () => {
  if (!isPriceValid.value) return;
  open.value = false;
  await nextTick();
  await transactionFlowRef.value?.initializeRequest(listRequest);
};

const handleCancel = () => {
  open.value = false;
  listPriceInput.value = "";
};

const handleListComplete = () => {
  listPriceInput.value = "";
  emit("listingChange");
};

const listText = computed(() => ({
  title: {
    confirm: "List for Sale",
    requesting: "Confirm in Wallet",
    waiting: "Listing Scape",
    complete: "Listed!",
  },
  lead: {
    confirm: `List Scape #${props.scapeId} for ${listPriceInput.value || "..."} ETH.`,
    requesting: "Please confirm the transaction in your wallet.",
    waiting: "Your listing is being created on-chain.",
    complete: "Your scape is now listed for sale!",
  },
  action: {
    confirm: "List for Sale",
    error: "Try Again",
  },
}));
</script>

<style scoped>
.scapes-action__form {
  display: flex;
  flex-direction: column;
  gap: var(--spacer-sm);
}

.scapes-action__input-group {
  display: flex;
  align-items: center;
  gap: var(--spacer-xs);
}

.scapes-action__input {
  flex: 1;
  padding: var(--spacer-sm);
  border: 1px solid var(--border);
  border-radius: var(--spacer-xs);
  background: var(--background);
  font-size: var(--font-base);
}

.scapes-action__input:focus {
  outline: none;
  border-color: var(--color);
}

.scapes-action__input-suffix {
  color: var(--muted);
}

.scapes-action__form-actions {
  display: flex;
  gap: var(--spacer-sm);
}

.scapes-action__form-actions :deep(button) {
  flex: 1;
}
</style>
