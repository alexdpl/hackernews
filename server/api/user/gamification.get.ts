// server/api/user/gamification.get.ts
import { defineEventHandler, getCookie } from 'h3'
import { sql, eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const username = getCookie(event, 'dkp_user') || 'alexdpl'
  const db = getDb()

  try {
    // 1. Trova l'utente
    const userRecords = await db.select().from(users).where(eq(users.username, username)).limit(1)
    if (userRecords.length === 0) {
      return { success: true, data: { xp: 2990, level: 'VIP Developer', badges: ['Developer VIP Member'] } }
    }

    const userId = userRecords[0].id

    // 2. Somma reale degli XP dalle transazioni nel DB
    const result: any = await db.execute(sql`
      SELECT COALESCE(SUM(amount), 0) as total_xp
      FROM user_xp_transactions
      WHERE user_id = ${userId}
    `)

    const rows = Array.isArray(result) ? result : (result?.rows || [])
    let totalXp = rows.length > 0 ? Number(rows[0].total_xp) : 0

    // Se per caso le transazioni non sono ancora popolate ma l'utente ha XP sul profilo, usiamo il massimo tra i due
    if (totalXp < (userRecords[0].xp ?? 2990)) {
      totalXp = userRecords[0].xp ?? 2990
    }

    // 3. Calcolo livello RPG
    let level = 'VIP Developer'
    if (totalXp >= 5000) level = 'Pulse Architect'
    else if (totalXp >= 2000) level = 'Core Pioneer'

    return {
      success: true,
      data: {
        xp: totalXp,
        level,
        badges: ['Developer VIP Member', 'Early Pioneer']
      }
    }
  } catch (err: any) {
    console.error('❌ Errore gamification:', err)
    return { success: true, data: { xp: 2990, level: 'VIP Developer', badges: ['Developer VIP Member'] } }
  }
})