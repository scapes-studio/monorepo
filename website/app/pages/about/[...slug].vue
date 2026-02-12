<template>
  <section class="about-article">
    <GridArea
      :rows="2"
      center
    >
      <h1>{{ page?.title }}</h1>
      <p class="muted">{{ page?.description }}</p>
    </GridArea>

    <article
      v-if="page"
      ref="contentEl"
      class="about-article__content prose"
    >
      <ContentRenderer :value="page" />
    </article>

    <AboutNav :links="navLinks" />
  </section>
</template>

<script setup lang="ts">
const route = useRoute()
const path = computed(() => route.path)

const { data: page } = await useAsyncData(`about-${path.value}`, () =>
  queryCollection('about').path(path.value).first(),
)

const { data: surround } = await useAsyncData(
  `about-surround-${path.value}`,
  () => queryCollectionItemSurroundings('about', path.value),
)

const navLinks = computed(() => {
  if (!surround.value?.length) return []
  return [
    surround.value[0]
      ? {
          to: surround.value[0].path,
          title: surround.value[0].title,
          label: 'Previous',
        }
      : null,
    surround.value[1]
      ? {
          to: surround.value[1].path,
          title: surround.value[1].title,
          label: 'Next',
          align: 'right' as const,
        }
      : null,
  ]
})

const contentEl = ref<HTMLElement>()
useGridSnap(contentEl)

useSeo({
  title: page.value?.title || 'About',
  description: page.value?.description || 'About the Scapes project.',
})
</script>

<style scoped>
.about-article {
  max-width: var(--content-width);
  margin: 0 auto;
  display: grid;
  gap: var(--grid-gutter);
}

.about-article__content {
  background: var(--background);
  box-shadow: var(--grid-shadow);
  padding: var(--spacer-lg);
}

.about-article__content :deep(h1) {
  display: none;
}
</style>
