import { and, asc, desc, eq, isNull, ne, sql } from "@ponder/client"
import type { TraitCounts } from "~/data/traits"
import { SCAPE_TRAIT_COUNTS, TRAITS } from "~/data/traits"
import type { ScapeRecord } from "~/composables/useScapesByOwner"
import type { ListingSource } from "~/composables/useListedScapes"

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

const PAGE_SIZE = 100

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

export const useScapesGallery = (
  selectedTraits: Ref<string[]>,
  sortBy: Ref<GallerySortOption> = ref("id-asc"),
  showPrices: Ref<boolean> = ref(false),
) => {
  const client = usePonderClient()
  const { public: { scapeCollectionAddress } } = useRuntimeConfig()
  const normalizedCollectionAddress = scapeCollectionAddress.toLowerCase() as `0x${string}`

  // Exclude scapes owned by contract (merged scapes)
  const excludeMergedScapes = ne(schema.scape.owner, normalizedCollectionAddress)

  // Track additional items loaded via loadMore (separate from initial data)
  const additionalScapes = ref<GalleryScape[]>([])
  const loadMoreLoading = ref(false)
  const loadMoreError = ref<Error | null>(null)
  const loadMoreHasMore = ref<boolean | null>(null)

  // Trait counts (client-side only feature)
  const traitCounts = ref<TraitCounts>({ ...SCAPE_TRAIT_COUNTS })
  const countsLoading = ref(false)

  const reset = () => {
    additionalScapes.value = []
    loadMoreError.value = null
    loadMoreHasMore.value = null
    loadMoreLoading.value = false
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

  const activeOfferConditions = and(
    eq(schema.offer.isActive, true),
    isNull(schema.offer.specificBuyer),
  )

  const fetchScapesWithPrices = async (
    traitConditions: ReturnType<typeof buildTraitConditions>,
    startOffset: number,
    sort: GallerySortOption,
  ) => {
    const isPriceSorted = sort.startsWith("price")
    const baseConditions = traitConditions
      ? and(excludeMergedScapes, traitConditions)
      : excludeMergedScapes

    if (isPriceSorted) {
      // For price sorting, inner join to only show listed scapes
      const results = await client.db
        .select({
          id: schema.scape.id,
          rarity: schema.scape.rarity,
          price: schema.offer.price,
        })
        .from(schema.scape)
        .innerJoin(schema.offer, eq(schema.offer.tokenId, schema.scape.id))
        .where(and(baseConditions, activeOfferConditions))
        .orderBy(...getSortOrder(sort))
        .limit(PAGE_SIZE)
        .offset(startOffset)

      return results.map((r) => ({ ...r, source: "onchain" as const }))
    }

    // For other sorts, left join to include all scapes with optional price
    const results = await client.db
      .select({
        id: schema.scape.id,
        rarity: schema.scape.rarity,
        price: schema.offer.price,
      })
      .from(schema.scape)
      .leftJoin(
        schema.offer,
        and(eq(schema.offer.tokenId, schema.scape.id), activeOfferConditions),
      )
      .where(baseConditions)
      .orderBy(...getSortOrder(sort))
      .limit(PAGE_SIZE)
      .offset(startOffset)

    return results.map((r) => ({
      ...r,
      source: r.price ? ("onchain" as const) : undefined,
    }))
  }

  const fetchScapesWithoutPrices = async (
    traitConditions: ReturnType<typeof buildTraitConditions>,
    startOffset: number,
    sort: GallerySortOption,
  ) => {
    const baseConditions = traitConditions
      ? and(excludeMergedScapes, traitConditions)
      : excludeMergedScapes

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
    const baseConditions = traitConditions
      ? and(excludeMergedScapes, traitConditions)
      : excludeMergedScapes

    return await client.db.$count(schema.scape, baseConditions)
  }

  const fetchListedCount = async (traitConditions: ReturnType<typeof buildTraitConditions>) => {
    const baseConditions = traitConditions
      ? and(excludeMergedScapes, traitConditions, activeOfferConditions)
      : and(excludeMergedScapes, activeOfferConditions)

    const result = await client.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.scape)
      .innerJoin(schema.offer, eq(schema.offer.tokenId, schema.scape.id))
      .where(baseConditions)

    return result[0]?.count ?? 0
  }

  const fetchInitial = async (): Promise<GalleryPayload> => {
    const traitConditions = buildTraitConditions(selectedTraits.value)
    const isPriceSorted = sortBy.value.startsWith("price")

    const [countResult, scapesResult] = await Promise.all([
      isPriceSorted
        ? fetchListedCount(traitConditions)
        : fetchCount(traitConditions),
      showPrices.value || isPriceSorted
        ? fetchScapesWithPrices(traitConditions, 0, sortBy.value)
        : fetchScapesWithoutPrices(traitConditions, 0, sortBy.value),
    ])

    return {
      total: countResult ?? 0,
      scapes: scapesResult,
    }
  }

  const asyncKey = computed(
    () =>
      `gallery-${selectedTraits.value.join(",")}-${sortBy.value}-${showPrices.value}`,
  )

  const {
    data,
    pending,
    error: asyncError,
  } = useAsyncData(asyncKey, fetchInitial, {
    watch: [selectedTraits, sortBy, showPrices],
    server: true,
  })

  // Reset additional state when filters change
  watch([selectedTraits, sortBy, showPrices], () => {
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
    // Otherwise, derive from initial data
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
      const result =
        showPrices.value || sortBy.value.startsWith("price")
          ? await fetchScapesWithPrices(traitConditions, currentOffset, sortBy.value)
          : await fetchScapesWithoutPrices(traitConditions, currentOffset, sortBy.value)

      additionalScapes.value.push(...result)
      if (result.length < PAGE_SIZE) {
        loadMoreHasMore.value = false
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
