<script setup lang="ts">
import type { SortOption } from "~/composables/useListedScapes";

const sortOptions = [
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "recent", label: "Recently Listed" },
] as const;

const selectedSort = ref<SortOption>("price-asc");
const includeSeaport = ref(true);

const { scapes, total, loading, error, hasMore, loadMore } = useListedScapes(
  selectedSort,
  includeSeaport,
);
</script>

<template>
  <section class="market-page">
    <header class="market-page__header">
      <div>
        <h1>Market</h1>
        <p class="market-page__subtitle">Scapes currently listed for sale.</p>
      </div>
      <div class="market-page__controls">
        <span v-if="total !== null" class="market-page__count">
          {{ total }} listed
        </span>
        <label class="market-page__toggle">
          <input
            v-model="includeSeaport"
            type="checkbox"
          />
          Include OpenSea
        </label>
        <select
          v-model="selectedSort"
          class="market-page__sort"
          aria-label="Sort listings"
        >
          <option
            v-for="option in sortOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
    </header>

    <div v-if="loading && scapes.length === 0" class="market-page__status">
      Loading listings...
    </div>
    <div v-else-if="error" class="market-page__status market-page__status--error">
      Unable to load listings right now.
    </div>
    <div v-else-if="scapes.length === 0" class="market-page__status">
      No scapes currently listed.
    </div>

    <template v-else>
      <ScapesGrid :scapes="scapes" />

      <button
        v-if="hasMore"
        class="market-page__load-more"
        type="button"
        :disabled="loading"
        @click="loadMore"
      >
        {{ loading ? "Loading..." : "Load more" }}
      </button>
    </template>
  </section>
</template>

<style scoped>
.market-page {
  max-width: var(--content-width-wide);
  margin: 0 auto;
  padding: var(--spacer-lg) var(--spacer);
  display: grid;
  gap: var(--spacer-lg);
}

.market-page__header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacer);
  justify-content: space-between;
  align-items: center;
}

.market-page__header h1 {
  margin: 0 0 var(--spacer-xs);
}

.market-page__subtitle {
  margin: 0;
  color: var(--muted);
}

.market-page__controls {
  display: flex;
  gap: var(--spacer);
  align-items: center;
}

.market-page__count {
  font-weight: var(--font-weight-bold);
}

.market-page__toggle {
  display: flex;
  gap: var(--spacer-xs);
  align-items: center;
  font-size: var(--font-sm);
  cursor: pointer;
}

.market-page__toggle input {
  cursor: pointer;
}

.market-page__sort {
  padding: var(--spacer-xs) var(--spacer-sm);
  border-radius: var(--size-3);
  border: var(--border);
  background: var(--background);
  font-size: var(--font-sm);
  cursor: pointer;
}

.market-page__status {
  padding: var(--spacer);
  border-radius: var(--size-3);
  background: var(--gray-z-1);
}

.market-page__status--error {
  background: oklch(from var(--error) l c h / 0.1);
}

.market-page__load-more {
  justify-self: center;
  padding: var(--spacer-sm) var(--spacer-md);
  border-radius: var(--size-10);
  border: none;
  background: var(--color);
  color: var(--background);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

.market-page__load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
