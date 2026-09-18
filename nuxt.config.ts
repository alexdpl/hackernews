// nuxt.config.ts
export default defineNuxtConfig({
  // https://nuxt.com/modules
  compatibilityDate: '2026-09-17',
  
  modules: [
    '@nuxthub/core',
    '@nuxt/eslint',
  ],

  // Configurazione per le variabili d'ambiente lato server
  runtimeConfig: {
    // Lasciandola vuota qui, Nuxt si aspetta che venga sovrascritta 
    // a runtime dalla variabile NUXT_DATABASE_URL nel file .env o su Vercel
    databaseUrl: '', 
  },

  // Configurazione Nuxt 4 (struttura a layer / app directory)
  future: { 
    compatibilityVersion: 4 
  },

  // https://devtools.nuxt.com
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

  // https://eslint.nuxt.com
  eslint: {
    config: {
      stylistic: {
        quotes: 'single',
      },
    },
  },
})