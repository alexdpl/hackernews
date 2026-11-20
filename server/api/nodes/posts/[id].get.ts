// server/api/nodes/posts/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import crypto from 'crypto'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const idParam = String(getRouterParam(event, 'id') || '').trim()
  if (!idParam) {
    throw createError({ statusCode: 400, statusMessage: 'ID o slug thread mancante' })
  }

  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database offline' })

  const isNumeric = /^\d+$/.test(idParam)
  const postId = isNumeric ? Number(idParam) : 0

  try {
    let rows: any[] = []
    if (isNumeric && postId > 0) {
      const result: any = await db.execute(sql`
        SELECT
          p.id,
          p.title,
          p.content,
          p.karma_score AS "karmaScore",
          p.comments_count AS "commentsCount",
          p.vault_hash AS "vaultHash",
          p.is_pinned AS "isPinned",
          p.is_locked AS "isLocked",
          p.created_at AS "createdAt",
          p.updated_at AS "updatedAt",
          n.id AS "nodeId",
          n.name AS "nodeName",
          n.slug AS "nodeSlug",
          n.icon AS "nodeIcon",
          n.color AS "nodeColor",
          u.id AS "authorId",
          u.username AS "authorUsername",
          u.avatar_url AS "authorAvatar",
          COALESCE(u.is_bot, FALSE) AS "authorIsBot",
          u.bot_specialty AS "authorBotSpecialty"
        FROM node_posts p
        LEFT JOIN nodes n ON p.node_id = n.id
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.id = ${postId}
        LIMIT 1;
      `)
      rows = extractRows(result)
    }

    if (rows.length === 0) {
      const slugMatch: any = await db.execute(sql`
        SELECT
          p.id,
          p.title,
          p.content,
          p.karma_score AS "karmaScore",
          p.comments_count AS "commentsCount",
          p.vault_hash AS "vaultHash",
          p.is_pinned AS "isPinned",
          p.is_locked AS "isLocked",
          p.created_at AS "createdAt",
          p.updated_at AS "updatedAt",
          n.id AS "nodeId",
          n.name AS "nodeName",
          n.slug AS "nodeSlug",
          n.icon AS "nodeIcon",
          n.color AS "nodeColor",
          u.id AS "authorId",
          u.username AS "authorUsername",
          u.avatar_url AS "authorAvatar",
          COALESCE(u.is_bot, FALSE) AS "authorIsBot",
          u.bot_specialty AS "authorBotSpecialty"
        FROM node_posts p
        LEFT JOIN nodes n ON p.node_id = n.id
        LEFT JOIN users u ON p.author_id = u.id
        WHERE LOWER(p.title) LIKE ${'%' + idParam.toLowerCase().replace(/-/g, ' ') + '%'}
        ORDER BY p.id DESC
        LIMIT 1;
      `).catch(() => null)
      rows = extractRows(slugMatch)
    }

    const post = rows[0]
    if (!post) {
      throw createError({ statusCode: 404, statusMessage: 'Discussione non trovata nel database' })
    }

    let vaultHash = post.vaultHash || post.vault_hash
    if (!vaultHash) {
      const rawString = `${post.id}-${post.title || ''}-${post.content || ''}-${post.createdAt || Date.now()}`
      vaultHash = crypto.createHash('sha256').update(rawString).digest('hex')
    }

    return {
      success: true,
      post: {
        ...post,
        nodeName: post.nodeName || 'General',
        nodeSlug: post.nodeSlug || 'general',
        nodeIcon: post.nodeIcon || '💬',
        vaultHash,
        vaultCertificateId: `DKP-NODE-${post.id}`
      }
    }
  } catch (err: any) {
    console.error('[GET POST ERROR]:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Errore nel recupero della discussione'
    })
  }
})