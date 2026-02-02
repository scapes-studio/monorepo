<template>
  <section class="gallery">
    <GridArea width="full" center :rows="2">
      <h1>Scapes</h1>
      <p class="gallery__subtitle">{{ formatNumber(10_000) }} pixel-art landscapes</p>
    </GridArea>
    <GridArea class="gallery__header" :rows="2" width="full" padding tag="header">
      <div class="gallery__controls">
        <FormCheckbox v-model="showPrices" class="small">Show prices</FormCheckbox>
        <FormCheckbox v-if="isMarketMode" v-model="includeSeaport" class="small">Include OpenSea</FormCheckbox>
        <FormSelect v-model="selectedSort" :options="sortOptions" class="small" />
      </div>
    </GridArea>

    <GalleryFilterTags v-if="selectedTraits.length > 0" :selected-traits="selectedTraits"
      @update="updateSelectedTraits" />

    <div class="gallery__layout" :class="{ 'gallery__layout--with-sidebar': showSidebar }">
      <aside v-if="showSidebar" class="gallery__sidebar">
        <GalleryScapeGallerySidebar :selected-traits="selectedTraits" :trait-counts="traitCounts"
          :counts-loading="countsLoading" @update-traits="updateSelectedTraits" />
      </aside>

      <main class="gallery__main" :style="{ '--grid-columns': `${galleryColumns}` }">
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
          <ScapesVirtualGrid :scapes="scapes" :has-more="hasMore" :loading="loading" :columns="galleryColumns"
            @load-more="loadMore" />

          <button v-if="hasMore" type="button" class="gallery__load-more" :disabled="loading" @click="loadMore">
            {{ loading ? "Loading..." : "Load more" }}
          </button>
        </template>
      </main>
    </div>
  </section>
</template>

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
]

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
const includeSeaport = ref(route.query.seaport !== "false")
const isMarketMode = computed(
  () => showPrices.value || selectedSort.value.startsWith("price"),
)

// Sync state to URL
watch(
  [selectedSort, selectedTraits, showPrices, includeSeaport],
  () => {
    router.replace({
      query: {
        ...route.query,
        sort: selectedSort.value !== "id-asc" ? selectedSort.value : undefined,
        traits: selectedTraits.value.length
          ? encodeURIComponent(selectedTraits.value.join("&&"))
          : undefined,
        prices: showPrices.value ? "true" : undefined,
        seaport: includeSeaport.value ? undefined : "false",
      },
    })
  },
  { deep: true },
)

const { columns } = useScapeGrid()

const showSidebar = computed(() => columns.value > 4)
const galleryColumns = computed(() => Math.max(1, columns.value - (showSidebar.value ? 2 : 0)))

const { scapes, total, loading, error, hasMore, loadMore, traitCounts, countsLoading } =
  useScapesGallery(selectedTraits, selectedSort, showPrices, includeSeaport)

const updateSelectedTraits = (newTraits: string[]) => {
  selectedTraits.value = newTraits
}

useSeo({
  title: 'Scapes Gallery',
  description: 'Explore all 10,000 Scapes - pixel-art landscapes from September 2021.',
})
</script>

<style scoped>
.gallery {
  margin: 0 auto;
  display: grid;
  gap: var(--grid-gutter);
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

.gallery__layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacer);
}

.gallery__layout--with-sidebar {
  grid-template-columns: repeat(var(--grid-columns), var(--scape-width));
  gap: var(--grid-gutter);
}

.gallery__sidebar {
  grid-column: 1 / span 2;
}

.gallery__layout--with-sidebar .gallery__main {
  grid-column: 3 / -1;
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
  cursor: pointer;
}

.gallery__load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
