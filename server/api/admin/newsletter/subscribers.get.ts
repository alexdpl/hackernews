// server/api/admin/newsletter/subscribers.get.ts
import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const db = getDb()
    if (!db) return { success: false, subscribers: [], stats: { total: 0, active: 0, unsubscribed: 0 } }

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pulse_subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(100),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        source VARCHAR(50) DEFAULT 'WEB',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `)

    const result: any = await db.execute(sql`
      SELECT * FROM pulse_subscribers ORDER BY created_at DESC;
    `)
    const subscribers = Array.isArray(result) ? result : (result?.rows || [])

    const activeCount = subscribers.filter((s: any) => s.status === 'ACTIVE').length
    const unsubCount = subscribers.filter((s: any) => s.status === 'UNSUBSCRIBED').length

    return {
      success: true,
      stats: {
        total: subscribers.length,
        active: activeCount,
        unsubscribed: unsubCount
      },
      subscribers
    }
  } catch (err: any) {
    return { success: false, subscribers: [], stats: { total: 0, active: 0, unsubscribed: 0 }, error: err.message }
  }
})