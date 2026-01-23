<script setup lang="ts">
useSeo({
  title: '27 Year Scapes',
  description: 'A daily AI-generated scape for 27 years. Browse the Gallery27 collection.',
});

const { scapes, total, loading, error, hasMore, loadMore } = useGallery27List();

const loadMoreRef = ref<HTMLElement | null>(null);
useIntersectionObserver(loadMoreRef, ([entry]) => {
  if (entry?.isIntersecting) loadMore();
});
</script>

<template>
  <section class="gallery27-page">
    <header class="gallery27-page__header">
      <div>
        <h1>27 Year Scapes</h1>
        <p class="gallery27-page__subtitle">A daily AI-generated scape for 27 years.</p>
      </div>
      <div class="gallery27-page__header-actions">
        <NuxtLink to="/gallery27/now" class="gallery27-page__current-link">
          Current Auction
        </NuxtLink>
        <span v-if="total !== null" class="gallery27-page__count">
          {{ total }} scapes
        </span>
      </div>
    </header>

    <div v-if="loading && scapes.length === 0" class="gallery27-page__status">
      Loading scapes...
    </div>
    <div v-else-if="error" class="gallery27-page__status gallery27-page__status--error">
      Unable to load scapes right now.
    </div>
    <div v-else-if="scapes.length === 0" class="gallery27-page__status">
      No scapes available yet.
    </div>

    <template v-else>
      <Gallery27Grid :scapes="scapes" />

      <button
        v-if="hasMore"
        ref="loadMoreRef"
        class="gallery27-page__load-more"
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
.gallery27-page {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--spacer-lg) var(--spacer);
  display: grid;
  gap: var(--spacer-lg);
}

.gallery27-page__header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacer);
  justify-content: space-between;
  align-items: center;
}

.gallery27-page__header h1 {
  margin: 0 0 var(--spacer-xs);
}

.gallery27-page__subtitle {
  margin: 0;
  color: var(--muted);
}

.gallery27-page__header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacer);
  align-items: center;
}

.gallery27-page__current-link {
  padding: var(--spacer-xs) var(--spacer-sm);
  border-radius: var(--size-10);
  background: var(--color);
  color: var(--background);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
}

.gallery27-page__count {
  font-weight: var(--font-weight-bold);
}

.gallery27-page__status {
  padding: var(--spacer);
  border-radius: var(--size-3);
  background: var(--gray-z-1);
}

.gallery27-page__status--error {
  background: oklch(from var(--error) l c h / 0.1);
}

.gallery27-page__load-more {
  justify-self: center;
  padding: var(--spacer-sm) var(--spacer-md);
  border-radius: var(--size-10);
  border: none;
  background: var(--color);
  color: var(--background);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

.gallery27-page__load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
