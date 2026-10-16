// server/api/hn/submit.post.ts
import { and, eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { posts, users, xpTransactions } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'POST') {
    const body = await readBody(event)
    const { title, url, userId, username } = body

    if (!title || title.trim() === '') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Il titolo è obbligatorio.'
      })
    }

    const cleanTitle = title.trim()
    const cleanUrl = url && url.trim() !== '' ? url.trim() : null
    const targetUserId = userId ? Number(userId) : 1
    const authorName = username || 'utente_neon'

    // Correzione v2.5-GOLD: getDb() è asincrono
    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
    }

    // --- FILTRO ANTI-DUPLICATI PER I POST ---
    if (cleanUrl) {
      const existingPostByUrl = await db
        .select()
        .from(posts)
        .where(eq(posts.url, cleanUrl))
        .limit(1)

      if (existingPostByUrl.length > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Questo link è già stato pubblicato su Hacker News.'
        })
      }
    } else {
      const existingPostByTitle = await db
        .select()
        .from(posts)
        .where(eq(posts.title, cleanTitle))
        .limit(1)

      if (existingPostByTitle.length > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Un post con questo identico titolo esiste già.'
        })
      }
    }
    // ----------------------------------------

    // Inserimento record nel DB Neon
    const newPost = await db.insert(posts).values({
      title: cleanTitle,
      url: cleanUrl,
      author: authorName,
      createdAt: new Date()
    }).returning()

    // GAMIFICATION v2.5-GOLD: +30 XP per la pubblicazione della notizia
    const rewardXp = 30
    await db.update(users)
      .set({ xp: sql`COALESCE(xp, 0) + ${rewardXp}` })
      .where(eq(users.id, targetUserId))

    await db.insert(xpTransactions).values({
      userId: targetUserId,
      action: `Publish HN Post: ${cleanTitle.substring(0, 25)}`,
      points: rewardXp
    }).catch(() => {})

    return {
      success: true,
      post: newPost[0],
      message: 'Post pubblicato con successo! +30 XP ⚡'
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Metodo non supportato.' })
})