import { defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { resolveNewsTable, normalizeNewsRow } from '~~/server/utils/dkpNewsRepo'
import { roundRobinInterleave, fetchItalianTechJobs, insertCrawledCandidatesSafe } from '~~/server/utils/dkpCrawlerService'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate')
  const query = getQuery(event)
  const feedType = String(query.type || 'top').toLowerCase().trim()
  const page = Math.max(1, Number(query.page || 1))
  const limit = Math.min(50, Math.max(1, Number(query.limit || 25)))
  const offset = (page - 1) * limit

  const db = await getDb()
  if (!db) return { success: true, data: [], items: [] }

  const meta = await resolveNewsTable()
  const tbl = meta?.tableName || 'news'
  const cols = meta?.columns || new Set<string>()
  const orderCol = cols.has('created_at') ? 'created_at' : (cols.has('time') ? 'time' : 'id')
  const typeExpr = cols.has('type') ? `LOWER(COALESCE(feed_channel, type, ''))` : `LOWER(COALESCE(feed_channel, ''))`

  try {
    // 1. /newest -> 100% COMMUNITY (Blog Posts + Forum Nodes + User Links)
    if (feedType === 'newest' || feedType === 'new') {
      const [blogRes, nodesRes, userLinksRes] = await Promise.all([
        db.execute(sql`
          SELECT
            bp.id::text AS id,
            bp.title,
            '/blog/' || bp.slug AS url,
            'devkernelpulse.org' AS domain,
            COALESCE(u.username, 'alexdpl') AS author,
            15 AS points,
            'COMMUNITY_BLOG' AS "sourceProvider",
            bp.created_at AS "createdAt"
          FROM blog_posts bp
          LEFT JOIN users u ON u.id = bp.author_id
          ORDER BY bp.created_at DESC
          LIMIT ${limit};
        `).catch(() => []),
        db.execute(sql`
          SELECT
            np.id::text AS id,
            np.title,
            '/nodes/post/' || np.id AS url,
            'devkernelpulse.org' AS domain,
            COALESCE(u.username, 'dkp_builder') AS author,
            COALESCE(np.karma_score, 5) AS points,
            'COMMUNITY_NODES' AS "sourceProvider",
            np.created_at AS "createdAt"
          FROM node_posts np
          LEFT JOIN users u ON u.id = np.author_id
          ORDER BY np.created_at DESC
          LIMIT ${limit};
        `).catch(() => []),
        db.execute(
          sql.raw(`SELECT * FROM "${tbl}" WHERE COALESCE(source_provider, '') = 'COMMUNITY_LINK' ORDER BY "${orderCol}" DESC LIMIT ${limit};`)
        ).catch(() => [])
      ])

      const merged = [
        ...extractRows(userLinksRes).map((r) => normalizeNewsRow(r, 'newest')),
        ...extractRows(blogRes).map((r) => normalizeNewsRow(r, 'newest')),
        ...extractRows(nodesRes).map((r) => normalizeNewsRow(r, 'newest'))
      ]
        .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(offset, offset + limit)

      return { success: true, data: merged, items: merged }
    }

    let rawRows: any[] = []

    if (feedType === 'ask') {
      const res = await db.execute(
        sql.raw(`
          SELECT * FROM "${tbl}"
          WHERE (
            ${typeExpr} IN ('ask', 'ask_hn', 'ask_dkp', 'askhn')
            OR title ILIKE 'Ask HN:%'
            OR title ILIKE 'Ask DKP:%'
            OR title ILIKE 'Tell HN:%'
          )
          AND title NOT ILIKE 'Show %'
          ORDER BY "${orderCol}" DESC
          LIMIT 80;
        `)
      )
      rawRows = extractRows(res)
      const hnBucket = rawRows.filter((r) => String(r.source_provider || 'HN').toUpperCase() !== 'REDDIT')
      const redditBucket = rawRows.filter((r) => String(r.source_provider || '').toUpperCase() === 'REDDIT')
      rawRows = roundRobinInterleave([hnBucket, redditBucket])
    } else if (feedType === 'show') {
      const res = await db.execute(
        sql.raw(`
          SELECT * FROM "${tbl}"
          WHERE (
            ${typeExpr} IN ('show', 'show_hn', 'show_dkp', 'showhn')
            OR title ILIKE 'Show %'
            OR COALESCE(source_provider, '') IN ('GITHUB', 'GITLAB')
          )
          AND title NOT ILIKE 'Ask %'
          ORDER BY "${orderCol}" DESC
          LIMIT 80;
        `)
      )
      rawRows = extractRows(res)
      const glBucket = rawRows.filter((r) => String(r.source_provider || '').toUpperCase() === 'GITLAB')
      const ghBucket = rawRows.filter((r) => String(r.source_provider || '').toUpperCase() !== 'GITLAB')
      rawRows = roundRobinInterleave([glBucket, ghBucket])
    } else if (feedType === 'jobs' || feedType === 'job') {
      const res = await db.execute(
        sql.raw(`
          SELECT * FROM "${tbl}"
          WHERE ${typeExpr} IN ('job', 'jobs')
             OR COALESCE(source_provider, '') IN ('DATAPIZZA_IT', 'TECHCOMPENSO_IT')
          ORDER BY "${orderCol}" DESC
          LIMIT 80;
        `)
      )
      rawRows = extractRows(res)

      // Se il DB ha meno di 4 offerte Italia, sincronizza subito Datapizza IT + TechCompenso IT!
      if (rawRows.length < 4) {
        const itJobs = await fetchItalianTechJobs()
        const interleavedJobs = roundRobinInterleave([itJobs.datapizza, itJobs.techcompenso])
        await insertCrawledCandidatesSafe(interleavedJobs)

        const refreshed = await db.execute(
          sql.raw(`
            SELECT * FROM "${tbl}"
            WHERE ${typeExpr} IN ('job', 'jobs')
               OR COALESCE(source_provider, '') IN ('DATAPIZZA_IT', 'TECHCOMPENSO_IT')
            ORDER BY "${orderCol}" DESC
            LIMIT 80;
          `)
        )
        rawRows = extractRows(refreshed)

        if (rawRows.length === 0) {
          const directMapped = interleavedJobs.map((j, i) => ({
            id: `it-job-${i + 1}`,
            title: j.title,
            url: j.url,
            domain: j.domain,
            points: j.points,
            score: j.points,
            author: j.author,
            by: j.author,
            type: 'jobs',
            sourceProvider: j.sourceProvider,
            sentinelVerified: true,
            commentsCount: 0,
            createdAt: new Date().toISOString()
          }))
          return { success: true, data: directMapped, items: directMapped }
        }
      }

      const dpBucket = rawRows.filter((r) => String(r.source_provider || '').toUpperCase() === 'DATAPIZZA_IT')
      const tcBucket = rawRows.filter((r) => String(r.source_provider || '').toUpperCase() === 'TECHCOMPENSO_IT')
      const otherBucket = rawRows.filter((r) => !['DATAPIZZA_IT', 'TECHCOMPENSO_IT'].includes(String(r.source_provider || '').toUpperCase()))
      rawRows = roundRobinInterleave([dpBucket, tcBucket, otherBucket])
    } else {
      const res = await db.execute(
        sql.raw(`
          SELECT * FROM "${tbl}"
          WHERE ${typeExpr} IN ('', 'feed', 'top', 'story', 'news')
            AND title NOT ILIKE 'Ask HN:%'
            AND title NOT ILIKE 'Show HN:%'
          ORDER BY "${orderCol}" DESC
          LIMIT 80;
        `)
      )
      rawRows = extractRows(res)
      const hnBucket = rawRows.filter((r) => String(r.source_provider || 'HN').toUpperCase() !== 'REDDIT')
      const redditBucket = rawRows.filter((r) => String(r.source_provider || '').toUpperCase() === 'REDDIT')
      rawRows = roundRobinInterleave([hnBucket, redditBucket])
    }

    const mapped = rawRows.slice(offset, offset + limit).map((r) => normalizeNewsRow(r, feedType))
    return { success: true, data: mapped, items: mapped }
  } catch (err) {
    console.error('[API /api/news] Errore:', err)
    return { success: true, data: [], items: [] }
  }
})