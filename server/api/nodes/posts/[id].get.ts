// server/api/nodes/posts/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import crypto from 'crypto'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

function slugifyTitle(raw: string): string {
  return String(raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

function parseTags(raw: any): string[] {
  if (Array.isArray(raw)) return raw.map((t) => String(t).trim()).filter(Boolean)
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map((t) => String(t).trim()).filter(Boolean)
    } catch {
      return raw.split(/[,;]+/).map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
    }
  }
  return []
}

export default defineEventHandler(async (event) => {
  const idParam = String(getRouterParam(event, 'id') || '').trim()
  if (!idParam) {
    throw createError({ statusCode: 400, statusMessage: 'ID o slug thread mancante' })
  }

  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database offline' })

  await db.execute(sql`
    ALTER TABLE node_posts ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
  `).catch(() => {})

  const leadingIdMatch = idParam.match(/^(\d+)(?:-|$)/)
  const postId = leadingIdMatch ? Number(leadingIdMatch[1]) : 0
  const slugWithoutPrefix = idParam.replace(/^\d+-+/, '')
  const cleanSlugParam = slugifyTitle(slugWithoutPrefix || idParam)
  const likeWordsPattern = `%${cleanSlugParam.replace(/-/g, '%')}%`

  try {
    let rows: any[] = []

    if (postId > 0) {
      const result: any = await db.execute(sql`
        SELECT
          p.id,
          p.title,
          COALESCE(p.content, '') AS content,
          COALESCE(p.tags, '[]'::jsonb) AS tags,
          p.karma_score AS "karmaScore",
          p.comments_count AS "commentsCount",
          p.vault_hash AS "vaultHash",
          p.is_pinned AS "isPinned",
          p.is_locked AS "isLocked",
          p.created_at AS "createdAt",
          p.updated_at AS "updatedAt",
          n.id AS "nodeId",
          n.name AS "nodeName",
          REGEXP_REPLACE(COALESCE(n.slug, 'general'), '^(n/)+', '', 'i') AS "nodeSlug",
          n.icon AS "nodeIcon",
          n.color AS "nodeColor",
          pn.name AS "parentNodeName",
          u.id AS "authorId",
          COALESCE(u.username, 'alexdpl') AS "authorUsername",
          COALESCE(u.username, 'alexdpl') AS "authorName",
          u.avatar_url AS "authorAvatar",
          COALESCE(u.is_bot, FALSE) AS "authorIsBot",
          u.bot_specialty AS "authorBotSpecialty"
        FROM node_posts p
        LEFT JOIN nodes n ON p.node_id = n.id
        LEFT JOIN nodes pn ON n.parent_id = pn.id
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.id = ${postId}
        LIMIT 1;
      `)
      rows = extractRows(result)
    }

    if (rows.length === 0 && cleanSlugParam) {
      const slugMatch: any = await db.execute(sql`
        SELECT
          p.id,
          p.title,
          COALESCE(p.content, '') AS content,
          COALESCE(p.tags, '[]'::jsonb) AS tags,
          p.karma_score AS "karmaScore",
          p.comments_count AS "commentsCount",
          p.vault_hash AS "vaultHash",
          p.is_pinned AS "isPinned",
          p.is_locked AS "isLocked",
          p.created_at AS "createdAt",
          p.updated_at AS "updatedAt",
          n.id AS "nodeId",
          n.name AS "nodeName",
          REGEXP_REPLACE(COALESCE(n.slug, 'general'), '^(n/)+', '', 'i') AS "nodeSlug",
          n.icon AS "nodeIcon",
          n.color AS "nodeColor",
          pn.name AS "parentNodeName",
          u.id AS "authorId",
          COALESCE(u.username, 'alexdpl') AS "authorUsername",
          COALESCE(u.username, 'alexdpl') AS "authorName",
          u.avatar_url AS "authorAvatar",
          COALESCE(u.is_bot, FALSE) AS "authorIsBot",
          u.bot_specialty AS "authorBotSpecialty"
        FROM node_posts p
        LEFT JOIN nodes n ON p.node_id = n.id
        LEFT JOIN nodes pn ON n.parent_id = pn.id
        LEFT JOIN users u ON p.author_id = u.id
        WHERE LOWER(p.title) LIKE ${likeWordsPattern}
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

    const tSlug = slugifyTitle(post.title)
    const canonicalSlug = tSlug ? `${post.id}-${tSlug}` : String(post.id)
    const cleanNodeSlug = String(post.nodeSlug || 'general').split('/').filter(Boolean).filter((p) => p.toLowerCase() !== 'n').join('/').toLowerCase() || 'general'

    const normalizedPost = {
      ...post,
      slug: canonicalSlug,
      tags: parseTags(post.tags),
      nodeName: post.nodeName || 'General',
      nodeSlug: cleanNodeSlug,
      parentNodeName: post.parentNodeName || null,
      nodeIcon: post.nodeIcon || '#',
      vaultHash,
      vaultCertificateId: `DKP-NODE-${post.id}`
    }

    return {
      success: true,
      data: normalizedPost,
      post: normalizedPost
    }
  } catch (err: any) {
    console.error('[GET POST ERROR]:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Errore nel recupero della discussione'
    })
  }
})
