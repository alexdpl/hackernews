// server/api/admin/bemyagent.get.ts
import fs from 'node:fs/promises'
import path from 'node:path'
import { defineEventHandler, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Accesso riservato al Kernel Admin.' })
  }

  const rootDir = process.cwd()
  const docsDir = path.join(rootDir, '.bemyagent', 'docs')
  const workDir = path.join(rootDir, '.bemyagent', 'work')

  let docs: Array<{ name: string; content: string }> = []
  try {
    const entries = await fs.readdir(docsDir)
    const mdFiles = entries.filter((f) => f.endsWith('.md')).sort()
    docs = await Promise.all(
      mdFiles.map(async (name) => ({
        name,
        content: await fs.readFile(path.join(docsDir, name), 'utf8')
      }))
    )
  } catch {
    docs = []
  }

  let workMilestones: string[] = []
  try {
    workMilestones = await fs.readdir(workDir)
  } catch {
    workMilestones = []
  }

  const db = await getDb()
  let ttevMetrics: any[] = []
  if (db) {
    const res: any = await db.execute(sql`
      SELECT
        sentinel_username AS "sentinel",
        action_type AS "actionType",
        reasoning_trace->>'cdmTier' AS "cdmTier",
        reasoning_trace->>'modelUsed' AS "modelUsed",
        reasoning_trace->>'verdict' AS "verdict",
        smtp_dispatched AS "smtpDispatched",
        created_at AS "createdAt"
      FROM sentinel_logs
      ORDER BY created_at DESC
      LIMIT 30;
    `).catch(() => [])
    ttevMetrics = Array.isArray(res) ? res : (res?.rows || [])
  }

  return {
    success: true,
    protocol: 'BEMYAGENT-TTEV-v1',
    docs,
    workMilestones,
    ttevMetrics
  }
})
