// server/api/news/comments.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { getDb } from '~~/server/utils/db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const slugParam = body?.slug ? String(body.slug).trim() : ''
    const content = body?.content ? String(body.content).trim() : ''

    if (!slugParam || !content) {
      throw createError({ statusCode: 400, statusMessage: 'Parametri mancanti per il invio del commento.' })
    }

    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' })
    }

    // Tabella di sicurezza
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS news_comments (
        id SERIAL PRIMARY KEY,
        story_slug VARCHAR(255) NOT NULL,
        author VARCHAR(100) DEFAULT 'Developer',
        author_username VARCHAR(100) DEFAULT 'dev_kernel',
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Inserisce il commento collegandolo allo slug della notizia
    const result: any = await db.execute(sql`
      INSERT INTO news_comments (story_slug, author, author_username, content, created_at)
      VALUES (${slugParam}, 'Developer', 'dev_kernel', ${content}, NOW())
      RETURNING id, story_slug AS "storySlug", author, author_username AS "authorUsername", content, created_at AS "createdAt"
    `)

    const newComment = (result.rows || result)[0]

    return {
      success: true,
      id: newComment?.id,
      data: newComment
    }
  } catch (err: any) {
    console.error('❌ [API Comments Post Error]:', err)
    if (err.statusCode) throw err

    throw createError({
      statusCode: 500,
      statusMessage: `Errore salvataggio commento: ${err.message}`
    })
  }
})