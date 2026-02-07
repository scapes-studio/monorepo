<template>
  <section class="scapes-tab grid-shadow" :class="{ 'has-merges': showMerges }">
    <GridArea v-if="scapesError" padding center>
      Failed to load scapes.
    </GridArea>
    <ScapesSkeleton v-else-if="scapesLoading && scapes.length === 0" :count="contentColumns * 3" />
    <GridArea v-else-if="scapes.length === 0" padding center>
      No scapes found for this account.
    </GridArea>

    <template v-else>
      <!-- Merges Section -->
      <template v-if="showMerges">
        <header class="scapes-tab__header grid-shadow">
          <h2>Merges</h2>
          <span>{{ merges.length }} owned</span>
        </header>
        <ScapesGrid :scapes="merges" :columns="contentColumns" />
      </template>

      <!-- Scapes Section -->
      <header v-if="showMerges" class="scapes-tab__header grid-shadow">
        <h2>Scapes</h2>
        <span>{{ regularScapes.length }} owned</span>
      </header>
      <ScapesGrid :scapes="regularScapes" :columns="contentColumns" />
    </template>

    <button v-if="hasMore" class="scapes-tab__load-more" type="button" :disabled="scapesLoading" @click="loadMore">
      {{ scapesLoading ? "Loading…" : "Load more" }}
    </button>
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

const {
  scapes,
  total: scapesTotal,
  loading: scapesLoading,
  error: scapesError,
  hasMore,
  loadMore,
} = await useScapesByOwner(resolvedAddress);

const merges = computed(() => scapes.value.filter(s => s.id > 10_000n));
const regularScapes = computed(() => scapes.value.filter(s => s.id <= 10_000n));
const showMerges = computed(() => merges.value.length > 0);

const { contentColumns } = useScapeGrid();

const ogTitle = computed(() => {
  const ens = profile.value?.ens;
  if (ens) return ens;
  const addr = displayAddress.value;
  return addr ? shortenAddress(addr) : "Profile";
});
const ogSubtitle = computed(
  () => profile.value?.data?.description || "Scapes owned and activity overview.",
);
const ogAvatar = computed(
  () => profile.value?.data?.avatar || "https://scapes.xyz/oneday-profile.png",
);
const ogScapeIds = computed(() =>
  regularScapes.value.slice(0, 36).map(s => Number(s.id)),
);
const ogCount = computed(() => scapesTotal.value ?? scapes.value.length);

const seoOptions = computed(() => ({
  title: ogTitle.value,
  description: ogSubtitle.value,
  image: null,
  imageAlt: null,
}));
useSeo(seoOptions);

defineOgImageComponent(
  "PeopleProfile",
  {
    title: ogTitle,
    subtitle: ogSubtitle,
    image: ogAvatar,
    scapeIds: ogScapeIds,
    count: ogCount,
  },
);
</script>

<style scoped>
.scapes-tab {
  --grid-columns: var(--content-columns);

  display: grid;
  gap: var(--grid-gutter);
  margin-top: var(--scape-height-gutter);
}

.scapes-tab__header {
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

.scapes-tab__header h2 {
  margin: 0;
}

.scapes-tab__status {
  padding: var(--spacer);
  border-radius: var(--size-3);
  background: var(--gray-z-1);
}
</style>
