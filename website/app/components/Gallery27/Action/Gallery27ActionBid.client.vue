<template>
  <div class="gallery27-action">
    <Button class="small" @click="open = true">
      Place Bid
    </Button>
    <p v-if="!isFirstBid" class="gallery27-action__hint">
      Minimum bid: {{ minimumBid }} ETH
    </p>

    <Dialog v-model:open="open" title="Place Bid">
      <div class="gallery27-action__form">
        <textarea
          v-model="bidMessage"
          placeholder="Your message for the AI..."
          class="gallery27-action__textarea"
          rows="3"
        />
        <FormItem>
          <input
            v-model="bidAmount"
            type="number"
            step="0.001"
            :min="minimumBid"
            :placeholder="`Min ${minimumBid}`"
          />
          <template #suffix>ETH</template>
        </FormItem>
        <Actions>
          <Button class="small" @click="handleCancel">
            Cancel
          </Button>
          <Button class="small" :disabled="!bidAmount || Number(bidAmount) < Number(minimumBid)" @click="handleContinue">
            Place Bid
          </Button>
        </Actions>
      </div>
    </Dialog>

    <EvmTransactionFlow
      ref="transactionFlowRef"
      :text="bidText"
      :request="bidRequest"
      @complete="handleBidComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { parseEther, formatEther } from "viem";
import type { Hash } from "viem";
import type { Gallery27AuctionState } from "~/types/gallery27";

const props = defineProps<{
  punkScapeId: number;
  auction: Gallery27AuctionState | null;
  latestBidder: string | null;
}>();

const emit = defineEmits<{
  actionComplete: [];
}>();

const punkScapeIdRef = computed(() => props.punkScapeId);
const { initializeAuction, bid } = useGallery27Actions(punkScapeIdRef);

const open = ref(false);
const bidMessage = ref("");
const bidAmount = ref("");

const transactionFlowRef = ref<{ initializeRequest: (request?: () => Promise<Hash>) => Promise<unknown> } | null>(null);

const isFirstBid = computed(() => !props.latestBidder);

const minimumBid = computed(() => {
  if (!props.auction?.latestBid) return "0.05";
  const current = BigInt(props.auction.latestBid);
  const minimum = current + (current * 5n) / 100n;
  return formatEther(minimum);
});

const delay = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms);
});

const bidRequest = async (): Promise<Hash> => {
  const value = parseEther(String(bidAmount.value));
  if (isFirstBid.value) {
    return initializeAuction(bidMessage.value, value);
  }
  return bid(bidMessage.value, value);
};

const handleContinue = async () => {
  open.value = false;
  await nextTick();
  await transactionFlowRef.value?.initializeRequest(bidRequest);
};

const handleCancel = () => {
  open.value = false;
  bidMessage.value = "";
  bidAmount.value = "";
};

const handleBidComplete = async () => {
  await delay(2000);
  bidMessage.value = "";
  bidAmount.value = "";
  emit("actionComplete");
};

const bidText = computed(() => ({
  title: {
    confirm: "Place Bid",
    requesting: "Confirm in Wallet",
    waiting: "Placing Bid",
    complete: "Bid Placed!",
  },
  lead: {
    confirm: `Bid ${bidAmount.value || "..."} ETH`,
    requesting: "Please confirm the transaction in your wallet.",
    waiting: "Your bid is being recorded on-chain.",
    complete: "You are now the leading bidder!",
  },
  action: {
    confirm: "Place Bid",
    error: "Try Again",
  },
}));
</script>

<style scoped>
.gallery27-action__form {
  display: flex;
  flex-direction: column;
  gap: var(--spacer-sm);
}

.gallery27-action__hint {
  font-size: var(--font-sm);
  color: var(--muted);
  margin: 0;
}

.gallery27-action__textarea {
  padding: var(--spacer-sm);
  border: 1px solid var(--border);
  border-radius: var(--spacer-xs);
  background: var(--background);
  font-size: var(--font-base);
  font-family: inherit;
  resize: vertical;
}

.gallery27-action__textarea:focus {
  outline: none;
  border-color: var(--color);
}

.actions {
  margin-top: var(--spacer);
}
</style>
