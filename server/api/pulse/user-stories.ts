// server/api/pulse/user-stories.ts
import { defineEventHandler, getQuery, setResponseHeaders } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { extractDkpUserFromEvent } from '~~/server/utils/session'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'X-Cloud-Region': 'europe-west4',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  })

  const startedAt = Date.now()
  const query = getQuery(event)
  const sessionUser = extractDkpUserFromEvent(event)

  const userId = sessionUser?.id ? Number(sessionUser.id) : (query.userId ? Number(query.userId) : 0)
  const username = String(sessionUser?.username || query.username || '').trim().replace(/^@+/, '')

  try {
    const db = await getDb()
    if (!db) {
      return {
        success: false,
        message: 'Database Neon non disponibile.',
        data: [],
        telemetry: null
      }
    }

    // 1. Recupero storie HN dell'utente da pulse_stories (Pure SQL)
    let userPosts: any[] = []
    if (userId > 0 && username) {
      const res = await db.execute(sql`
        SELECT
          id,
          title,
          url,
          domain,
          type,
          content,
          author,
          author_id AS "authorId",
          COALESCE(points, 1)::int AS points,
          COALESCE(comments_count, 0)::int AS "commentsCount",
          COALESCE(xp_awarded, 15)::int AS "xpAwarded",
          vault_hash AS "vaultHash",
          created_at AS "createdAt"
        FROM pulse_stories
        WHERE author_id = ${userId} OR LOWER(COALESCE(author, '')) = LOWER(${username})
        ORDER BY created_at DESC
        LIMIT 100;
      `)
      userPosts = extractRows(res)
    } else if (userId > 0) {
      const res = await db.execute(sql`
        SELECT
          id,
          title,
          url,
          domain,
          type,
          content,
          author,
          author_id AS "authorId",
          COALESCE(points, 1)::int AS points,
          COALESCE(comments_count, 0)::int AS "commentsCount",
          COALESCE(xp_awarded, 15)::int AS "xpAwarded",
          vault_hash AS "vaultHash",
          created_at AS "createdAt"
        FROM pulse_stories
        WHERE author_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 100;
      `)
      userPosts = extractRows(res)
    }

    // 2. Telemetrie live dell'ecosistema HN globale
    const globalCountsRes = await db.execute(sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE LOWER(type) = 'news')::int AS news_count,
        COUNT(*) FILTER (WHERE LOWER(type) = 'ask')::int AS ask_count,
        COUNT(*) FILTER (WHERE LOWER(type) = 'show')::int AS show_count,
        COUNT(*) FILTER (WHERE LOWER(type) IN ('job', 'jobs'))::int AS jobs_count
      FROM pulse_stories;
    `).catch(() => null)

    const gRow = extractRows(globalCountsRes)[0] || {}
    const totalUserPoints = userPosts.reduce((acc, item) => acc + Number(item.points || 0), 0)
    const totalUserXp = userPosts.reduce((acc, item) => acc + Number(item.xpAwarded || 0), 0)

    return {
      success: true,
      data: userPosts,
      telemetry: {
        dbLatencyMs: Math.max(1, Date.now() - startedAt),
        userStoriesCount: userPosts.length,
        userPointsTotal: totalUserPoints,
        userXpEarned: totalUserXp,
        globalFeedTotal: Number(gRow.total || 0),
        sections: {
          news: Number(gRow.news_count || 0),
          ask: Number(gRow.ask_count || 0),
          show: Number(gRow.show_count || 0),
          jobs: Number(gRow.jobs_count || 0)
        }
      }
    }
  } catch (err: any) {
    console.error('[PULSE USER STORIES ERROR]', err?.message)
    return {
      success: false,
      message: 'Errore nel recupero dei segnali HN.',
      data: [],
      telemetry: null
    }
  }
})