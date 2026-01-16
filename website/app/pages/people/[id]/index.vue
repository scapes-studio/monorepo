<script setup lang="ts">
import type { ProfileResponse } from "~/composables/useProfile";

const injected = inject<{
  profile: Ref<ProfileResponse | null>;
  resolvedAddress: Ref<string | null>;
  displayAddress: Ref<string>;
}>("profile");

const profile = injected?.profile ?? ref(null);
const resolvedAddress = injected?.resolvedAddress ?? ref(null);
const displayAddress = injected?.displayAddress ?? computed(() => resolvedAddress.value ?? "");

const {
  scapes,
  total: scapesTotal,
  loading: scapesLoading,
  error: scapesError,
  hasMore,
  loadMore,
} = useScapesByOwner(resolvedAddress);

const scapesOwnedCount = computed(() => scapesTotal.value ?? scapes.value.length);

const ogTitle = computed(() =>
  displayAddress.value ? `Profile ${displayAddress.value}` : "Profile",
);
const ogSubtitle = computed(
  () => profile.value?.data?.description || "Scapes owned and activity overview.",
);

const seoOptions = computed(() => ({
  title: ogTitle.value,
  description: ogSubtitle.value,
  image: null,
  imageAlt: null,
}));
useSeo(seoOptions);

defineOgImage({
  component: "PeopleProfile",
  title: ogTitle,
  subtitle: ogSubtitle,
  image: profile.value?.data?.avatar || null,
  cacheMaxAgeSeconds: 0,
});
</script>

<template>
  <section class="scapes-tab">
    <header class="scapes-tab__header">
      <h2>Scapes</h2>
      <span>{{ scapesOwnedCount }} owned</span>
    </header>

    <div v-if="scapesError" class="scapes-tab__status scapes-tab__status--error">
      Failed to load scapes.
    </div>
    <div v-else-if="scapesLoading && scapes.length === 0" class="scapes-tab__status">
      Loading scapes…
    </div>
    <div v-else-if="scapes.length === 0" class="scapes-tab__status">
      No scapes found for this account.
    </div>

    <ScapesGrid v-else :scapes="scapes" />

    <button v-if="hasMore" class="scapes-tab__load-more" type="button" :disabled="scapesLoading" @click="loadMore">
      {{ scapesLoading ? "Loading…" : "Load more" }}
    </button>
  </section>
</template>

<style scoped>
.scapes-tab {
  display: grid;
  gap: var(--spacer);
}

.scapes-tab__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.scapes-tab__header h2 {
  margin: 0;
}

.scapes-tab__status {
  padding: var(--spacer);
  border-radius: var(--size-3);
  background: var(--gray-z-1);
}

.scapes-tab__status--error {
  background: oklch(from var(--error) l c h / 0.1);
}

.scapes-tab__load-more {
  justify-self: center;
  padding: var(--spacer-sm) var(--spacer-md);
  border-radius: var(--size-10);
  border: var(--border);
  background: var(--background);
  cursor: pointer;
}

.scapes-tab__load-more:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
