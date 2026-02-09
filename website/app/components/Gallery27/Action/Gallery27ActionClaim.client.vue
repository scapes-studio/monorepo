<template>
  <div class="gallery27-action">
    <Button class="small" :disabled="!selectedImage" @click="open = true">
      Claim Your Scape
    </Button>
    <p v-if="!selectedImage" class="gallery27-action__hint">
      Select an image above to claim
    </p>

    <Dialog v-model:open="open" title="Claim Your Scape">
      <div class="gallery27-action__form">
        <p class="gallery27-action__copy">Mint your TwentySevenYearScape NFT.</p>
        <Actions>
          <Button class="small" @click="open = false">
            Cancel
          </Button>
          <Button class="small" @click="handleContinue">
            Claim NFT
          </Button>
        </Actions>
      </div>
    </Dialog>

    <EvmTransactionFlow
      ref="transactionFlowRef"
      :text="claimText"
      :request="claimRequest"
      @complete="handleClaimComplete"
    />
  </div>
</template>

<script setup lang="ts">
import type { Hash } from "viem";
import type { Gallery27Image } from "~/types/gallery27";

const props = defineProps<{
  punkScapeId: number;
  selectedImage: Gallery27Image | null;
}>();

const emit = defineEmits<{
  actionComplete: [];
}>();

const punkScapeIdRef = computed(() => props.punkScapeId);
const { claim } = useGallery27Actions(punkScapeIdRef);

const open = ref(false);

const transactionFlowRef = ref<{ initializeRequest: (request?: () => Promise<Hash>) => Promise<unknown> } | null>(null);

const delay = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms);
});

const claimRequest = async (): Promise<Hash> => {
  if (!props.selectedImage?.id) {
    throw new Error("Select an image to claim");
  }
  const step = props.selectedImage.steps ?? 0;
  return claim(props.selectedImage.id, step);
};

const handleContinue = async () => {
  open.value = false;
  await nextTick();
  await transactionFlowRef.value?.initializeRequest(claimRequest);
};

const handleClaimComplete = async () => {
  await delay(2000);
  emit("actionComplete");
};

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
</script>

<style scoped>
.gallery27-action__form {
  display: flex;
  flex-direction: column;
  gap: var(--spacer-sm);
}

.gallery27-action__copy {
  margin: 0;
  color: var(--muted);
  font-size: var(--font-sm);
}

.gallery27-action__hint {
  font-size: var(--font-sm);
  color: var(--muted);
  margin: 0;
}

.actions {
  margin-top: var(--spacer);
}
</style>
