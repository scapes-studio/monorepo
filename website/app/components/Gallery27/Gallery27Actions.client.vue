<template>
  <div v-if="isConnected" class="gallery27-actions">
    <!-- Active auction: bid form -->
    <template v-if="isActive">
      <div v-if="!showBidForm" class="gallery27-actions__cta">
        <button type="button" class="gallery27-actions__btn" @click="showBidForm = true">
          Place Bid
        </button>
        <p v-if="!isFirstBid" class="gallery27-actions__hint">
          Minimum bid: {{ minimumBid }} ETH
        </p>
      </div>

      <div v-else class="gallery27-actions__form">
        <textarea
          v-model="bidMessage"
          placeholder="Your message for the AI..."
          class="gallery27-actions__textarea"
          rows="3"
        />
        <div class="gallery27-actions__input-group">
          <input
            v-model="bidAmount"
            type="number"
            step="0.001"
            :min="minimumBid"
            :placeholder="`Min ${minimumBid}`"
            class="gallery27-actions__input"
          />
          <span class="gallery27-actions__input-suffix">ETH</span>
        </div>

        <EvmTransactionFlow
          ref="bidFlowRef"
          :text="bidText"
          :request="bidRequest"
          @complete="handleBidComplete"
        >
          <template #start="{ start }">
            <div class="gallery27-actions__form-actions">
              <button
                type="button"
                class="gallery27-actions__btn gallery27-actions__btn--secondary"
                @click="showBidForm = false"
              >
                Cancel
              </button>
              <button
                type="button"
                class="gallery27-actions__btn"
                :disabled="!bidAmount || Number(bidAmount) < Number(minimumBid)"
                @click="start"
              >
                Place Bid
              </button>
            </div>
          </template>
        </EvmTransactionFlow>
      </div>
    </template>

    <!-- Auction ended, winner can claim -->
    <template v-else-if="canClaim">
      <EvmTransactionFlow
        ref="claimFlowRef"
        :text="claimText"
        :request="claimRequest"
        @complete="emit('actionComplete')"
      >
        <template #start="{ start }">
          <button
            type="button"
            class="gallery27-actions__btn gallery27-actions__btn--primary"
            :disabled="!selectedImage"
            @click="start"
          >
            Claim Your Scape
          </button>
        </template>
      </EvmTransactionFlow>
      <p v-if="!selectedImage" class="gallery27-actions__hint">
        Select an image above to claim
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAccount } from "@wagmi/vue";
import { parseEther, formatEther } from "viem";
import type { Hash } from "viem";
import type { Gallery27AuctionState, Gallery27Image } from "~/types/gallery27";

const props = defineProps<{
  punkScapeId: number;
  tokenId: number;
  auction: Gallery27AuctionState | null;
  latestBidder: string | null;
  punkScapeOwner: string | null;
  isActive: boolean;
  isMinted: boolean;
  selectedImage: Gallery27Image | null;
}>();

const emit = defineEmits<{
  actionComplete: [];
}>();

const { address, isConnected } = useAccount();
const punkScapeIdRef = computed(() => props.punkScapeId);
const { initializeAuction, bid, claim, withdraw, getCurrentBidPrice } = useGallery27Actions(punkScapeIdRef);

// Bid form state
const bidMessage = ref("");
const bidAmount = ref("");
const showBidForm = ref(false);

// Computed states
const isFirstBid = computed(() => !props.latestBidder);
const isWinner = computed(() => {
  if (!address.value) return false;
  // If there's a bidder, check if user is the winning bidder
  if (props.latestBidder) {
    return address.value.toLowerCase() === props.latestBidder.toLowerCase();
  }
  // If no bids, check if user is the PunkScape owner
  if (props.punkScapeOwner) {
    return address.value.toLowerCase() === props.punkScapeOwner.toLowerCase();
  }
  return false;
});

const canClaim = computed(() => {
  return !props.isActive && isWinner.value && !props.isMinted;
});

// Minimum bid calculation (5% increase from latest bid or starting price)
const minimumBid = computed(() => {
  if (!props.auction?.latestBid) return "0.05";
  const current = BigInt(props.auction.latestBid);
  // 5% increase minimum (500 basis points)
  const minimum = current + (current * 5n) / 100n;
  return formatEther(minimum);
});

