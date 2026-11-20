// server/api/news/comments.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { getDb } from '~~/server/utils/db'
import { sql } from 'drizzle-orm'
import {
  parseSessionUser,
  evaluateCommentWithSentinel,
  syncUnifiedCommentRow
} from '~~/server/utils/dkpComments'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const slugParam = body?.slug ? String(body.slug).trim() : ''
    const content = body?.content ? String(body.content).trim() : ''

    if (!slugParam || !content) {
      throw createError({ statusCode: 400, statusMessage: 'Parametri mancanti per l invio del commento.' })
    }

    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' })
    }

    const sessionUser = parseSessionUser(event)
    const authorName = String(body?.author || sessionUser?.username || 'dev_kernel').trim()
    const authorUsername = String(sessionUser?.username || body?.authorUsername || 'dev_kernel').trim()

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

    const sentinel = await evaluateCommentWithSentinel({
      content,
      section: 'HN',
      author: authorUsername,
      targetSlug: slugParam
    })

    const result: any = await db.execute(sql`
      INSERT INTO news_comments (story_slug, author, author_username, content, created_at)
      VALUES (${slugParam}, ${authorName}, ${authorUsername}, ${content}, NOW())
      RETURNING id, story_slug AS "storySlug", author, author_username AS "authorUsername", content, created_at AS "createdAt"
    `)

    const newComment = (result.rows || result)[0]

    // Risolve eventuale post_id numerico se slugParam è un ID o presente in posts
    const numericId = /^\d+$/.test(slugParam) ? Number(slugParam) : 0
    await syncUnifiedCommentRow(db, {
      postId: numericId,
      targetSlug: slugParam,
      userId: sessionUser?.id || null,
      targetType: 'hn',
      author: authorUsername,
      content,
      sentinel
    }).catch(() => null)

    return {
      success: true,
      id: newComment?.id,
      data: {
        ...newComment,
        sentinel
      },
      sentinel
    }
  } catch (err: any) {
    console.error('[API Comments Post Error]:', err)
    if (err.statusCode) throw err

    throw createError({
      statusCode: 500,
      statusMessage: `Errore salvataggio commento: ${err.message}`
    })
  }
})