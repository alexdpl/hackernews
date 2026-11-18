// server/api/admin/bemyagent.get.ts
import { defineEventHandler, createError } from 'h3'
import { useStorage } from '#imports'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { BEMYAGENT_BUNDLE } from '~~/server/utils/bemyagentBundle'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Accesso riservato al Kernel Admin.' })
  }

  let docs: Array<{ name: string; content: string }> = []
  const milestoneSet = new Set<string>()

  // 1. Tenta lettura dinamica da Nitro assets:server
  try {
    const storage = useStorage('assets:server')
    const keys = await storage.getKeys('bemyagent')

    for (const key of keys) {
      const normalized = key.replace(/:/g, '/')
      if (normalized.startsWith('bemyagent/docs/') && normalized.endsWith('.md') && normalized.split('/').length === 3) {
        const raw = await storage.getItem(key)
        const content =
          typeof raw === 'string'
            ? raw
            : Buffer.isBuffer(raw)
              ? raw.toString('utf8')
              : raw instanceof Uint8Array
                ? Buffer.from(raw).toString('utf8')
                : String(raw || '')
        docs.push({ name: normalized.replace('bemyagent/docs/', ''), content })
      } else if (normalized.startsWith('bemyagent/work/')) {
        const parts = normalized.split('/')
        if (parts[2]) milestoneSet.add(parts[2])
      }
    }
    docs.sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    // Usa il bundle compilato come fallback garantito
  }

  // 2. Fallback garantito dal bundle compilato nel server Nitro
  if (docs.length === 0) {
    docs = [...BEMYAGENT_BUNDLE.docs]
  }
  if (milestoneSet.size === 0) {
    BEMYAGENT_BUNDLE.workMilestones.forEach((m) => milestoneSet.add(m))
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