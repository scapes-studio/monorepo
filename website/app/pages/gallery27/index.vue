<template>
  <section class="gallery">
    <GridArea width="full" center :rows="3">
      <h1>27 Year Scapes</h1>
      <p class="muted">A daily AI-generated scape for 27 years.</p>

      <Button to="/gallery27/now" class="current-link">Go to today</Button>
    </GridArea>

    <div v-if="loading && scapes.length === 0" class="gallery__status">
      Loading scapes...
    </div>
    <div v-else-if="error" class="gallery__status gallery__status--error">
      Unable to load scapes right now.
    </div>
    <div v-else-if="scapes.length === 0" class="gallery__status">
      No scapes available yet.
    </div>

    <template v-else>
      <Gallery27Grid :scapes="scapes" />

      <Button v-if="hasMore" ref="loadMoreRef" class="gallery__load-more" :disabled="loading" @click="loadMore">
        {{ loading ? "Loading..." : "Load more" }}
      </Button>
    </template>
  </section>
</template>

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

<style scoped>
.gallery {
  margin: 0 auto;
  display: grid;
  gap: var(--grid-gutter);
}

.current-link {
  margin-top: var(--spacer-lg);
}

.gallery__status {
  padding: var(--spacer);
  border-radius: var(--size-3);
  background: var(--gray-z-1);
}

.gallery__status--error {
  background: oklch(from var(--error) l c h / 0.1);
}

.gallery__load-more {
  opacity: 0.001;
}
</style>
