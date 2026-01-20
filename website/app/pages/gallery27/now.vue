<script setup lang="ts">
import type { Gallery27ScapeDetail } from "~/types/gallery27";

const runtimeConfig = useRuntimeConfig();

const { data: scape, pending, error } = await useAsyncData(
  "gallery27-current",
  async () => {
    const baseUrl = runtimeConfig.public.apiUrl.replace(/\/$/, "");
    return await $fetch<Gallery27ScapeDetail>(`${baseUrl}/gallery27/current`);
  },
);

// Redirect to the current auction if found
watch(
  () => scape.value,
  (current) => {
    if (current?.tokenId) {
      navigateTo(`/gallery27/${current.tokenId}`, { replace: true });
    }
  },
  { immediate: true },
);

useSeo({
  title: 'Current Auction',
  description: 'View the current Gallery27 auction. Daily AI-generated scapes for 27 years.',
});
</script>

<template>
  <div class="gallery27-now">
    <div v-if="pending" class="gallery27-now__status">
      Loading current auction...
    </div>
    <div v-else-if="error || !scape" class="gallery27-now__status gallery27-now__status--empty">
      <p>No active auction right now.</p>
      <NuxtLink to="/gallery27" class="gallery27-now__link">
        Browse all scapes
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.gallery27-now {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--spacer-lg) var(--spacer);
}

.gallery27-now__status {
  padding: var(--spacer);
  border-radius: var(--size-3);
  background: var(--gray-z-1);
  text-align: center;
}

.gallery27-now__status--empty {
  display: grid;
  gap: var(--spacer);
  justify-items: center;
}

.gallery27-now__status--empty p {
  margin: 0;
}

.gallery27-now__link {
  padding: var(--spacer-sm) var(--spacer-md);
  border-radius: var(--size-10);
  background: var(--color);
  color: var(--background);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
}
</style>
