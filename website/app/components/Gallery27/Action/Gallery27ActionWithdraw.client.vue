<template>
  <div class="gallery27-action">
    <p class="gallery27-action__copy">Revenue share: {{ revenueShare }} ETH</p>
    <Button class="small" @click="handleWithdraw">
      Withdraw
    </Button>

    <EvmTransactionFlow ref="transactionFlowRef" :text="withdrawText" :request="withdrawRequest"
      auto-close-success @complete="handleWithdrawComplete" />
  </div>
</template>

<script setup lang="ts">
import type { Hash, Hex } from "viem";

const props = defineProps<{
  punkScapeId: number;
  latestBid: string;
  contractAddress: Hex;
}>();

const emit = defineEmits<{
  actionComplete: [];
}>();

const punkScapeIdRef = computed(() => props.punkScapeId);
const { withdraw } = useGallery27Actions(punkScapeIdRef);

const transactionFlowRef = ref<{ initializeRequest: (request?: () => Promise<Hash>) => Promise<unknown> } | null>(null);

const revenueShare = computed(() => {
  const half = Number(BigInt(props.latestBid) / 2n) / 1e18;
  return formatETH(half);
});

const delay = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms);
});

const withdrawRequest = async (): Promise<Hash> => {
  return withdraw([props.punkScapeId], props.contractAddress);
};

const handleWithdraw = async () => {
  await transactionFlowRef.value?.initializeRequest(withdrawRequest);
};

const handleWithdrawComplete = async () => {
  await delay(2000);
  emit("actionComplete");
};

const withdrawText = {
  title: {
    confirm: "Withdraw Revenue Share",
    requesting: "Confirm in Wallet",
    waiting: "Withdrawing",
    complete: "Withdrawn!",
  },
  lead: {
    confirm: `Withdraw your 50% revenue share.`,
    requesting: "Please confirm the transaction in your wallet.",
    waiting: "Your withdrawal is being processed on-chain.",
    complete: "Revenue share has been withdrawn!",
  },
  action: {
    confirm: "Withdraw",
    error: "Try Again",
  },
};
</script>

<style scoped>
.gallery27-action__copy {
  margin: 0;
  color: var(--muted);
  font-size: var(--font-sm);
}
</style>
