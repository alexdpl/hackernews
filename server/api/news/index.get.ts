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

function extractDomain(rawUrl: string | null | undefined): string {
  if (!rawUrl) return 'news.ycombinator.com'
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '')
  } catch {
    return 'news.ycombinator.com'
  }
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
      conditions.push(sql`(title ILIKE ${pattern} OR COALESCE(domain, '') ILIKE ${pattern} OR COALESCE(summary_it, '') ILIKE ${pattern})`)
    }

    if (minScore > 0) {
      conditions.push(sql`tech_score >= ${minScore}`)
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

    // CTE unificata tra hn_stories (nuovo crawler/cron) e pulse_stories (archivio)
    const unifiedCte = sql`
      WITH unified_stories AS (
        SELECT DISTINCT ON (LOWER(TRIM(title)))
          id,
          hn_id,
          title,
          slug,
          url,
          domain,
          points,
          author,
          type,
          summary_it,
          tech_score,
          tags,
          created_at
        FROM (
          SELECT
            COALESCE(h.hn_id, h.id) AS id,
            h.hn_id AS hn_id,
            h.title AS title,
            COALESCE(NULLIF(h.slug, ''), CONCAT('story-', COALESCE(h.hn_id, h.id))) AS slug,
            h.original_url AS url,
            COALESCE(NULLIF(to_jsonb(h)->>'domain', ''), substring(COALESCE(h.original_url, '') from 'https?://(?:www\.)?([^/]+)')) AS domain,
            COALESCE(h.hn_points, 1) AS points,
            COALESCE(NULLIF(h.hn_by, ''), 'hackernews') AS author,
            CASE
              WHEN h.title ILIKE 'Show HN%' OR LOWER(COALESCE(h.category, '')) LIKE '%show%' THEN 'show'
              WHEN h.title ILIKE 'Ask HN%' OR LOWER(COALESCE(h.category, '')) LIKE '%ask%' THEN 'ask'
              ELSE 'news'
            END AS type,
            COALESCE(
              NULLIF(to_jsonb(h)->>'ai_summary_it', ''),
              NULLIF(to_jsonb(h)->>'summary_it', ''),
              NULLIF(to_jsonb(h)->>'summary', ''),
              ''
            ) AS summary_it,
            COALESCE(
              NULLIF(to_jsonb(h)->>'tech_score', '')::int,
              NULLIF(to_jsonb(h)->>'ai_score', '')::int,
              LEAST(98, GREATEST(55, COALESCE(h.hn_points, 10) * 2 + 45))
            ) AS tech_score,
            to_jsonb(h)->'tags' AS tags,
            COALESCE((to_jsonb(h)->>'created_at')::timestamptz, NOW()) AS created_at,
            1 AS priority
          FROM hn_stories h

          UNION ALL

          SELECT
            p.id AS id,
            p.id AS hn_id,
            p.title AS title,
            COALESCE(NULLIF(p.slug, ''), CONCAT('story-', p.id)) AS slug,
            p.url AS url,
            COALESCE(NULLIF(to_jsonb(p)->>'domain', ''), substring(COALESCE(p.url, '') from 'https?://(?:www\.)?([^/]+)')) AS domain,
            COALESCE(p.points, 1) AS points,
            COALESCE(NULLIF(to_jsonb(p)->>'author', ''), 'hackernews') AS author,
            COALESCE(NULLIF(LOWER(to_jsonb(p)->>'type'), ''), 'news') AS type,
            COALESCE(
              NULLIF(to_jsonb(p)->>'summary_it', ''),
              NULLIF(to_jsonb(p)->>'summary', ''),
              ''
            ) AS summary_it,
            COALESCE(
              NULLIF(to_jsonb(p)->>'tech_score', '')::int,
              LEAST(98, GREATEST(45, COALESCE(p.points, 10) * 2 + 40))
            ) AS tech_score,
            to_jsonb(p)->'tags' AS tags,
            COALESCE((to_jsonb(p)->>'created_at')::timestamptz, NOW() - INTERVAL '1 day') AS created_at,
            2 AS priority
          FROM pulse_stories p
        ) combined
        ORDER BY LOWER(TRIM(title)), priority ASC, created_at DESC
      )
    `

    const countResult: any = await db.execute(sql`
      ${unifiedCte}
      SELECT COUNT(*) AS total
      FROM unified_stories
      ${whereClause}
    `)

    const totalRows = extractRows(countResult)
    const total = Number(totalRows[0]?.total || 0)
    const totalPages = Math.max(1, Math.ceil(total / limit))

    const result: any = await db.execute(sql`
      ${unifiedCte}
      SELECT *
      FROM unified_stories
      ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const rows = extractRows(result)

    const formattedStories = rows.map((item: any) => {
      const titleLower = (item.title || '').toLowerCase()
      let detectedType = item.type ? String(item.type).toLowerCase() : 'news'

      if (titleLower.startsWith('show hn')) detectedType = 'show'
      else if (titleLower.startsWith('ask hn')) detectedType = 'ask'

      const computedScore = Number(
        item.tech_score ?? Math.min(98, Math.max(45, (Number(item.points) || 10) * 2 + 40))
      )
      const safeSlug = (item.slug && String(item.slug) !== String(item.id))
        ? String(item.slug)
        : slugifyTitleFallback(item.title, item.id)

      const domainClean = item.domain || extractDomain(item.url)
      const summaryText =
        item.summary_it ||
        `Analisi Trinity AI: Segnale tecnico indicizzato da ${domainClean}. Rilevanza architetturale verificata dal Sentinel Kernel.`

      const parsedTags = Array.isArray(item.tags) && item.tags.length > 0
        ? item.tags
        : [
            detectedType === 'show' ? 'ShowHN' : detectedType === 'ask' ? 'AskHN' : 'Tech',
            domainClean.split('.')[0] || 'HackerNews',
            'TrinityAI'
          ]

      return {
        ...item,
        id: Number(item.id),
        hnId: Number(item.hn_id || item.id),
        type: detectedType,
        slug: safeSlug,
        domain: domainClean,
        points: Number(item.points ?? 1),
        createdAt: item.created_at ?? new Date().toISOString(),
        techScore: computedScore,
        tech_score: computedScore,
        summaryIt: summaryText,
        summary_it: summaryText,
        tags: parsedTags
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