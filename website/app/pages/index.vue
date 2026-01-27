<template>
  <div class="home">
    <header class="home__header">
      <h1>Welcome Home</h1>
      <p>Composable places stored on Ethereum.</p>
    </header>

    <ClientOnly>
      <ScapesVirtualGrid :scapes="scapes" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const { scapes } = useRandomScapes();

useSeo({
  title: 'Home',
  description: 'Composable places stored on Ethereum. Explore 10,000 pixel-art landscapes.',
});
</script>

<style scoped>
.home {
  display: grid;
  gap: var(--grid-gutter);
}

.home__header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(3 * var(--scape-height-gutter) - var(--grid-gutter));
  width: 100%;
  max-width: var(--content-width);
  margin: 0 auto;
  text-align: center;
  background: var(--background);
  padding: var(--scape-height);
}

.home__header h1 {
  margin: 0;
}

.home__header p {
  margin: var(--grid-gutter) 0 0;
  color: var(--muted);
}
</style>
