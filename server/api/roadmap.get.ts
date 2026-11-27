// server/api/roadmap.get.ts
import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '../utils/db'
import { roadmapMilestones, type RoadmapMilestone } from '../../app/data/roadmap'

function computeCompletion(items: RoadmapMilestone[]): number {
  if (!items.length) return 0
  const totalWeight = items.reduce((acc, m) => {
    if (m.status === 'completed') return acc + 100
    return acc + Math.max(0, Math.min(100, Number(m.progress || 0)))
  }, 0)
  return Math.round(totalWeight / items.length)
}

export default defineEventHandler(async () => {
  const milestones = roadmapMilestones.map((m) => ({ ...m, features: [...m.features] }))

  try {
    const db = await getDb()
    if (db) {
      const res: any = await db.execute(sql`
        SELECT id, status, progress
        FROM roadmap_milestones;
      `).catch(() => [])
      const rows = Array.isArray(res) ? res : (res?.rows || [])
      if (rows.length > 0) {
        const overrideMap = new Map<string, any>(rows.map((r: any) => [String(r.id), r]))
        for (const m of milestones) {
          const ov = overrideMap.get(m.id)
          if (ov) {
            if (ov.status === 'completed' || ov.status === 'in-progress' || ov.status === 'upcoming') {
              m.status = ov.status
            }
            if (typeof ov.progress === 'number') {
              m.progress = ov.progress
            }
          }
        }
      }
    }
  } catch {}

  return {
    success: true,
    version: 'v2.6-PURE-SQL',
    completion: computeCompletion(milestones),
    milestones
  }
})