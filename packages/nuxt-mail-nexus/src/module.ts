import { defineNuxtModule, createResolver, addServerHandler, extendPages } from '@nuxt/kit'

export interface DkpMailNexusOptions {
  licenseKey: string
  databaseUrl?: string
  smtpConfig?: {
    host: string
    port: number
    user: string
    pass: string
  }
}

export default defineNuxtModule<DkpMailNexusOptions>({
  meta: {
    name: '@devkernelpulse/nuxt-mail-nexus',
    configKey: 'dkpMailNexus',
    version: '2.4.0',
    compatibility: {
      nuxt: '^3.0.0 || ^4.0.0'
    }
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // 1. Controllo Licenza DKP Vault
    if (!options.licenseKey) {
      console.warn('⚠️ [DKP MAIL NEXUS]: Nessuna licenza rilevata. Il modulo funzionerà in modalità DEMO.')
    }

    // 2. Iniezione automatica delle API Nitro Backend
    addServerHandler({
      route: '/api/mail/inbound',
      handler: resolver.resolve('./runtime/server/api/inbound.post')
    })

    addServerHandler({
      route: '/api/admin/mail',
      handler: resolver.resolve('./runtime/server/api/admin-mail.get')
    })

    // 3. Iniezione Pagine Admin nel Router Nuxt
    extendPages((pages) => {
      pages.push(
        {
          name: 'dkp-admin-mail',
          path: '/admin/mail',
          file: resolver.resolve('./runtime/pages/mail.vue')
        },
        {
          name: 'dkp-admin-newsletter',
          path: '/admin/newsletter',
          file: resolver.resolve('./runtime/pages/newsletter.vue')
        },
        {
          name: 'dkp-admin-autoresponder',
          path: '/admin/autoresponder',
          file: resolver.resolve('./runtime/pages/autoresponder.vue')
        }
      )
    })

    console.log('⚡ [DKP MAIL NEXUS v2.4]: Modulo caricato con successo nel Kernel!')
  }
})