// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-07',
  devtools: { enabled: true },
  extends: [
    '@1001-digital/layers.base',
    '@1001-digital/layers.evm',
  ],
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'https://indexer.scapes.xyz',
    },
  },
  css: [
    '~/assets/styles/index.css',
  ],
  devServer: {
    port: 3311,
  }
})
