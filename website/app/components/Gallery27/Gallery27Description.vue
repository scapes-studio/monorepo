<script setup lang="ts">
const props = defineProps<{
  tokenId: number;
  scapeId: number | null;
  description: string | null;
}>();
</script>

<template>
  <div class="gallery27-description">
    <p v-if="description" class="gallery27-description__text">
      {{ description }}
    </p>

    <div v-if="scapeId" class="gallery27-description__link">
      Based on <NuxtLink :to="`/scapes/${scapeId}`">Scape #{{ scapeId }}</NuxtLink>
    </div>

    <div class="gallery27-description__links">
      <a
        :href="`https://opensea.io/assets/ethereum/0x8b8c4e99e13e50e0313de1e7c8f6b21a0a86a39c/${tokenId}`"
        target="_blank"
        rel="noopener"
      >
        OpenSea
      </a>
    </div>
  </div>
</template>

<style scoped>
.gallery27-description {
  display: grid;
  gap: var(--spacer-sm);
}

.gallery27-description__text {
  margin: 0;
}

.gallery27-description__link {
  font-size: var(--font-sm);
  color: var(--muted);
}

.gallery27-description__links {
  display: flex;
  gap: var(--spacer);
  font-size: var(--font-sm);
}
</style>
