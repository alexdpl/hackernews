import { resolve } from 'path'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-25',

  future: {
    compatibilityVersion: 4
  },

  experimental: {
    appManifest: false
  },

  alias: {
    '~~/drizzle': resolve(__dirname, './drizzle'),
    '@core': resolve(__dirname, './devkernelpulse-core'),
    '@plugins': resolve(__dirname, './dkp-proprietary-plugins')
  },

  // Auto-import dinamico per composables e utility dei plugin
  imports: {
    dirs: [
      '~/composables',
      '~/utils',
      '~~/dkp-proprietary-plugins/*/composables'
    ]
  },

  // Auto-import componenti per la app e per tutti i plugin proprietari
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

  // Configurazione Runtime dinamica (Server vs Client)
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',

    smtpHost: process.env.SMTP_HOST || process.env.NUXT_SMTP_HOST || 'smtp-relay.brevo.com',
    smtpPort: Number(process.env.SMTP_PORT || process.env.NUXT_SMTP_PORT || 587),
    smtpUser: process.env.SMTP_USER || process.env.NUXT_SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || process.env.NUXT_SMTP_PASS || '',
    smtpFrom: process.env.SMTP_FROM || process.env.NUXT_SMTP_FROM || 'Alessandro | DevKernelPulse <alex@devkernelpulse.org>',

    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://devkernelpulse.org',
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'https://api.devkernelpulse.org',
      mailUrl: process.env.NUXT_PUBLIC_MAIL_URL || 'https://mail.devkernelpulse.org'
    }
  }
})