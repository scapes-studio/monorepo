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
  background-color: white;
  background-image:
    linear-gradient(to right, var(--gray-z-1) var(--grid-gutter), transparent var(--grid-gutter)),
    linear-gradient(to bottom, var(--gray-z-1) var(--grid-gutter), transparent var(--grid-gutter));
  background-size:
    calc(var(--scape-width) + var(--grid-gutter)) calc(var(--scape-height) + var(--grid-gutter));
  background-position: 0 0;

  width: 100vw;
  min-height: 100dvh;
  padding: var(--grid-gutter);
}
</style>
