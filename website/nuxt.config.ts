// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-07',
  devtools: { enabled: true },
  modules: ['@nuxt/content', '@nuxt/fonts', 'nuxt-og-image'],
  fonts: {
    families: [
      { name: 'Space Mono', weights: [700], styles: ['normal', 'italic'], global: true },
    ],
  },
  app: {
    head: {
      titleTemplate: '%s | Scapes',
      meta: [
        { name: 'description', content: 'Composable places stored on the Ethereum Blockchain.' },
        { property: 'og:site_name', content: 'Scapes' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/icon.png' },
      ],
    },
  },
  icon: {
    aliases: {
      close: 'ic:baseline-close',
    }
  },
  site: {
    url: 'https://scapes.xyz',
    name: 'Scapes',
  },
  ogImage: {
    componentDirs: ['app/components/OgImage'],
    defaults: {
      cacheMaxAgeSeconds: 0,
    },
  },
  imports: {
    presets: [
      {
        from: '@ponder/client',
        imports: ['createClient', 'asc', 'desc', 'eq', 'ne', 'sql', 'and', 'gt', 'lte'],
      },
      {
        from: '@vueuse/core',
        imports: ['useIntersectionObserver'],
      },
    ],
  },
  extends: [
    '@1001-digital/layers.base',
    '@1001-digital/layers.evm',
  ],
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'https://indexer.scapes.xyz',
      ipfsGateway: process.env.NUXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
      scapeCollectionAddress: '0xb7def63a9040ad5dc431aff79045617922f4023a',
      chainId: 1,
      rpc1: process.env.NUXT_PUBLIC_RPC_URL,
    },
  },
  css: [
    '~/assets/styles/index.css',
  ],
  devServer: {
    port: 3311,
  },
  nitro: {
    externals: {
      external: ['@scapes-studio/scape-renderer', 'sharp'],
    },
  },
})
