// server/api/user/gamification.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const userId = query.userId ? Number(query.userId) : 1
    const db = await getDb()

    const [userRecord] = await db
      .select({
        xp: users.xp,
        level: users.level,
        badges: users.badges
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!userRecord) {
      return {
        success: true,
        data: { xp: 850, level: 'VIP Developer', badges: ['Developer VIP Member'] }
      }
    }

    return {
      success: true,
      data: {
        xp: userRecord.xp || 850,
        level: userRecord.level === 2 ? 'Core Pioneer' : 'VIP Developer',
        badges: Array.isArray(userRecord.badges) && userRecord.badges.length > 0 
          ? userRecord.badges 
          : ['Developer VIP Member']
      }
    }
  } catch (err: any) {
    console.error('[GAMIFICATION GET ERROR]:', err)
    throw createError({ statusCode: 500, statusMessage: err.message })
  }
})