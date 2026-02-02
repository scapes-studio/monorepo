<template>
  <div class="scapes-action">
    <Button class="small" @click="open = true">
      Unmerge
    </Button>

    <Dialog v-model:open="open" title="Unmerge" class="scapes-action__dialog">
      <div class="scapes-action__form">
        <p class="scapes-action__copy">Unmerge this merge and return the component Scapes.</p>
        <Actions>
          <Button class="small" @click="open = false">
            Keep Merge
          </Button>
          <Button class="small" @click="handleContinue">
            Unmerge
          </Button>
        </Actions>
      </div>
    </Dialog>

    <EvmTransactionFlow
      ref="transactionFlowRef"
      :text="purgeText"
      :request="purgeRequest"
      @complete="handlePurgeComplete"
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

const { purge } = useMarketplaceActions(() => props.scapeId);

const open = ref(false);

const transactionFlowRef = ref<{ initializeRequest: (request?: () => Promise<Hash>) => Promise<unknown> } | null>(null);

const delay = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms);
});

const purgeRequest = async (): Promise<Hash> => {
  return purge();
};

const handleContinue = async () => {
  open.value = false;
  await nextTick();
  await transactionFlowRef.value?.initializeRequest(purgeRequest);
};

const handlePurgeComplete = async () => {
  await delay(2000);
  open.value = false;
  emit("listingChange");
};

const purgeText = {
  title: {
    confirm: "Unmerge",
    requesting: "Confirm in Wallet",
    waiting: "Unmerging",
    complete: "Unmerged!",
  },
  lead: {
    confirm: "Unmerge this merge and return the component Scapes.",
    requesting: "Please confirm the transaction in your wallet.",
    waiting: "Your merge is being unmerged on-chain.",
    complete: "The merge has been unmerged. Your Scapes are back!",
  },
  action: {
    confirm: "Unmerge",
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

.actions {
  margin-top: var(--spacer);
}
</style>
