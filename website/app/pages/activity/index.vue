<template>
  <section class="activity-page">
    <header class="activity-page__header">
      <h1>Activity</h1>
      <p class="activity-page__subtitle">
        <span>Recent activity </span>
        <span v-if="total !== null" class="activity-page__count">({{ formatNumber(total) }} total events)</span>
      </p>
    </header>
    <ActivityFilters v-model="filters" />

    <div v-if="loading && activity.length === 0" class="activity-page__status">
      Loading activity...
    </div>
    <div v-else-if="error" class="activity-page__status activity-page__status--error">
      Unable to load activity right now.
    </div>
    <div v-else-if="activity.length === 0" class="activity-page__status">
      No activity found.
    </div>

    <template v-else>
      <ul class="activity-page__list">
        <ActivityItem v-for="item in activity" :key="item.id" :item="item" />
      </ul>

      <button v-if="hasMore" ref="loadMoreRef" class="activity-page__load-more" type="button" :disabled="loading"
        @click="loadMore">
        <span v-if="loading">Loading...</span>
        <span v-else>Load more</span>
      </button>
      <div v-else class="activity-page__status">All activity loaded.</div>
    </template>
  </section>
</template>

<script setup lang="ts">
import type { ActivityFilters } from "~/types/activity";

useSeo({
  title: 'Activity',
  description: 'Recent activity across Scapes collections - transfers, sales, and listings.',
});

const route = useRoute();
const router = useRouter();

const parseFilterParam = (value: unknown): boolean => {
  if (value === "false" || value === "0") return false;
  return true;
};

const getInitialFilters = (): ActivityFilters => ({
  transfers: parseFilterParam(route.query.transfers),
  sales: parseFilterParam(route.query.sales),
  listings: parseFilterParam(route.query.listings),
});

const filters = ref<ActivityFilters>(getInitialFilters());

watch(
  filters,
  (newFilters) => {
    const allDisabled = !newFilters.transfers && !newFilters.sales && !newFilters.listings;
    if (allDisabled) {
      nextTick(() => {
        filters.value = { transfers: true, sales: true, listings: true };
      });
      return;
    }

    const query: Record<string, string> = {};
    if (!newFilters.transfers) query.transfers = "false";
    if (!newFilters.sales) query.sales = "false";
    if (!newFilters.listings) query.listings = "false";
    router.replace({ query });
  },
  { deep: true }
);

const { activity, total, loading, error, hasMore, loadMore } = useActivity(filters);

const loadMoreRef = ref<HTMLElement | null>(null);
useIntersectionObserver(loadMoreRef, ([entry]) => {
  if (entry?.isIntersecting) loadMore();
});
</script>

<style scoped>
.activity-page {
  max-width: var(--content-width);
  margin: 0 auto;
  display: grid;
  gap: var(--grid-gutter);
}

.activity-page__header {
  display: flex;
  flex-direction: column;
  gap: var(--grid-gutter);
  align-items: center;
  justify-content: center;
  height: calc(2 * var(--scape-height-gutter) - var(--grid-gutter));
  padding-inline: calc(var(--scape-height) / 2);
  width: 100%;
  background: var(--background);
}

.activity-page__header h1 {
  margin: 0;
  width: 100%;
  text-align: center;
}

.activity-page__subtitle {
  margin: 0;
  width: 100%;
  color: var(--muted);
  text-align: center;
}

.activity-page__controls {
  margin: 0;
  padding: 0;
  height: var(--scape-height);

  >* {
    display: flex;
    justify-content: space-between;
  }
}

.activity-page__count {
  font-weight: var(--font-weight-bold);
}

.activity-page__status {
  padding: var(--grid-gutter);
  border-radius: var(--grid-gutter);
  background: var(--gray-z-1);
}

.activity-page__status--error {
  background: oklch(from var(--error) l c h / 0.1);
}

.activity-page__list {
  list-style: none;
  padding: 0;
  padding-top: var(--scape-height-gutter);
  margin: 0;
  display: grid;
  gap: calc(var(--scape-height) + 2 * var(--grid-gutter));
}

.activity-page__load-more {
  text-align: center;

  &>span {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.activity-page__load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
