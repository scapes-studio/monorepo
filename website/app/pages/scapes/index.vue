<script setup lang="ts">
import type { GallerySortOption } from "~/composables/useScapesGallery"

const route = useRoute()
const router = useRouter()

const sortOptions = [
  { value: "id-asc", label: "ID (Low to High)" },
  { value: "id-desc", label: "ID (High to Low)" },
  { value: "rarity-desc", label: "Rarest First" },
  { value: "rarity-asc", label: "Most Common First" },
  { value: "price-asc", label: "Price (Low to High)" },
  { value: "price-desc", label: "Price (High to Low)" },
] as const

// State from URL query params
const selectedSort = ref<GallerySortOption>(
  (route.query.sort as GallerySortOption) || "id-asc",
)

const selectedTraits = ref<string[]>(
  route.query.traits
    ? decodeURIComponent(route.query.traits as string).split("&&")
    : [],
)

const showPrices = ref(route.query.prices === "true")

// Sync state to URL
watch(
  [selectedSort, selectedTraits, showPrices],
  () => {
    router.replace({
      query: {
        ...route.query,
        sort: selectedSort.value !== "id-asc" ? selectedSort.value : undefined,
        traits: selectedTraits.value.length
          ? encodeURIComponent(selectedTraits.value.join("&&"))
          : undefined,
        prices: showPrices.value ? "true" : undefined,
      },
    })
  },
  { deep: true },
)

const { scapes, total, loading, error, hasMore, loadMore, traitCounts, countsLoading } =
  useScapesGallery(selectedTraits, selectedSort, showPrices)

const updateSelectedTraits = (newTraits: string[]) => {
  selectedTraits.value = newTraits
}

useSeo({
  title: 'Scapes Gallery',
  description: 'Explore all 10,000 Scapes - pixel-art landscapes from September 2021.',
})
</script>

<template>
  <section class="gallery">
    <header class="gallery__header">
      <div>
        <h1>Scapes</h1>
        <p class="gallery__subtitle">10,000 pixel-art landscapes</p>
      </div>
      <div class="gallery__controls">
        <span v-if="total !== null" class="gallery__count">
          {{ total.toLocaleString() }} scapes
        </span>
        <label class="gallery__toggle">
          <input v-model="showPrices" type="checkbox" />
          Show prices
        </label>
        <select v-model="selectedSort" class="gallery__sort" aria-label="Sort scapes">
          <option v-for="option in sortOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
    </header>

    <GalleryFilterTags v-if="selectedTraits.length > 0" :selected-traits="selectedTraits"
      @update="updateSelectedTraits" />

    <div class="gallery__layout">
      <GalleryScapeGallerySidebar :selected-traits="selectedTraits" :trait-counts="traitCounts"
        :counts-loading="countsLoading" @update-traits="updateSelectedTraits" />

      <main class="gallery__main">
        <div v-if="loading && scapes.length === 0" class="gallery__status">
          Loading scapes...
        </div>
        <div v-else-if="error" class="gallery__status gallery__status--error">
          Unable to load scapes right now.
        </div>
        <div v-else-if="scapes.length === 0" class="gallery__status">
          No matching scapes found.
        </div>

        <template v-else>
          <ScapesVirtualGrid
            :scapes="scapes"
            :has-more="hasMore"
            :loading="loading"
            @load-more="loadMore"
          />

          <button v-if="hasMore" type="button" class="gallery__load-more" :disabled="loading" @click="loadMore">
            {{ loading ? "Loading..." : "Load more" }}
          </button>
        </template>
      </main>
    </div>
  </section>
</template>

<style scoped>
.gallery {
  max-width: var(--content-width-wide);
  margin: 0 auto;
  padding: var(--spacer-lg) var(--spacer);
  display: grid;
  gap: var(--spacer-lg);
}

.gallery__header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacer);
  justify-content: space-between;
  align-items: center;
}

.gallery__header h1 {
  margin: 0 0 var(--spacer-xs);
}

.gallery__subtitle {
  margin: 0;
  color: var(--muted);
}

.gallery__controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacer);
  align-items: center;
}

.gallery__count {
  font-weight: var(--font-weight-bold);
}

.gallery__toggle {
  display: flex;
  gap: var(--spacer-xs);
  align-items: center;
  font-size: var(--font-sm);
  cursor: pointer;
}

.gallery__toggle input {
  cursor: pointer;
}

.gallery__sort {
  padding: var(--spacer-xs) var(--spacer-sm);
  border-radius: var(--size-3);
  border: var(--border);
  background: var(--background);
  font-size: var(--font-sm);
  cursor: pointer;
}

.gallery__layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacer);
}

@media (min-width: 48rem) {
  .gallery__layout {
    grid-template-columns: min(20vw, 18rem) 1fr;
  }
}

.gallery__main {
  min-height: 50vh;
  display: grid;
  gap: var(--spacer-lg);
  align-content: start;
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
  justify-self: center;
  padding: var(--spacer-sm) var(--spacer-md);
  border-radius: var(--size-10);
  border: none;
  background: var(--color);
  color: var(--background);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

.gallery__load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
