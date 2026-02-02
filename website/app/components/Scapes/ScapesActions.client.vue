<template>
  <div v-if="isConnected" class="scapes-actions">
    <!-- Owner actions -->
    <template v-if="isOwner">
      <!-- Owner with no listing: show list button -->
      <template v-if="!listing">
        <button
          v-if="!showListForm"
          type="button"
          class="scapes-actions__btn"
          @click="showListForm = true"
        >
          List for Sale
        </button>

        <div v-else class="scapes-actions__list-form">
          <div class="scapes-actions__input-group">
            <input
              v-model="listPriceInput"
              type="number"
              step="0.001"
              min="0"
              placeholder="Price in ETH"
              class="scapes-actions__input"
            />
            <span class="scapes-actions__input-suffix">ETH</span>
          </div>

          <EvmTransactionFlow
            ref="transactionFlowRef"
            :text="listText"
            :request="listRequest"
            @complete="handleListComplete"
          >
            <template #start="{ start }">
              <div class="scapes-actions__form-actions">
                <button
                  type="button"
                  class="scapes-actions__btn scapes-actions__btn--secondary"
                  @click="showListForm = false"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="scapes-actions__btn"
                  :disabled="!listPriceInput || Number(listPriceInput) <= 0"
                  @click="start"
                >
                  List for Sale
                </button>
              </div>
            </template>
          </EvmTransactionFlow>
        </div>
      </template>

      <!-- Owner with onchain listing: show cancel button -->
      <template v-else-if="hasOnchainListing">
        <EvmTransactionFlow
          ref="cancelFlowRef"
          :text="cancelText"
          :request="cancelRequest"
          @complete="handleCancelComplete"
        >
          <template #start="{ start }">
            <button
              type="button"
              class="scapes-actions__btn scapes-actions__btn--secondary"
              @click="start"
            >
              Cancel Listing
            </button>
          </template>
        </EvmTransactionFlow>
      </template>

      <!-- Owner with seaport listing: link to OpenSea -->
      <template v-else-if="hasSeaportListing">
        <a
          :href="openseaUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="scapes-actions__link"
        >
          Manage on OpenSea
        </a>
      </template>

      <!-- Owner with merge: show unmerge button -->
      <template v-if="isMerge">
        <EvmTransactionFlow
          ref="purgeFlowRef"
          :text="purgeText"
          :request="purgeRequest"
          @complete="handlePurgeComplete"
        >
          <template #start="{ start }">
            <button
              type="button"
              class="scapes-actions__btn scapes-actions__btn--secondary"
              @click="start"
            >
              Unmerge
            </button>
          </template>
        </EvmTransactionFlow>
      </template>
    </template>

    <!-- Non-owner actions -->
    <template v-else>
      <!-- Non-owner with onchain listing: show buy button -->
      <template v-if="hasOnchainListing && listPrice">
        <EvmTransactionFlow
          ref="buyFlowRef"
          :text="buyText"
          :request="buyRequest"
          @complete="handleBuyComplete"
        >
          <template #start="{ start }">
            <button
              type="button"
              class="scapes-actions__btn scapes-actions__btn--primary"
              @click="start"
            >
              Buy for {{ listPrice }} ETH
            </button>
          </template>
        </EvmTransactionFlow>
      </template>

      <!-- Non-owner with seaport listing: link to OpenSea -->
      <template v-else-if="hasSeaportListing && listPrice">
        <a
          :href="openseaUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="scapes-actions__btn scapes-actions__link"
        >
          Buy on OpenSea for {{ listPrice }} ETH
        </a>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAccount } from "@wagmi/vue";
import { parseEther } from "viem";
import type { Hash } from "viem";
import type { ListingData } from "~/composables/useScapeListing";
import { isMergeTokenId } from "~/utils/merges";

const props = defineProps<{
  scapeId: string;
  owner: string | null;
  listing: ListingData;
}>();

const emit = defineEmits<{
  listingChange: [];
}>();

const { address, isConnected } = useAccount();
const { makeOffer, cancelOffer, buy, purge } = useMarketplaceActions(() => props.scapeId);

const isOwner = computed(() => {
  if (!address.value || !props.owner) return false;
  return address.value.toLowerCase() === props.owner.toLowerCase();
});

const isMerge = computed(() => isMergeTokenId(BigInt(props.scapeId)));

