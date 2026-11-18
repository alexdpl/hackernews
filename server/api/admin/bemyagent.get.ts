// server/api/admin/bemyagent.get.ts
import fs from 'node:fs/promises'
import path from 'node:path'
import { defineEventHandler, createError } from 'h3'
import { useStorage } from '#imports'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Accesso riservato al Kernel Admin.' })
  }

  let docs: Array<{ name: string; content: string }> = []
  const milestoneSet = new Set<string>()

  // 1. Lettura primaria da Nitro Server Assets (funziona sia in locale sia in Cloud Run)
  try {
    const storage = useStorage('assets:bemyagent')
    const keys = await storage.getKeys()

    for (const key of keys) {
      const normalized = key.replace(/:/g, '/')
      if (normalized.startsWith('docs/') && normalized.endsWith('.md') && normalized.split('/').length === 2) {
        const raw = await storage.getItem(key)
        const content =
          typeof raw === 'string'
            ? raw
            : Buffer.isBuffer(raw)
              ? raw.toString('utf8')
              : raw instanceof Uint8Array
                ? Buffer.from(raw).toString('utf8')
                : String(raw || '')
        docs.push({ name: normalized.replace('docs/', ''), content })
      } else if (normalized.startsWith('work/')) {
        const parts = normalized.split('/')
        if (parts[1]) milestoneSet.add(parts[1])
      }
    }
    docs.sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    // Fallback su filesystem locale
  }

  // 2. Fallback filesystem se in dev locale non ancora indicizzato
  if (docs.length === 0) {
    try {
      const docsDir = path.join(process.cwd(), '.bemyagent', 'docs')
      const entries = await fs.readdir(docsDir)
      const mdFiles = entries.filter((f) => f.endsWith('.md')).sort()
      docs = await Promise.all(
        mdFiles.map(async (name) => ({
          name,
          content: await fs.readFile(path.join(docsDir, name), 'utf8')
        }))
      )
    } catch {}
  }

  if (milestoneSet.size === 0) {
    try {
      const workEntries = await fs.readdir(path.join(process.cwd(), '.bemyagent', 'work'))
      workEntries.forEach((m) => milestoneSet.add(m))
    } catch {}
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
    workMilestones: Array.from(milestoneSet).sort(),
    ttevMetrics
  }
})
