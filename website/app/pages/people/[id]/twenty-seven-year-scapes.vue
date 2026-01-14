<script setup lang="ts">
import type { ProfileResponse } from "~/composables/useProfile";

const injected = inject<{
  profile: Ref<ProfileResponse | null>;
  resolvedAddress: Ref<string | null>;
  displayAddress: Ref<string>;
}>("profile");

const resolvedAddress = injected?.resolvedAddress ?? ref(null);

const { data, pending, error } = await use27YScapesByOwner(resolvedAddress);

const scapes = computed(() => data.value?.scapes ?? []);
</script>

<template>
  <section class="gallery27-tab">
    <header class="gallery27-tab__header">
      <h2>Twenty Seven Year Scapes</h2>
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

<style scoped>
.gallery27-tab {
  display: grid;
  gap: var(--spacer);
}

.gallery27-tab__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
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
