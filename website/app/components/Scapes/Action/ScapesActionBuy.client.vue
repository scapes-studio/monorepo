<template>
  <div class="scapes-action">
    <Button class="small" @click="open = true">
      Buy for {{ priceEth }} ETH
    </Button>

    <Dialog v-model:open="open" title="Buy Scape" class="scapes-action__dialog">
      <div class="scapes-action__form">
        <p class="scapes-action__copy">Buy Scape #{{ scapeId }} for {{ priceEth }} ETH.</p>
        <Actions>
          <Button class="small" @click="open = false">
            Cancel
          </Button>
          <Button class="small" @click="handleContinue">
            Buy for {{ priceEth }} ETH
          </Button>
        </Actions>
      </div>
    </Dialog>

    <EvmTransactionFlow ref="transactionFlowRef" :text="buyText" :request="buyRequest"
      auto-close-success @complete="handleBuyComplete" />
  </div>
</template>

<script setup lang="ts">
import type { Hash } from "viem";

const props = defineProps<{
  scapeId: string;
  priceWei: string;
  priceEth: string;
}>();

const emit = defineEmits<{
  listingChange: [];
}>();

const { buy } = useMarketplaceActions(() => props.scapeId);

const open = ref(false);

const transactionFlowRef = ref<{ initializeRequest: (request?: () => Promise<Hash>) => Promise<unknown> } | null>(null);

const delay = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms);
});

const buyRequest = async (): Promise<Hash> => {
  return buy(BigInt(props.priceWei));
};

const handleContinue = async () => {
  open.value = false;
  await nextTick();
  await transactionFlowRef.value?.initializeRequest(buyRequest);
};

const handleBuyComplete = async () => {
  await delay(2000);
  open.value = false;
  emit("listingChange");
};

const buyText = computed(() => ({
  title: {
    confirm: "Buy Scape",
    requesting: "Confirm in Wallet",
    waiting: "Purchasing Scape",
    complete: "Purchase Complete!",
  },
  lead: {
    confirm: `Buy Scape #${props.scapeId} for ${props.priceEth} ETH.`,
    requesting: "Please confirm the transaction in your wallet.",
    waiting: "Your purchase is being processed on-chain.",
    complete: "You now own this scape!",
  },
  action: {
    confirm: `Buy for ${props.priceEth} ETH`,
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

.scapes-action__copy {
  margin: 0;
  color: var(--muted);
  font-size: var(--font-sm);
}

.actions {
  margin-top: var(--spacer);
}
</style>
