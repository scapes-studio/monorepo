import { sql } from "@ponder/client";

export type ScapeRecord = {
  id: string;
  owner: string;
  attributes: Record<string, unknown> | null;
  rarity: number | null;
};

const PAGE_SIZE = 50;

export const useScapesByOwner = (owner: Ref<string | null | undefined>) => {
  const client = usePonderClient();
  const scapes = ref<ScapeRecord[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const hasMore = ref(true);
  const offset = ref(0);

  const reset = () => {
    scapes.value = [];
    error.value = null;
    offset.value = 0;
    hasMore.value = true;
  };

  const loadMore = async () => {
    if (!owner.value || loading.value || !hasMore.value) return;
    loading.value = true;
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
      loading.value = false;
    }
  };

  watch(
    owner,
    (value) => {
      reset();
      if (value) {
        loadMore();
      }
    },
    { immediate: true },
  );

  return {
    scapes,
    loading,
    error,
    hasMore,
    loadMore,
    pageSize: PAGE_SIZE,
  };
};
