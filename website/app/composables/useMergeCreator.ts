import { type MergePart, mergeDefinitionToTokenId } from "~/utils/merges";

const MAX_SCAPES = 8;

export const useMergeCreator = () => {
  const scapes = ref<MergePart[]>([]);
  const fadeMode = ref(true);

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
