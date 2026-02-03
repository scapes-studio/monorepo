<template>
  <component :is="tag" class="grid-area" :class="classes" :style="styles">
    <slot />
  </component>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  tag?: string;
  rows?: number | string;
  width?: 'content' | 'content-small' | 'full' | number;
  background?: boolean | string;
  center?: boolean;
  padding?: boolean | string;
}>(), {
  tag: 'div',
  rows: 1,
  width: 'content',
  background: true,
  center: false,
});

const classes = computed(() => ({
  'centered': props.center,
  [`width-${props.width}`]: typeof props.width === 'string',
  padded: !!props.padding,
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

  &:not(.no-shadow) {
    box-shadow: var(--grid-shadow);
  }
}

.width-content {
  max-width: var(--content-width);
  margin-inline: auto;
}

.width-content-small {
  max-width: var(--content-width-small);
  margin-inline: auto;
}

.width-full {
  max-width: none;
}

.centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.padded {
  padding: var(--spacer);
}
</style>
