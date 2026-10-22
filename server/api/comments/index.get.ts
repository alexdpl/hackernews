// server/api/comments/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const postId = query.postId ? Number(query.postId) : null

  if (!postId || isNaN(postId) || postId <= 0) {
    return {
      success: true,
      comments: []
    }
  }

  try {
    const db = await getDb()
    if (!db) {
      return { success: true, comments: [] }
    }

    // 1. Assicura l'esistenza della tabella unificata 'comments'
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INT NOT NULL,
        author VARCHAR(255) NOT NULL DEFAULT 'community',
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `).catch(() => {})

    // 2. Fetch dei commenti per l'ID articolo/post
    const res: any = await db.execute(sql`
      SELECT id, post_id AS "postId", author, text, created_at AS "createdAt"
      FROM comments
      WHERE post_id = ${postId}
      ORDER BY created_at ASC;
    `)

    const rows = Array.isArray(res) ? res : (res?.rows || [])

    const comments = rows.map((c: any) => ({
      id: c.id,
      postId: c.postId,
      author: typeof c.author === 'object' ? c.author?.username : (c.author || 'community'),
      text: c.text || '',
      createdAt: c.createdAt || c.created_at || new Date()
    }))

    return {
      success: true,
      comments
    }
  } catch (err: any) {
    console.warn('⚠️ [COMMENTS GET WARN]:', err?.message)
    return {
      success: true,
      comments: []
    }
  }
})