// server/utils/cronAuth.ts
import { type H3Event, getHeader, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { scryptSync, timingSafeEqual } from 'node:crypto'
import { extractDkpUserFromEvent } from './session'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

function safeStringEqual(a: string, b: string): boolean {
  if (!a || !b) return false
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

function matchesStoredHash(rawKey: string, storedHashValue: string): boolean {
  const cleanKey = rawKey.trim()
  const [salt, storedHash] = String(storedHashValue || '').split(':')
  if (!salt || !storedHash || !/^[a-f0-9]+$/i.test(storedHash)) return false
  try {
    const derivedBuf = scryptSync(cleanKey, salt, 64)
    const storedBuf = Buffer.from(storedHash, 'hex')
    if (derivedBuf.length !== storedBuf.length) return false
    return timingSafeEqual(derivedBuf, storedBuf)
  } catch {
    return false
  }
}

export async function verifyAdminOrCronAuth(event: H3Event, db: any) {
  const authHeader = getHeader(event, 'authorization') || ''
  const xApiKey = getHeader(event, 'x-api-key') || ''
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim()
  const token = bearerToken || xApiKey.trim()

  const envCron = String(process.env.CRON_SECRET || '').trim()

  if (token) {
    // 1. Validazione prioritaria e diretta di CRON_SECRET (da process.env)
    if (envCron && safeStringEqual(token, envCron)) {
      return true
    }

    // 2. Validazione API Key ADMIN attiva su Neon DB
    if (token.startsWith('dkp_live_') && db) {
      const prefix = token.slice(0, 9)
      const keyRes = await db.execute(sql`
        SELECT id, role, key_hash
        FROM api_keys
        WHERE status = 'ACTIVE'
          AND UPPER(COALESCE(role, '')) = 'ADMIN'
          AND (key_prefix = ${prefix} OR key_prefix IS NULL);
      `).catch(() => [])

      const rows = extractRows(keyRes)
      const matchedRow = rows.find((r: any) => r.key_hash && matchesStoredHash(token, r.key_hash))
      if (matchedRow) {
        await db.execute(sql`
          UPDATE api_keys
          SET usage_count = COALESCE(usage_count, 0) + 1,
              last_used_at = NOW()
          WHERE id = ${Number(matchedRow.id)};
        `).catch(() => {})
        return true
      }
    }
  }

  // 3. Verifica sessione Admin firmata + riscontro ruolo su DB
  const sessionUser = extractDkpUserFromEvent(event)
  if (sessionUser?.id && Number(sessionUser.id) > 0 && db) {
    const userRes = await db.execute(sql`
      SELECT id, role
      FROM users
      WHERE id = ${Number(sessionUser.id)}
      LIMIT 1;
    `).catch(() => [])

    const dbUser = extractRows(userRes)[0]
    if (dbUser && String(dbUser.role || '').toUpperCase() === 'ADMIN') {
      return true
    }
  }

  throw createError({
    statusCode: 401,
    statusMessage: 'Autenticazione amministrativa o API Key non valida.'
  })
}