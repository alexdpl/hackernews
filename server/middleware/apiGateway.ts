// server/middleware/apiGateway.ts
import { scryptSync, createHash } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { apiKeys, apiLogs } from '~~/server/db/schema'

const TIER_QUOTAS: Record<string, number> = {
  FREE: 1000,
  PRO: 50000,
  ENTERPRISE: 1000000,
  ADMIN: 10000000
}

function verifyKeyHash(rawKey: string, storedKeyHash: string): boolean {
  const cleanKey = rawKey.trim()
  // 1. Formato standard scrypt (salt:hash)
  if (storedKeyHash.includes(':')) {
    const parts = storedKeyHash.split(':')
    if (parts.length !== 2) return false
    const [salt, storedHash] = parts
    const computedHash = scryptSync(cleanKey, salt, 64).toString('hex')
    return computedHash === storedHash
  }
  // 2. Formato SHA-256 (Master Key / Chiavi di sistema)
  const sha256Hash = createHash('sha256').update(cleanKey).digest('hex')
  return sha256Hash === storedKeyHash
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

  const db = await getDb()

  try {
    const keyRecords = await db.select().from(apiKeys).where(eq(apiKeys.status, 'ACTIVE'))
    const matchedKeyRecord = keyRecords.find(r => r.keyHash && verifyKeyHash(rawApiKey!, r.keyHash)) || null

    if (!matchedKeyRecord) {
      setResponseStatus(event, 401)
      return {
        success: false,
        code: 'INVALID_API_KEY',
        message: 'API Key non valida, revocata o inesistente nel sistema.'
      }
    }

    const keyRecord = matchedKeyRecord
    const statusUpper = (keyRecord.status || 'ACTIVE').toUpperCase()
    if (statusUpper !== 'ACTIVE') {
      setResponseStatus(event, 403)
      return {
        success: false,
        code: statusUpper === 'SUSPENDED' ? 'KEY_SUSPENDED' : 'KEY_REVOKED',
        message: `API Key non attiva (Stato: ${statusUpper}).`
      }
    }

    const roleTier = (keyRecord.role || 'FREE').toUpperCase()
    const maxQuota = TIER_QUOTAS[roleTier] || TIER_QUOTAS.FREE
    const currentUsage = keyRecord.usageCount || 0

    const remaining = Math.max(0, maxQuota - currentUsage)
    setResponseHeader(event, 'X-RateLimit-Limit', maxQuota)
    setResponseHeader(event, 'X-RateLimit-Remaining', remaining)
    setResponseHeader(event, 'X-RateLimit-Tier', roleTier)

    if (roleTier !== 'ADMIN' && currentUsage >= maxQuota) {
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
        message: `Quota limite mensile superata per il piano ${roleTier} (${currentUsage}/${maxQuota} chiamate).`
      }
    }

    await db.update(apiKeys)
      .set({
        usageCount: sql`${apiKeys.usageCount} + 1`,
        lastUsedAt: new Date()
      })
      .where(eq(apiKeys.id, keyRecord.id))

    event.context.apiKey = {
      id: keyRecord.id,
      name: keyRecord.name,
      userId: keyRecord.userId,
      role: roleTier,
      usageCount: currentUsage + 1,
      maxQuota
    }

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