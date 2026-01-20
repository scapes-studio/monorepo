<script setup lang="ts">
useScapeGrid()
</script>

<template>
  <div>
    <MainMenu />
    <main>
      <NuxtPage />
    </main>
  </div>
</template>

<style>
:root {
  color-scheme: light;
}

body {
  --grid-color: var(--gray-z-1);

  background-color: white;
  background-image:
    linear-gradient(to right, var(--grid-color) var(--grid-gutter), transparent var(--grid-gutter)),
    linear-gradient(to bottom, var(--grid-color) var(--grid-gutter), transparent var(--grid-gutter));
  background-size:
    calc(var(--scape-width) + var(--grid-gutter)) calc(var(--scape-height) + var(--grid-gutter));
  background-position: var(--grid-margin-offset, 0px) var(--grid-margin-offset, 0px);

  width: 100vw;
  min-height: 100dvh;
  padding: calc(var(--grid-gutter) + var(--grid-margin-offset, 0px));
}
</style>
