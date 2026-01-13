import type { ProfileResponse } from "./useProfile";

type ENSCacheState = "pending" | "resolved";

type ENSCacheEntry = {
  ens: string | null;
  state: ENSCacheState;
};

// Module-level reactive cache shared across all component instances
const ensCache: Record<string, ENSCacheEntry | undefined> = reactive({});

// Track pending requests to avoid duplicate fetches
const pendingRequests = new Map<string, Promise<void>>();

export type AccountDisplay = {
  address: `0x${string}`;
  ens: string | null;
  displayName: string;
  url: string;
};

// Utility to shorten address
const shortenAddress = (value: string, start = 6, end = 4): string => {
  if (!value) return "";
  if (value.length <= start + end) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
};

export const useENSResolution = () => {
  const runtimeConfig = useRuntimeConfig();
  const baseUrl = computed(() => runtimeConfig.public.apiUrl.replace(/\/$/, ""));

  const getENS = (address: string): string | null => {
    const entry = ensCache[address.toLowerCase()];
    return entry?.ens ?? null;
  };

  const isResolved = (address: string): boolean => {
    const entry = ensCache[address.toLowerCase()];
    return entry?.state === "resolved";
  };

  const resolveAddress = async (address: string): Promise<void> => {
    const normalizedAddress = address.toLowerCase();

    // Skip if already resolved or pending
    if (ensCache[normalizedAddress]?.state === "resolved") return;
    if (pendingRequests.has(normalizedAddress)) {
      await pendingRequests.get(normalizedAddress);
      return;
    }

    // Mark as pending in cache
    ensCache[normalizedAddress] = { ens: null, state: "pending" };

    const request = $fetch<ProfileResponse>(`${baseUrl.value}/profiles/${address}`)
      .then((response) => {
        ensCache[normalizedAddress] = {
          ens: response.ens,
          state: "resolved",
        };
      })
      .catch(() => {
        // On error, mark as resolved with null ENS (graceful fallback)
        ensCache[normalizedAddress] = { ens: null, state: "resolved" };
      })
      .finally(() => {
        pendingRequests.delete(normalizedAddress);
      });

    pendingRequests.set(normalizedAddress, request);
    await request;
  };

  const resolveAddresses = async (addresses: string[]): Promise<void> => {
    const uniqueAddresses = [...new Set(addresses.filter(Boolean))];
    await Promise.all(uniqueAddresses.map(resolveAddress));
  };

  const getAccountDisplay = (address: `0x${string}` | string | undefined): AccountDisplay => {
    if (!address) {
      return { address: "0x" as `0x${string}`, ens: null, displayName: "", url: "/people" };
    }

    const normalizedAddress = address as `0x${string}`;

    // Trigger resolution as side effect (runs in background)
    resolveAddress(normalizedAddress);

    const ens = getENS(normalizedAddress);
    const displayName = ens || shortenAddress(normalizedAddress);
    const url = `/people/${ens || normalizedAddress}`;

    return { address: normalizedAddress, ens, displayName, url };
  };

  return {
    getENS,
    isResolved,
    resolveAddress,
    resolveAddresses,
    getAccountDisplay,
  };
};
