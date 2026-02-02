<template>
  <svg xmlns="http://www.w3.org/2000/svg" :width="size" :height="size" viewBox="0 0 24 24" fill="currentColor"
    :stroke="stroke" :stroke-width="strokeWidth">
    <rect x="4" y="4" width="6" height="16" />
    <rect x="14" y="4" width="6" height="16" />
  </svg>
</template>

<script setup lang="ts">
const props = defineProps({
  size: {
    type: [Number, String],
    default: 18,
  },
  stroke: {
    type: String,
    default: "var(--border-color)",
  },
  strokeWidth: {
    type: [Number, String],
    default: "var(--grid-gutter)",
  },
});

const { size, stroke, strokeWidth } = props;
</script>
