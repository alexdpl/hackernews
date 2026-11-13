// server/api/nodes/comments/index.post.ts
import { defineEventHandler, readBody, getCookie, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { awardNodeXpAndBadges, GamificationRules } from '~~/server/utils/gamification'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database non disponibile.' })
  }

  const body = (await readBody(event)) || {}
  
  // Risoluzione ID utente (supporta body, context o cookie di sessione dkp_session)
  let authorId = body.userId ? Number(body.userId) : (event.context.user?.id || 1)
  const sessionCookie = getCookie(event, 'dkp_session')
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie))
      if (parsed.id) authorId = Number(parsed.id)
    } catch (_) {}
  }

  const postId = Number(body.postId)
  const parentId = body.parentId ? Number(body.parentId) : null
  const content = body.content?.trim()

  if (!postId || isNaN(postId) || !content) {
    throw createError({ statusCode: 400, statusMessage: 'Post ID e contenuto sono obbligatori.' })
  }

  try {
    // 1. Inserimento del Commento
    const insertResult: any = await db.execute(sql`
      INSERT INTO node_comments (post_id, author_id, parent_id, content, karma_score)
      VALUES (${postId}, ${authorId}, ${parentId}, ${content}, 1)
      RETURNING id, created_at
    `)

    const rows = Array.isArray(insertResult) ? insertResult : (insertResult?.rows || [])
    const newComment = rows[0]

    if (!newComment) {
      throw new Error('Impossibile recuperare il commento appena inserito.')
    }

    // 2. Incremento del contatore sul Thread principale
    await db.execute(sql`
      UPDATE node_posts 
      SET comments_count = COALESCE(comments_count, 0) + 1 
      WHERE id = ${postId}
    `)

    // 3. Erogazione XP per la risposta
    try {
      await awardNodeXpAndBadges(authorId, `Risposta al Thread #${postId}`, GamificationRules.NEW_COMMENT)
    } catch (xpErr) {
      console.warn('⚠️ Errore XP commento:', xpErr)
    }

    return {
      success: true,
      message: 'Risposta pubblicata con successo.',
      data: {
        id: newComment.id,
        createdAt: newComment.created_at
      }
    }
  } catch (error: any) {
    console.error('💥 [NODE COMMENT POST ERROR]:', error?.message)
    throw createError({ statusCode: 500, statusMessage: error.message || 'Errore durante la pubblicazione del commento.' })
  }
})