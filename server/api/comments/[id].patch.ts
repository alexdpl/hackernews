// server/api/comments/[id].patch.ts
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import {
  ensureUnifiedCommentsSchema,
  extractSqlRows,
  parseSessionUser
} from '~~/server/utils/dkpComments'

export default defineEventHandler(async (event) => {
  const numericId = Number(getRouterParam(event, 'id'))
  if (!numericId || Number.isNaN(numericId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID commento non valido.' })
  }

  const session = parseSessionUser(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Autenticazione richiesta per modificare un commento.' })
  }

  const body = (await readBody(event).catch(() => ({}))) || {}
  const nextText = String(body.text || body.content || '').trim()

  if (!nextText || nextText.length > 5000) {
    throw createError({ statusCode: 400, statusMessage: 'Il testo del commento deve essere tra 1 e 5000 caratteri.' })
  }

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database non disponibile.' })
  }

  await ensureUnifiedCommentsSchema(db)

  const existing = extractSqlRows(
    await db.execute(sql`SELECT id, user_id, author FROM comments WHERE id = ${numericId} LIMIT 1;`)
  )[0]

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Commento non trovato.' })
  }

  const isOwner =
    (session.id > 0 && Number(existing.user_id) === session.id) ||
    String(existing.author || '').toLowerCase() === session.username.toLowerCase()

  if (!session.isAdmin && !isOwner) {
    throw createError({ statusCode: 403, statusMessage: 'Non hai i permessi per modificare questo commento.' })
  }

  const updated = extractSqlRows(
    await db.execute(sql`
      UPDATE comments
      SET
        text = ${nextText},
        content = ${nextText},
        updated_at = NOW()
      WHERE id = ${numericId}
      RETURNING
        id,
        post_id AS "postId",
        COALESCE(NULLIF(target_type, ''), 'post') AS "targetType",
        author,
        text,
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `)
  )[0]

  return {
    success: true,
    comment: updated
  }
})