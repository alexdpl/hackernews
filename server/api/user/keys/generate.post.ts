// server/api/user/keys/generate.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { randomBytes, scryptSync } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { extractDkpUserFromEvent } from '~~/server/utils/session'

const MAX_ACTIVE_KEYS_PER_USER = 5

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const sessionUser = extractDkpUserFromEvent(event)
  if (!sessionUser?.id || !Number.isSafeInteger(Number(sessionUser.id)) || Number(sessionUser.id) <= 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Devi effettuare il login per generare una API Key.'
    })
  }

  const body = (await readBody(event).catch(() => ({}))) || {}
  const keyName = String(body.name || 'Default Production API Key').trim()

  if (keyName.length < 2 || keyName.length > 80) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Il nome della API Key deve essere compreso tra 2 e 80 caratteri.'
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
    const userId = Number(sessionUser.id)

    // 1. Verifica utente autenticato e ruolo reale su Neon DB (anti-privilege escalation)
    const userRes = await db.execute(sql`
      SELECT id, role
      FROM users
      WHERE id = ${userId}
      LIMIT 1;
    `)
    const dbUser = extractRows(userRes)[0]
    if (!dbUser?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Sessione non valida o utente inesistente.'
      })
    }

    const isDbAdmin = String(dbUser.role || '').toUpperCase() === 'ADMIN'
    const requestedRole = String(body.role || 'PRO').trim().toUpperCase()

    // Solo un vero ADMIN su DB può generare una chiave ADMIN; agli altri viene assegnato PRO o USER
    const safeRole = isDbAdmin && requestedRole === 'ADMIN'
      ? 'ADMIN'
      : (requestedRole === 'USER' ? 'USER' : 'PRO')

    // 2. Assicura schema tabella api_keys (Pure SQL)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        usage_count INTEGER NOT NULL DEFAULT 0,
        role VARCHAR(32) NOT NULL DEFAULT 'PRO',
        status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
        name VARCHAR(120) NOT NULL DEFAULT 'Default Production API Key',
        key_hash TEXT NOT NULL,
        key_prefix VARCHAR(32),
        key_masked VARCHAR(64),
        last_used_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `).catch(() => null)

    // 3. Controllo quota massima chiavi attive per utente (escluso Admin)
    if (!isDbAdmin) {
      const countRes = await db.execute(sql`
        SELECT COUNT(*)::int AS total
        FROM api_keys
        WHERE user_id = ${userId} AND status = 'ACTIVE';
      `)
      const activeCount = Number(extractRows(countRes)[0]?.total || 0)

      if (activeCount >= MAX_ACTIVE_KEYS_PER_USER) {
        throw createError({
          statusCode: 429,
          statusMessage: `Hai raggiunto il limite massimo di ${MAX_ACTIVE_KEYS_PER_USER} API Key attive. Revocane una prima di crearne una nuova.`
        })
      }
    }

    // 4. Generazione sicura del token in chiaro e del relativo hash scrypt
    const rawSecret = randomBytes(32).toString('hex')
    const fullApiKey = `dkp_live_${rawSecret}`
    const keyPrefix = fullApiKey.slice(0, 9) // 'dkp_live_' -> allineato a cronAuth.ts
    const keyMasked = `${fullApiKey.slice(0, 12)}...${fullApiKey.slice(-4)}`

    const salt = randomBytes(16).toString('hex')
    const derivedKey = scryptSync(fullApiKey, salt, 64).toString('hex')
    const hashedKey = `${salt}:${derivedKey}`

    const insertRes = await db.execute(sql`
      INSERT INTO api_keys (
        user_id,
        name,
        key_prefix,
        key_masked,
        key_hash,
        role,
        status,
        usage_count,
        created_at
      )
      VALUES (
        ${userId},
        ${keyName},
        ${keyPrefix},
        ${keyMasked},
        ${hashedKey},
        ${safeRole},
        'ACTIVE',
        0,
        NOW()
      )
      RETURNING
        id,
        user_id AS "userId",
        name,
        key_prefix AS "keyPrefix",
        key_masked AS "keyMasked",
        role,
        status,
        usage_count AS "usageCount",
        created_at AS "createdAt";
    `)

    const insertedKey = extractRows(insertRes)[0]

    return {
      success: true,
      message: '🔑 Nuova API Key generata e salvata con successo nel DB Neon!',
      rawApiKey: fullApiKey, // Restituito UNA SOLA VOLTA al momento della creazione
      keyData: insertedKey
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('❌ [USER KEYS GENERATE ERROR]:', error?.message)
    throw createError({
      statusCode: 500,
      statusMessage: `Impossibile generare la chiave API: ${error?.message || 'Errore DB'}`
    })
  }
})