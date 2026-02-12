import { and, asc, desc, sql } from "@ponder/client"
import type { TraitCounts } from "~/data/traits"
import { SCAPE_TRAIT_COUNTS, TRAITS } from "~/data/traits"
import type { ScapeRecord } from "~/composables/useScapesByOwner"
import type { ListingSource } from "~/types/listings"

export type GallerySortOption =
  | "id-asc"
  | "id-desc"
  | "rarity-asc"
  | "rarity-desc"
  | "price-asc"
  | "price-desc"

export type GalleryScape = ScapeRecord & {
  price?: bigint | null
  source?: ListingSource
}

type GalleryPayload = {
  total: number
  scapes: GalleryScape[]
}

type ListingsResponse = {
  data: Array<{
    id: string
    rarity: number | null
    price: string
    source: ListingSource
  }>
  meta: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

const PAGE_SIZE = 200

const buildTraitConditions = (traits: string[]) => {
  if (traits.length === 0) return undefined

  const conditions = traits.map((trait) => {
    const [category, value] = trait.split("=")
    // Use JSON containment query
    return sql`${schema.scape.attributes}::jsonb @> ${JSON.stringify([{ trait_type: category, value }])}::jsonb`
  })

  return conditions.length === 1 ? conditions[0] : and(...conditions)
}

const getSortOrder = (sortBy: GallerySortOption) => {
  switch (sortBy) {
    case "id-asc":
      return [asc(schema.scape.id)]
    case "id-desc":
      return [desc(schema.scape.id)]
    case "rarity-asc":
      return [asc(schema.scape.rarity), asc(schema.scape.id)]
    case "rarity-desc":
      return [desc(schema.scape.rarity), asc(schema.scape.id)]
    case "price-asc":
      return [asc(schema.offer.price), asc(schema.scape.id)]
    case "price-desc":
      return [desc(schema.offer.price), asc(schema.scape.id)]
    default:
      return [asc(schema.scape.id)]
  }
}

const isRaritySort = (sortBy: GallerySortOption) =>
  sortBy === "rarity-asc" || sortBy === "rarity-desc"

const getListingSort = (sortBy: GallerySortOption) => {
  switch (sortBy) {
    case "price-desc":
      return { sort: "price", order: "desc" }
    case "price-asc":
      return { sort: "price", order: "asc" }
    case "rarity-desc":
      return { sort: "rarity", order: "desc" }
    case "rarity-asc":
      return { sort: "rarity", order: "asc" }
    case "id-desc":
      return { sort: "id", order: "desc" }
    case "id-asc":
    default:
      return { sort: "id", order: "asc" }
  }
}

export const useScapesGallery = (
  selectedTraits: Ref<string[]>,
  sortBy: Ref<GallerySortOption> = ref("id-asc"),
  showPrices: Ref<boolean> = ref(false),
  includeSeaport: Ref<boolean> = ref(true),
) => {
  const client = usePonderClient()
  const isMarketMode = computed(
    () => showPrices.value || sortBy.value.startsWith("price"),
  )

  // Track additional items loaded via loadMore (separate from initial data)
  const additionalScapes = ref<GalleryScape[]>([])
  const loadMoreLoading = ref(false)
  const loadMoreError = ref<Error | null>(null)
  const loadMoreHasMore = ref<boolean | null>(null)
  const initialHasMore = ref<boolean | null>(null)

  // Trait counts (client-side only feature)
  const traitCounts = ref<TraitCounts>({ ...SCAPE_TRAIT_COUNTS })
  const countsLoading = ref(false)

  const reset = () => {
    additionalScapes.value = []
    loadMoreError.value = null
    loadMoreHasMore.value = null
    loadMoreLoading.value = false
    initialHasMore.value = null
  }

  // Fetch dynamic trait counts from API
  type AttributeCountRow = { category: string; value: string; count: string }
  const runtimeConfig = useRuntimeConfig()

  const fetchTraitCounts = async (currentTraits: string[]): Promise<TraitCounts> => {
    // If no filters, return static counts
    if (currentTraits.length === 0) {
      return { ...SCAPE_TRAIT_COUNTS }
    }

    // Build API URL with traits query param
    const traitsParam = currentTraits.join(",")
    const url = `${runtimeConfig.public.apiUrl}/scapes/attributes?traits=${encodeURIComponent(traitsParam)}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error("Failed to fetch attribute counts")
    }

    const rows: AttributeCountRow[] = await response.json()

    // Initialize counts structure with zeros
    const counts: TraitCounts = {} as TraitCounts
    for (const group of TRAITS) {
      counts[group.name] = { count: 0, values: {} }
      for (const value of group.values) {
        counts[group.name].values[value] = 0
      }
    }

    // Populate counts from API response
    for (const row of rows) {
      const category = row.category as keyof TraitCounts
      if (counts[category]) {
        const count = parseInt(row.count, 10)
        counts[category].values[row.value] = count
        counts[category].count += count
      }
    }

    return counts
  }

  // Debounced trait counts refresh
  let countsDebounceTimer: ReturnType<typeof setTimeout> | null = null
  const refreshTraitCounts = () => {
    if (countsDebounceTimer) {
      clearTimeout(countsDebounceTimer)
    }
    countsDebounceTimer = setTimeout(async () => {
      countsLoading.value = true
      try {
        traitCounts.value = await fetchTraitCounts(selectedTraits.value)
      } catch {
        // Keep existing counts on error
      } finally {
        countsLoading.value = false
      }
    }, 300)
  }

  // Watch selectedTraits and refresh counts
  watch(selectedTraits, refreshTraitCounts, { deep: true })

  const fetchListings = async (startOffset: number) => {
    const { sort, order } = getListingSort(sortBy.value)
    const traitsParam = selectedTraits.value.length
      ? selectedTraits.value.join("&&")
      : undefined

    const response = await $fetch<ListingsResponse>(
      `${runtimeConfig.public.apiUrl}/listings`,
      {
        query: {
          limit: PAGE_SIZE,
          offset: startOffset,
          sort,
          order,
          includeSeaport: includeSeaport.value,
          traits: traitsParam,
        },
      },
    )

    const scapes = response.data.map((listing) => {
      const base: GalleryScape = {
        id: BigInt(listing.id),
        rarity: listing.rarity,
      }

      if (!showPrices.value) {
        return base
      }

      return {
        ...base,
        price: BigInt(listing.price),
        source: listing.source,
      }
    })

    return {
      scapes,
      total: response.meta.total,
      hasMore: response.meta.hasMore,
    }
  }

  const fetchScapesWithoutPrices = async (
    traitConditions: ReturnType<typeof buildTraitConditions>,
    startOffset: number,
    sort: GallerySortOption,
  ) => {
    const rarityExclusion = isRaritySort(sort)
      ? sql`${schema.scape.id} <= 10000`
      : undefined
    const baseConditions = traitConditions
      ? and(traitConditions, rarityExclusion)
      : rarityExclusion

    return await client.db
      .select({
        id: schema.scape.id,
        rarity: schema.scape.rarity,
      })
      .from(schema.scape)
      .where(baseConditions)
      .orderBy(...getSortOrder(sort))
      .limit(PAGE_SIZE)
      .offset(startOffset)
  }

  const fetchCount = async (traitConditions: ReturnType<typeof buildTraitConditions>) => {
    const rarityExclusion = isRaritySort(sortBy.value)
      ? sql`${schema.scape.id} <= 10000`
      : undefined
    const baseConditions = traitConditions
      ? and(traitConditions, rarityExclusion)
      : rarityExclusion

    return await client.db.$count(schema.scape, baseConditions)
  }

  const fetchInitial = async (): Promise<GalleryPayload> => {
    const traitConditions = buildTraitConditions(selectedTraits.value)
    if (isMarketMode.value) {
      const result = await fetchListings(0)
      initialHasMore.value = result.hasMore
      return {
        total: result.total,
        scapes: result.scapes,
      }
    }

    const [countResult, scapesResult] = await Promise.all([
      fetchCount(traitConditions),
      fetchScapesWithoutPrices(traitConditions, 0, sortBy.value),
    ])

    return {
      total: countResult ?? 0,
      scapes: scapesResult,
    }
  }

  const asyncKey = computed(
    () =>
      `gallery-${selectedTraits.value.join(",")}-${sortBy.value}-${showPrices.value}-${includeSeaport.value}`,
  )

  const {
    data,
    pending,
    error: asyncError,
  } = useAsyncData(asyncKey, fetchInitial, {
    watch: [selectedTraits, sortBy, showPrices, includeSeaport],
    server: true,
  })

  // Reset additional state when filters change
  watch([selectedTraits, sortBy, showPrices, includeSeaport], () => {
    reset()
  })

  // Use computed for values derived from data to avoid hydration mismatch
  // Computed is lazy and reads data.value at render time when it's populated
  const scapes = computed(() => {
    const initial = data.value?.scapes ?? []
    return [...initial, ...additionalScapes.value]
  })

  const total = computed(() => data.value?.total ?? null)

  const hasMore = computed(() => {
    // If we've done a loadMore, use that state
    if (loadMoreHasMore.value !== null) {
      return loadMoreHasMore.value
    }
    if (initialHasMore.value !== null) {
      return initialHasMore.value
    }
    const initialCount = data.value?.scapes.length ?? 0
    return initialCount >= PAGE_SIZE
  })

  const error = computed(() => loadMoreError.value ?? asyncError.value ?? null)

  const loadMore = async () => {
    if (loadMoreLoading.value || pending.value || !hasMore.value) return
    loadMoreLoading.value = true
    loadMoreError.value = null

    try {
      const traitConditions = buildTraitConditions(selectedTraits.value)
      const currentOffset = (data.value?.scapes.length ?? 0) + additionalScapes.value.length
      if (isMarketMode.value) {
        const result = await fetchListings(currentOffset)
        additionalScapes.value.push(...result.scapes)
        loadMoreHasMore.value = result.hasMore
      } else {
        const result = await fetchScapesWithoutPrices(traitConditions, currentOffset, sortBy.value)
        additionalScapes.value.push(...result)
        if (result.length < PAGE_SIZE) {
          loadMoreHasMore.value = false
        }
      }
    } catch (err) {
      loadMoreError.value = err instanceof Error ? err : new Error("Failed to load scapes")
    } finally {
      loadMoreLoading.value = false
    }
  }

  const loading = computed(() => pending.value || loadMoreLoading.value)

  return {
    scapes,
    total,
    loading,
    error,
    hasMore,
    loadMore,
    traitCounts,
    countsLoading,
    pageSize: PAGE_SIZE,
  }
}
