// server/api/admin/dependabot.get.ts
import { defineEventHandler, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { KnowledgeDependabotService } from '~~/server/utils/knowledgeDependabot'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Accesso riservato al Kernel Admin.' })
  }

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
  }

  await KnowledgeDependabotService.ensureSchemaAndRoles(db)

  const [permsMap, botsRes, scansRes] = await Promise.all([
    KnowledgeDependabotService.getPermissionsMap(db),
    db.execute(sql`
      SELECT id, username, role, bot_specialty AS "specialty", bio, xp
      FROM users
      WHERE username IN ('sentinel_dockeeper', 'sentinel_archguard')
      ORDER BY username ASC;
    `),
    db.execute(sql`
      SELECT
        id,
        entity_type AS "entityType",
        entity_id AS "entityId",
        entity_slug AS "entitySlug",
        entity_title AS "entityTitle",
        code_blocks_count AS "codeBlocksCount",
        dockeeper_findings_count AS "docKeeperCount",
        archguard_findings_count AS "archGuardCount",
        findings_json AS "findings",
        auto_commented AS "autoCommented",
        created_at AS "createdAt"
      FROM sentinel_dependabot_scans
      ORDER BY created_at DESC
      LIMIT 40;
    `)
  ])

  const scans = extractRows(scansRes)
  const totals = {
    scansTotal: scans.length,
    docKeeperFindings: scans.reduce((acc, s) => acc + Number(s.docKeeperCount || 0), 0),
    archGuardFindings: scans.reduce((acc, s) => acc + Number(s.archGuardCount || 0), 0),
    autoCommentsPublished: scans.filter((s) => Boolean(s.autoCommented)).length
  }

  return {
    success: true,
    permissions: Object.values(permsMap),
    bots: extractRows(botsRes),
    scans,
    totals
  }
})