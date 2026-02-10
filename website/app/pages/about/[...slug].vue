<template>
  <section class="about-article">
    <GridArea :rows="2" center>
      <h1>{{ page?.title }}</h1>
      <p class="muted">{{ page?.description }}</p>
    </GridArea>

    <article v-if="page" ref="contentEl" class="about-article__content prose">
      <ContentRenderer :value="page" />
    </article>

    <nav v-if="surround?.length" class="about-article__surround">
      <NuxtLink v-if="surround[0]" :to="surround[0].path" class="border about-article__surround-link">
        <span class="muted">Previous</span>
        <span>{{ surround[0].title }}</span>
      </NuxtLink>
      <div v-else />
      <NuxtLink v-if="surround[1]" :to="surround[1].path"
        class="border about-article__surround-link about-article__surround-link--next">
        <span class="muted">Next</span>
        <span>{{ surround[1].title }}</span>
      </NuxtLink>
    </nav>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()
const path = computed(() => route.path)

const { data: page } = await useAsyncData(`about-${path.value}`, () =>
  queryCollection('about').path(path.value).first(),
)

const { data: surround } = await useAsyncData(`about-surround-${path.value}`, () =>
  queryCollectionItemSurroundings('about', path.value),
)

const contentEl = ref<HTMLElement>()
const { scapeHeight, gutter } = useScapeGrid()

const snapContentToGrid = () => {
  const el = contentEl.value
  if (!el) return

  const unit = scapeHeight.value + gutter.value

  el.style.minHeight = ''
  const naturalHeight = el.offsetHeight
  const rows = Math.max(1, Math.ceil((naturalHeight + gutter.value) / unit))
  el.style.minHeight = `${rows * unit - gutter.value}px`
}

watch([scapeHeight, gutter], snapContentToGrid)
onMounted(snapContentToGrid)

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
  padding: var(--scape-height) var(--scape-height);
}

.about-article__content :deep(h1) {
  display: none;
}

.about-article__back {
  display: flex;
}

.about-article__back-link {
  padding: var(--grid-gutter) var(--scape-height);
  background: var(--background);
  text-decoration: none;
  font-size: var(--font-sm);
  transition: background var(--speed);
}

.about-article__back-link:hover {
  background: var(--gray-z-1);
}

.about-article__surround {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--grid-gutter);
}

.about-article__surround-link {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: calc(var(--scape-height) * 2 + var(--grid-gutter));
  padding: var(--spacer);
  background: var(--background);
  text-decoration: none;
  transition: background var(--speed);
}

.about-article__surround-link:hover {
  background: var(--gray-z-1);
}

.about-article__surround-link--next {
  text-align: right;
}
</style>
