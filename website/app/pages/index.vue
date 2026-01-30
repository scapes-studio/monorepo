<template>
  <div class="home">
    <GridArea :rows="3" background center>
      <h1>Welcome Home</h1>
      <p>Composable places stored on Ethereum.</p>
    </GridArea>

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

.home h1 {
  margin: 0;
}

.home p {
  margin: var(--grid-gutter) 0 0;
  color: var(--muted);
}
</style>
