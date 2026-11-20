// server/api/user/comments.get.ts
import { defineEventHandler, getQuery, getCookie, setResponseHeaders } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import {
  ensureUnifiedCommentsSchema,
  extractSqlRows,
  parseSessionUser
} from '~~/server/utils/dkpComments'

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
      data: [],
      comments: [],
      stats: { total: 0, hnCount: 0, blogCount: 0, nodeCount: 0, moderatedCount: 0, orphanedCount: 0 }
    }
  }

  try {
    const db = await getDb()
    if (!db) {
      return { success: false, data: [], comments: [] }
    }

    await ensureUnifiedCommentsSchema(db)

    await db.execute(sql`
      ALTER TABLE comments ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'published';
    `).catch(() => {})

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

    const commentsRes = await db.execute(sql`
      SELECT
        id,
        post_id AS "postId",
        target_slug AS "targetSlug",
        parent_id AS "parentId",
        COALESCE(NULLIF(LOWER(target_type), ''), 'post') AS "targetType",
        COALESCE(NULLIF(author, ''), ${resolvedUsername || 'community'}) AS author,
        COALESCE(NULLIF(text, ''), content, '') AS text,
        COALESCE(NULLIF(UPPER(status), ''), 'PUBLISHED') AS status,
        COALESCE(NULLIF(sentinel_verdict, ''), 'PEER_VERIFIED') AS "sentinelVerdict",
        COALESCE(sentinel_score, 92) AS "sentinelScore",
        COALESCE(NULLIF(sentinel_note, ''), 'Peer-reviewed by DKP Sentinel Network') AS "sentinelNote",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM comments
      WHERE (${userId || 0} > 0 AND user_id = ${userId || 0})
         OR (${resolvedUsername} <> '' AND LOWER(COALESCE(author, '')) = LOWER(${resolvedUsername}))
      ORDER BY created_at DESC
      LIMIT 200;
    `)

    const rawComments = extractSqlRows(commentsRes)

    if (rawComments.length === 0) {
      return {
        success: true,
        data: [],
        comments: [],
        stats: { total: 0, hnCount: 0, blogCount: 0, nodeCount: 0, moderatedCount: 0, orphanedCount: 0 }
      }
    }

    const postIds = Array.from(new Set(rawComments.map((c: any) => Number(c.postId)).filter((n) => n > 0)))

    const hnMap = new Map<number, { title: string; slug?: string }>()
    const blogMap = new Map<number, { title: string; slug: string }>()
    const nodeMap = new Map<number, { title: string; slug?: string }>()

    if (postIds.length > 0) {
      const idListSql = sql.join(postIds.map((id) => sql`${id}`), sql`, `)

      const postsLookup = await db.execute(sql`
        SELECT id, title FROM posts WHERE id IN (${idListSql});
      `).catch(() => null)
      for (const r of extractSqlRows(postsLookup)) {
        hnMap.set(Number(r.id), { title: String(r.title) })
      }

      const newsLookup = await db.execute(sql`
        SELECT id, title, slug FROM news WHERE id IN (${idListSql});
      `).catch(() => null)
      for (const r of extractSqlRows(newsLookup)) {
        if (!hnMap.has(Number(r.id))) {
          hnMap.set(Number(r.id), { title: String(r.title), slug: r.slug ? String(r.slug) : undefined })
        }
      }

      const blogLookup = await db.execute(sql`
        SELECT id, title, slug FROM blog_posts WHERE id IN (${idListSql});
      `).catch(() => null)
      for (const r of extractSqlRows(blogLookup)) {
        blogMap.set(Number(r.id), {
          title: String(r.title),
          slug: String(r.slug || r.id)
        })
      }

      const nodePostsLookup = await db.execute(sql`
        SELECT p.id, p.title, n.slug AS "nodeSlug"
        FROM node_posts p
        LEFT JOIN nodes n ON p.node_id = n.id
        WHERE p.id IN (${idListSql});
      `).catch(() => null)
      for (const r of extractSqlRows(nodePostsLookup)) {
        nodeMap.set(Number(r.id), { title: String(r.title), slug: r.nodeSlug ? String(r.nodeSlug) : undefined })
      }

      const nodeThreadsLookup = await db.execute(sql`
        SELECT id, title FROM node_threads WHERE id IN (${idListSql});
      `).catch(() => null)
      for (const r of extractSqlRows(nodeThreadsLookup)) {
        if (!nodeMap.has(Number(r.id))) {
          nodeMap.set(Number(r.id), { title: String(r.title) })
        }
      }
    }

    const formattedData = rawComments.map((c: any) => {
      const pid = Number(c.postId)
      const explicitSlug = c.targetSlug ? String(c.targetSlug).trim() : ''
      const rawType = String(c.targetType || 'post').toLowerCase()
      const section: 'HN' | 'BLOG' | 'NODE' =
        rawType === 'blog' ? 'BLOG' : rawType === 'node' || rawType === 'thread' ? 'NODE' : 'HN'

      let postTitle = ''
      let targetUrl = '/'
      let isParentDeleted = false

      if (section === 'BLOG') {
        const found = blogMap.get(pid)
        if (found) {
          postTitle = found.title
          targetUrl = `/blog/${found.slug}`
        } else if (explicitSlug) {
          postTitle = `Articolo Blog (${explicitSlug})`
          targetUrl = `/blog/${explicitSlug}`
        } else {
          postTitle = 'Articolo Blog rimosso o non più disponibile'
          targetUrl = '/blog'
          isParentDeleted = true
        }
      } else if (section === 'NODE') {
        const found = nodeMap.get(pid)
        if (found) {
          postTitle = found.title
          targetUrl = `/nodes/thread/${pid}`
        } else {
          postTitle = 'Discussione Nodo rimossa o archiviata'
          targetUrl = '/nodes'
          isParentDeleted = true
        }
      } else {
        const found = hnMap.get(pid)
        const resolvedSlug = found?.slug || explicitSlug || (pid > 0 ? String(pid) : '')
        if (found || resolvedSlug) {
          postTitle = found?.title || (resolvedSlug ? `Notizia (${resolvedSlug})` : 'Notizia Tech')
          targetUrl = resolvedSlug ? `/news/${resolvedSlug}` : '/news'
        } else {
          postTitle = 'Notizia HN rimossa o non più disponibile'
          targetUrl = '/news'
          isParentDeleted = true
        }
      }

      const status = String(c.status || 'PUBLISHED').toUpperCase()
      const isModerated = status === 'MODERATED' || status === 'HIDDEN' || status === 'FLAGGED'

      return {
        id: Number(c.id),
        postId: pid,
        targetSlug: explicitSlug || null,
        parentId: c.parentId ? Number(c.parentId) : null,
        section,
        targetType: rawType,
        postTitle,
        targetUrl,
        isParentDeleted,
        author: String(c.author || resolvedUsername || 'community'),
        content: String(c.text || ''),
        text: String(c.text || ''),
        status,
        isModerated,
        isEdited: Boolean(c.updatedAt),
        sentinelVerdict: String(c.sentinelVerdict || 'PEER_VERIFIED'),
        sentinelScore: Number(c.sentinelScore ?? 92),
        sentinelNote: String(c.sentinelNote || 'Peer-reviewed by DKP Sentinel Network'),
        createdAt: c.createdAt,
        updatedAt: c.updatedAt || null,
        date: formatIsoDate(c.createdAt)
      }
    })

    const stats = formattedData.reduce(
      (acc, item) => {
        acc.total += 1
        if (item.section === 'HN') acc.hnCount += 1
        if (item.section === 'BLOG') acc.blogCount += 1
        if (item.section === 'NODE') acc.nodeCount += 1
        if (item.isModerated) acc.moderatedCount += 1
        if (item.isParentDeleted) acc.orphanedCount += 1
        return acc
      },
      { total: 0, hnCount: 0, blogCount: 0, nodeCount: 0, moderatedCount: 0, orphanedCount: 0 }
    )

    return {
      success: true,
      data: formattedData,
      comments: formattedData,
      stats
    }
  } catch (err: any) {
    console.error('Errore fetch commenti utente:', err?.message || err)
    return {
      success: false,
      data: [],
      comments: [],
      stats: { total: 0, hnCount: 0, blogCount: 0, nodeCount: 0, moderatedCount: 0, orphanedCount: 0 }
    }
  }
})