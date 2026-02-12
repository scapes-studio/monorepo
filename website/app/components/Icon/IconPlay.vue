<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <polygon
      points="5,3 19,12 5,21"
      :stroke="stroke"
      :stroke-width="strokeWidth"
    />
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
    default: 'var(--border-color)',
  },
  strokeWidth: {
    type: [Number, String],
    default: 'var(--grid-gutter)',
  },
})

const { size, stroke, strokeWidth } = props
</script>
