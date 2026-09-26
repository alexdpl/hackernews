// nuxt.config.ts
import { resolve } from 'path'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-25',

  future: {
    compatibilityVersion: 4
  },

  alias: {
    '~~/drizzle': resolve(__dirname, './drizzle'),
    '@core': resolve(__dirname, './devkernelpulse-core'),
    '@plugins': resolve(__dirname, './dkp-proprietary-plugins'),
    '@crawler-plugin': resolve(__dirname, './dkp-proprietary-plugins/dkp-automated-crawler-pro'),
    '@translator-plugin': resolve(__dirname, './dkp-proprietary-plugins/dkp-translator-pro'),
    '@nexus-plugin': resolve(__dirname, './dkp-proprietary-plugins/dkp-pulse-nexus-pro')
  },

  // Scansione automatica di tutti i componenti nei plugin proprietari
  components: {
    dirs: [
      '~/components',
      {
        path: '~~/dkp-proprietary-plugins',
        pathPrefix: false,
        extensions: ['.vue']
      }
    ]
  },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://devkernelpulse.duckdns.org'
    }
  }
})