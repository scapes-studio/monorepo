<script setup lang="ts">
defineProps<{ description: string | null | undefined }>();
</script>

<template>
  <section class="profile-bio">
    <h2>About</h2>
    <p v-if="description">{{ description }}</p>
    <p v-else class="profile-bio__empty">No description available.</p>
  </section>
</template>

<style scoped>
.profile-bio {
  padding: var(--spacer);
  border: var(--border);
  border-radius: var(--spacer);
}

.profile-bio h2 {
  margin-top: 0;
}

.profile-bio__empty {
  color: var(--muted);
}
</style>
