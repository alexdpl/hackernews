// server/api/admin/inspect-posts.get.ts
import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async () => {
  const db = getDb()
  try {
    const res: any = await db.execute(sql`
      SELECT id, title, url, author FROM posts LIMIT 25
    `)
    const posts = Array.isArray(res) ? res : (res?.rows || [])
    return {
      success: true,
      totalChecked: posts.length,
      posts
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})