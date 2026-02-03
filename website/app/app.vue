<template>
  <div>
    <MainMenu />
    <main>
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
const { isInitialized, isMobile } = useScapeGrid()

onMounted(() => {
  console.log(isMobile)
})

useHead({
  bodyAttrs: {
    class: computed(() => {
      const classes = []
      if (isInitialized.value) classes.push('grid-ready')
      if (isMobile.value) classes.push('grid-mobile')
      return classes.join(' ')
    }),
  },
})
</script>

<style>
:root {
  color-scheme: light;
}

body {
  --grid-color: var(--gray-z-1);
  --grid-padding: calc(var(--grid-gutter) + var(--grid-margin-offset, 0px));
  --grid-shadow: 0 0 0 var(--grid-gutter) var(--grid-color);

  background-color: var(--background);
  width: 100vw;
  min-height: 100dvh;
  padding: var(--grid-padding);
  padding-bottom: calc(var(--grid-padding) + var(--scape-height-gutter) + var(--scape-height-gutter));
  background-image:
    linear-gradient(to right, var(--grid-color) var(--grid-gutter), transparent var(--grid-gutter)),
    linear-gradient(to bottom, var(--grid-color) var(--grid-gutter), transparent var(--grid-gutter));
  background-size:
    calc(var(--scape-width) + var(--grid-gutter)) calc(var(--scape-height) + var(--grid-gutter));
  background-position: var(--grid-margin-offset, 0px) var(--grid-margin-offset, 0px);
  opacity: 0;
  transition: opacity var(--speed-slow);

  &.grid-ready {
    opacity: 1;
  }
}

body.grid-mobile {
  --grid-padding: var(--grid-gutter);

  background: var(--background);
}

main {
  transform: translateY(1rem);
  transition: transform var(--speed);
}

body.grid-ready main {
  transform: translateY(0);
}

body.grid-ready nav.main-menu {
  display: flex;
  opacity: 1;
}
</style>
