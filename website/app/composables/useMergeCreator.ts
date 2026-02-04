import { type MergePart, mergeDefinitionToTokenId } from "~/utils/merges";

const MAX_SCAPES = 8;

/**
 * Parse URL params into merge state.
 * Format: ?scapes=1,2f,3&fade=1
 * - Each scape id can have 'f' suffix for flipX
 * - fade=1 means fade mode, fade=0 means merge mode
 */
const parseScapesParam = (param: string | null): MergePart[] => {
  if (!param) return [];

  return param
    .split(",")
    .slice(0, MAX_SCAPES)
    .map((part) => {
      const trimmed = part.trim();
      const flipX = trimmed.endsWith("f");
      const idStr = flipX ? trimmed.slice(0, -1) : trimmed;
      const id = parseInt(idStr, 10);

      if (Number.isNaN(id) || id < 1 || id > 10000) return null;

      return [BigInt(id), flipX, false] as MergePart;
    })
    .filter((p): p is MergePart => p !== null);
};

/**
 * Serialize merge state to URL param format.
 */
const serializeScapesParam = (scapes: MergePart[]): string => {
  return scapes
    .map((s) => `${s[0]}${s[1] ? "f" : ""}`)
    .join(",");
};

export const useMergeCreator = () => {
  const route = useRoute();
  const router = useRouter();

  // Initialize from URL params
  const initialScapes = parseScapesParam(route.query.scapes as string | null);
  const initialFade = route.query.fade !== "0";

  const scapes = ref<MergePart[]>(initialScapes);
  const fadeMode = ref(initialFade);

  // Sync state to URL
  const syncToUrl = () => {
    const query = { ...route.query } as Record<string, string | undefined>;

    if (scapes.value.length > 0) {
      query.scapes = serializeScapesParam(scapes.value);
    } else {
      delete query.scapes;
    }

    if (!fadeMode.value) {
      query.fade = "0";
    } else {
      delete query.fade;
    }

    router.replace({ query });
  };

  // Watch for changes and sync to URL
  watch([scapes, fadeMode], syncToUrl, { deep: true });

  const tokenId = computed(() => {
    if (scapes.value.length < 2) return 0n;
    return mergeDefinitionToTokenId(scapes.value, fadeMode.value);
  });

  const canMerge = computed(() => scapes.value.length >= 2);
  const isFull = computed(() => scapes.value.length >= MAX_SCAPES);

  const addScape = (id: bigint) => {
    if (isFull.value) return;
    if (scapes.value.some((s) => s[0] === id)) return;
    scapes.value = [...scapes.value, [id, false, false]];
  };

  const removeScape = (index: number) => {
    scapes.value = scapes.value.filter((_, i) => i !== index);
  };

  const toggleFlipX = (index: number) => {
    scapes.value = scapes.value.map((s, i) =>
      i === index ? [s[0], !s[1], s[2]] : s,
    );
  };

  const clear = () => {
    scapes.value = [];
  };

  const selectedIds = computed(() => scapes.value.map((s) => s[0]));

  return {
    scapes,
    fadeMode,
    tokenId,
    canMerge,
    isFull,
    selectedIds,
    addScape,
    removeScape,
    toggleFlipX,
    clear,
  };
};
