<script setup lang="ts">
import type { ScapeRecord } from "~/composables/useScapesByOwner";

defineProps<{ scape: ScapeRecord }>();
</script>

<template>
  <NuxtLink class="scape-link" :to="`/scapes/${scape.id}`">
    <ScapesImage :id="scape.id" />
  </NuxtLink>
  <!-- <article class="scape-card"> -->
  <!--   <h1>#{{ scape.id }}</h1> -->
  <!-- </article> -->
</template>

<style scoped>
img {
  border-radius: 3px;
}

.scape-link {
  display: block;
}
</style>
