// server/api/auth/register.post.ts
import crypto from 'node:crypto'
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import {
  syncCrossSubdomainSessionCookie,
  signDkpSessionToken
} from '~~/server/utils/session'

const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'root',
  'system',
  'support',
  'staff',
  'moderator',
  'mod',
  'devkernelpulse',
  'dkp',
  'vault',
  'security',
  'api',
  'null',
  'undefined'
])

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

  // 1. Validazione Username
  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Lo username deve avere tra 3 e 30 caratteri (solo lettere, numeri, _ o -).'
    })
  }

  if (RESERVED_USERNAMES.has(username.toLowerCase())) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Questo username è riservato dal sistema.'
    })
  }

  // 2. Validazione Email
  if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Indirizzo email non valido.'
    })
  }

  // 3. Validazione Password
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
    // 4. Assicura schema tabella users aggiornato (Pure SQL)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'USER',
        xp INTEGER NOT NULL DEFAULT 100,
        avatar_url TEXT,
        bio TEXT DEFAULT '',
        github VARCHAR(255),
        twitter VARCHAR(255),
        linkedin VARCHAR(255),
        reddit VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `).catch(() => null)

    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`).catch(() => null)
    await db.execute(sql`ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT;`).catch(() => null)

    // 5. Controllo unicità username / email (case-insensitive)
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

    // 6. Hashing sicuro scrypt & inserimento utente (ruolo sempre forzato a USER)
    const passwordHash = hashPasswordScrypt(password)
    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`
    const initialXp = 100

    const insertRes = await db.execute(sql`
      INSERT INTO users (username, email, password_hash, role, xp, avatar_url, bio, created_at)
      VALUES (${username}, ${email}, ${passwordHash}, 'USER', ${initialXp}, ${defaultAvatar}, '', NOW())
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