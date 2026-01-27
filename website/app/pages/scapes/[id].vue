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

defineOgImageComponent(
  "ScapeDetail",
  {
    title: ogTitle,
    subtitle: ogSubtitle,
    image: ogImage,
  },
  {
    width: 1200,
    height: 1200,
  },
);

const scapeCount = computed(() => mergeScapeCount(BigInt(scapeId.value)));

const sesModalOpen = ref(false);
</script>

<template>
  <section class="scape-detail" :style="{ '--scape-count': scapeCount }">
    <div class="scape-detail__image">
      <ScapeImage :id="scapeId" :scape-count="scapeCount" />
    </div>
    <header class="scape-detail__header">
      <div class="scape-detail__meta">
        <h1>Scape #{{ scapeId }}</h1>
        <div class="scape-detail__stats">
          <span>{{ totalTransfers }} transfers</span>
          <span>{{ totalSales }} sales</span>
        </div>
        <div class="scape-detail__owner">
          <span v-if="scapePending">Loading owner…</span>
          <template v-else-if="owner">
            Owned by
            <AccountLink :address="owner" class="scape-detail__owner-link" />
          </template>
        </div>
        <NuxtLink v-if="gallery27TokenId" :to="`/gallery27/${gallery27TokenId}`" class="scape-detail__gallery27-link">
          View Gallery27 Day {{ gallery27TokenId }}
        </NuxtLink>
        <ScapesMarketplaceData :listing="listing" :is-pending="listingPending" :has-error="listingError"
          class="scape-detail__listings" />
        <ScapesActions :scape-id="scapeId" :owner="owner" :listing="listing" class="scape-detail__actions"
          @listing-change="refreshListing" />
        <button type="button" class="scape-detail__ses-button" @click="sesModalOpen = true">
          Play SES
        </button>
      </div>
    </header>

    <ScapesAttributes :attributes="attributes" />

    <ScapesTransactionHistory :history="history" :pending="pending" :error="error" />

    <ClientOnly>
      <ScapesSESModal v-model:open="sesModalOpen" :token-id="scapeId" />
    </ClientOnly>
  </section>
</template>

<style scoped>
.scape-detail {
  max-width: var(--content-width);
  margin: 0 auto;
  display: grid;
  gap: var(--scape-height-gutter);
  container-type: inline-size;
}

.scape-detail__image {
  justify-self: center;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--background);
  width: 100%;

  height: calc(var(--scape-height) * var(--content-columns, 5) * 3 + var(--grid-gutter) * (var(--content-columns, 5) * 3 - 1));

  img {
    width: calc(var(--scape-width-gutter) * var(--detail-columns, 3) * var(--scape-count, 1));
    max-width: 100%;
    height: auto;
  }
}

.scape-detail__header {
  justify-self: center;
  text-align: center;
}

.scape-detail__meta h1 {
  margin: 0 0 var(--spacer-sm);
}

.scape-detail__stats {
  display: flex;
  justify-content: center;
  gap: var(--spacer);
  font-weight: var(--font-weight-bold);
}

.scape-detail__owner {
  margin-top: var(--spacer-sm);
  color: var(--muted);
}

.scape-detail__owner-link {
  font-weight: var(--font-weight-bold);
  color: inherit;
  text-decoration: none;
  word-break: break-all;
}

.scape-detail__owner-link:hover {
  text-decoration: underline;
}

.scape-detail__gallery27-link {
  display: inline-block;
  margin-top: var(--spacer-sm);
  color: var(--color-accent);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
}

.scape-detail__gallery27-link:hover {
  text-decoration: underline;
}

.scape-detail__listings {
  margin-top: var(--size-3);
}

.scape-detail__actions {
  margin-top: var(--spacer);
}

.scape-detail__ses-button {
  margin-top: var(--spacer);
  padding: var(--spacer-sm) var(--spacer);
  background: var(--color-accent);
  color: var(--color-bg);
  border: none;
  cursor: pointer;
  font-weight: var(--font-weight-bold);
  transition: opacity 0.2s;
}

.scape-detail__ses-button:hover {
  opacity: 0.9;
}
</style>
