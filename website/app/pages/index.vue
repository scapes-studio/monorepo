<script setup lang="ts">
const { scapes, loading, error } = useRandomScapes();

useSeo({
  title: 'Home',
  description: 'Composable places stored on the Ethereum Blockchain. Explore 10,000 pixel-art landscapes.',
});
</script>

<template>
  <div class="home">
    <!-- <h1>Welcome Home</h1>
    <p>Composable places stored on the Ethereum Blockchain.</p> -->

    <section class="market-section">
      <p v-if="loading">Loading...</p>
      <p v-else-if="error">Failed to load scapes</p>
      <ScapesGrid v-else :scapes="scapes" />
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: var(--content-width);
  margin: 0 auto;
  text-align: center;
}

.home h1 {
  margin-bottom: var(--spacer);
}

.market-section {
  text-align: left;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
}
</style>