// Transaction flow refs
const bidFlowRef = ref<{ initializeRequest: () => Promise<unknown> } | null>(null);
const claimFlowRef = ref<{ initializeRequest: () => Promise<unknown> } | null>(null);
const withdrawFlowRef = ref<{ initializeRequest: () => Promise<unknown> } | null>(null);

// Request handlers
const bidRequest = async (): Promise<Hash> => {
  // Convert to string since v-model with type="number" gives us a number
  const value = parseEther(String(bidAmount.value));
  if (isFirstBid.value) {
    return initializeAuction(bidMessage.value, value);
  }
  return bid(bidMessage.value, value);
};

const claimRequest = async (): Promise<Hash> => {
  if (!props.selectedImage?.id) {
    throw new Error("Select an image to claim");
  }
  // Default to step 0 if not available
  const step = props.selectedImage.steps ?? 0;
  return claim(props.selectedImage.id, step);
};

const withdrawRequest = async (): Promise<Hash> => {
  return withdraw([props.punkScapeId]);
};

// Event handlers
const handleBidComplete = () => {
  showBidForm.value = false;
  bidMessage.value = "";
  bidAmount.value = "";
  emit("actionComplete");
};

// Text configs
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

const claimText = {
  title: {
    confirm: "Claim Your Scape",
    requesting: "Confirm in Wallet",
    waiting: "Minting NFT",
    complete: "Claimed!",
  },
  lead: {
    confirm: "Mint your TwentySevenYearScape NFT.",
    requesting: "Please confirm the transaction in your wallet.",
    waiting: "Your NFT is being minted on-chain.",
    complete: "Your TwentySevenYearScape has been minted!",
  },
  action: {
    confirm: "Claim NFT",
    error: "Try Again",
  },
};

const withdrawText = {
  title: {
    confirm: "Withdraw Revenue",
    requesting: "Confirm in Wallet",
    waiting: "Withdrawing",
    complete: "Withdrawn!",
  },
  lead: {
    confirm: "Withdraw your 50% revenue share as the PunkScape owner.",
    requesting: "Please confirm the transaction in your wallet.",
    waiting: "Your withdrawal is being processed.",
    complete: "Revenue has been sent to your wallet!",
  },
  action: {
    confirm: "Withdraw",
    error: "Try Again",
  },
};
</script>

<style scoped>
.gallery27-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacer-sm);
}

.gallery27-actions__cta {
  display: flex;
  flex-direction: column;
  gap: var(--spacer-xs);
}

.gallery27-actions__hint {
  font-size: var(--font-sm);
  color: var(--muted);
  margin: 0;
}

.gallery27-actions__form {
  display: flex;
  flex-direction: column;
  gap: var(--spacer-sm);
}

.gallery27-actions__textarea {
  padding: var(--spacer-sm);
  border: 1px solid var(--border);
  border-radius: var(--spacer-xs);
  background: var(--background);
  font-size: var(--font-base);
  font-family: inherit;
  resize: vertical;
}

.gallery27-actions__textarea:focus {
  outline: none;
  border-color: var(--color);
}

.gallery27-actions__input-group {
  display: flex;
  align-items: center;
  gap: var(--spacer-xs);
}

.gallery27-actions__input {
  flex: 1;
  padding: var(--spacer-sm);
  border: 1px solid var(--border);
  border-radius: var(--spacer-xs);
  background: var(--background);
  font-size: var(--font-base);
}

.gallery27-actions__input:focus {
  outline: none;
  border-color: var(--color);
}

.gallery27-actions__input-suffix {
  font-weight: var(--font-weight-bold);
  color: var(--muted);
}

.gallery27-actions__form-actions {
  display: flex;
  gap: var(--spacer-sm);
}

.gallery27-actions__form-actions .gallery27-actions__btn {
  flex: 1;
}

.gallery27-actions__btn {
  padding: var(--spacer-sm) var(--spacer);
  border: 1px solid var(--border);
  border-radius: var(--spacer-xs);
  background: var(--gray-z-1);
  font-size: var(--font-base);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  text-align: center;
}

.gallery27-actions__btn:hover {
  background: var(--gray-z-2);
}

.gallery27-actions__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gallery27-actions__btn--primary {
  background: var(--color);
  color: var(--background);
  border-color: var(--color);
}

.gallery27-actions__btn--primary:hover {
  opacity: 0.9;
}

.gallery27-actions__btn--secondary {
  background: transparent;
}
</style>
