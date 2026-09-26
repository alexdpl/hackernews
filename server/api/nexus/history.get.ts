// server/api/nexus/history.get.ts
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { pulseChatMessages, pulseUserXp } from '~~/drizzle/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    return { success: false, error: 'DATABASE_URL mancante', messages: [], xp: 150 }
  }

  const sql = neon(dbUrl)
  const db = drizzle(sql)

  // 1. Estrazione Username dal cookie dkp_session
  const rawCookies = event.node?.req?.headers?.cookie || ''
  let username = 'Socio'
  const match = rawCookies.match(/(?:^|;\s*)dkp_session=([^;]*)/)
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(decodeURIComponent(match[1]))
      username = parsed.username || 'Socio'
    } catch (_) {}
  }

  try {
    // 2. Recupero ultimi 25 messaggi chat
    const rawMessages = await db.select()
      .from(pulseChatMessages)
      .orderBy(desc(pulseChatMessages.createdAt))
      .limit(25)

    // 3. Recupero o Inizializzazione Punti XP Utente
    let userRecord = await db.select()
      .from(pulseUserXp)
      .where(eq(pulseUserXp.username, username))
      .limit(1)

    if (userRecord.length === 0) {
      const created = await db.insert(pulseUserXp)
        .values({ username, xp: 150, level: 1 })
        .returning()
      userRecord = created
    }

    return {
      success: true,
      username,
      xp: userRecord[0].xp,
      level: userRecord[0].level,
      messages: rawMessages.reverse().map(m => ({
        id: m.id.toString(),
        sender: m.username,
        role: m.role as 'user' | 'assistant' | 'system',
        text: m.text,
        xpEarned: m.xpEarned || 0,
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }))
    }
  } catch (error: any) {
    return { success: false, error: error.message, messages: [], xp: 150 }
  }
})