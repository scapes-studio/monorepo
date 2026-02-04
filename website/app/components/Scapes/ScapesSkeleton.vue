<template>
  <div class="scapes-skeleton">
    <div v-for="i in count" :key="i" class="scapes-skeleton__item">
      <div class="scapes-skeleton__image" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  count?: number
}>()
</script>

<style scoped>
.scapes-skeleton {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns, 4), var(--scape-width));
  gap: var(--grid-gutter);
}

.scapes-skeleton__item {
  width: var(--scape-width);
  height: var(--scape-height);
}

.scapes-skeleton__image {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--gray-z-1) 0%,
    var(--gray-z-2) 50%,
    var(--gray-z-1) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
