<template>
  <section class="about-page">
    <GridArea :rows="2" center>
      <h1>About</h1>
      <p class="muted">10,000 unique pixel landscapes on Ethereum</p>
    </GridArea>

    <ContentRenderer v-if="page" :value="page" class="about-page__content prose" />

    <nav v-if="articles?.length" class="about-page__nav">
      <NuxtLink v-for="article in articles" :key="article.path" :to="article.path" class="about-page__nav-item border">
        <span class="about-page__nav-title">{{ article.title }}</span>
        <span class="about-page__nav-description muted">{{ article.description }}</span>
      </NuxtLink>
    </nav>
  </section>
</template>

<script setup lang="ts">
useSeo({
  title: 'About',
  description: 'An overview of the Scapes project — 10,000 unique pixel landscapes on Ethereum.',
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
  padding: var(--scape-height) var(--scape-height);
}

.about-page__content :deep(h1) {
  display: none;
}

.about-page__nav {
  display: grid;
  gap: var(--grid-gutter);
}

.about-page__nav-item {
  display: flex;
  flex-direction: column;
  gap: 0.25em;
  padding: var(--scape-height) var(--scape-height);
  background: var(--background);
  text-decoration: none;
  transition: background var(--speed);
}

.about-page__nav-item:hover {
  background: var(--gray-z-1);
}

.about-page__nav-title {
  font-weight: 700;
}

.about-page__nav-description {
  font-size: var(--font-sm);
}
</style>
