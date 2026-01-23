<script setup lang="ts">
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

const excludeScapeCollection = ne(schema.scape.owner, normalizedCollectionAddress)

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
  const [ownersCount, scapesCount] = await Promise.all([
    client.db
      .select({ total: sql<number>`count(distinct ${schema.scape.owner})::int` })
      .from(schema.scape)
      .where(excludeScapeCollection),
    client.db
      .select({ total: sql<number>`count(*)::int` })
      .from(schema.scape)
      .where(excludeScapeCollection),
  ]);

  return {
    owners: ownersCount[0]?.total ?? 0,
    scapes: scapesCount[0]?.total ?? 0,
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
const totalScapes = computed(() => totalsData.value?.scapes ?? 0);

const loadMoreRef = ref<HTMLElement | null>(null);
useIntersectionObserver(loadMoreRef, ([entry]) => {
  if (entry?.isIntersecting) loadMore();
});
</script>

<template>
  <section class="accounts-page">
    <header class="accounts-page__header">
      <div>
        <h1>Scape Owners</h1>
        <p class="accounts-page__subtitle">Leaderboard by total scapes owned.</p>
      </div>
      <div class="accounts-page__stats">
        <span>{{ totalOwners }} owners</span>
        <span>{{ totalScapes }} total scapes</span>
      </div>
    </header>

    <div v-if="pending" class="accounts-page__status">Loading owners…</div>
    <div v-else-if="error" class="accounts-page__status accounts-page__status--error">
      Unable to load scape owners right now.
    </div>
    <div v-else-if="owners?.length === 0" class="accounts-page__status">No owners found.</div>

    <div v-else class="accounts-page__results">
      <ol class="accounts-page__list">
        <li v-for="(entry, index) in owners" :key="entry.owner" class="accounts-page__row">
          <span class="accounts-page__rank">{{ index + 1 }}</span>
          <AccountLink :address="entry.owner" class="accounts-page__owner" />
          <span class="accounts-page__count">{{ entry.count }} scapes</span>
        </li>
      </ol>
      <button v-if="hasMore" ref="loadMoreRef" class="accounts-page__load-more" type="button" :disabled="isLoadingMore" @click="loadMore">
        <span v-if="isLoadingMore">Loading more…</span>
        <span v-else>Load more</span>
      </button>
      <div v-else class="accounts-page__status">All owners loaded.</div>
    </div>
  </section>
</template>

<style scoped>
.accounts-page {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--grid-gutter);
  padding-top: 0;
  display: grid;
  gap: var(--grid-gutter);
}

.accounts-page__header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--grid-gutter);
  justify-content: space-between;
  align-items: center;
  min-height: calc(var(--scape-height-gutter) - var(--grid-gutter));
}

.accounts-page__header h1 {
  margin: 0;
}

.accounts-page__subtitle {
  margin: 0;
  color: var(--muted);
}

.accounts-page__stats {
  display: flex;
  gap: var(--grid-gutter);
  font-weight: var(--font-weight-bold);
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
  grid-template-columns: calc(2 * var(--grid-gutter)) minmax(0, 1fr) auto;
  gap: var(--grid-gutter);
  align-items: center;
  padding: var(--grid-gutter);
  border-radius: var(--grid-gutter);
  border: var(--border);
}

.accounts-page__load-more {
  justify-self: center;
  padding: calc(var(--grid-gutter) / 2) var(--grid-gutter);
  border-radius: var(--grid-gutter);
  border: none;
  background: var(--color);
  color: var(--background);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

.accounts-page__load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.accounts-page__rank {
  font-weight: var(--font-weight-bold);
  color: var(--muted);
}

.accounts-page__owner {
  font-weight: var(--font-weight-bold);
  color: inherit;
  text-decoration: none;
  word-break: break-all;
}

.accounts-page__owner:hover {
  text-decoration: underline;
}

.accounts-page__count {
  font-weight: var(--font-weight-bold);
}
</style>
