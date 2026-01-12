<script setup lang="ts">
import type { ScapeRecord } from "~/composables/useScapesByOwner";

defineProps<{ scape: ScapeRecord }>();
</script>

<template>
  <ScapesImage :id="scape.id" />
  <!-- <article class="scape-card"> -->
  <!--   <h1>#{{ scape.id }}</h1> -->
  <!-- </article> -->
</template>

<style scoped>
img {
  border-radius: 3px;
}
</style>
