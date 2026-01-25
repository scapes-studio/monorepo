<script setup lang="ts">
defineProps<{ description: string | null | undefined }>();
</script>

<template>
  <section class="profile-bio">
    <p v-if="description">{{ description }}</p>
    <p v-else class="profile-bio__empty">No description available.</p>
  </section>
</template>

<style scoped>
.profile-bio {
  padding: var(--spacer);
  height: calc(2 * var(--scape-height-gutter) - var(--grid-gutter));
  background: var(--background);
  display: flex;
  align-items: center;
}

.profile-bio h2 {
  margin-top: 0;
}

.profile-bio__empty {
  color: var(--muted);
}
</style>
