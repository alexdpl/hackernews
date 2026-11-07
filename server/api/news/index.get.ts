// server/api/news/index.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' })
    }

    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 12))
    const offset = (page - 1) * limit
    const search = query.q ? String(query.q).trim() : ''
    const minScore = Number(query.minScore) || 0
    const category = query.category ? String(query.category).trim() : ''

    // Costruiamo le condizioni dinamiche in SQL puro per massima performance
    // Nota: usiamo condizioni sicure con i template literal di drizzle-orm (`sql``)
    
    // Query per contare il totale dei record filtrati
    const countResult: any = await db.execute(sql`
      SELECT COUNT(*) as total 
      FROM pulse_stories 
      WHERE (${search} = '' OR title ILIKE ${'%' + search + '%'} OR domain ILIKE ${'%' + search + '%'})
        AND (${minScore} = 0 OR points >= ${minScore})
        AND (${category} = '' OR type = ${category.toLowerCase()})
    `)
    
    const totalRows = countResult.rows || countResult
    const total = Number(totalRows[0]?.total || 0)
    const totalPages = Math.ceil(total / limit) || 1

    // Query per recuperare le storie della pagina corrente
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
      WHERE (${search} = '' OR title ILIKE ${'%' + search + '%'} OR domain ILIKE ${'%' + search + '%'})
        AND (${minScore} = 0 OR points >= ${minScore})
        AND (${category} = '' OR type = ${category.toLowerCase()})
      ORDER BY id DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const rows = result.rows || result

    // Arricchiamo i dati con campi UI di cortesia (Sentinel Score simulato o basato sui punti, summary AI, tag)
    const formattedStories = rows.map((item: any) => {
      const computedScore = Math.min(95, Math.max(40, (item.points || 10) * 2 + 50))
      return {
        ...item,
        tech_score: computedScore,
        summary_it: `Analisi Trinity AI: Notizia proveniente da ${item.domain || 'devkernelpulse.org'}. Impatto architetturale rilevante per sviluppatori e ingegneri di sistemi distribuiti.`,
        tags: [item.type || 'Tech', item.domain ? item.domain.split('.')[0] : 'HackerNews']
      }
    })

    return {
      success: true,
      data: formattedStories,
      meta: {
        total,
        page,
        limit,
        totalPages
      }
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Errore recupero feed news: ${err.message}`
    })
  }
})