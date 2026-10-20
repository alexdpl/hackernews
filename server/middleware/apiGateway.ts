// server/middleware/apiGateway.ts
import { scryptSync } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { apiKeys, apiLogs } from '~~/server/db/schema'

// Limiti di Quota Mensile configurati per ciascun Tier
const TIER_QUOTAS: Record<string, number> = {
  FREE: 1000,
  PRO: 50000,
  ENTERPRISE: 1000000
}

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)

  // Applichiamo la verifica del Gateway solo alle rotte API commerciali (/api/v1/)
  if (!url.pathname.startsWith('/api/v1/')) {
    return
  }

  const startTime = performance.now()
  const reqHeaders = getRequestHeaders(event)
  const reqQuery = getQuery(event)

  // 1. Estrazione dell'API Key dagli Header o dalla Query Parameter
  let rawApiKey = (reqHeaders['x-api-key'] || reqHeaders['X-API-Key']) as string | undefined

  if (!rawApiKey && reqHeaders.authorization) {
    const parts = reqHeaders.authorization.split(' ')
    if (parts.length === 2 && (parts[0].toLowerCase() === 'bearer' || parts[0].toLowerCase() === 'apikey')) {
      rawApiKey = parts[1]
    }
  }

  if (!rawApiKey && reqQuery.apiKey) {
    rawApiKey = reqQuery.apiKey as string
  }

  if (!rawApiKey) {
    setResponseStatus(event, 401)
    return {
      success: false,
      code: 'MISSING_API_KEY',
      message: 'API Key mancante. Invia la chiave nell\'header "X-API-Key" o "Authorization: Bearer <key>".'
    }
  }

  const db = getDb()

  try {
    // 2. Recuperiamo tutte le chiavi attive per confrontare il hash scrypt (che include il sale univoco)
    const keyRecords = await db.select().from(apiKeys).where(eq(apiKeys.status, 'ACTIVE'))

    let matchedKeyRecord = null

    for (const record of keyRecords) {
      if (!record.keyHash) continue
      
      const parts = record.keyHash.split(':')
      if (parts.length !== 2) continue

      const [salt, storedHash] = parts
      const computedHash = scryptSync(rawApiKey.trim(), salt, 64).toString('hex')

      if (computedHash === storedHash) {
        matchedKeyRecord = record
        break
      }
    }

    if (!matchedKeyRecord) {
      setResponseStatus(event, 401)
      return {
        success: false,
        code: 'INVALID_API_KEY',
        message: 'API Key non valida o inesistente nel sistema.'
      }
    }

    const keyRecord = matchedKeyRecord

    // 3. Controllo Stato Operativo della Chiave
    const statusUpper = (keyRecord.status || 'ACTIVE').toUpperCase()
    if (statusUpper !== 'ACTIVE') {
      setResponseStatus(event, 403)
      return {
        success: false,
        code: statusUpper === 'SUSPENDED' ? 'KEY_SUSPENDED' : 'KEY_REVOKED',
        message: `API Key non attiva (Stato: ${statusUpper}). Contatta il supporto o verifica il tuo pannello.`
      }
    }

    // 4. Verifica dei Limiti e Quota (Rate Limiting)
    const roleTier = (keyRecord.role || 'FREE').toUpperCase()
    const maxQuota = TIER_QUOTAS[roleTier] || TIER_QUOTAS.FREE
    const currentUsage = keyRecord.usageCount || 0

    // Configurazione Header HTTP di Rate Limit standard
    const remaining = Math.max(0, maxQuota - currentUsage)
    setResponseHeader(event, 'X-RateLimit-Limit', maxQuota)
    setResponseHeader(event, 'X-RateLimit-Remaining', remaining)
    setResponseHeader(event, 'X-RateLimit-Tier', roleTier)

    // Se la quota è esaurita
    if (currentUsage >= maxQuota) {
      setResponseStatus(event, 429)
      const latencyMs = Math.round(performance.now() - startTime)
      const clientIp = (getRequestHeader(event, 'x-forwarded-for') || event.node.req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim()

      db.insert(apiLogs).values({
        apiKeyId: keyRecord.id,
        endpoint: url.pathname,
        method: event.method,
        statusCode: 429,
        ipAddress: clientIp,
        latencyMs,
        errorMessage: 'QUOTA_EXCEEDED'
      }).catch(err => console.error('Errore scrittura api_log:', err))

      return {
        success: false,
        code: 'QUOTA_EXCEEDED',
        message: `Quota limite mensile superata per il piano ${roleTier} (${currentUsage}/${maxQuota} chiamate). Sostieni l'upgrade del piano per continuare.`
      }
    }

    // 5. Incremento atomico del conteggio chiamate su Neon DB
    await db.update(apiKeys)
      .set({
        usageCount: sql`${apiKeys.usageCount} + 1`,
        lastUsedAt: new Date()
      })
      .where(eq(apiKeys.id, keyRecord.id))

    // 6. Salva il contesto dell'utente/chiave autenticata
    event.context.apiKey = {
      id: keyRecord.id,
      name: keyRecord.name,
      userId: keyRecord.userId,
      role: roleTier,
      usageCount: currentUsage + 1,
      maxQuota
    }

    // 7. Log di audit asincrono al completamento della risposta
    event.node.res.on('finish', () => {
      const latencyMs = Math.round(performance.now() - startTime)
      const statusCode = event.node.res.statusCode
      const clientIp = (getRequestHeader(event, 'x-forwarded-for') || event.node.req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim()

      db.insert(apiLogs).values({
        apiKeyId: keyRecord.id,
        endpoint: url.pathname,
        method: event.method,
        statusCode,
        ipAddress: clientIp,
        latencyMs,
        errorMessage: statusCode >= 400 ? `HTTP_STATUS_${statusCode}` : null
      }).catch(err => console.error('Errore salvataggio asincrono api_log:', err))
    })

  } catch (err: any) {
    console.error('Errore critico Gateway API:', err)
    setResponseStatus(event, 500)
    return {
      success: false,
      code: 'GATEWAY_ERROR',
      message: 'Errore interno del Gateway durante l\'elaborazione della richiesta.'
    }
  }
})