// server/api/admin/nodes/index.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const db = await getDb()

  // 1. GET: Elenco completo dei Nodi con il conteggio dei thread e iscritti
  if (method === 'GET') {
    try {
      const result: any = await db.execute(sql`
        SELECT 
          n.id,
          n.name,
          n.slug,
          n.description,
          n.icon,
          n.color,
          n.subscribers_count AS "subscribersCount",
          n.is_private AS "isPrivate",
          n.created_at AS "createdAt",
          COUNT(p.id)::int AS "postsCount"
        FROM nodes n
        LEFT JOIN node_posts p ON n.id = p.node_id
        GROUP BY n.id
        ORDER BY n.subscribers_count DESC, n.id ASC;
      `)
      const rows = Array.isArray(result) ? result : (result?.rows || [])
      return { success: true, data: rows }
    } catch (err: any) {
      throw createError({ statusCode: 500, statusMessage: err.message })
    }
  }

  // 2. POST: Creazione nuovo Nodo (Subreddit)
  if (method === 'POST') {
    const body = await readBody(event)
    const creatorId = event.context.user?.id || 1
    const { name, slug, description, icon, color, isPrivate } = body

    if (!name || !slug || !description) {
      throw createError({ statusCode: 400, statusMessage: 'Nome, slug e descrizione sono obbligatori.' })
    }

    try {
      const result: any = await db.execute(sql`
        INSERT INTO nodes (name, slug, description, icon, color, creator_id, is_private, subscribers_count)
        VALUES (${name}, ${slug}, ${description}, ${icon || 'i-heroicons-hashtag'}, ${color || '#38bdf8'}, ${creatorId}, ${Boolean(isPrivate)}, 1)
        RETURNING id, name, slug
      `)
      const newNode = result?.rows?.[0] || result?.[0]
      return { success: true, message: 'Nodo creato con successo', data: newNode }
    } catch (err: any) {
      throw createError({ statusCode: 500, statusMessage: err.message })
    }
  }
})