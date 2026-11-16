// server/api/comments/[id].delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
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
    throw createError({ statusCode: 401, statusMessage: 'Autenticazione richiesta.' })
  }

  try {
    const db = await getDb()
    if (!db) throw new Error('Database non disponibile.')

    await ensureUnifiedCommentsSchema(db)

    // 1. Recupera metadati commento e verifica permessi
    const commentRes: any = await db.execute(sql`
      SELECT id, post_id, user_id, author, COALESCE(NULLIF(target_type, ''), 'post') AS target_type
      FROM comments
      WHERE id = ${numericId}
      LIMIT 1;
    `)
    const row = extractSqlRows(commentRes)[0]

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Commento non trovato.' })
    }

    const isOwner =
      (session.id > 0 && Number(row.user_id) === session.id) ||
      String(row.author || '').toLowerCase() === session.username.toLowerCase()

    if (!session.isAdmin && !isOwner) {
      throw createError({ statusCode: 403, statusMessage: 'Non hai i permessi per eliminare questo commento.' })
    }

    // 2. Elimina il commento ed eventuali risposte nidificate
    const deletedRes: any = await db.execute(sql`
      DELETE FROM comments
      WHERE id = ${numericId} OR parent_id = ${numericId}
      RETURNING id;
    `)
    const deletedCount = Math.max(1, extractSqlRows(deletedRes).length)

    // 3. Decrementa il contatore sul contenuto originale
    if (row.post_id) {
      const targetType = String(row.target_type || 'post')
      if (targetType === 'blog') {
        await db.execute(sql`
          UPDATE blog_posts
          SET comments_count = GREATEST(COALESCE(comments_count, 1) - ${deletedCount}, 0)
          WHERE id = ${row.post_id};
        `).catch(() => {})
      } else if (targetType === 'node' || targetType === 'thread') {
        await db.execute(sql`
          UPDATE node_threads
          SET replies_count = GREATEST(COALESCE(replies_count, 1) - ${deletedCount}, 0)
          WHERE id = ${row.post_id};
        `).catch(() => {})
      } else {
        await db.execute(sql`
          UPDATE posts
          SET comments_count = GREATEST(COALESCE(comments_count, 1) - ${deletedCount}, 0)
          WHERE id = ${row.post_id};
        `).catch(() => {})
        await db.execute(sql`
          UPDATE news
          SET comments_count = GREATEST(COALESCE(comments_count, 1) - ${deletedCount}, 0)
          WHERE id = ${row.post_id};
        `).catch(() => {})
      }
    }

    return {
      success: true,
      message: 'Commento eliminato con successo.',
      deletedCount
    }
  } catch (err: any) {
    console.error('❌ Errore eliminazione commento:', err?.message)
    if (err.statusCode) throw err
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Impossibile eliminare il commento.'
    })
  }
})