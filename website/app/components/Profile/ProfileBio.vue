<template>
  <section
    v-if="description"
    class="profile-bio"
  >
    <p>{{ description }}</p>
  </section>
</template>

<script setup lang="ts">
defineProps<{ description: string | null | undefined }>()
</script>

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
