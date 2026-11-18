// server/api/auth/login.post.ts
import crypto from 'node:crypto'
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import {
  syncCrossSubdomainSessionCookie,
  signDkpSessionToken
} from '~~/server/utils/session'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

function safeStringEqual(a: string, b: string): boolean {
  if (!a || !b) return false
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

function hashPasswordScrypt(plainPassword: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = crypto.scryptSync(plainPassword, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

async function verifyPasswordAndUpgrade(
  db: any,
  userId: number,
  plainPassword: string,
  storedHash: string
): Promise<boolean> {
  if (!plainPassword || !storedHash) return false

  // 1. Formato standard DKP v2.6: salt:scryptHex
  if (storedHash.includes(':')) {
    const [salt, expectedHex] = storedHash.split(':')
    if (!salt || !expectedHex || !/^[a-f0-9]+$/i.test(expectedHex)) return false
    try {
      const derivedBuf = crypto.scryptSync(plainPassword, salt, 64)
      const expectedBuf = Buffer.from(expectedHex, 'hex')
      if (derivedBuf.length !== expectedBuf.length) return false
      return crypto.timingSafeEqual(derivedBuf, expectedBuf)
    } catch {
      return false
    }
  }

  // 2. Formato legacy SHA-256 esadecimale (64 char)
  if (/^[a-f0-9]{64}$/i.test(storedHash)) {
    const sha256Hex = crypto.createHash('sha256').update(plainPassword).digest('hex')
    if (safeStringEqual(sha256Hex, storedHash.toLowerCase())) {
      const upgraded = hashPasswordScrypt(plainPassword)
      await db.execute(sql`
        UPDATE users SET password_hash = ${upgraded} WHERE id = ${userId};
      `).catch(() => {})
      return true
    }
    return false
  }

  // 3. Formato legacy plaintext -> verifica constant-time + migrazione a scrypt
  if (safeStringEqual(plainPassword, storedHash)) {
    const upgraded = hashPasswordScrypt(plainPassword)
    await db.execute(sql`
      UPDATE users SET password_hash = ${upgraded} WHERE id = ${userId};
    `).catch(() => {})
    return true
  }

  return false
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event).catch(() => ({}))) || {}
  const identifier = String(body.email || body.username || '').trim()
  const password = String(body.password || '')

  if (!identifier || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Inserisci email/username e password.'
    })
  }

  if (identifier.length > 255 || password.length > 512) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Lunghezza credenziali non valida.'
    })
  }

  const db = await getDb()
  if (!db) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database Neon non disponibile.'
    })
  }

  try {
    // Assicura colonna avatar_url se non ancora migrata
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
    `).catch(() => null)

    const userRes = await db.execute(sql`
      SELECT
        id,
        username,
        email,
        password_hash AS "passwordHash",
        role,
        COALESCE(xp, 0)::int AS xp,
        avatar_url AS "avatarUrl"
      FROM users
      WHERE LOWER(email) = LOWER(${identifier})
         OR LOWER(username) = LOWER(${identifier})
      LIMIT 1;
    `)

    let dbUser = extractRows(userRes)[0]

    // Configurazione Admin Secret d'emergenza (da runtimeConfig o process.env)
    const config = useRuntimeConfig(event)
    const configuredAdminSecret = String(
      config?.adminSecret || process.env.NUXT_ADMIN_SECRET || process.env.ADMIN_SECRET || ''
    ).trim()

    const isFounderIdentifier =
      identifier.toLowerCase() === 'alexdpl' ||
      identifier.toLowerCase() === 'alex@devkernelpulse.org'

    const matchedAdminSecret =
      isFounderIdentifier &&
      configuredAdminSecret.length > 0 &&
      password === configuredAdminSecret

    // Se l'utente non esiste nel DB ma combacia la secret d'emergenza, creiamolo al volo!
    if (!dbUser && matchedAdminSecret) {
      const defaultHash = hashPasswordScrypt(password)
      await db.execute(sql`
        INSERT INTO users (username, email, role, xp, avatar_url, password_hash)
        VALUES ('alexdpl', 'alex@devkernelpulse.org', 'admin', 15000, 'https://github.com/alexdpl.png', ${defaultHash})
        ON CONFLICT (username) DO NOTHING;
      `).catch(() => {})

      const retryRes = await db.execute(sql`
        SELECT id, username, email, password_hash AS "passwordHash", role, COALESCE(xp, 0)::int AS xp, avatar_url AS "avatarUrl"
        FROM users WHERE LOWER(username) = 'alexdpl' LIMIT 1;
      `)
      dbUser = extractRows(retryRes)[0]
    }
	
	if (!dbUser && !matchedAdminSecret) {
      console.warn('[AUTH 401 DEBUG - NO USER]', {
        identifier,
        isFounderIdentifier,
        adminSecretLen: configuredAdminSecret.length,
        inputPasswordLen: password.length
      })
      throw createError({
        statusCode: 401,
        statusMessage: 'Credenziali non valide.'
      })
    }

    if (!dbUser && !matchedAdminSecret) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Credenziali non valide.'
      })
    }

    // Se l'utente esiste ma ha password_hash NULL e usiamo la admin secret, ripariamo il DB al volo
    if (dbUser && matchedAdminSecret) {
      if (!dbUser.passwordHash) {
        const newHash = hashPasswordScrypt(password)
        await db.execute(sql`
          UPDATE users SET password_hash = ${newHash}, role = 'admin' WHERE id = ${Number(dbUser.id)};
        `).catch(() => {})
        dbUser.passwordHash = newHash
      }
    } else if (dbUser) {
      const passwordOk = await verifyPasswordAndUpgrade(
        db,
        Number(dbUser.id),
        password,
        String(dbUser.passwordHash || '')
      )
      if (!passwordOk) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Credenziali non valide.'
        })
      }
    }

    const userId = dbUser ? Number(dbUser.id) : 1
    const username = dbUser?.username || 'alexdpl'
    const email = dbUser?.email || 'alex@devkernelpulse.org'
    const normalizedRole = String(
      matchedAdminSecret || dbUser?.role === 'admin' ? 'admin' : (dbUser?.role || 'user')
    ).toLowerCase()
    const xp = Number(dbUser?.xp ?? (matchedAdminSecret ? 15000 : 100))
    const avatar =
      dbUser?.avatarUrl ||
      (username.toLowerCase() === 'alexdpl'
        ? 'https://github.com/alexdpl.png'
        : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`)

    const sessionUser = {
      id: userId,
      username,
      email,
      role: normalizedRole,
      isAdmin: normalizedRole === 'admin',
      avatar,
      avatarUrl: avatar,
      xp,
      level: Math.max(1, Math.floor(xp / 250) + 1)
    }

    syncCrossSubdomainSessionCookie(event, sessionUser)
    const signedToken = signDkpSessionToken(sessionUser)

    return {
      success: true,
      message: 'Accesso eseguito con successo (DKP v2.6-AUTO-FIX).',
      user: sessionUser,
      token: signedToken
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('❌ [AUTH LOGIN ERROR]:', err?.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore interno durante l\'autenticazione.'
    })
  }
})