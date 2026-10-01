import { defineEventHandler, getHeader, createError, setResponseHeaders } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { licenses, users } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const path = event.node.req.url || ''

  // 1. Applica il middleware solo alle chiamate verso gli endpoint API (/api/...)
  // Salta asset statici, route interne di Nuxt e health check
  if (!path.startsWith('/api/') || path.startsWith('/_nuxt') || path.startsWith('/api/_')) {
    return
  }

  try {
    const db = getDb()

    // 2. Estrazione credenziali e ruolo utente (da context sessione o header x-api-key)
    const apiKey = getHeader(event, 'x-api-key') || getHeader(event, 'authorization')?.replace('Bearer ', '')
    const userRole = event.context.user?.role || 'user' // Estratto dalla sessione Auth se presente

    // -------------------------------------------------------------
    // 👑 BYPASS COMPLETO RATE LIMIT PER ADMIN
    // -------------------------------------------------------------
    if (userRole === 'admin') {
      setResponseHeaders(event, {
        'X-RateLimit-Limit': 'Unlimited',
        'X-RateLimit-Remaining': 'Unlimited',
        'X-RateLimit-Reset': '0',
        'X-RateLimit-Bypass': 'true-god-mode',
        'X-DKP-Version': 'v2.4-GOLD'
      })
      return // L'admin passa immediatamente senza contatori né blocchi DB!
    }

    // -------------------------------------------------------------
    // 🛡️ CONTROLLO RATE LIMIT UTENTI STANDARD / API KEYS
    // -------------------------------------------------------------
    if (apiKey) {
      // Cerca la licenza associata all'API Key ricevuta
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

      // Blocco in caso di raggiungimento del limite
      if (used >= limit) {
        setResponseHeaders(event, {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'Retry-After': '3600'
        })

        throw createError({
          statusCode: 429,
          statusMessage: `Rate limit superato! Quota mensile esaurita (${used}/${limit} req). Effettua l'upgrade del piano.`
        })
      }

      // Incrementa atomicamente il contatore di consumo su Neon Postgres
      await db
        .update(licenses)
        .set({ downloadsCount: sql`${licenses.downloadsCount} + 1` })
        .where(eq(licenses.id, license.id))

      // Imposta gli header di Rate Limit standard per il client
      const remaining = Math.max(0, limit - (used + 1))
      setResponseHeaders(event, {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining),
        'X-DKP-Version': 'v2.4-GOLD'
      })
    }

  } catch (error: any) {
    // Se è un errore H3 già sollevato (401, 403, 429), lo rilanciamo
    if (error.statusCode) {
      throw error
    }

    console.error('❌ Errore durante la verifica del Rate Limit API:', error)
    // Non blocchiamo le richieste in caso di errore temporaneo del DB
  }
})