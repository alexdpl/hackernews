// server/middleware/sentinelAI.ts
import { defineEventHandler } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { licenses } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const req = event.node?.req
  const res = event.node?.res

  if (!req || !res) return

  const headers = req.headers || {}
  const host = String(headers['host'] || headers['x-forwarded-host'] || '')
  let path = req.url || event.path || ''

  const isApiSubdomain = host.startsWith('api.')
  const isMailSubdomain = host.startsWith('mail.')

  try {
    // -------------------------------------------------------------
    // 🤖 1. ROUTING & API SENTINEL AI (api.devkernelpulse.org)
    // -------------------------------------------------------------
    if (isApiSubdomain) {
      // A. Se l'utente visita la radice da browser, serviamo la console API
      if (path === '/' || path === '') {
        req.url = '/api-console'
        return
      }

      // B. Ignora asset statici e percorsi interni di sistema
      if (
        path.startsWith('/_nuxt') || 
        path.startsWith('/api/_') || 
        path.startsWith('/favicon') ||
        path === '/api-console'
      ) {
        return
      }

      // C. Mappatura automatica: trasforma api.domain.com/v2/news -> /api/v2/news
      if (!path.startsWith('/api/')) {
        req.url = `/api${path.startsWith('/') ? '' : '/'}${path}`
      }

      // D. Estrazione della chiave API dall'header
      const rawApiKey = headers['x-api-key'] || headers['authorization']
      const apiKeyString = Array.isArray(rawApiKey) ? rawApiKey[0] : rawApiKey
      const apiKey = apiKeyString ? String(apiKeyString).replace(/^Bearer\s+/i, '').trim() : ''

      // E. BLOCCO 401: Manca la chiave API
      if (!apiKey) {
        res.statusCode = 401
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('X-Sentinel-AI', 'API-Guard-Active')
        res.setHeader('X-Error-Reason', 'Missing-API-Key')
        res.end(JSON.stringify({
          error: true,
          statusCode: 401,
          statusMessage: 'Unauthorized',
          message: 'API Sentinel AI: Accesso negato. Header "x-api-key" obbligatorio.'
        }))
        return
      }

      // F. Connessione al DB Neon e verifica licenza
      const db = getDb()
      const [license] = await db
        .select()
        .from(licenses)
        .where(eq(licenses.licenseKey, apiKey))
        .limit(1)

      // G. BLOCCO 403: Licenza non valida o non attiva
      if (!license || license.status !== 'active') {
        res.statusCode = 403
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('X-Sentinel-AI', 'API-Guard-Active')
        res.end(JSON.stringify({
          error: true,
          statusCode: 403,
          statusMessage: 'Forbidden',
          message: 'API Sentinel AI: Licenza non valida o non attiva.'
        }))
        return
      }

      // H. BLOCCO 429: Rate Limit / Quota Esaurita
      const used = license.downloadsCount || 0
      const limit = license.maxDownloads || 1000

      if (used >= limit) {
        res.statusCode = 429
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('X-RateLimit-Limit', String(limit))
        res.setHeader('X-RateLimit-Remaining', '0')
        res.setHeader('Retry-After', '3600')
        res.end(JSON.stringify({
          error: true,
          statusCode: 429,
          statusMessage: 'Too Many Requests',
          message: 'API Sentinel AI: Quota mensile esaurita.'
        }))
        return
      }

      // Incremento contatore
      await db
        .update(licenses)
        .set({ downloadsCount: sql`${licenses.downloadsCount} + 1` })
        .where(eq(licenses.id, license.id))

      // Intestazioni per risposte valide
      res.setHeader('X-Sentinel-Status', 'Protected-By-Pulse-AI')
      res.setHeader('X-RateLimit-Limit', String(limit))
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - (used + 1))))
    }

    // -------------------------------------------------------------
    // 📧 2. ROUTING & NEXUS MAIL SENTINEL AI (mail.devkernelpulse.org)
    // -------------------------------------------------------------
    if (isMailSubdomain) {
      res.setHeader('X-Nexus-Mail-Sentinel', 'Active-Delivery-Engine')
      res.setHeader('X-DKP-Version', 'v2.4-GOLD')

      if (path === '/') {
        req.url = '/mail'
      }
    }

  } catch (error: any) {
    console.error('❌ Errore critico nel Pulse Sentinel AI:', error)
  }
})