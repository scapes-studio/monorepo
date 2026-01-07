// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-07',
  devtools: { enabled: true },
  extends: [
    '@1001-digital/layers.base',
    '@1001-digital/layers.evm',
  ],
  css: [
    '~/assets/styles/index.css',
  ]
})
