import { and, desc, eq, isNull, lte, sql } from "@ponder/client";
import type { ScapeRecord } from "~/composables/useScapesByOwner";

export type ScapeOnMarket = ScapeRecord & {
  price: bigint;
};

const PAGE_SIZE = 500;

export const usePreviewScapes = () => {
  const client = usePonderClient();

  const fetchScapes = async () => {
    const result = await client.db
      .select({
        id: schema.scape.id,
        owner: schema.scape.owner,
        attributes: schema.scape.attributes,
        rarity: schema.scape.rarity,
        price: schema.offer.price,
      })
      .from(schema.offer)
      .innerJoin(schema.scape, eq(schema.offer.tokenId, schema.scape.id))
      .where(and(eq(schema.offer.isActive, true), isNull(schema.offer.specificBuyer), lte(schema.scape.id, 10_000n)))
      .orderBy(desc(schema.offer.price))
      .limit(PAGE_SIZE);

    return result as ScapeOnMarket[];
  };

  const { data, pending, error } = useAsyncData("preview-scapes", fetchScapes, {
    server: true,
  });

  const scapes = computed(() => data.value ?? []);

  return {
    scapes,
    loading: pending,
    error,
  };
};

export const useRandomScapes = () => {
  const client = usePonderClient();
  const scapes = ref<ScapeRecord[]>([]);
  const loading = ref(true);
  const loadingMore = ref(false);
  const error = ref<Error | null>(null);
  const hasMore = ref(true);
  const offset = ref(0);

  const fetchScapes = async (currentOffset: number) => {
    const result = await client.db
      .select({
        id: schema.scape.id,
        owner: schema.scape.owner,
        attributes: schema.scape.attributes,
        rarity: schema.scape.rarity,
      })
      .from(schema.scape)
      .where(lte(schema.scape.id, 10_000n))
      .orderBy(schema.scape.id)
      .limit(PAGE_SIZE)
      .offset(currentOffset);

    return result as ScapeRecord[];
  };

  const loadInitial = async () => {
    loading.value = true;
    try {
      const result = await fetchScapes(0);
      scapes.value = result;
      offset.value = result.length;
      hasMore.value = result.length === PAGE_SIZE;
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  };

  const loadMore = async () => {
    if (loadingMore.value || !hasMore.value) return;

    loadingMore.value = true;
    try {
      const result = await fetchScapes(offset.value);
      scapes.value = [...scapes.value, ...result];
      offset.value += result.length;
      hasMore.value = result.length === PAGE_SIZE;
    } catch (e) {
      error.value = e as Error;
    } finally {
      loadingMore.value = false;
    }
  };

  onMounted(() => {
    loadInitial();
  });

  return {
    scapes,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
  };
};
