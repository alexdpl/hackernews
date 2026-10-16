// server/api/nexus/history.get.ts
import { defineEventHandler } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { pulseChatMessages, users } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
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
    // Correzione v2.5-GOLD: getDb() asincrono
    const db = await getDb()
    if (!db) throw new Error('Database non disponibile')

    const rawMessages = await db.select()
      .from(pulseChatMessages)
      .orderBy(desc(pulseChatMessages.createdAt))
      .limit(25)

    let userRecord = null
    try {
      const results = await db.select({ xp: users.xp, level: users.level })
        .from(users)
        .where(eq(users.username, username))
        .limit(1)
      userRecord = results[0]
    } catch (_) {}

    return {
      success: true,
      username,
      xp: userRecord?.xp || 150,
      level: userRecord?.level || 1,
      messages: rawMessages.reverse().map((m: any) => ({
        id: m.id ? m.id.toString() : Date.now().toString(),
        sender: m.username || 'Socio',
        role: m.role || 'user', 
        text: m.text || m.message || '', 
        xpEarned: m.xpEarned || 0,
        timestamp: m.createdAt 
          ? new Date(m.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) 
          : new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
      }))
    }
  } catch (error: any) {
    return {
      success: true,
      username,
      xp: 150,
      level: 1,
      messages: [{
        id: '1',
        sender: 'Pulse Nexus',
        role: 'assistant',
        text: '⚡ SISTEMA NEXUS ONLINE v2.5-GOLD. Benvenuto socio!',
        xpEarned: 0,
        timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
      }]
    }
  }
})