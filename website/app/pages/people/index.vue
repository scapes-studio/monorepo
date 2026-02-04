<template>
  <section class="accounts-page">
    <GridArea :rows="2" center>
      <h1>{{ formatNumber(totalOwners) }} Scape Owners</h1>
      <p class="accounts-page__subtitle">Leaderboard by total scapes owned.</p>
    </GridArea>

    <div v-if="pending" class="accounts-page__status">Loading owners…</div>
    <div v-else-if="error" class="accounts-page__status accounts-page__status--error">
      Unable to load scape owners right now.
    </div>
    <div v-else-if="owners?.length === 0" class="accounts-page__status">No owners found.</div>

    <div v-else class="accounts-page__results">
      <ol class="accounts-page__list">
        <li v-for="(entry, index) in owners" :key="entry.owner" class="accounts-page__row grid-shadow">
          <span class="accounts-page__rank">{{ index + 1 }}</span>
          <AccountLink :address="entry.owner" class="accounts-page__owner" shorten-ens />
          <span class="accounts-page__count">{{ entry.count }} scapes</span>
        </li>
      </ol>
      <button v-if="hasMore" ref="loadMoreRef" class="accounts-page__load-more" type="button" :disabled="isLoadingMore"
        @click="loadMore">
        <span v-if="isLoadingMore">Loading more…</span>
        <span v-else>Load more</span>
      </button>
      <div v-else class="accounts-page__status">All owners loaded.</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { zeroAddress } from "viem";

const ogTitle = "Scape Owners";
const ogSubtitle = "Leaderboard of Scape owners ranked by total scapes owned.";
const ogImage = "https://scapes.xyz/og-default.png";

useSeo({
  title: ogTitle,
  description: ogSubtitle,
  image: null,
  imageAlt: null,
});

defineOgImageComponent(
  "PeopleIndex",
  {
    title: ogTitle,
    subtitle: ogSubtitle,
    image: ogImage,
  },

);

const client = usePonderClient();
const { public: { scapeCollectionAddress } } = useRuntimeConfig();
const normalizedCollectionAddress = scapeCollectionAddress.toLowerCase() as `0x${string}`;

const PAGE_SIZE = 20;
const count = sql<number>`count(*)::int`;
const owners = ref<Array<{ owner: string; count: number }>>([]);
const offset = ref(0);
const isLoadingMore = ref(false);
const hasMore = ref(true);

const excludeScapeCollection = and(
  ne(schema.scape.owner, normalizedCollectionAddress),
  ne(schema.scape.owner, zeroAddress),
)

const fetchOwners = async (startOffset: number) => client.db.select({
  owner: schema.scape.owner,
  count,
})
  .from(schema.scape)
  .where(excludeScapeCollection)
  .groupBy(schema.scape.owner)
  .orderBy(
    desc(count),
    asc(schema.scape.owner),
  )
  .limit(PAGE_SIZE)
  .offset(startOffset);

const { data: ownersData, pending, error } = await useAsyncData("scape-owners-leaderboard", () => fetchOwners(0));
const { data: totalsData } = await useAsyncData("scape-owners-totals", async () => {
  const ownersCount = await client.db
    .select({ total: sql<number>`count(distinct ${schema.scape.owner})::int` })
    .from(schema.scape)
    .where(excludeScapeCollection)

  return {
    owners: ownersCount[0]?.total ?? 0,
  };
});

watchEffect(() => {
  if (ownersData.value) {
    owners.value = ownersData.value;
    offset.value = ownersData.value.length;
    hasMore.value = ownersData.value.length === PAGE_SIZE;
  }
});

const loadMore = async () => {
  if (isLoadingMore.value || !hasMore.value) return;
  isLoadingMore.value = true;
  try {
    const nextOwners = await fetchOwners(offset.value);
    owners.value = [...owners.value, ...nextOwners];
    offset.value += nextOwners.length;
    hasMore.value = nextOwners.length === PAGE_SIZE;
  } finally {
    isLoadingMore.value = false;
  }
};

const totalOwners = computed(() => totalsData.value?.owners ?? 0);

const loadMoreRef = ref<HTMLElement | null>(null);
useIntersectionObserver(loadMoreRef, ([entry]) => {
  if (entry?.isIntersecting) loadMore();
});
</script>

<style scoped>
.accounts-page {
  max-width: var(--content-width);
  margin: 0 auto;
  display: grid;
  gap: var(--grid-gutter);
}

.accounts-page h1 {
  margin: 0;
}

.accounts-page__subtitle {
  margin: var(--grid-gutter) 0 0;
  color: var(--muted);
}

.accounts-page__status {
  padding: var(--grid-gutter);
  border-radius: var(--grid-gutter);
  background: var(--gray-z-1);
}

.accounts-page__status--error {
  background: oklch(from var(--error) l c h / 0.1);
}

.accounts-page__results {
  display: grid;
  gap: var(--grid-gutter);
}

.accounts-page__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--grid-gutter);
}

.accounts-page__row {
  display: grid;
  grid-template-columns: calc(var(--scape-height)/2) minmax(0, 1fr) auto;
  gap: var(--spacer);
  align-items: center;
  height: var(--scape-height);
  padding-inline: calc(var(--scape-height)/2);
  background: var(--background);
}

.accounts-page__load-more {
  text-align: center;

  &>span {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.accounts-page__load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.accounts-page__rank {
  color: var(--muted);
}

.accounts-page__owner {
  color: inherit;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.accounts-page__owner:hover {
  text-decoration: underline;
}

.accounts-page__count {
  color: var(--muted);
}
</style>
