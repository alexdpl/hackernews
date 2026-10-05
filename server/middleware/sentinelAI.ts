// server/middleware/sentinelAI.ts

// Helper ultra-sicuro: usa direttamente l'oggetto HTTP nativo di Node.js scavalcando qualsiasi bug di h3
function setSafeHeader(event: any, name: string, value: string) {
  if (event.node?.res?.setHeader) {
    event.node.res.setHeader(name, value)
  } else {
    try {
      setResponseHeader(event, name, value)
    } catch {}
  }
}

function getSafeHeader(event: any, name: string): string {
  const lowerName = name.toLowerCase()

  try {
    const h = getHeader(event, name)
    if (h) return h
  } catch {}

  const nodeHeaders = event.node?.req?.headers
  if (nodeHeaders) {
    const val = nodeHeaders[lowerName]
    if (Array.isArray(val)) return val[0] || ''
    if (typeof val === 'string') return val
  }

  if (event.req?.headers?.get && typeof event.req.headers.get === 'function') {
    return event.req.headers.get(lowerName) || ''
  }

  return ''
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  const host =
    getSafeHeader(event, 'x-forwarded-host') ||
    getSafeHeader(event, 'host') ||
    ''

  const isApiSubdomain = host.startsWith('api.')
  const isMailSubdomain = host.startsWith('mail.')

  // -------------------------------------------------------------
  // 🌐 1. CONFIGURAZIONE CORS UNIVERSALE
  // -------------------------------------------------------------
  const origin = getSafeHeader(event, 'origin')
  const allowedOrigins = [
    'https://devkernelpulse.org',
    'https://api.devkernelpulse.org',
    'https://mail.devkernelpulse.org',
    'http://localhost:3000'
  ]

  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.devkernelpulse.org'))) {
    setSafeHeader(event, 'Access-Control-Allow-Origin', origin)
    setSafeHeader(event, 'Access-Control-Allow-Credentials', 'true')
    setSafeHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    setSafeHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Requested-With')
  }

  if (method === 'OPTIONS') {
    if (event.node?.res) {
      event.node.res.statusCode = 204
      event.node.res.end()
    }
    return
  }

  let path = event.path || event.node?.req?.url || ''

  try {
    // -------------------------------------------------------------
    // 🤖 2. ROUTING & API SENTINEL AI
    // -------------------------------------------------------------
    if (isApiSubdomain) {
      setSafeHeader(event, 'X-Sentinel-AI', 'API-Guard-Active')
      setSafeHeader(event, 'X-DKP-Version', 'v2.4-GOLD')

      if (path === '/' || path === '') {
        if (event.node?.req) event.node.req.url = '/api-console'
        return
      }

      if (
        path.startsWith('/_nuxt') ||
        path.startsWith('/api/_') ||
        path.startsWith('/favicon') ||
        path === '/api-console'
      ) {
        return
      }

      if (!path.startsWith('/api/')) {
        const rewrittenPath = `/api${path.startsWith('/') ? '' : '/'}${path}`
        if (event.node?.req) event.node.req.url = rewrittenPath
        path = rewrittenPath
      }

      if (path.startsWith('/api/admin/') || path.startsWith('/api/public/')) {
        return
      }

      const rawApiKey = getSafeHeader(event, 'x-api-key') || getSafeHeader(event, 'authorization')
      const apiKey = rawApiKey.replace(/^Bearer\s+/i, '').trim()

      if (!apiKey) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized',
          message: 'API Sentinel AI: Accesso negato. Header "x-api-key" obbligatorio per il sottodominio API.'
        })
      }
    }

    // -------------------------------------------------------------
    // 📧 3. ROUTING MAIL SUBDOMAIN
    // -------------------------------------------------------------
    if (isMailSubdomain) {
      setSafeHeader(event, 'X-Nexus-Mail-Sentinel', 'Active-Delivery-Engine')
      setSafeHeader(event, 'X-DKP-Version', 'v2.4-GOLD')

      if (path === '/' || path === '') {
        if (event.node?.req) event.node.req.url = '/mail'
      }
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('❌ Errore critico in Sentinel AI:', error)
  }
})