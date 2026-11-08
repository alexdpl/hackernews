// server/api/news/index.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function slugifyTitleFallback(title: string, id: number | string): string {
  const cleanTitle = (title || 'story')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 70)

  return `${cleanTitle}-${id}`
}

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
    
    // Forza la categoria in minuscolo e gestisci casi in cui la UI invia 'show hn'
    let category = query.category ? String(query.category).trim().toLowerCase() : ''
    if (category === 'show hn' || category === 'show-hn') category = 'show';
    if (category === 'ask hn' || category === 'ask-hn') category = 'ask';

    const isExplicitJobRequest = category === 'job'

    // 🟢 ESCLUSIONE LAVORI BLINDATA:
    // Se NON stiamo chiedendo esplicitamente i job, escludiamo tutto ciò che assomiglia a un job.
    // Usiamo COALESCE per evitare che i NULL passino i controlli.
    const jobExclusionClause = isExplicitJobRequest
      ? sql`LOWER(COALESCE(type, '')) = 'job'`
      : sql`LOWER(COALESCE(type, '')) != 'job' 
            AND title NOT ILIKE 'job %' 
            AND title NOT ILIKE 'job:%'
            AND title NOT ILIKE '%hiring%'
            AND COALESCE(domain, '') NOT ILIKE '%workremotely%'`

    // 1. Conteggio totale
    const countResult: any = await db.execute(sql`
      SELECT COUNT(*) as total 
      FROM pulse_stories 
      WHERE (${search} = '' OR title ILIKE ${'%' + search + '%'} OR domain ILIKE ${'%' + search + '%'})
        AND (${minScore} = 0 OR points >= ${minScore})
        AND (${category === '' || isExplicitJobRequest} OR LOWER(COALESCE(type, '')) = ${category})
        AND (${jobExclusionClause})
    `)
    
    const totalRows = countResult.rows || countResult
    const total = Number(totalRows[0]?.total || 0)
    const totalPages = Math.ceil(total / limit) || 1

    // 2. Estrazione record
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
        AND (${category === '' || isExplicitJobRequest} OR LOWER(COALESCE(type, '')) = ${category})
        AND (${jobExclusionClause})
      ORDER BY id DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const rows = result.rows || result

    // 3. Formattazione
    const formattedStories = rows.map((item: any) => {
      const titleLower = (item.title || '').toLowerCase()
      let detectedType = item.type ? item.type.toLowerCase() : 'news'

      // Ultima linea di difesa per categorizzare correttamente
      if (titleLower.startsWith('show hn')) detectedType = 'show'
      else if (titleLower.startsWith('ask hn')) detectedType = 'ask'

      const computedScore = Math.min(98, Math.max(45, (item.points || 10) * 2 + 40))
      const safeSlug = (item.slug && item.slug !== String(item.id)) 
        ? item.slug 
        : slugifyTitleFallback(item.title, item.id)

      return {
        ...item,
        type: detectedType,
        slug: safeSlug,
        tech_score: computedScore,
        summary_it: `Analisi Trinity AI: Notizia proveniente da ${item.domain || 'devkernelpulse.org'}. Impatto architetturale rilevante.`,
        tags: [
          detectedType === 'show' ? 'ShowHN' : detectedType === 'ask' ? 'AskHN' : 'Tech',
          item.domain ? item.domain.split('.')[0] : 'DevKernelPulse'
        ]
      }
    })

    return {
      success: true,
      data: formattedStories,
      meta: { total, page, limit, totalPages }
    }
  } catch (err: any) {
    console.error('❌ [API News Index Error]:', err)
    throw createError({
      statusCode: 500,
      statusMessage: `Errore recupero feed news: ${err.message}`
    })
  }
})