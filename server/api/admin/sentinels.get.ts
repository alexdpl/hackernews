// server/api/admin/sentinels.get.ts
import { defineEventHandler, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Accesso riservato al Kernel Admin.' })
  }

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database non disponibile.' })
  }

  const [botsRes, logsRes, shadowbannedRes] = await Promise.all([
    db.execute(sql`
      SELECT id, username, role, bot_specialty AS "specialty", bio, xp, avatar_url AS "avatarUrl"
      FROM users
      WHERE is_bot = TRUE
      ORDER BY id ASC;
    `),
    db.execute(sql`
      SELECT
        l.id,
        l.sentinel_username AS "sentinel",
        u.username AS "targetUsername",
        l.target_type AS "targetType",
        l.target_id AS "targetId",
        l.action_type AS "actionType",
        l.reasoning_trace AS "reasoningTrace",
        l.payload_summary AS "summary",
        l.smtp_dispatched AS "smtpDispatched",
        l.created_at AS "createdAt"
      FROM sentinel_logs l
      LEFT JOIN users u ON u.id = l.target_user_id
      ORDER BY l.created_at DESC
      LIMIT 50;
    `),
    db.execute(sql`
      SELECT id, username, email, ban_reason AS "banReason", banned_until AS "bannedUntil"
      FROM users
      WHERE is_shadowbanned = TRUE
      ORDER BY id DESC;
    `)
  ])

  const toRows = (r: any) => (Array.isArray(r) ? r : r?.rows || [])

  return {
    success: true,
    sentinels: toRows(botsRes),
    logs: toRows(logsRes),
    shadowbannedUsers: toRows(shadowbannedRes)
  }
})
