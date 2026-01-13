<script setup lang="ts">
import type { ActivityFilters } from "~/types/activity";

const filters = ref<ActivityFilters>({
  transfers: true,
  sales: true,
  listings: true,
  offers: true,
});

const { activity, total, loading, error, hasMore, loadMore } = useActivity(filters);
</script>

<template>
  <section class="activity-page">
    <header class="activity-page__header">
      <div>
        <h1>Activity</h1>
        <p class="activity-page__subtitle">Recent activity across all collections.</p>
      </div>
      <div class="activity-page__controls">
        <span v-if="total !== null" class="activity-page__count">
          {{ total }} events
        </span>
        <ActivityFilters v-model="filters" />
      </div>
    </header>

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

      <button
        v-if="hasMore"
        class="activity-page__load-more"
        type="button"
        :disabled="loading"
        @click="loadMore"
      >
        {{ loading ? "Loading..." : "Load more" }}
      </button>
      <div v-else class="activity-page__status">All activity loaded.</div>
    </template>
  </section>
</template>

<style scoped>
.activity-page {
  max-width: var(--content-width-wide);
  margin: 0 auto;
  padding: var(--spacer-lg) var(--spacer);
  display: grid;
  gap: var(--spacer-lg);
}

.activity-page__header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacer);
  justify-content: space-between;
  align-items: flex-start;
}

.activity-page__header h1 {
  margin: 0 0 var(--spacer-xs);
}

.activity-page__subtitle {
  margin: 0;
  color: var(--muted);
}

.activity-page__controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacer-sm);
  align-items: flex-end;
}

.activity-page__count {
  font-weight: var(--font-weight-bold);
}

.activity-page__status {
  padding: var(--spacer);
  border-radius: var(--size-3);
  background: var(--gray-z-1);
}

.activity-page__status--error {
  background: oklch(from var(--error) l c h / 0.1);
}

.activity-page__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--spacer);
}

.activity-page__load-more {
  justify-self: center;
  padding: var(--spacer-sm) var(--spacer-md);
  border-radius: var(--size-10);
  border: none;
  background: var(--color);
  color: var(--background);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

.activity-page__load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
