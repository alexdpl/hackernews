// server/api/user/password.patch.ts
import crypto from 'node:crypto'
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import {
  extractDkpUserFromEvent,
  syncCrossSubdomainSessionCookie
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

function verifyStoredPassword(plainPassword: string, storedHash: string): boolean {
  if (!plainPassword || !storedHash) return false

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

  if (/^[a-f0-9]{64}$/i.test(storedHash)) {
    const sha256Hex = crypto.createHash('sha256').update(plainPassword).digest('hex')
    return safeStringEqual(sha256Hex, storedHash.toLowerCase())
  }

  return safeStringEqual(plainPassword, storedHash)
}

export default defineEventHandler(async (event) => {
  const sessionUser = extractDkpUserFromEvent(event)
  if (!sessionUser?.id || Number(sessionUser.id) <= 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Devi effettuare il login per cambiare la password.'
    })
  }

  const body = (await readBody(event).catch(() => ({}))) || {}
  const currentPassword = String(body.currentPassword || '')
  const newPassword = String(body.newPassword || '')

  if (!currentPassword || !newPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Inserisci la password attuale e la nuova password.'
    })
  }

  if (newPassword.length < 8 || newPassword.length > 128) {
    throw createError({
      statusCode: 400,
      statusMessage: 'La nuova password deve essere compresa tra 8 e 128 caratteri.'
    })
  }

  if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'La nuova password deve contenere almeno una lettera e un numero.'
    })
  }

  if (currentPassword === newPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'La nuova password deve essere diversa da quella attuale.'
    })
  }

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
  }

  try {
    const userId = Number(sessionUser.id)
    const userRes = await db.execute(sql`
      SELECT id, username, email, role, password_hash AS "passwordHash", avatar_url AS "avatarUrl"
      FROM users
      WHERE id = ${userId}
      LIMIT 1;
    `)
    const dbUser = extractRows(userRes)[0]

    if (!dbUser) {
      throw createError({ statusCode: 404, statusMessage: 'Utente non trovato.' })
    }

    if (!verifyStoredPassword(currentPassword, String(dbUser.passwordHash || ''))) {
      throw createError({
        statusCode: 401,
        statusMessage: 'La password attuale non è corretta.'
      })
    }

    const salt = crypto.randomBytes(16).toString('hex')
    const newHash = `${salt}:${crypto.scryptSync(newPassword, salt, 64).toString('hex')}`

    await db.execute(sql`
      UPDATE users
      SET password_hash = ${newHash}
      WHERE id = ${userId};
    `)

    // Rinnova il token di sessione firmato
    syncCrossSubdomainSessionCookie(event, {
      id: Number(dbUser.id),
      username: dbUser.username,
      email: dbUser.email,
      role: String(dbUser.role || 'user').toLowerCase(),
      avatarUrl: dbUser.avatarUrl || null
    })

    return {
      success: true,
      message: 'Password aggiornata con successo (scrypt SHA-512).'
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('❌ [CHANGE PASSWORD ERROR]:', err?.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore durante l\'aggiornamento della password.'
    })
  }
})