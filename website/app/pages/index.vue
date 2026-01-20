<script setup lang="ts">
const { scapes } = useRandomScapes();

useSeo({
  title: 'Home',
  description: 'Composable places stored on the Ethereum Blockchain. Explore 10,000 pixel-art landscapes.',
});
</script>

<template>
  <div class="home">
    <ClientOnly>
      <ScapesVirtualGrid :scapes="scapes" />
    </ClientOnly>
  </div>
</template>

<style scoped>
.market-section {
  width: 100vw;
}
</style>
