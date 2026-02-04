<template>
  <section class="merge">
    <GridArea width="content" center :rows="2">
      <h1>Scape Merges</h1>
      <p class="muted">An early experiment of composable onchain art.</p>
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
