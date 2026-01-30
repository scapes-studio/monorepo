<template>
  <div class="grid-area" :class="classes" :style="styles">
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  rows?: number | string;
  width?: 'content' | 'content-small' | 'full' | number;
  background?: boolean | string;
  center?: boolean;
}>(), {
  rows: 1,
  width: 'content',
  background: false,
  center: false,
});

const classes = computed(() => ({
  'grid-area--centered': props.center,
  [`grid-area--width-${props.width}`]: typeof props.width === 'string',
}));

const styles = computed(() => {
  const s: Record<string, string> = {};

  // Height: always use the grid formula, rows can be number or CSS var string
  const rowsValue = typeof props.rows === 'number' ? props.rows : props.rows;
  s.height = `calc(${rowsValue} * var(--scape-height-gutter) - var(--grid-gutter))`;

  // Width: number means specific column count
  if (typeof props.width === 'number') {
    s.maxWidth = `calc(${props.width} * var(--scape-width-gutter) - var(--grid-gutter))`;
  }

  // Background
  if (props.background === true) {
    s.background = 'var(--background)';
  } else if (typeof props.background === 'string') {
    s.background = props.background;
  }

  return s;
});
</script>

<style scoped>
.grid-area {
  width: 100%;
}

.grid-area--width-content {
  max-width: var(--content-width);
  margin-inline: auto;
}

.grid-area--width-content-small {
  max-width: var(--content-width-small);
  margin-inline: auto;
}

.grid-area--width-full {
  max-width: none;
}

.grid-area--centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
</style>
