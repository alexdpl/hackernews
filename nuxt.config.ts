import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-25',
  devtools: { enabled: true },
  
  runtimeConfig: {
    // Credenziali e chiavi server-side protette
    geminiApiKey: process.env.GEMINI_API_KEY,
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
  },
  
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/dkp-logo.svg' },
      ]
    }
  },

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

  // 🟢 ALIAS ESSENZIALI (Drizzle & Core)
  alias: {
    '~~/drizzle': fileURLToPath(new URL('./drizzle', import.meta.url)),
    '@core': fileURLToPath(new URL('./devkernelpulse-core', import.meta.url)),
  },

  imports: {
    dirs: [
      '~/composables',
      '~/utils'
    ]
  },

  components: {
    dirs: [
      '~/components'
    ]
  }
})