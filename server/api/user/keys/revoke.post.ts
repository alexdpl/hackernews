// server/api/user/keys/revoke.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { extractDkpUserFromEvent } from '~~/server/utils/session'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const sessionUser = extractDkpUserFromEvent(event)
  if (!sessionUser?.id || !Number.isSafeInteger(Number(sessionUser.id)) || Number(sessionUser.id) <= 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Devi effettuare il login per revocare una API Key.'
    })
  }

  const body = (await readBody(event).catch(() => ({}))) || {}
  const rawId = String(body.id ?? '').trim()
  const numericId = Number(rawId)

  if (!rawId || !/^\d+$/.test(rawId) || !Number.isSafeInteger(numericId) || numericId <= 0 || numericId > 2147483647) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID della chiave API non valido.'
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

    // Verifica ruolo reale su DB (l'ADMIN può revocare qualsiasi chiave; l'utente solo le proprie)
    const userRes = await db.execute(sql`
      SELECT id, role FROM users WHERE id = ${userId} LIMIT 1;
    `)
    const dbUser = extractRows(userRes)[0]
    if (!dbUser?.id) {
      throw createError({ statusCode: 401, statusMessage: 'Sessione non valida.' })
    }

    const isDbAdmin = String(dbUser.role || '').toUpperCase() === 'ADMIN'

    const revokeRes = isDbAdmin
      ? await db.execute(sql`
          UPDATE api_keys
          SET status = 'REVOKED'
          WHERE id = ${numericId}
          RETURNING id, name, status;
        `)
      : await db.execute(sql`
          UPDATE api_keys
          SET status = 'REVOKED'
          WHERE id = ${numericId} AND user_id = ${userId}
          RETURNING id, name, status;
        `)

    const revoked = extractRows(revokeRes)[0]
    if (!revoked) {
      throw createError({
        statusCode: 404,
        statusMessage: 'API Key non trovata o non appartenente al tuo account.'
      })
    }

    return {
      success: true,
      message: '🚫 API Key revocata permanentemente dal database Neon.',
      keyData: revoked
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('❌ [USER KEYS REVOKE ERROR]:', error?.message)
    throw createError({
      statusCode: 500,
      statusMessage: `Errore revoca chiave: ${error?.message || 'Errore database'}`
    })
  }
})