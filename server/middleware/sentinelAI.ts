// server/middleware/sentinelAI.ts
import { defineEventHandler, createError, setResponseHeaders } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { licenses } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  // Accesso sicuro e nativo alle intestazioni Node.js per evitare conflitti di versione h3
  const headers = event.node?.req?.headers || {}
  const host = String(headers['host'] || headers['x-forwarded-host'] || '')
  const path = event.node?.req?.url || event.path || ''

  // Riconoscimento dei sottodomini dedicati v2.4-GOLD
  const isApiSubdomain = host.startsWith('api.')
  const isMailSubdomain = host.startsWith('mail.')

  try {
    // -------------------------------------------------------------
    // 🤖 1. API SENTINEL AI (Gestione e Protezione api.devkernelpulse.org)
    // -------------------------------------------------------------
    if (isApiSubdomain) {
      // Ignora asset interni di Nuxt e percorsi di sistema
      if (path.startsWith('/_nuxt') || path.startsWith('/api/_')) {
        return
      }

      // Estrazione sicura della chiave API dalle intestazioni nativo-node
      const rawApiKey = headers['x-api-key'] || headers['authorization']
      const apiKeyString = Array.isArray(rawApiKey) ? rawApiKey[0] : rawApiKey
      const apiKey = apiKeyString ? String(apiKeyString).replace(/^Bearer\s+/i, '').trim() : ''

      // Se la chiave manca, l'API Sentinel AI blocca la richiesta con un JSON pulito
      if (!apiKey) {
        setResponseHeaders(event, {
          'X-Sentinel-AI': 'API-Guard-Active',
          'X-Error-Reason': 'Missing-API-Key'
        })
        throw createError({
          statusCode: 401,
          statusMessage: 'API Sentinel AI: Accesso negato. Header "x-api-key" obbligatorio.'
        })
      }

      // Connessione al Database Neon per la verifica della licenza
      const db = getDb()
      const [license] = await db
        .select()
        .from(licenses)
        .where(eq(licenses.licenseKey, apiKey))
        .limit(1)

      if (!license || license.status !== 'active') {
        throw createError({
          statusCode: 403,
          statusMessage: 'API Sentinel AI: Licenza non valida o non attiva.'
        })
      }

      // Controllo Quota e Rate Limit
      const used = license.downloadsCount || 0
      const limit = license.maxDownloads || 1000

      if (used >= limit) {
        setResponseHeaders(event, {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'Retry-After': '3600'
        })
        throw createError({
          statusCode: 429,
          statusMessage: 'API Sentinel AI: Quota mensile esaurita.'
        })
      }

      // Incremento atomico del contatore richieste
      await db
        .update(licenses)
        .set({ downloadsCount: sql`${licenses.downloadsCount} + 1` })
        .where(eq(licenses.id, license.id))

      // Intestazioni di risposta protetta dall'AI
      setResponseHeaders(event, {
        'X-Sentinel-Status': 'Protected-By-Pulse-AI',
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(Math.max(0, limit - (used + 1)))
      })
    }

    // -------------------------------------------------------------
    // 📧 2. NEXUS MAIL SENTINEL AI (Gestione mail.devkernelpulse.org)
    // -------------------------------------------------------------
    if (isMailSubdomain) {
      setResponseHeaders(event, {
        'X-Nexus-Mail-Sentinel': 'Active-Delivery-Engine',
        'X-DKP-Version': 'v2.4-GOLD'
      })
      // Gestione dedicata per code Autoresponder e Newsletter
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('❌ Errore critico nel Pulse Sentinel AI:', error)
  }
})