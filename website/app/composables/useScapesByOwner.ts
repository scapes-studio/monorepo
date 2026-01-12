import { sql } from "@ponder/client";

export type ScapeRecord = {
  id: string;
  owner: string;
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

  const parseCount = (result: unknown) => {
    const rows =
      (result as { rows?: Array<{ count: number | string }> }).rows ??
      (result as Array<{ count: number | string }>);
    const countValue = rows[0]?.count ?? rows[0];
    return countValue === undefined ? 0 : Number(countValue);
  };

  const fetchInitial = async (): Promise<ScapesPayload> => {
    if (!owner.value) {
      return { total: 0, scapes: [] };
    }

    const normalizedOwner = owner.value.toLowerCase();
    const [countResult, scapesResult] = await Promise.all([
      client.db.execute(sql`
        SELECT COUNT(*)::int AS count
        FROM scape
        WHERE owner = ${normalizedOwner}
      `),
      client.db.execute(sql`
        SELECT id, owner, attributes, rarity
        FROM scape
        WHERE owner = ${normalizedOwner}
        ORDER BY id DESC
        LIMIT ${PAGE_SIZE}
        OFFSET 0
      `),
    ]);

    const rows = (scapesResult as { rows?: ScapeRecord[] }).rows ?? (scapesResult as ScapeRecord[]);
    const mapped = rows.map((row) => ({
      id: row.id.toString(),
      owner: row.owner,
      attributes: row.attributes ?? null,
      rarity: row.rarity ?? null,
    }));

    return {
      total: parseCount(countResult),
      scapes: mapped,
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
      const result = await client.db.execute(sql`
        SELECT id, owner, attributes, rarity
        FROM scape
        WHERE owner = ${normalizedOwner}
        ORDER BY id DESC
        LIMIT ${PAGE_SIZE}
        OFFSET ${offset.value}
      `);

      const rows = (result as { rows?: ScapeRecord[] }).rows ?? (result as ScapeRecord[]);
      const mapped = rows.map((row) => ({
        id: row.id.toString(),
        owner: row.owner,
        attributes: row.attributes ?? null,
        rarity: row.rarity ?? null,
      }));

      scapes.value.push(...mapped);
      offset.value += rows.length;
      if (rows.length < PAGE_SIZE) {
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
