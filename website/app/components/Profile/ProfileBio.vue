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
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
}

.profile-bio h2 {
  margin-top: 0;
}

.profile-bio__empty {
  color: rgba(0, 0, 0, 0.6);
}
</style>
