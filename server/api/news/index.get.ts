// server/api/news/index.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { sql, type SQL } from 'drizzle-orm'
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

function extractRows(result: any): any[] {
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.rows)) return result.rows
  return []
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

    let category = query.category ? String(query.category).trim().toLowerCase() : ''
    if (category === 'show hn' || category === 'show-hn') category = 'show'
    if (category === 'ask hn' || category === 'ask-hn') category = 'ask'

    const isExplicitJobRequest = category === 'job'

    const conditions: SQL[] = []

    if (isExplicitJobRequest) {
      conditions.push(sql`LOWER(COALESCE(type, '')) = 'job'`)
    } else {
      conditions.push(sql`
        LOWER(COALESCE(type, '')) != 'job'
        AND title NOT ILIKE 'job %'
        AND title NOT ILIKE 'job:%'
        AND title NOT ILIKE '%hiring%'
        AND COALESCE(domain, '') NOT ILIKE '%workremotely%'
      `)
    }

    if (search.length > 0) {
      const pattern = `%${search}%`
      conditions.push(sql`(title ILIKE ${pattern} OR COALESCE(domain, '') ILIKE ${pattern})`)
    }

    if (minScore > 0) {
      conditions.push(
        sql`LEAST(98, GREATEST(45, COALESCE(points, 10) * 2 + 40)) >= ${minScore}`
      )
    }

    if (category.length > 0 && !isExplicitJobRequest) {
      if (category === 'show') {
        conditions.push(sql`(LOWER(COALESCE(type, '')) = 'show' OR title ILIKE 'Show HN%')`)
      } else if (category === 'ask') {
        conditions.push(sql`(LOWER(COALESCE(type, '')) = 'ask' OR title ILIKE 'Ask HN%')`)
      } else {
        conditions.push(sql`LOWER(COALESCE(type, '')) = ${category}`)
      }
    }

    const whereClause = conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``

    // 1. Conteggio totale
    const countResult: any = await db.execute(sql`
      SELECT COUNT(*) AS total
      FROM pulse_stories
      ${whereClause}
    `)

    const totalRows = extractRows(countResult)
    const total = Number(totalRows[0]?.total || 0)
    const totalPages = Math.max(1, Math.ceil(total / limit))

    // 2. Estrazione record con SELECT * per compatibilità totale con lo schema DB
    const result: any = await db.execute(sql`
      SELECT *
      FROM pulse_stories
      ${whereClause}
      ORDER BY id DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const rows = extractRows(result)

    // 3. Formattazione allineata a news/index.vue e news/[slug].vue
    const formattedStories = rows.map((item: any) => {
      const titleLower = (item.title || '').toLowerCase()
      let detectedType = item.type ? String(item.type).toLowerCase() : 'news'

      if (titleLower.startsWith('show hn')) detectedType = 'show'
      else if (titleLower.startsWith('ask hn')) detectedType = 'ask'

      const computedScore = Number(
        item.techScore ?? item.tech_score ?? Math.min(98, Math.max(45, (Number(item.points) || 10) * 2 + 40))
      )
      const safeSlug = (item.slug && String(item.slug) !== String(item.id))
        ? String(item.slug)
        : slugifyTitleFallback(item.title, item.id)

      const summaryText =
        item.summary_it ||
        item.summaryIt ||
        item.summary ||
        `Analisi Trinity AI: Notizia proveniente da ${item.domain || 'devkernelpulse.org'}. Impatto architetturale rilevante.`

      return {
        ...item,
        id: Number(item.id),
        type: detectedType,
        slug: safeSlug,
        points: Number(item.points ?? 0),
        commentsCount: Number(item.commentsCount ?? item.comments_count ?? 0),
        xpAwarded: Number(item.xpAwarded ?? item.xp_awarded ?? 0),
        createdAt: item.createdAt ?? item.created_at ?? new Date().toISOString(),
        techScore: computedScore,
        tech_score: computedScore,
        summaryIt: summaryText,
        summary_it: summaryText,
        tags: Array.isArray(item.tags) && item.tags.length > 0
          ? item.tags
          : [
              detectedType === 'show' ? 'ShowHN' : detectedType === 'ask' ? 'AskHN' : 'Tech',
              item.domain ? String(item.domain).split('.')[0] : 'DevKernelPulse'
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