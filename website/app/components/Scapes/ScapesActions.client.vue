<template>
  <GridArea v-if="showActions" :rows="2" width="full" padding class="scapes-actions__area">
    <header>
      <h1>Marketplace Status</h1>
      <p v-if="!listing">This scape is not listed for sale.</p>
      <p v-else>This scape is listed for sale for {{ listPrice }} ETH on {{ hasOnchainListing ? `the scapes
        marketplace` : `Seaport (OpenSea)` }}.</p>
    </header>
    <Actions class="left">
      <template v-if="hasSeaportListing && listPrice">
        <Button :to="openseaUrl" target="_blank" rel="noopener noreferrer" class="small">
          Buy on OpenSea ({{ listPrice }} ETH)
        </Button>
      </template>
      <EvmConnect v-else-if="!isConnected" class-name="small" />
      <template v-else>
        <!-- Owner actions -->
        <template v-if="isOwner">
          <!-- Owner with no listing: show list Button -->
          <template v-if="!listing">
            <ScapesActionList :scape-id="scapeId" @listing-change="emit('listingChange')" />
          </template>

          <!-- Owner with onchain listing: show cancel Button -->
          <template v-else-if="hasOnchainListing">
            <ScapesActionCancelListing :scape-id="scapeId" @listing-change="emit('listingChange')" />
          </template>

          <!-- Owner with seaport listing: link to OpenSea -->
          <template v-else-if="hasSeaportListing">
            <a :href="openseaUrl" target="_blank" rel="noopener noreferrer" class="scapes-actions__link">
              Manage on OpenSea
            </a>
          </template>

          <!-- Owner with merge: show unmerge Button -->
          <template v-if="isMerge">
            <ScapesActionUnmerge :scape-id="scapeId" @listing-change="emit('listingChange')" />
          </template>
        </template>

        <!-- Non-owner actions -->
        <template v-else>
          <!-- Non-owner with onchain listing: show buy Button -->
          <template v-if="hasOnchainListing && listPrice">
            <ScapesActionBuy :scape-id="scapeId" :price-wei="listing?.price ?? '0'" :price-eth="listPrice"
              @listing-change="emit('listingChange')" />
          </template>

        </template>
      </template>
    </Actions>
  </GridArea>
</template>

<script setup lang="ts">
import { useConnection } from "@wagmi/vue";
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

const { address, isConnected } = useConnection();

const isOwner = computed(() => {
  if (!address.value || !props.owner) return false;
  return address.value.toLowerCase() === props.owner.toLowerCase();
});

const isMerge = computed(() => isMergeTokenId(BigInt(props.scapeId)));

const showActions = computed(() => Boolean(props.listing) || isOwner.value);

const hasOnchainListing = computed(() => props.listing?.source === "onchain");
const hasSeaportListing = computed(() => props.listing?.source === "seaport");

const openseaUrl = computed(
  () => `https://opensea.io/assets/ethereum/0xb7def63A9040ad5dC431afF79045617922f4023A/${props.scapeId}`,
);

const formatEth = (wei: string) => {
  const eth = Number(wei) / 1e18;
  return eth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
};

const listPrice = computed(() => {
  if (!props.listing?.price) return null;
  return formatEth(props.listing.price);
});

</script>

<style scoped>
.scapes-actions__area {
  display: grid;
  gap: var(--spacer-sm);

  &>header {
    & p {
      color: var(--muted);
      font-size: var(--font-sm);
    }
  }

  &>.actions {
    gap: var(--spacer);
    padding-inline: var(--grid-gutter);
    padding-bottom: var(--grid-gutter);
  }
}
</style>
