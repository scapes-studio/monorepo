import { and, asc, desc, eq, isNull } from "@ponder/client";
import type { ScapeRecord } from "~/composables/useScapesByOwner";

export type ListedScape = ScapeRecord & {
  price: bigint;
};

export type SortOption = "price-asc" | "price-desc" | "recent";

type ListedScapesPayload = {
  total: number;
  scapes: ListedScape[];
};

const PAGE_SIZE = 100;

export const useListedScapes = (sortBy: Ref<SortOption> = ref("price-asc")) => {
  const client = usePonderClient();
  const scapes = ref<ListedScape[]>([]);
  const total = ref<number | null>(null);
  const loadMoreLoading = ref(false);
  const error = ref<Error | null>(null);
  const hasMore = ref(true);
  const offset = ref(0);

  const reset = () => {
    scapes.value = [];
    total.value = null;
    error.value = null;
    offset.value = 0;
    hasMore.value = true;
    loadMoreLoading.value = false;
  };

  const getOrderBy = (sort: SortOption) => {
    switch (sort) {
      case "price-asc":
        return asc(schema.offer.price);
      case "price-desc":
        return desc(schema.offer.price);
      case "recent":
        return desc(schema.offer.updatedAt);
    }
  };

  const activeOfferConditions = and(
    eq(schema.offer.isActive, true),
    isNull(schema.offer.specificBuyer),
  );

  const fetchScapes = async (startOffset: number, sort: SortOption) => {
    return client.db
      .select({
        id: schema.scape.id,
        owner: schema.scape.owner,
        attributes: schema.scape.attributes,
        rarity: schema.scape.rarity,
        price: schema.offer.price,
      })
      .from(schema.offer)
      .innerJoin(schema.scape, eq(schema.offer.tokenId, schema.scape.id))
      .where(activeOfferConditions)
      .orderBy(getOrderBy(sort))
      .limit(PAGE_SIZE)
      .offset(startOffset);
  };

  const fetchInitial = async (): Promise<ListedScapesPayload> => {
    const [countResult, scapesResult] = await Promise.all([
      client.db.$count(schema.offer, activeOfferConditions),
      fetchScapes(0, sortBy.value),
    ]);

    return {
      total: countResult ?? 0,
      scapes: scapesResult as ListedScape[],
    };
  };

  const asyncKey = computed(() => `listed-scapes-${sortBy.value}`);
  const { data, pending, error: asyncError } = useAsyncData(asyncKey, fetchInitial, {
    watch: [sortBy],
    server: true,
  });

  watch(
    data,
    (value) => {
      if (!value) return;
      scapes.value = value.scapes;
      total.value = value.total;
      offset.value = value.scapes.length;
      hasMore.value = value.scapes.length >= PAGE_SIZE;
    },
    { immediate: true },
  );

  watch(
    asyncError,
    (value) => {
      error.value = value ?? null;
    },
    { immediate: true },
  );

  watch(sortBy, () => {
    reset();
  });

  const loadMore = async () => {
    if (loadMoreLoading.value || pending.value || !hasMore.value) return;
    loadMoreLoading.value = true;
    error.value = null;

    try {
      const result = await fetchScapes(offset.value, sortBy.value);
      scapes.value.push(...(result as ListedScape[]));
      offset.value += result.length;
      if (result.length < PAGE_SIZE) {
        hasMore.value = false;
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Failed to load listings");
    } finally {
      loadMoreLoading.value = false;
    }
  };

  const loading = computed(() => pending.value || loadMoreLoading.value);

  return {
    scapes,
    total,
    loading,
    error,
    hasMore,
    loadMore,
    pageSize: PAGE_SIZE,
  };
};
