import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    about: defineCollection({
      type: 'page',
      source: 'about/**',
    }),
  },
})
