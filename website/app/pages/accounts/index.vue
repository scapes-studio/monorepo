<script setup lang="ts">
import { asc, desc, ne, sql } from "@ponder/client";

const client = usePonderClient();
const { public: { scapeCollectionAddress } } = useRuntimeConfig();

const PAGE_SIZE = 100;
const count = sql<number>`count(*)::int`;
const owners = ref<Array<{ owner: string; count: number }>>([]);
const offset = ref(0);
const isLoadingMore = ref(false);
const hasMore = ref(true);

const excludeScapeCollection = ne(schema.scape.owner, scapeCollectionAddress)

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
          <NuxtLink class="accounts-page__owner" :to="`/accounts/${entry.owner}`">
            {{ entry.owner }}
          </NuxtLink>
          <span class="accounts-page__count">{{ entry.count }} scapes</span>
        </li>
      </ol>
      <button v-if="hasMore" class="accounts-page__load-more" type="button" :disabled="isLoadingMore" @click="loadMore">
        <span v-if="isLoadingMore">Loading more…</span>
        <span v-else>Load more</span>
      </button>
      <div v-else class="accounts-page__status">All owners loaded.</div>
    </div>
  </section>
</template>

<style scoped>
.accounts-page {
  max-width: 72rem;
  margin: 0 auto;
  padding: var(--spacer-lg) var(--spacer);
  display: grid;
  gap: var(--spacer-lg);
}

.accounts-page__header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacer);
  justify-content: space-between;
  align-items: center;
}

.accounts-page__header h1 {
  margin: 0 0 0.35rem;
}

.accounts-page__subtitle {
  margin: 0;
  color: rgba(0, 0, 0, 0.6);
}

.accounts-page__stats {
  display: flex;
  gap: var(--spacer);
  font-weight: 600;
}

.accounts-page__status {
  padding: var(--spacer);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.04);
}

.accounts-page__status--error {
  background: rgba(255, 0, 0, 0.08);
}

.accounts-page__results {
  display: grid;
  gap: var(--spacer);
}

.accounts-page__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.75rem;
}

.accounts-page__row {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr) auto;
  gap: var(--spacer);
  align-items: center;
  padding: var(--spacer);
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.accounts-page__load-more {
  justify-self: center;
  padding: 0.65rem 1.5rem;
  border-radius: 999px;
  border: none;
  background: #111;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.accounts-page__load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.accounts-page__rank {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
}

.accounts-page__owner {
  font-weight: 600;
  color: inherit;
  text-decoration: none;
  word-break: break-all;
}

.accounts-page__owner:hover {
  text-decoration: underline;
}

.accounts-page__count {
  font-weight: 600;
}
</style>
