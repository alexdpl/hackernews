// server/middleware/rateLimit.ts
import { defineEventHandler, createError, setResponseHeaders, getMethod } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { licenses } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const path = event.path || event.node?.req?.url || ''
  const method = getMethod(event)

  // 1. Bypass all'istante per chiamate non-API e per le richieste Preflight CORS (OPTIONS)
  if (!path.startsWith('/api/') || path.startsWith('/_nuxt') || path.startsWith('/api/_') || method === 'OPTIONS') {
    return
  }

  try {
    // 2. Estrazione sicura degli header tramite getSafeHeader (auto-importato da server/utils/headers.ts)
    const rawApiKey = getSafeHeader(event, 'x-api-key') || getSafeHeader(event, 'authorization') || ''
    const apiKey = rawApiKey.replace(/^Bearer\s+/i, '').trim()

    // Estrazione dell'IP reale client tramite proxy GCP / Cloudflare / Node in totale sicurezza
    const clientIp =
      getSafeHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
      getSafeHeader(event, 'x-real-ip') ||
      event.node?.req?.socket?.remoteAddress ||
      '127.0.0.1'

    // Estrazione ruolo e username dalla sessione
    const userRole = event.context.user?.role?.toLowerCase() || ''
    const username = event.context.user?.username?.toLowerCase() || ''

    // -------------------------------------------------------------
    // 👑 GOD MODE: BYPASS COMPLETO RATE LIMIT PER ADMIN
    // -------------------------------------------------------------
    if (userRole === 'admin' || username === 'alexdpl') {
      setResponseHeaders(event, {
        'X-RateLimit-Limit': 'Unlimited',
        'X-RateLimit-Remaining': 'Unlimited',
        'X-RateLimit-Reset': '0',
        'X-RateLimit-Bypass': 'true-god-mode',
        'X-DKP-Version': 'v2.4-GOLD'
      })
      return // L'admin passa all'istante senza interrogare il DB!
    }

    // -------------------------------------------------------------
    // 🛡️ CONTROLLO RATE LIMIT UTENTI STANDARD / API KEYS
    // -------------------------------------------------------------
    if (apiKey) {
      const db = getDb()

      const [license] = await db
        .select()
        .from(licenses)
        .where(eq(licenses.licenseKey, apiKey))
        .limit(1)

      if (!license) {
        throw createError({
          statusCode: 401,
          statusMessage: 'API Key non valida o revocata.'
        })
      }

      if (license.status !== 'active') {
        throw createError({
          statusCode: 403,
          statusMessage: `Licenza non attiva (Stato: ${license.status}).`
        })
      }

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
          statusMessage: `Rate limit superato! Quota mensile esaurita (${used}/${limit} req).`
        })
      }

      // Incremento atomico su Neon DB
      await db
        .update(licenses)
        .set({ downloadsCount: sql`${licenses.downloadsCount} + 1` })
        .where(eq(licenses.id, license.id))

      const remaining = Math.max(0, limit - (used + 1))
      setResponseHeaders(event, {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining),
        'X-DKP-Client-IP': clientIp,
        'X-DKP-Version': 'v2.4-GOLD'
      })
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('❌ Errore durante la verifica del Rate Limit API:', error)
  }
})