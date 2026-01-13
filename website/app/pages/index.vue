<script setup lang="ts">
const { scapes, loading, error } = useRandomScapes();
</script>

<template>
  <div class="home">
    <h1>Welcome Home</h1>
    <p>Composable places stored on the Ethereum Blockchain.</p>

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
  padding: var(--spacer-lg);
  text-align: center;
}

.home h1 {
  margin-bottom: var(--spacer);
}

.market-section {
  margin-top: var(--spacer-xl);
  text-align: left;
}
</style>
