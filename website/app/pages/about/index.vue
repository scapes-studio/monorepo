<template>
  <section class="about-page">
    <GridArea
      :rows="2"
      center
    >
      <h1>About</h1>
      <p class="muted">10,000 unique pixel landscapes on Ethereum</p>
    </GridArea>

    <ContentRenderer
      v-if="page"
      ref="contentEl"
      :value="page"
      class="about-page__content prose"
    />

    <AboutNav :links="navLinks" />
  </section>
</template>

<script setup lang="ts">
useSeo({
  title: 'About',
  description:
    'An overview of the Scapes project — 10,000 unique pixel landscapes on Ethereum.',
})

const { data: page } = await useAsyncData('about-index', () =>
  queryCollection('about').path('/about').first(),
)

const { data: articles } = await useAsyncData('about-articles', () =>
  queryCollection('about')
    .where('path', 'NOT LIKE', '/about')
    .order('stem', 'ASC')
    .all(),
)

const navLinks = computed(
  () =>
    articles.value?.map((article) => ({
      to: article.path,
      title: article.title,
      description: article.description,
    })) ?? [],
)

const contentEl = ref<ComponentPublicInstance>()
useGridSnap(contentEl)
</script>

<style scoped>
.about-page {
  max-width: var(--content-width);
  margin: 0 auto;
  display: grid;
  gap: var(--grid-gutter);
}

.about-page__content {
  background: var(--background);
  box-shadow: var(--grid-shadow);
  padding: var(--spacer-lg);
}

.about-page__content :deep(h1) {
  display: none;
}
</style>
