<script setup lang="ts">
const { scapes } = useRandomScapes();

useSeo({
  title: 'Home',
  description: 'Composable places stored on the Ethereum Blockchain. Explore 10,000 pixel-art landscapes.',
});
</script>

<template>
  <div class="home">
    <section class="market-section">
      <ScapesGrid :scapes="scapes" />
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: var(--content-width);
  margin: 0 auto;
}

.market-section {
  width: 100vw;
  margin-left: calc(-50vw + 50%);
}
</style>
