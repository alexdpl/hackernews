// server/middleware/rateLimit.ts
import crypto from 'node:crypto'
import { defineEventHandler, createError, setResponseHeaders, getRequestHeader, getMethod } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

function safeTimingEqual(a: string, b: string): boolean {
  if (!a || !b) return false
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

function verifyScryptKey(plainKey: string, storedHash: string): boolean {
  if (!plainKey || !storedHash || !storedHash.includes(':')) return false
  const [salt, expectedHex] = storedHash.split(':')
  if (!salt || !expectedHex || !/^[a-f0-9]+$/i.test(expectedHex)) return false
  try {
    const derivedBuf = crypto.scryptSync(plainKey, salt, 64)
    const expectedBuf = Buffer.from(expectedHex, 'hex')
    if (derivedBuf.length !== expectedBuf.length) return false
    return crypto.timingSafeEqual(derivedBuf, expectedBuf)
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const path = event.path || event.node?.req?.url || ''
  const method = getMethod(event)

  // 1. Bypass immediato per asset, preflight CORS, auth e Playground AI
  if (
    !path.startsWith('/api/') ||
    path.startsWith('/_nuxt') ||
    path.startsWith('/api/_') ||
    path.startsWith('/api/ai/') ||
    path.startsWith('/api/auth/') ||
    method === 'OPTIONS'
  ) {
    return
  }

  try {
    const rawApiKey =
      getRequestHeader(event, 'x-api-key') ||
      getRequestHeader(event, 'authorization') ||
      ''
    const apiKey = rawApiKey.replace(/^Bearer\s+/i, '').trim()

    const clientIp =
      getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
      getRequestHeader(event, 'x-real-ip') ||
      event.node?.req?.socket?.remoteAddress ||
      '127.0.0.1'

    const userRole = String(event.context.user?.role || '').toLowerCase()
    const username = String(event.context.user?.username || '').toLowerCase()

    // 2. Bypass completo per sessione Admin autenticata
    if (userRole === 'admin' || username === 'alexdpl') {
      setResponseHeaders(event, {
        'X-RateLimit-Limit': 'Unlimited',
        'X-RateLimit-Remaining': 'Unlimited',
        'X-RateLimit-Reset': '0',
        'X-RateLimit-Bypass': 'true-admin-session',
        'X-Cloud-Region': 'europe-west4',
        'X-DKP-Version': 'v2.6-PURE-SQL'
      })
      return
    }

    if (!apiKey) {
      return
    }

    // 3. Validazione chiavi di sistema (CRON_SECRET / DKP_MASTER_KEY)
    const systemSecrets = [
      process.env.CRON_SECRET,
      process.env.NUXT_CRON_SECRET,
      process.env.DKP_MASTER_KEY
    ]
      .map((s) => String(s || '').trim())
      .filter(Boolean)

    if (systemSecrets.some((secret) => safeTimingEqual(apiKey, secret))) {
      event.context.isAdmin = true
      event.context.authRole = 'ADMIN'
      setResponseHeaders(event, {
        'X-RateLimit-Limit': 'Unlimited',
        'X-RateLimit-Remaining': 'Unlimited',
        'X-RateLimit-Bypass': 'true-system-secret',
        'X-Cloud-Region': 'europe-west4',
        'X-DKP-Version': 'v2.6-PURE-SQL'
      })
      return
    }

    const db = await getDb()
    if (!db) {
      return
    }

    // 4. Validazione Developer API Key (dkp_live_...) nella tabella api_keys
    if (apiKey.startsWith('dkp_live_')) {
      const keysRes = await db.execute(sql`
        SELECT id, user_id AS "userId", role, status, key_hash AS "keyHash", COALESCE(usage_count, 0)::int AS "usageCount"
        FROM api_keys
        WHERE status = 'ACTIVE'
        LIMIT 250;
      `)
      const activeKeys = extractRows(keysRes)
      const matchedKey = activeKeys.find((row) => verifyScryptKey(apiKey, String(row.keyHash || '')))

      if (!matchedKey) {
        throw createError({
          statusCode: 401,
          statusMessage: 'API Key non valida o revocata.'
        })
      }

      await db.execute(sql`
        UPDATE api_keys
        SET usage_count = COALESCE(usage_count, 0) + 1,
            last_used_at = NOW()
        WHERE id = ${Number(matchedKey.id)};
      `).catch(() => null)

      event.context.apiKey = {
        id: Number(matchedKey.id),
        userId: Number(matchedKey.userId),
        role: matchedKey.role
      }
      if (String(matchedKey.role || '').toUpperCase() === 'ADMIN') {
        event.context.isAdmin = true
        event.context.authRole = 'ADMIN'
      }

      setResponseHeaders(event, {
        'X-RateLimit-Limit': 'Unlimited',
        'X-RateLimit-Remaining': 'Unlimited',
        'X-DKP-Client-IP': clientIp,
        'X-Cloud-Region': 'europe-west4',
        'X-DKP-Version': 'v2.6-PURE-SQL'
      })
      return
    }

    // 5. Fallback su tabella legacy licenses (Pure SQL)
    const licRes = await db.execute(sql`
      SELECT id, status, COALESCE(downloads_count, 0)::int AS "downloadsCount", COALESCE(max_downloads, 1000)::int AS "maxDownloads"
      FROM licenses
      WHERE license_key = ${apiKey}
      LIMIT 1;
    `)
    const license = extractRows(licRes)[0]

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

    const used = Number(license.downloadsCount || 0)
    const limit = Number(license.maxDownloads || 1000)

    if (used >= limit) {
      setResponseHeaders(event, {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
        'Retry-After': '3600',
        'X-Cloud-Region': 'europe-west4',
        'X-DKP-Version': 'v2.6-PURE-SQL'
      })
      throw createError({
        statusCode: 429,
        statusMessage: `Rate limit superato! Quota mensile esaurita (${used}/${limit} req).`
      })
    }

    await db.execute(sql`
      UPDATE licenses
      SET downloads_count = COALESCE(downloads_count, 0) + 1
      WHERE id = ${Number(license.id)};
    `)

    const remaining = Math.max(0, limit - (used + 1))
    setResponseHeaders(event, {
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-DKP-Client-IP': clientIp,
      'X-Cloud-Region': 'europe-west4',
      'X-DKP-Version': 'v2.6-PURE-SQL'
    })
  } catch (error: any) {
    if (error?.statusCode) {
      throw error
    }
    console.error('❌ Errore critico in v2.6 Rate Limit API:', error?.message)
  }
})
