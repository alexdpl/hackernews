// server/api/user/keys/index.get.ts
import { defineEventHandler, createError, setResponseHeaders } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { extractDkpUserFromEvent } from '~~/server/utils/session'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'X-Cloud-Region': 'europe-west4',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  })

  const sessionUser = extractDkpUserFromEvent(event)
  if (!sessionUser?.id || !Number.isSafeInteger(Number(sessionUser.id)) || Number(sessionUser.id) <= 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Devi effettuare il login per visualizzare le tue API Key.'
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

    await db.execute(sql`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ NULL;`).catch(() => null)
    await db.execute(sql`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`).catch(() => null)

    const userId = Number(sessionUser.id)

    // Selezione esplicita dei campi sicuri (ESCLUSIONE totale di key_hash)
    const keysRes = await db.execute(sql`
      SELECT
        id,
        user_id AS "userId",
        name,
        key_prefix AS "keyPrefix",
        key_masked AS "keyMasked",
        role,
        status,
        COALESCE(usage_count, 0)::int AS "usageCount",
        last_used_at AS "lastUsedAt",
        created_at AS "createdAt"
      FROM api_keys
      WHERE user_id = ${userId}
      ORDER BY created_at DESC, id DESC;
    `)

    const keys = extractRows(keysRes)

    return {
      success: true,
      data: keys
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('❌ [USER KEYS GET ERROR]:', error?.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore durante il recupero delle chiavi API dal DB Neon.'
    })
  }
})