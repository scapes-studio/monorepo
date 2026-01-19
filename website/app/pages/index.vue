<script setup lang="ts">
const { scapes, loading, loadingMore, error, hasMore, loadMore } = useRandomScapes();

useSeo({
  title: 'Home',
  description: 'Composable places stored on the Ethereum Blockchain. Explore 10,000 pixel-art landscapes.',
});

const checkAndLoadMore = () => {
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  if (documentHeight <= windowHeight + 200 && hasMore.value && !loadingMore.value) {
    loadMore();
  }
};

const handleScroll = () => {
  const scrollTop = window.scrollY;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  if (scrollTop + windowHeight >= documentHeight - 200) {
    loadMore();
  }
};

watch([loading, loadingMore], () => {
  if (!loading.value && !loadingMore.value) {
    nextTick(checkAndLoadMore);
  }
});

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('resize', checkAndLoadMore);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', checkAndLoadMore);
});
</script>

<template>
  <div class="home">
    <!-- <h1>Welcome Home</h1>
    <p>Composable places stored on the Ethereum Blockchain.</p> -->

    <section class="market-section">
      <p v-if="loading">Loading...</p>
      <p v-else-if="error">Failed to load scapes</p>
      <template v-else>
        <ScapesGrid :scapes="scapes" />
        <p v-if="loadingMore" class="loading-more">Loading more...</p>
      </template>
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

.loading-more {
  text-align: center;
  padding: var(--spacer);
}
</style>
