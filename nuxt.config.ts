import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-25',
  devtools: { enabled: true },

  vite: {
    optimizeDeps: {
      holdUntilCrawlEnd: true,
      include: [
        '@vue/devtools-core',
        'prismjs'
      ]
    }
  },

  modules: [
    '@nuxtjs/tailwindcss'
  ],

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.js',
  },

  css: [
    'prismjs/themes/prism-tomorrow.css',
    '~/assets/css/main.css'
  ],

  // Forziamo Nuxt a non iniettare nesting automatico se non lo vogliamo
  postcss: {
    plugins: {
      'tailwindcss/nesting': false,
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  future: {
    compatibilityVersion: 4
  },

  experimental: {
    appManifest: false
  },

  // 🟢 RISOLUZIONE ASSOLUTA ESM (IL SEGRETO PER NON FAR CRASHARE DRIZZLE/NITRO)
  alias: {
    '~~/drizzle': fileURLToPath(new URL('./drizzle', import.meta.url)),
    '@core': fileURLToPath(new URL('./devkernelpulse-core', import.meta.url)),
    '@plugins': fileURLToPath(new URL('./dkp-proprietary-plugins', import.meta.url))
  },

  imports: {
    dirs: [
      '~/composables',
      '~/utils',
      '~~/dkp-proprietary-plugins/*/composables'
    ]
  },

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