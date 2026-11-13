// server/api/nodes/posts/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import crypto from 'crypto'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  if (!idParam) {
    throw createError({ statusCode: 400, statusMessage: 'ID post mancante' })
  }

  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database offline' })

  const postId = Number(idParam)

  try {
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
        u.avatar_url AS "authorAvatar"
      FROM node_posts p
      LEFT JOIN nodes n ON p.node_id = n.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = ${postId}
      LIMIT 1;
    `)

    const rows = Array.isArray(result) ? result : (result?.rows || [])
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
    console.error('❌ [GET POST ERROR]:', err)
    throw createError({ 
      statusCode: err.statusCode || 500, 
      statusMessage: err.statusMessage || err.message || 'Errore interno recupero post' 
    })
  }
})