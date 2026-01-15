<script setup lang="ts">
useSeo({
  title: 'Create Merge',
  description: 'Combine multiple Scapes into a unique merged artwork.',
});
</script>

<template>
  <ClientOnly>
    <MergeCreator />
  </ClientOnly>
</template>
