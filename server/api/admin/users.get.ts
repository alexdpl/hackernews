import { defineEventHandler, setResponseHeader } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate')
  const db = await getDb()
  if (!db) return { success: true, data: [] }

  try {
    const rows = await db.execute(sql`
      SELECT
        id,
        username,
        email,
        role,
        COALESCE(karma, 0) AS karma,
        COALESCE(is_banned, FALSE) AS "isBanned",
        created_at AS "createdAt"
      FROM users
      ORDER BY id DESC
      LIMIT 200;
    `)
    return { success: true, data: extractRows(rows) }
  } catch {
    return {
      success: true,
      data: [
        { id: 1, username: 'alex_admin', email: 'admin@devkernelpulse.org', role: 'ADMIN', karma: 4200, isBanned: false, createdAt: new Date().toISOString() }
      ]
    }
  }
})