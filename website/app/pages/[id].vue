<template>
  <section class="scape-detail" :style="{ '--scape-count': scapeCount }">
    <GridArea rows="calc(var(--content-columns, 5) * 2)" width="full" class="scape-detail__image border-drop_">
      <ScapeAnimated :id="scapeId" :scape-count="scapeCount" />
    </GridArea>

    <header class="border-drop_">
      <GridArea rows="1" class="scape-detail__header" padding>
        <div>
          <h1>Scape #{{ scapeId }}</h1>
          <div class="scape-detail__owner">
            <span v-if="scapePending">Loading owner…</span>
            <template v-else-if="owner">
              Owned by
              <AccountLink :address="owner" class="scape-detail__owner-link" shorten-ens />
            </template>
          </div>
        </div>

        <ScapesMarketplaceData :listing="listing" :is-pending="listingPending" :has-error="listingError"
          class="scape-detail__listings" />
      </GridArea>

      <ScapesAttributes :attributes="attributes" :gallery27-token-id="gallery27TokenId" />
    </header>

    <ScapesActions :scape-id="scapeId" :owner="owner" :listing="listing" class="scape-detail__actions border-drop_"
      @listing-change="refreshListing" />

    <ScapesTransactionHistory :scape-id="scapeId" :history="history" :pending="pending" :error="error"
      :total-transfers="totalTransfers" :total-sales="totalSales" class="border-drop_" />

    <ClientOnly>
      <ScapesSESModal v-model:open="sesModalOpen" :token-id="scapeId" />
    </ClientOnly>
  </section>
</template>

<script setup lang="ts">
import { eq } from "@ponder/client";

type SalePrice = {
  wei?: string;
  eth?: number;
  usd?: number;
  currency?: {
    symbol?: string;
    amount?: string;
  };
};

type SaleDetails = {
  id: string | number;
  price?: SalePrice;
  seller?: string;
  buyer?: string;
  slug?: string;
  source?: string;
};

type TransferEntry = {
  type: "transfer" | "sale";
  id: string;
  timestamp: number;
  from: string;
  to: string;
  txHash: string;
  sale: SaleDetails | null;
};

type ListingEntry = {
  type: "listing";
  id: string;
  timestamp: number;
  lister: string;
  price: { wei: string; eth: number };
  isActive: boolean;
  txHash: string;
};

type ScapeHistoryEntry = TransferEntry | ListingEntry;

type ScapeHistoryResponse = {
  collection: string;
  tokenId: string;
  history: ScapeHistoryEntry[];
  totalTransfers: number;
  totalSales: number;
  totalListings: number;
};

const route = useRoute();
const scapeId = computed(() => route.params.id as string);
const client = usePonderClient();

// Radio integration: play this scape when on detail page (client-only)
if (import.meta.client) {
  const { setFixedScape, clearFixedScape } = useScapeRadio();
  watch(
    scapeId,
    (id) => {
      if (id) {
        setFixedScape(Number(id));
      }
    },
    { immediate: true },
  );
  onBeforeUnmount(() => {
    clearFixedScape();
  });
}

const { data, pending, error } = await useAPI<ScapeHistoryResponse>(
  () => `/scapes/${scapeId.value}/history`,
  { watch: [scapeId] },
);

const scapeDataKey = computed(() => `scape-data-${scapeId.value ?? "unknown"}`);
const {
  data: scapeData,
  pending: scapePending,
} = await useAsyncData(
  scapeDataKey,
  async () => {
    const tokenIdValue = BigInt(scapeId.value);

    const result = await client.db
      .select()
      .from(schema.scape)
      .where(eq(schema.scape.id, tokenIdValue))
      .limit(1);

    const row = result[0];
    return row ?? null;
  },
  { watch: [scapeId] },
);

const owner = computed(() => scapeData.value?.owner ?? null);
const attributes = computed(() => scapeData.value?.attributes ?? null);

const history = computed(() => data.value?.history ?? []);
const totalTransfers = computed(() => data.value?.totalTransfers ?? 0);
const totalSales = computed(() => data.value?.totalSales ?? 0);

const {
  listing,
  isPending: listingPending,
  hasError: listingError,
  refresh: refreshListing,
} = useScapeListing(scapeId);

const { data: gallery27TokenId } = await useGallery27ByScape(scapeId);

// Page meta
const seoOptions = computed(() => {
  const id = scapeId.value;
  const attrs = attributes.value;
  let description = `View Scape #${id} details, ownership history, and marketplace listings.`;
  if (attrs && typeof attrs === 'object') {
    const attrEntries = Object.entries(attrs as Record<string, string>)
      .filter(([key]) => key !== 'Seed')
      .slice(0, 4)
      .map(([key, value]) => `${key}: ${value}`);
    if (attrEntries.length > 0) {
      description = `Scape #${id} - ${attrEntries.join(', ')}. View ownership history and marketplace listings.`;
    }
  }

  return {
    title: `Scape #${id}`,
    description,
    image: null,
    imageAlt: null,
  };
});
useSeo(seoOptions);

const ogTitle = computed(() => `Scape #${scapeId.value}`);
const ogSubtitle = computed(() => {
  const attrs = attributes.value;
  if (attrs && typeof attrs === "object") {
    const attrEntries = Object.entries(attrs as Record<string, string>)
      .filter(([key]) => key !== "Seed")
      .slice(0, 2)
      .map(([key, value]) => `${key}: ${value}`);
    if (attrEntries.length > 0) {
      return attrEntries.join(" · ");
    }
  }
  return "Ownership, history, and listings.";
});
const ogImage = computed(
  () => `https://cdn.scapes.xyz/scapes/lg/${scapeId.value}.png`,
);

const scapeCount = computed(() => mergeScapeCount(BigInt(scapeId.value)));

defineOgImageComponent(
  "ScapeDetail",
  {
    title: ogTitle,
    subtitle: ogSubtitle,
    image: ogImage,
    scapeCount,
  },
  {
    width: 1200,
    height: 1200,
  },
);

const sesModalOpen = ref(false);
</script>

<style scoped>
.scape-detail {
  max-width: var(--content-width);
  margin: 0 auto;
  display: grid;
  gap: var(--grid-gutter);
  gap: calc(var(--scape-height-gutter) + var(--grid-gutter));
  container-type: inline-size;


  &>header {
    display: grid;
    gap: var(--grid-gutter);
  }
}

.scape-detail__image {
  position: relative;
  justify-self: center;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16%;

  img {
    width: calc(var(--scape-width-gutter) * var(--detail-columns, 3) * var(--scape-count, 1));
    max-width: 100%;
    height: auto;
  }
}


.scape-detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  &>div {
    display: flex;
    flex-direction: column;
    justify-content: center;

    &>h1 {
      margin: 0;
    }
  }
}

.scape-detail__header .scape-detail__owner {
  color: var(--muted);
  font-size: var(--font-sm);
}

.scape-detail__owner-link {
  color: inherit;
  text-decoration: none;
  word-break: break-all;
}

.scape-detail__owner-link:hover {
  text-decoration: underline;
}
</style>
