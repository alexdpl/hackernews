// nuxt.config.ts
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-25',

  future: {
    compatibilityVersion: 4
  },

  devtools: { enabled: true },

  devServer: {
    host: 'localhost',
    port: 3000
  },

  // 🟢 ROUTE RULES: Gestione Caching ed Isolamento API Nitro Engine
  routeRules: {
    // API Amministrative: Nessuna cache, bypass completo SSR / Vue Router
    '/api/admin/**': {
      cache: false,
      cors: true
    },
    // API Notizie: Cache Edge di 5 min con Stale-While-Revalidate su CDN
    '/api/news': {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'max-age=300, stale-while-revalidate=86400'
      }
    },
    // API Blog: Cache Edge 1h
    '/api/blog/**': {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'max-age=3600, stale-while-revalidate=86400'
      }
    }
  },

  // 🟢 NITRO ENGINE CONFIGURATION (Server-Side)
  nitro: {
    experimental: {
      asyncContext: true
    }
  },

  // 🟢 RUNTIME CONFIGURATION (Server & Public)
  runtimeConfig: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
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

  // 🟢 HEAD & META TAGS SEO
  app: {
    head: {
      htmlAttrs: { lang: 'it' },
      title: 'DevKernelPulse — The Next-Gen Developer & AI Ecosystem',
      meta: [
        { name: 'author', content: 'Alexdpl - DevKernelPulse Architecture' },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'keywords', content: 'DevKernelPulse, Nuxt 4, OpenUI Studio, OpenRouter, Neon DB, Drizzle ORM, AI Gateway, API Key Management' },
        { name: 'description', content: 'Piattaforma SaaS avanzata per Nuxt 4 con Neural Playground, OpenUI Studio, Proof-of-Code Vault e API Gateway protetto.' },
        
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'DevKernelPulse v2.6-PURE-SQL' },
        { property: 'og:title', content: 'DevKernelPulse — The Next-Gen Developer & AI Ecosystem' },
        { property: 'og:description', content: 'Piattaforma SaaS avanzata per Nuxt 4 con Neural Playground, OpenUI Studio, Proof-of-Code Vault e API Gateway protetto.' },
        { property: 'og:image', content: 'https://devkernelpulse.org/og-cover.png' },
        
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'DevKernelPulse v2.6-PURE-SQL' },
        { name: 'twitter:description', content: 'Costruisci, proteggi e monetizza le tue app con Nuxt 4 e IA decentralizzata.' },
        { name: 'twitter:image', content: 'https://devkernelpulse.org/og-cover.png' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/dkp-logo.svg' }
      ]
    }
  },

  // 🟢 VITE BUNDLER OPTIMIZATION (Risolto NUXT_B7002)
  vite: {
    optimizeDeps: {
      include: [
        'prismjs'
      ]
    }
  },

  // 🟢 STYLES & TAILWIND (Risolto NUXT_B7027)
  modules: [
    '@nuxtjs/tailwindcss'
  ],

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.js',
    exposeConfig: false,
    viewer: false
  },

  css: [
    'prismjs/themes/prism-tomorrow.css'
  ],

  // 🟢 ALIAS & AUTO-IMPORTS DKP KERNEL
  alias: {
    '~~/drizzle': fileURLToPath(new URL('./drizzle', import.meta.url)),
    '@core': fileURLToPath(new URL('./devkernelpulse-core', import.meta.url))
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