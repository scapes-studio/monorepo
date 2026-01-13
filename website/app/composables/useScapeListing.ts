import type { ListingSource } from "./useListedScapes";

export type ListingData = {
  price: string;
  source: ListingSource;
} | null;

type ListingResponse = {
  data: ListingData;
};

export const useScapeListing = (scapeId: MaybeRefOrGetter<string>) => {
  const runtimeConfig = useRuntimeConfig();

  const listingKey = computed(() => `scape-listing-${toValue(scapeId)}`);

  const {
    data: listing,
    status,
    error,
    refresh,
  } = useAsyncData<ListingResponse>(
    listingKey,
    async () => {
      const baseUrl = runtimeConfig.public.apiUrl.replace(/\/$/, "");
      return await $fetch<ListingResponse>(`${baseUrl}/listings/${toValue(scapeId)}`);
    },
    {
      watch: [() => toValue(scapeId)],
    },
  );

  const isPending = computed(() => status.value === "pending");
  const hasError = computed(() => Boolean(error.value));
  const listingData = computed(() => listing.value?.data ?? null);
  const isListed = computed(() => listingData.value !== null);
  const source = computed(() => listingData.value?.source ?? null);
  const price = computed(() => listingData.value?.price ?? null);

  return {
    listing: listingData,
    isPending,
    hasError,
    isListed,
    source,
    price,
    refresh,
  };
};
