import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import * as sessionUtils from '~~/server/utils/session'
import { resolveNewsTable } from '~~/server/utils/dkpNewsRepo'

async function resolveCurrentUser(event: any) {
  const s = sessionUtils as Record<string, any>
  const fn = s.getSessionUser || s.getUserSession || s.getDkpSessionUser || s.getAuthUser || s.verifySession
  if (typeof fn === 'function') {
    const res = await fn(event).catch(() => null)
    return res?.user || res || null
  }
  return event.context?.user || null
}

export default defineEventHandler(async (event) => {
  const user = await resolveCurrentUser(event)
  const body = await readBody(event)
  const itemId = String(body?.itemId || '').replace(/[^a-zA-Z0-9_-]/g, '')

  if (!itemId) {
    throw createError({ statusCode: 400, statusMessage: 'ID elemento mancante' })
  }

  const db = await getDb()
  const meta = await resolveNewsTable()
  if (!db || !meta) return { success: true, xpAwarded: 0 }

  const scoreCol = meta.columns.has('points') ? 'points' : (meta.columns.has('score') ? 'score' : null)
  if (scoreCol) {
    await db.execute(
      sql.raw(`UPDATE "${meta.tableName}" SET "${scoreCol}" = COALESCE("${scoreCol}", 1) + 1 WHERE id::text = '${itemId}';`)
    ).catch(() => null)
  }

  if (user?.id) {
    await db.execute(sql`
      UPDATE users
      SET xp = COALESCE(xp, 0) + 5
      WHERE id = ${user.id};
    `).catch(() => null)
  }

  return {
    success: true,
    xpAwarded: user?.id ? 5 : 0
  }
})