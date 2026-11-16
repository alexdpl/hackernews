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

    // Assicura la colonna status per tracciare eventuali interventi di moderazione
    await db.execute(sql`
      ALTER TABLE comments ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'published';
    `).catch(() => {})

    // 1. Risolve ID e username reali dell'utente
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

    // 2. Recupero tutti i commenti dell'utente (sia via user_id che via author)
    const commentsRes = await db.execute(sql`
      SELECT
        id,
        post_id AS "postId",
        parent_id AS "parentId",
        COALESCE(NULLIF(LOWER(target_type), ''), 'post') AS "targetType",
        COALESCE(NULLIF(author, ''), ${resolvedUsername || 'community'}) AS author,
        COALESCE(NULLIF(text, ''), content, '') AS text,
        COALESCE(NULLIF(UPPER(status), ''), 'PUBLISHED') AS status,
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

    // 3. Arricchimento titoli & link delle destinazioni (HN/News, Blog, Forum/Nodi) in batch Pure-SQL
    const postIds = Array.from(new Set(rawComments.map((c: any) => Number(c.postId)).filter((n) => n > 0)))

    const hnMap = new Map<number, { title: string }>()
    const blogMap = new Map<number, { title: string; slug: string }>()
    const nodeMap = new Map<number, { title: string }>()

    if (postIds.length > 0) {
      const idListSql = sql.join(postIds.map((id) => sql`${id}`), sql`, `)

      // Lookup su posts (HN Feed)
      const postsLookup = await db.execute(sql`
        SELECT id, title FROM posts WHERE id IN (${idListSql});
      `).catch(() => null)
      for (const r of extractSqlRows(postsLookup)) {
        hnMap.set(Number(r.id), { title: String(r.title) })
      }

      // Fallback lookup su news se presente
      const newsLookup = await db.execute(sql`
        SELECT id, title FROM news WHERE id IN (${idListSql});
      `).catch(() => null)
      for (const r of extractSqlRows(newsLookup)) {
        if (!hnMap.has(Number(r.id))) {
          hnMap.set(Number(r.id), { title: String(r.title) })
        }
      }

      // Lookup su blog_posts
      const blogLookup = await db.execute(sql`
        SELECT id, title, slug FROM blog_posts WHERE id IN (${idListSql});
      `).catch(() => null)
      for (const r of extractSqlRows(blogLookup)) {
        blogMap.set(Number(r.id), {
          title: String(r.title),
          slug: String(r.slug || r.id)
        })
      }

      // Lookup su node_threads
      const nodeLookup = await db.execute(sql`
        SELECT id, title FROM node_threads WHERE id IN (${idListSql});
      `).catch(() => null)
      for (const r of extractSqlRows(nodeLookup)) {
        nodeMap.set(Number(r.id), { title: String(r.title) })
      }
    }

    // 4. Normalizzazione finale per la Dashboard Utente
    const formattedData = rawComments.map((c: any) => {
      const pid = Number(c.postId)
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
        if (found) {
          postTitle = found.title
          targetUrl = `/item/${pid}`
        } else {
          postTitle = 'Notizia HN rimossa o non più disponibile'
          targetUrl = `/item/${pid}`
          isParentDeleted = true
        }
      }

      const status = String(c.status || 'PUBLISHED').toUpperCase()
      const isModerated = status === 'MODERATED' || status === 'HIDDEN' || status === 'FLAGGED'

      return {
        id: Number(c.id),
        postId: pid,
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
    console.error('❌ Errore fetch commenti utente:', err?.message || err)
    return {
      success: false,
      data: [],
      comments: [],
      stats: { total: 0, hnCount: 0, blogCount: 0, nodeCount: 0, moderatedCount: 0, orphanedCount: 0 }
    }
  }
})