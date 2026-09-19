// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2026-09-17',
  
  modules: [
    '@nuxthub/core',
    '@nuxt/eslint',
  ],

  // Configurazione per le variabili d'ambiente lato server (Accessibili solo in server/)
  runtimeConfig: {
    databaseUrl: '', // Mappata automaticamente da NUXT_DATABASE_URL
    adminSecret: '', // Mappata automaticamente da NUXT_ADMIN_SECRET
  },

  // Configurazione Nuxt 4 (struttura a layer / app directory)
  future: { 
    compatibilityVersion: 4 
  },

  // Target di compilazione Nitro richiesto
  nitro: {
    esnext: true,
    esbuild: {
      options: {
        target: 'esnext'
      }
    }
  },

  devtools: {
    enabled: true,
  },

  hub: {
    cache: true,
  },

  postcss: {
    plugins: {
      'postcss-nesting': {},
    },
  },

  eslint: {
    config: {
      stylistic: {
        quotes: 'single',
      },
    },
  },
})