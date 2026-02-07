<template>
  <section class="gallery27-tab grid-shadow">
    <!-- Claimable Section (client-only, requires wallet) -->
    <Gallery27Claimable :resolved-address="resolvedAddress" />

    <!-- Owned Section -->
    <header class="gallery27-tab__header grid-shadow">
      <h2>Owned</h2>
      <span>{{ scapes.length }} owned</span>
    </header>

    <div v-if="error" class="gallery27-tab__status gallery27-tab__status--error">
      Failed to load scapes.
    </div>
    <div v-else-if="pending" class="gallery27-tab__status">
      Loading scapes…
    </div>
    <div v-else-if="scapes.length === 0" class="gallery27-tab__status">
      No Twenty Seven Year Scapes found for this account.
    </div>

    <Gallery27Grid v-else :scapes="scapes" />
  </section>
</template>

<script setup lang="ts">
import type { ProfileResponse } from "~/composables/useProfile";
import { shortenAddress } from "~/composables/useENSResolution";

const injected = inject<{
  profile: Ref<ProfileResponse | null>;
  resolvedAddress: Ref<string | null>;
  displayAddress: Ref<string>;
}>("profile");

const profile = injected?.profile ?? ref(null);
const resolvedAddress = injected?.resolvedAddress ?? ref(null);
const displayAddress = injected?.displayAddress ?? computed(() => resolvedAddress.value ?? "");

// Fetch owned scapes
const { data, pending, error } = await useGallery27ScapesByOwner(resolvedAddress);
const scapes = computed(() => data.value?.scapes ?? []);

const ogTitle = computed(() => {
  const ens = profile.value?.ens;
  if (ens) return ens;
  const addr = displayAddress.value;
  return addr ? shortenAddress(addr) : "Profile";
});
const ogSubtitle = computed(
  () => "Twenty Seven Year Scapes owned by this collector.",
);
const ogImage = computed(
  () =>
    profile.value?.data?.avatar || "https://scapes.xyz/oneday-profile.png"
);

const CDN_BASE = "https://cdn.scapes.xyz";
const ogImageUrls = computed(() =>
  scapes.value.slice(0, 16).map((s) => {
    if (s.imagePath) return `${CDN_BASE}/${s.imagePath}`;
    if (s.scapeId) return `${CDN_BASE}/scapes/sm/${s.scapeId}.png`;
    return null;
  }).filter((url): url is string => url !== null),
);

const seoOptions = computed(() => ({
  title: ogTitle.value,
  description: ogSubtitle.value,
  image: null,
  imageAlt: null,
}));
useSeo(seoOptions);

defineOgImageComponent(
  "PeopleGallery27",
  {
    title: ogTitle,
    subtitle: ogSubtitle,
    image: ogImage,
    imageUrls: ogImageUrls,
  },
  { cacheMaxAgeSeconds: 0 },
);
</script>

<style scoped>
.gallery27-tab {
  --grid-columns: var(--content-columns);

  display: grid;
  gap: var(--grid-gutter);
  margin-top: var(--scape-height-gutter);
}

.gallery27-tab__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: var(--scape-height);
  margin: var(--scape-height-gutter) 0 0;
  background: var(--background);
  padding: var(--spacer);

  &:first-of-type {
    margin-top: 0;
  }
}

.gallery27-tab__header h2 {
  margin: 0;
}

.gallery27-tab__status {
  padding: var(--spacer);
  border-radius: var(--size-3);
  background: var(--gray-z-1);
}

.gallery27-tab__status--error {
  background: oklch(from var(--error) l c h / 0.1);
}
</style>
