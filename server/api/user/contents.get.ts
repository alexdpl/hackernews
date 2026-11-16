// server/api/user/contents.get.ts
import { defineEventHandler, getQuery, getCookie, setResponseHeaders } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { extractSqlRows, parseSessionUser } from '~~/server/utils/dkpComments'

function formatIsoDate(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0]
  if (val instanceof Date) return val.toISOString().split('T')[0]
  return String(val).split('T')[0]
}

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'X-Cloud-Region': 'europe-west4',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  })

  const query = getQuery(event)
  const session = parseSessionUser(event)
  const cookieUsername = getCookie(event, 'dkp_user')

  const username = String(query.username || session?.username || cookieUsername || '').trim()
  let userId: number | null = query.userId ? Number(query.userId) : (session?.id || null)

  if (!userId && !username) {
    return {
      success: true,
      hnPosts: [],
      blogPosts: [],
      nodeThreads: [],
      stats: { hnCount: 0, blogCount: 0, nodeCount: 0, totalPoints: 0 }
    }
  }

  try {
    const db = await getDb()
    if (!db) {
      return { success: false, error: 'Database Neon non disponibile.', hnPosts: [], blogPosts: [], nodeThreads: [] }
    }

    // 1. Risolve ID e username reali dell'utente su Neon DB
    let resolvedUsername = username
    if (!userId && username) {
      const userRes = await db.execute(sql`
        SELECT id, username FROM users WHERE LOWER(username) = LOWER(${username}) LIMIT 1;
      `).catch(() => null)
      const uRow = extractSqlRows(userRes)[0]
      if (uRow) {
        userId = Number(uRow.id)
        resolvedUsername = String(uRow.username || username)
      }
    } else if (userId && !resolvedUsername) {
      const userRes = await db.execute(sql`
        SELECT username FROM users WHERE id = ${userId} LIMIT 1;
      `).catch(() => null)
      const uRow = extractSqlRows(userRes)[0]
      if (uRow?.username) resolvedUsername = String(uRow.username)
    }

    if (!userId && !resolvedUsername) {
      return {
        success: true,
        hnPosts: [],
        blogPosts: [],
        nodeThreads: [],
        stats: { hnCount: 0, blogCount: 0, nodeCount: 0, totalPoints: 0 }
      }
    }

    // 2. Recupero Post HN / News (Pure-SQL)
    const postsRes = userId
      ? await db.execute(sql`
          SELECT
            id,
            title,
            url,
            COALESCE(type, 'story') AS type,
            COALESCE(points, 1) AS points,
            COALESCE(comments_count, 0) AS "commentsCount",
            created_at AS "createdAt"
          FROM posts
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
          LIMIT 100;
        `).catch(() => null)
      : null

    const hnPosts = extractSqlRows(postsRes).map((p: any) => ({
      id: Number(p.id),
      section: 'HN',
      title: String(p.title || 'Senza titolo'),
      url: p.url || null,
      targetLink: `/item/${p.id}`,
      type: String(p.type || 'story'),
      points: Number(p.points || 1),
      commentsCount: Number(p.commentsCount || 0),
      createdAt: formatIsoDate(p.createdAt)
    }))

    // 3. Recupero Articoli Blog (tollerante se la tabella ha colonne diverse)
    const blogRes = resolvedUsername
      ? await db.execute(sql`
          SELECT
            id,
            slug,
            title,
            COALESCE(status, 'published') AS status,
            COALESCE(views, 0) AS views,
            created_at AS "createdAt"
          FROM blog_posts
          WHERE LOWER(COALESCE(author, '')) = LOWER(${resolvedUsername})
             OR (${userId || 0} > 0 AND author_id = ${userId || 0})
          ORDER BY created_at DESC
          LIMIT 50;
        `).catch(() => null)
      : null

    const blogPosts = extractSqlRows(blogRes).map((b: any) => ({
      id: Number(b.id),
      section: 'BLOG',
      slug: b.slug || String(b.id),
      title: String(b.title || 'Articolo Blog'),
      targetLink: `/blog/${b.slug || b.id}`,
      status: String(b.status || 'published').toUpperCase(),
      views: Number(b.views || 0),
      createdAt: formatIsoDate(b.createdAt)
    }))

    // 4. Recupero Discussioni nei Nodi / Forum
    const nodesRes = resolvedUsername
      ? await db.execute(sql`
          SELECT
            id,
            title,
            COALESCE(node_slug, 'general') AS "nodeSlug",
            COALESCE(replies_count, 0) AS "repliesCount",
            created_at AS "createdAt"
          FROM node_threads
          WHERE LOWER(COALESCE(author, '')) = LOWER(${resolvedUsername})
             OR (${userId || 0} > 0 AND user_id = ${userId || 0})
          ORDER BY created_at DESC
          LIMIT 50;
        `).catch(() => null)
      : null

    const nodeThreads = extractSqlRows(nodesRes).map((n: any) => ({
      id: Number(n.id),
      section: 'NODE',
      title: String(n.title || 'Discussione Nodo'),
      nodeSlug: String(n.nodeSlug || 'general'),
      targetLink: `/nodes/thread/${n.id}`,
      repliesCount: Number(n.repliesCount || 0),
      createdAt: formatIsoDate(n.createdAt)
    }))

    const totalPoints = hnPosts.reduce((acc, item) => acc + item.points, 0)

    return {
      success: true,
      hnPosts,
      blogPosts,
      nodeThreads,
      stats: {
        hnCount: hnPosts.length,
        blogCount: blogPosts.length,
        nodeCount: nodeThreads.length,
        totalPoints
      }
    }
  } catch (err: any) {
    console.error('❌ Errore API user/contents:', err?.message || err)
    return {
      success: false,
      error: err?.message || 'Errore database',
      hnPosts: [],
      blogPosts: [],
      nodeThreads: [],
      stats: { hnCount: 0, blogCount: 0, nodeCount: 0, totalPoints: 0 }
    }
  }
})