const hasOnchainListing = computed(() => props.listing?.source === "onchain");
const hasSeaportListing = computed(() => props.listing?.source === "seaport");

const openseaUrl = computed(
  () => `https://opensea.io/assets/ethereum/0xb7def63A9040ad5dC431afF79045617922f4023A/${props.scapeId}`,
);

const listPriceInput = ref("");
const showListForm = ref(false);

const formatEth = (wei: string) => {
  const eth = Number(wei) / 1e18;
  return eth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
};

const listPrice = computed(() => {
  if (!props.listing?.price) return null;
  return formatEth(props.listing.price);
});

const transactionFlowRef = ref<{ initializeRequest: (request?: () => Promise<Hash>) => Promise<unknown> } | null>(null);
const cancelFlowRef = ref<{ initializeRequest: (request?: () => Promise<Hash>) => Promise<unknown> } | null>(null);
const buyFlowRef = ref<{ initializeRequest: (request?: () => Promise<Hash>) => Promise<unknown> } | null>(null);
const purgeFlowRef = ref<{ initializeRequest: (request?: () => Promise<Hash>) => Promise<unknown> } | null>(null);

const listRequest = async (): Promise<Hash> => {
  const priceWei = parseEther(String(listPriceInput.value));
  return makeOffer(priceWei);
};

const cancelRequest = async (): Promise<Hash> => {
  return cancelOffer();
};

const buyRequest = async (): Promise<Hash> => {
  const price = BigInt(props.listing?.price ?? "0");
  return buy(price);
};

const purgeRequest = async (): Promise<Hash> => {
  return purge();
};

const handleListComplete = () => {
  showListForm.value = false;
  listPriceInput.value = "";
  emit("listingChange");
};

const handleCancelComplete = () => {
  emit("listingChange");
};

const handleBuyComplete = () => {
  emit("listingChange");
};

const handlePurgeComplete = () => {
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

const buyText = computed(() => ({
  title: {
    confirm: "Buy Scape",
    requesting: "Confirm in Wallet",
    waiting: "Purchasing Scape",
    complete: "Purchase Complete!",
  },
  lead: {
    confirm: `Buy Scape #${props.scapeId} for ${listPrice.value} ETH.`,
    requesting: "Please confirm the transaction in your wallet.",
    waiting: "Your purchase is being processed on-chain.",
    complete: "You now own this scape!",
  },
  action: {
    confirm: `Buy for ${listPrice.value} ETH`,
    error: "Try Again",
  },
}));

const purgeText = {
  title: {
    confirm: "Unmerge",
    requesting: "Confirm in Wallet",
    waiting: "Unmerging",
    complete: "Unmerged!",
  },
  lead: {
    confirm: `Unmerge this merge and return the component Scapes.`,
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
.scapes-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacer-sm);
}

.scapes-actions__btn {
  padding: var(--spacer-sm) var(--spacer);
  border: 1px solid var(--border);
  border-radius: var(--spacer-xs);
  background: var(--gray-z-1);
  font-size: var(--font-base);
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  color: inherit;
}

.scapes-actions__btn:hover {
  background: var(--gray-z-2);
}

.scapes-actions__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.scapes-actions__btn--primary {
  background: var(--color);
  color: var(--background);
  border-color: var(--color);
}

.scapes-actions__btn--primary:hover {
  opacity: 0.9;
}

.scapes-actions__btn--secondary {
  background: transparent;
}

.scapes-actions__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacer-sm) var(--spacer);
  border: 1px solid var(--border);
  border-radius: var(--spacer-xs);
  text-decoration: none;
  color: inherit;
}

.scapes-actions__link:hover {
  background: var(--gray-z-1);
}

.scapes-actions__list-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacer-sm);
}

.scapes-actions__input-group {
  display: flex;
  align-items: center;
  gap: var(--spacer-xs);
}

.scapes-actions__input {
  flex: 1;
  padding: var(--spacer-sm);
  border: 1px solid var(--border);
  border-radius: var(--spacer-xs);
  background: var(--background);
  font-size: var(--font-base);
}

.scapes-actions__input:focus {
  outline: none;
  border-color: var(--color);
}

.scapes-actions__input-suffix {
  color: var(--muted);
}

.scapes-actions__form-actions {
  display: flex;
  gap: var(--spacer-sm);
}

.scapes-actions__form-actions .scapes-actions__btn {
  flex: 1;
}
</style>
