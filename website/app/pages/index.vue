<template>
  <section class="gallery">
    <GridArea width="full" center :rows="2">
      <h1>WELCOME HOME</h1>
      <p class="muted">{{ formatNumber(10_000) }} pixel-art landscapes on Ethereum</p>
    </GridArea>

    <GridArea class="controls" width="full" padding>
      <FormCheckbox v-model="showPrices" class="small for-sale-toggle">For Sale</FormCheckbox>

      <div>
        <span>Sort by:</span>
        <FormSelect v-model="selectedSort" :options="sortOptions" class="small" />
      </div>
    </GridArea>

    <GridArea v-if="selectedTraits.length > 0" class="filter-tags" width="full" padding>
      <GalleryFilterTags :selected-traits="selectedTraits" @update="updateSelectedTraits" />
    </GridArea>

    <ClientOnly>
      <div class="gallery__layout" :class="{ 'gallery__layout--with-sidebar': showSidebar }">
        <aside v-if="showSidebar" class="gallery__sidebar">
          <GalleryScapeGallerySidebar :selected-traits="selectedTraits" :trait-counts="traitCounts"
            :counts-loading="countsLoading" @update-traits="updateSelectedTraits" />
        </aside>

        <main class="gallery__main" :style="{ '--grid-columns': `${galleryColumns}` }">
          <ScapesSkeleton v-if="loading && scapes.length === 0" :count="galleryColumns * 4" />
          <div v-else-if="error" class="gallery__status gallery__status--error">
            Unable to load scapes right now.
          </div>
          <div v-else-if="scapes.length === 0" class="gallery__status">
            No matching scapes found.
          </div>

          <template v-else>
            <ScapesVirtualGrid :scapes="scapes" :has-more="hasMore" :loading="loading" :columns="galleryColumns"
              :show-prices="showPrices" @load-more="loadMore" />

            <Button v-if="hasMore" class="gallery__load-more" :disabled="loading" @click="loadMore">
              {{ loading ? "Loading..." : "Load more" }}
            </Button>
          </template>
        </main>
      </div>
    </ClientOnly>
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

const priceSorts = new Set<GallerySortOption>(["price-asc", "price-desc"])

watch(selectedSort, (nextSort) => {
  if (priceSorts.has(nextSort)) {
    showPrices.value = true
  }
})

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

const { isMobile, columns } = useScapeGrid()

const showSidebar = computed(() => !isMobile.value)
const galleryColumns = computed(() => Math.max(1, columns.value - (showSidebar.value ? 2 : 0)))

const { scapes, loading, error, hasMore, loadMore, traitCounts, countsLoading } =
  useScapesGallery(selectedTraits, selectedSort, showPrices, includeSeaport)

const updateSelectedTraits = (newTraits: string[]) => {
  selectedTraits.value = newTraits
}

useSeo({
  title: 'Scapes on Ethereum',
  description: '10,000 Scapes - composable pixel art landscapes inspired by CryptoPunks.',
})
</script>

<style scoped>
.gallery {
  margin: 0 auto;
  display: grid;
  gap: var(--grid-gutter);

  &>.controls,
  &>.filter-tags {
    display: flex;
    gap: var(--spacer-lg);
    align-items: center;
    padding-block: 0;
    overflow: auto;
  }

  &>.controls {
    justify-content: center;
    font-size: var(--font-sm);

    @media (min-width: 800px) {
      justify-content: flex-end;
    }

    &>* {
      white-space: nowrap;
    }

    &>div {
      display: flex;
      align-items: center;
      gap: var(--spacer);
    }

    &:deep(select),
    &:deep(button) {
      font-size: var(--font-sm);
    }
  }
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
