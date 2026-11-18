// server/api/auth/register.post.ts
import crypto from 'node:crypto'
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { isValidHumanUsername } from '~~/server/utils/reservedUsernames'
import {
  syncCrossSubdomainSessionCookie,
  signDkpSessionToken
} from '~~/server/utils/session'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

function hashPasswordScrypt(plainPassword: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = crypto.scryptSync(plainPassword, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event).catch(() => ({}))) || {}

  const username = String(body.username || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')

  if (!isValidHumanUsername(username)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username non valido o riservato dal sistema (3-32 caratteri alfanumerici, _ o -).'
    })
  }

  if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Indirizzo email non valido.'
    })
  }

  if (password.length < 8 || password.length > 128) {
    throw createError({
      statusCode: 400,
      statusMessage: 'La password deve essere compresa tra 8 e 128 caratteri.'
    })
  }

  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'La password deve contenere almeno una lettera e un numero.'
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
    const existingRes = await db.execute(sql`
      SELECT username, email
      FROM users
      WHERE LOWER(username) = LOWER(${username})
         OR LOWER(email) = LOWER(${email})
      LIMIT 1;
    `)
    const existing = extractRows(existingRes)[0]

    if (existing) {
      const sameUsername = String(existing.username || '').toLowerCase() === username.toLowerCase()
      throw createError({
        statusCode: 409,
        statusMessage: sameUsername
          ? 'Questo username è già in uso.'
          : 'Esiste già un account registrato con questa email.'
      })
    }

    const passwordHash = hashPasswordScrypt(password)
    const defaultAvatar = `[https://api.dicebear.com/7.x/bottts/svg?seed=$](https://api.dicebear.com/7.x/bottts/svg?seed=$){encodeURIComponent(username)}`
    const initialXp = 100

    const insertRes = await db.execute(sql`
      INSERT INTO users (username, email, password_hash, role, is_bot, xp, avatar_url, bio, created_at)
      VALUES (${username}, ${email}, ${passwordHash}, 'USER', FALSE, ${initialXp}, ${defaultAvatar}, '', NOW())
      RETURNING id, username, email, role, xp, avatar_url AS "avatarUrl", created_at AS "createdAt";
    `)

    const createdUser = extractRows(insertRes)[0]
    if (!createdUser?.id) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Impossibile completare la registrazione dell\'account.'
      })
    }

    const sessionUser = {
      id: Number(createdUser.id),
      username: createdUser.username,
      email: createdUser.email,
      role: 'user',
      isAdmin: false,
      avatar: createdUser.avatarUrl || defaultAvatar,
      avatarUrl: createdUser.avatarUrl || defaultAvatar,
      xp: initialXp,
      level: 1
    }

    syncCrossSubdomainSessionCookie(event, sessionUser)
    const signedToken = signDkpSessionToken(sessionUser)

    return {
      success: true,
      message: 'Account creato con successo! Benvenuto nel Kernel DKP v2.6.',
      user: sessionUser,
      token: signedToken
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('❌ [AUTH REGISTER ERROR]:', err?.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore interno durante la registrazione.'
    })
  }
})
