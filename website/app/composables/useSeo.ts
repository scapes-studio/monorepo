import type { MaybeRefOrGetter } from 'vue'

type SeoOptions = {
  title: string
  description: string
  image?: string
  imageAlt?: string
}

const SITE_URL = 'https://scapes.xyz'
const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`

export function useSeo(options: MaybeRefOrGetter<SeoOptions>) {
  const route = useRoute()

  const resolved = computed(() => toValue(options))

  useSeoMeta({
    title: () => resolved.value.title,
    description: () => resolved.value.description,
    ogTitle: () => resolved.value.title,
    ogDescription: () => resolved.value.description,
    ogImage: () => resolved.value.image || DEFAULT_IMAGE,
    ogImageAlt: () => resolved.value.imageAlt || resolved.value.title,
    ogUrl: () => `${SITE_URL}${route.path}`,
    twitterTitle: () => resolved.value.title,
    twitterDescription: () => resolved.value.description,
    twitterImage: () => resolved.value.image || DEFAULT_IMAGE,
  })

  useHead({
    link: [
      { rel: 'canonical', href: computed(() => `${SITE_URL}${route.path}`) },
    ],
  })
}
