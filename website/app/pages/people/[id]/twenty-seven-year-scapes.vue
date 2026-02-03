<template>
  <section class="gallery27-tab grid-shadow">
    <!-- Claimable Section (only shown on own profile) -->
    <template v-if="showClaimable">
      <header class="gallery27-tab__header grid-shadow">
        <h2>Claimable</h2>
        <span>{{ claimableScapes.length }} to claim</span>
      </header>
      <Gallery27Grid :scapes="claimableScapes" />
    </template>
    <div v-else-if="isOwnProfile && claimablePending" class="gallery27-tab__status">
      Checking for claimable scapes…
    </div>

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
import { useAccount } from "@wagmi/vue";
import type { ProfileResponse } from "~/composables/useProfile";

const injected = inject<{
  profile: Ref<ProfileResponse | null>;
  resolvedAddress: Ref<string | null>;
  displayAddress: Ref<string>;
}>("profile");

const profile = injected?.profile ?? ref(null);
const resolvedAddress = injected?.resolvedAddress ?? ref(null);
const displayAddress = injected?.displayAddress ?? computed(() => resolvedAddress.value ?? "");

// Check if viewing own profile
// FIXME: Use the composable from layers.evm
const { address: connectedAddress } = useAccount();
const isOwnProfile = computed(() =>
  connectedAddress.value?.toLowerCase() === resolvedAddress.value?.toLowerCase()
);

// Fetch owned scapes
const { data, pending, error } = await useGallery27ScapesByOwner(resolvedAddress);
const scapes = computed(() => data.value?.scapes ?? []);

// Fetch claimable scapes only when viewing own profile
const claimableOwner = computed(() => isOwnProfile.value ? resolvedAddress.value : null);
const { data: claimableData, pending: claimablePending } = await useGallery27ClaimableByOwner(claimableOwner);
const claimableScapes = computed(() => claimableData.value?.scapes ?? []);
const showClaimable = computed(() => isOwnProfile.value && claimableScapes.value.length > 0);

const ogTitle = computed(() =>
  displayAddress.value
    ? `Gallery27 for ${displayAddress.value}`
    : "Gallery27",
);
const ogSubtitle = computed(
  () => "Twenty Seven Year Scapes owned by this collector.",
);
const ogImage = computed(
  () =>
    profile.value?.data?.avatar || null
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
  },
  { cacheMaxAgeSeconds: 0 },
);
</script>

<style scoped>
.gallery27-tab {
  --grid-columns: var(--content-columns);

  display: grid;
  gap: var(--grid-gutter);
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
