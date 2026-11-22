// server/api/pulse/stories/[id].delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { extractDkpUserFromEvent } from '~~/server/utils/session'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const storyId = Number(idParam)

  if (!storyId || Number.isNaN(storyId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID segnale HN non valido.' })
  }

  const sessionUser = extractDkpUserFromEvent(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, statusMessage: 'Autenticazione richiesta.' })
  }

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
  }

  const existingRes = await db.execute(sql`
    SELECT id, author, author_id AS "authorId"
    FROM pulse_stories
    WHERE id = ${storyId}
    LIMIT 1;
  `)
  const story = extractRows(existingRes)[0]
  if (!story) {
    throw createError({ statusCode: 404, statusMessage: 'Segnale HN non trovato.' })
  }

  const isAdmin = String(sessionUser.role || '').toUpperCase() === 'ADMIN' || String(sessionUser.username || '').toLowerCase() === 'alexdpl'
  const isOwner =
    (story.authorId && Number(story.authorId) === Number(sessionUser.id)) ||
    String(story.author || '').toLowerCase() === String(sessionUser.username || '').toLowerCase()

  if (!isAdmin && !isOwner) {
    throw createError({ statusCode: 403, statusMessage: 'Non hai i permessi per eliminare questo segnale.' })
  }

  await db.execute(sql`
    DELETE FROM comments
    WHERE target_type = 'hn' AND target_slug = ${String(storyId)};
  `).catch(() => null)

  await db.execute(sql`
    DELETE FROM pulse_stories
    WHERE id = ${storyId};
  `)

  return {
    success: true,
    message: 'Segnale HN eliminato con successo dal database Pure SQL.'
  }
})