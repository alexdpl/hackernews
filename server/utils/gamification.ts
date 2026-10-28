// server/utils/gamification.ts
import { getDb } from '~~/server/utils/db'
import { users, xpTransactions } from '~~/drizzle/schema'
import { sql } from 'drizzle-orm'

export const GamificationRules = {
  NEW_THREAD: 25,
  NEW_COMMENT: 5,
  UPVOTE_RECEIVED: 2
}

export async function awardNodeXpAndBadges(userId: number, action: string, points: number) {
  const db = await getDb()

  // Traccia la transazione XP
  await db.insert(xpTransactions).values({ userId, action, points })

  // Aggiorna gli XP e controlla lo sblocco dei badge atomico tramite SQL grezzo su JSONB
  await db.execute(sql`
    UPDATE users 
    SET 
      xp = COALESCE(xp, 0) + ${points},
      badges = CASE 
        WHEN COALESCE(xp, 0) + ${points} >= 1500 AND NOT (badges @> '["Node Architect"]'::jsonb) 
          THEN badges || '["Node Architect"]'::jsonb
        WHEN COALESCE(xp, 0) + ${points} >= 500 AND NOT (badges @> '["Top Debater"]'::jsonb) 
          THEN badges || '["Top Debater"]'::jsonb
        ELSE COALESCE(badges, '[]'::jsonb)
      END
    WHERE id = ${userId}
  `)
}