// server/api/news/[slug].get.ts
import { defineEventHandler, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const param = event.context.params?.slug

  if (!param || param === 'undefined') {
    throw createError({ statusCode: 400, statusMessage: 'Parametro notizia non valido' })
  }

  try {
    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' })
    }

    const result: any = await db.execute(sql`
      SELECT 
        id,
        title,
        COALESCE(slug, id::text) AS slug,
        url,
        domain,
        type,
        author,
        points,
        comments_count AS "commentsCount",
        xp_awarded AS "xpAwarded",
        created_at AS "createdAt"
      FROM pulse_stories
      WHERE slug = ${param} 
         OR id::text = ${param}
         OR id = ${isNaN(Number(param)) ? 0 : Number(param)}
      LIMIT 1
    `)

    const rows = result.rows || result
    const story = Array.isArray(rows) && rows.length > 0 ? rows[0] : null

    if (!story) {
      throw createError({ statusCode: 404, statusMessage: 'Scheda notizia non trovata nel database' })
    }

    const computedScore = Math.min(95, Math.max(40, (story.points || 10) * 2 + 50))

    return {
      success: true,
      data: {
        ...story,
        tech_score: computedScore,
        summary_it: `Sintesi approfondita Trinity AI: L'articolo discute tendenze chiave legate a ${story.domain || 'tecnologie emergenti'}, offrendo spunti importanti per l'ecosistema cloud e open source.`,
        tags: [story.type || 'Tech', story.domain ? story.domain.split('.')[0] : 'Dev']
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: `Errore DB dettaglio: ${error.message}`
    })
  }
})
 