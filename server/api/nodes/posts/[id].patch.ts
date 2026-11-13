// server/api/nodes/posts/[id].patch.ts
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const postId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { title, content } = body

  if (!postId) {
    throw createError({ statusCode: 400, message: 'ID post mancante' })
  }

  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, message: 'Database offline' })

  try {
    const updated: any = await db.execute(sql`
      UPDATE node_posts 
      SET 
        title = COALESCE(${title || null}, title),
        content = COALESCE(${content || null}, content),
        updated_at = NOW()
      WHERE id = ${Number(postId)}
      RETURNING *
    `)

    const row = updated?.rows?.[0] || updated?.[0]
    if (!row) {
      throw createError({ statusCode: 404, message: 'Post non trovato o non modificabile' })
    }

    return {
      success: true,
      message: 'Post aggiornato con successo!',
      post: row
    }
  } catch (err: any) {
    console.error('❌ [PATCH POST ERROR]:', err)
    throw createError({ statusCode: 500, message: err.message || 'Errore durante l\'aggiornamento del post' })
  }
})