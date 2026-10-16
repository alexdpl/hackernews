// server/api/blog/comments.ts
import { defineEventHandler, getQuery, readBody, createError } from 'h3'
import { eq, desc, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users, xpTransactions } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile' })

  // ----------------------------------------------------
  // GET: RECUPERO COMMENTI DEL BLOG
  // ----------------------------------------------------
  if (method === 'GET') {
    const query = getQuery(event)
    const blogSlug = query.slug as string

    if (!blogSlug) {
      throw createError({ statusCode: 400, statusMessage: 'Slug del blog obbligatorio.' })
    }

    try {
      // Assicura l'esistenza della tabella blog_comments su Neon DB
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS blog_comments (
          id SERIAL PRIMARY KEY,
          blog_slug VARCHAR(255) NOT NULL,
          author VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          points INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `)

      const comments = await db.execute(sql`
        SELECT id, blog_slug AS "blogSlug", author, content, points, created_at AS "createdAt"
        FROM blog_comments
        WHERE blog_slug = ${blogSlug}
        ORDER BY created_at DESC
      `)

      const rows = Array.isArray(comments) ? comments : (comments?.rows || [])

      return {
        success: true,
        comments: rows
      }
    } catch (err: any) {
      throw createError({ statusCode: 500, statusMessage: err.message || 'Errore nel recupero commenti del blog' })
    }
  }

  // ----------------------------------------------------
  // POST: AGGIUNTA NUOVO COMMENTO + GAMIFICATION XP
  // ----------------------------------------------------
  if (method === 'POST') {
    const body = await readBody(event) || {}
    const { blogSlug, content, author, userId } = body

    if (!blogSlug || !content || content.trim() === '') {
      throw createError({ statusCode: 400, statusMessage: 'Slug e contenuto del commento obbligatori.' })
    }

    const cleanContent = content.trim()
    const cleanAuthor = author || 'community_dev'
    const targetUserId = userId ? Number(userId) : 1

    try {
      // Inserimento commento nel DB
      const result = await db.execute(sql`
        INSERT INTO blog_comments (blog_slug, author, content)
        VALUES (${blogSlug}, ${cleanAuthor}, ${cleanContent})
        RETURNING id, blog_slug AS "blogSlug", author, content, points, created_at AS "createdAt"
      `)

      const newComment = Array.isArray(result) ? result[0] : (result?.rows?.[0] || null)

      // GAMIFICATION v2.5-GOLD: +10 XP per il commento sul blog
      const rewardXp = 10
      await db.update(users)
        .set({ xp: sql`COALESCE(xp, 0) + ${rewardXp}` })
        .where(eq(users.id, targetUserId))

      await db.insert(xpTransactions).values({
        userId: targetUserId,
        action: `Comment on Blog: ${blogSlug}`,
        points: rewardXp
      }).catch(() => {})

      return {
        success: true,
        message: 'Commento pubblicato con successo! +10 XP ⚡',
        comment: newComment,
        xpAwarded: rewardXp
      }
    } catch (err: any) {
      throw createError({ statusCode: 500, statusMessage: err.message || 'Errore durante il salvataggio del commento' })
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Metodo non supportato.' })
})