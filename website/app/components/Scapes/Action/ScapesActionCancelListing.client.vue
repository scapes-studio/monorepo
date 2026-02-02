<template>
  <div class="scapes-action">
    <Button class="small" @click="open = true">
      Cancel Listing
    </Button>

    <Dialog v-model:open="open" title="Cancel Listing" class="scapes-action__dialog">
      <div class="scapes-action__form">
        <p class="scapes-action__copy">Cancel your listing for Scape #{{ scapeId }}.</p>
        <div class="scapes-action__form-actions">
          <Button class="small" @click="open = false">
            Keep Listing
          </Button>
          <Button class="small" @click="handleContinue">
            Cancel Listing
          </Button>
        </div>
      </div>
    </Dialog>

    <EvmTransactionFlow
      ref="transactionFlowRef"
      :text="cancelText"
      :request="cancelRequest"
      @complete="handleCancelComplete"
    />
  </div>
</template>

<script setup lang="ts">
import type { Hash } from "viem";

const props = defineProps<{
  scapeId: string;
}>();

const emit = defineEmits<{
  listingChange: [];
}>();

const { cancelOffer } = useMarketplaceActions(() => props.scapeId);

const open = ref(false);

const transactionFlowRef = ref<{ initializeRequest: (request?: () => Promise<Hash>) => Promise<unknown> } | null>(null);

const cancelRequest = async (): Promise<Hash> => {
  return cancelOffer();
};

const handleContinue = async () => {
  open.value = false;
  await nextTick();
  await transactionFlowRef.value?.initializeRequest(cancelRequest);
};

const handleCancelComplete = () => {
  emit("listingChange");
};

const cancelText = {
  title: {
    confirm: "Cancel Listing",
    requesting: "Confirm in Wallet",
    waiting: "Canceling Listing",
    complete: "Listing Canceled!",
  },
  lead: {
    confirm: `Cancel your listing for Scape #${props.scapeId}.`,
    requesting: "Please confirm the transaction in your wallet.",
    waiting: "Your listing is being canceled on-chain.",
    complete: "Your listing has been canceled.",
  },
  action: {
    confirm: "Cancel Listing",
    error: "Try Again",
  },
};
</script>

<style scoped>
.scapes-action__form {
  display: flex;
  flex-direction: column;
  gap: var(--spacer-sm);
}

.scapes-action__copy {
  margin: 0;
  color: var(--muted);
  font-size: var(--font-sm);
}

.scapes-action__form-actions {
  display: flex;
  gap: var(--spacer-sm);
}

.scapes-action__form-actions :deep(button) {
  flex: 1;
}
</style>
