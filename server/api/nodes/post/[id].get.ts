// server/api/nodes/post/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function stripNodePrefix(raw: string): string {
  return String(raw || '').replace(/^(n\/)+/i, '').trim()
}

function extractRows(result: any): any[] {
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.rows)) return result.rows
  return []
}

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const postId = Number(idParam)

  if (!idParam || Number.isNaN(postId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID thread non valido' })
  }

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database non disponibile' })
  }

  try {
    let postRes: any
    try {
      postRes = await db.execute(sql`
        SELECT
          p.*,
          COALESCE(u.username, 'community') AS "authorUsername",
          n.name AS "rawNodeName",
          n.slug AS "nodeSlug",
          n.icon AS "nodeIcon"
        FROM node_posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN nodes n ON p.node_id = n.id
        WHERE p.id = ${postId}
        LIMIT 1
      `)
    } catch {
      try {
        postRes = await db.execute(sql`
          SELECT
            p.*,
            n.name AS "rawNodeName",
            n.slug AS "nodeSlug",
            n.icon AS "nodeIcon"
          FROM node_posts p
          LEFT JOIN nodes n ON p.node_id = n.id
          WHERE p.id = ${postId}
          LIMIT 1
        `)
      } catch {
        postRes = await db.execute(sql`
          SELECT *
          FROM node_posts
          WHERE id = ${postId}
          LIMIT 1
        `)
      }
    }

    const row = extractRows(postRes)[0]
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Discussione non trovata' })
    }

    let commentsRes: any = []
    try {
      commentsRes = await db.execute(sql`
        SELECT
          c.*,
          COALESCE(u.username, 'member') AS "authorUsername"
        FROM node_comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ${postId}
        ORDER BY c.created_at ASC
      `)
    } catch {
      commentsRes = await db.execute(sql`
        SELECT *
        FROM node_comments
        WHERE post_id = ${postId}
        ORDER BY created_at ASC
      `).catch(() => [])
    }

    const post = {
      ...row,
      id: Number(row.id),
      nodeName: stripNodePrefix(row.rawNodeName || row.nodeSlug || 'General'),
      nodeSlug: row.nodeSlug || '',
      nodeIcon: row.nodeIcon || '#',
      authorUsername: row.authorUsername || row.author_username || 'community',
      karmaScore: Number(row.karmaScore ?? row.karma_score ?? 1),
      vaultHash: row.vaultHash ?? row.vault_hash ?? null,
      createdAt: row.createdAt ?? row.created_at ?? new Date().toISOString(),
      comments: extractRows(commentsRes).map((c: any) => ({
        ...c,
        id: Number(c.id),
        authorUsername: c.authorUsername || c.author_username || 'member',
        createdAt: c.createdAt ?? c.created_at ?? new Date().toISOString()
      }))
    }

    return {
      success: true,
      post,
      data: post
    }
  } catch (err: any) {
    if (err?.statusCode === 404) throw err
    console.error('[GET /api/nodes/post/:id ERROR]:', err)
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Errore interno thread' })
  }
})