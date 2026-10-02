// server/middleware/sentinelAI.ts
import {
  defineEventHandler,
  createError,
  setResponseHeaders,
  getHeader,
  getMethod,
  getRequestHost
} from 'h3'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const host = getRequestHost(event, { xForwardedHost: true }) || ''

  // Rilevamento Sottodomini GCP / Localhost
  const isApiSubdomain = host.startsWith('api.')
  const isMailSubdomain = host.startsWith('mail.')

  // -------------------------------------------------------------
  // 🌐 1. CONFIGURAZIONE CORS UNIVERSALE PER SUBDOMAINS GCP
  // -------------------------------------------------------------
  const origin = getHeader(event, 'origin') || ''
  const allowedOrigins = [
    'https://devkernelpulse.org',
    'https://api.devkernelpulse.org',
    'https://mail.devkernelpulse.org',
    'http://localhost:3000'
  ]

  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.devkernelpulse.org'))) {
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Requested-With'
    })
  }

  // Risposta istantanea per richieste Preflight CORS (OPTIONS)
  if (method === 'OPTIONS') {
    event.node.res.statusCode = 204
    event.node.res.end()
    return
  }

  let path = event.path || event.node?.req?.url || ''

  try {
    // -------------------------------------------------------------
    // 🤖 2. ROUTING & API SENTINEL AI (api.devkernelpulse.org)
    // -------------------------------------------------------------
    if (isApiSubdomain) {
      setResponseHeaders(event, {
        'X-Sentinel-AI': 'API-Guard-Active',
        'X-DKP-Version': 'v2.4-GOLD'
      })

      // A. Visita da browser alla radice -> reindirizza a Console API
      if (path === '/' || path === '') {
        if (event.node?.req) event.node.req.url = '/api-console'
        event.path = '/api-console'
        return
      }

      // B. Ignora asset statici, console e percorsi interni
      if (
        path.startsWith('/_nuxt') ||
        path.startsWith('/api/_') ||
        path.startsWith('/favicon') ||
        path === '/api-console'
      ) {
        return
      }

      // C. Mappatura automatica URL: api.domain.com/v2/news -> /api/v2/news
      if (!path.startsWith('/api/')) {
        const rewrittenPath = `/api${path.startsWith('/') ? '' : '/'}${path}`
        if (event.node?.req) event.node.req.url = rewrittenPath
        event.path = rewrittenPath
        path = rewrittenPath
      }

      // D. Eccezione per rotte Admin o Public che non richiedono API Key esterna
      if (path.startsWith('/api/admin/') || path.startsWith('/api/public/')) {
        return
      }

      // E. Estrazione della chiave API per le chiamate pubbliche sul sottodominio API
      const rawApiKey = getHeader(event, 'x-api-key') || getHeader(event, 'authorization') || ''
      const apiKey = rawApiKey.replace(/^Bearer\s+/i, '').trim()

      // F. Verifica presenza API Key
      if (!apiKey) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized',
          message: 'API Sentinel AI: Accesso negato. Header "x-api-key" obbligatorio per il sottodominio API.'
        })
      }

      // Nota: La verifica della validità della licenza e l'incremento quota DB
      // vengono gestiti in modo unico e centralizzato da `rateLimit.ts`.
    }

    // -------------------------------------------------------------
    // 📧 3. ROUTING MAIL SUBDOMAIN (mail.devkernelpulse.org)
    // -------------------------------------------------------------
    if (isMailSubdomain) {
      setResponseHeaders(event, {
        'X-Nexus-Mail-Sentinel': 'Active-Delivery-Engine',
        'X-DKP-Version': 'v2.4-GOLD'
      })

      if (path === '/' || path === '') {
        if (event.node?.req) event.node.req.url = '/mail'
        event.path = '/mail'
      }
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('❌ Errore critico in Sentinel AI:', error)
  }
})