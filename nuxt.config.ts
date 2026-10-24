// nuxt.config.ts
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
      htmlAttrs: { lang: 'it' },
      title: 'DevKernelPulse — The Next-Gen Developer & AI Ecosystem',
      meta: [
        { name: 'author', content: 'Alexdpl - DevKernelPulse Architecture' },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'keywords', content: 'DevKernelPulse, Nuxt 4, OpenUI Studio, OpenRouter, Neon DB, Drizzle ORM, AI Gateway, API Key Management' },
        { name: 'description', content: 'Piattaforma SaaS avanzata per Nuxt 4 con Neural Playground, OpenUI Studio, Proof-of-Code Vault e API Gateway protetto.' },
        
        // Open Graph per Social & AI Previews (ChatGPT Search, Perplexity, Discord, Telegram)
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'DevKernelPulse v2.5-GOLD' },
        { property: 'og:title', content: 'DevKernelPulse — The Next-Gen Developer & AI Ecosystem' },
        { property: 'og:description', content: 'Piattaforma SaaS avanzata per Nuxt 4 con Neural Playground, OpenUI Studio, Proof-of-Code Vault e API Gateway protetto.' },
        { property: 'og:image', content: 'https://devkernelpulse.org/og-cover.png' },
        
        // Twitter Card / X
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'DevKernelPulse v2.5-GOLD' },
        { name: 'twitter:description', content: 'Costruisci, proteggi e monetizza le tue app con Nuxt 4 e IA decentralizzata.' },
        { name: 'twitter:image', content: 'https://devkernelpulse.org/og-cover.png' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/dkp-logo.svg' }
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