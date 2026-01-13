<script setup lang="ts">
useSeoMeta({
  title: "Create Merge | Scapes",
  description: "Combine multiple Scapes into a unique merged artwork.",
});
</script>

<template>
  <ClientOnly>
    <MergeCreator />
  </ClientOnly>
</template>
