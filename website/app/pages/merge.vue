<template>
  <section class="merge">
    <GridArea width="content" center :rows="2">
      <h1>Create Merge</h1>
      <p class="muted">Combine multiple Scapes into a unique merged artwork.</p>
    </GridArea>

    <ClientOnly>
      <MergeCreator />
    </ClientOnly>
  </section>
</template>

<script setup lang="ts">
useSeo({
  title: 'Create Merge',
  description: 'Combine multiple Scapes into a unique merged artwork.',
});
</script>

<style scoped>
.merge {
  margin: 0 auto;
  display: grid;
  gap: var(--grid-gutter);
}
</style>
