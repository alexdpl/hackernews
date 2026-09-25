// nuxt.config.ts
import { resolve } from 'path'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-25',

  future: {
    compatibilityVersion: 4
  },

  // Mappatura Alias Architettura SaaS Modulare (Bagisto-Style)
  alias: {
    '@core': resolve(__dirname, './devkernelpulse-core'),
    '@plugins': resolve(__dirname, './dkp-proprietary-plugins'),
    '@crawler-plugin': resolve(__dirname, './dkp-proprietary-plugins/dkp-automated-crawler-pro'),
    '@translator-plugin': resolve(__dirname, './dkp-proprietary-plugins/dkp-translator-pro')
  },

  // Scansione dei componenti anche dalle cartelle dei plugin proprietari
  components: {
    dirs: [
      { path: '~/components' },
      { path: '~/dkp-proprietary-plugins', pathPrefix: false }
    ]
  },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://devkernelpulse.duckdns.org'
    }
  }
})