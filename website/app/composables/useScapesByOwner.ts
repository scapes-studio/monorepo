import { desc, eq } from "@ponder/client";

export type ScapeRecord = {
  id: bigint;
  owner: `0x${string}`;
  attributes: Record<string, unknown> | null;
  rarity: number | null;
};

type ScapesPayload = {
  total: number;
  scapes: ScapeRecord[];
};

const PAGE_SIZE = 500;

export const useScapesByOwner = (owner: Ref<string | null | undefined>) => {
  const client = usePonderClient();
  const scapes = ref<ScapeRecord[]>([]);
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

  const fetchScapes = async (normalizedOwner: `0x${string}`, startOffset: number) =>
    client.db
      .select({
        id: schema.scape.id,
        owner: schema.scape.owner,
        attributes: schema.scape.attributes,
        rarity: schema.scape.rarity,
      })
      .from(schema.scape)
      .where(eq(schema.scape.owner, normalizedOwner))
      .orderBy(desc(schema.scape.id))
      .limit(PAGE_SIZE)
      .offset(startOffset);

  const fetchInitial = async (): Promise<ScapesPayload> => {
    if (!owner.value) {
      return { total: 0, scapes: [] };
    }

    const normalizedOwner = owner.value.toLowerCase() as `0x${string}`;
    const [countResult, scapesResult] = await Promise.all([
      client.db.$count(schema.scape, eq(schema.scape.owner, normalizedOwner)),
      fetchScapes(normalizedOwner, 0),
    ]);

    return {
      total: countResult ?? 0,
      scapes: scapesResult as ScapeRecord[],
    };
  };

  const asyncKey = computed(() => `scapes-by-owner-${owner.value?.toLowerCase() ?? "unknown"}`);
  const { data, pending, error: asyncError } = useAsyncData(asyncKey, fetchInitial, {
    watch: [owner],
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

  watch(owner, (value) => {
    if (!value) {
      reset();
    }
  });

  const loadMore = async () => {
    if (!owner.value || loadMoreLoading.value || pending.value || !hasMore.value) return;
    loadMoreLoading.value = true;
    error.value = null;

    try {
      const normalizedOwner = owner.value.toLowerCase();
      const result = await fetchScapes(normalizedOwner, offset.value);
      scapes.value.push(...result);
      offset.value += result.length;
      if (result.length < PAGE_SIZE) {
        hasMore.value = false;
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Failed to load scapes");
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
