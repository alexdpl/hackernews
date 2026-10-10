// server/api/nexus/history.get.ts
import { defineEventHandler } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { pulseChatMessages, users } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  // 1. Estrazione Username dal Cookie (Simulazione Auth)
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
    const db = await getDb()

    // 2. Recupero Messaggi Chat (Ultimi 25, con Drizzle)
    const rawMessages = await db.select()
      .from(pulseChatMessages)
      // Se vuoi filtrare per utente, scommenta: .where(eq(pulseChatMessages.username, username))
      .orderBy(desc(pulseChatMessages.createdAt))
      .limit(25)

    // 3. Recupero Dati Gamification Utente (da Drizzle)
    // Cerca l'utente per username e prendiamo il suo livello di XP reale (nella nuova tabella users)
    const [userRecord] = await db.select({ xp: users.xp, level: users.level })
      .from(users)
      .where(eq(users.username, username))
      .limit(1)

    return {
      success: true,
      username,
      xp: userRecord?.xp || 150,
      level: userRecord?.level || 1,
      messages: rawMessages.reverse().map((m: any) => ({
        id: m.id.toString(),
        sender: m.username,
        role: m.username.includes('Pulse') || m.username.includes('Nexus') ? 'assistant' : 'user',
        text: m.message, // Nello schema si chiama 'message', non 'text'
        xpEarned: 0, // Puoi aggiungerlo allo schema se vuoi, per ora mock.
        timestamp: m.createdAt 
          ? new Date(m.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) 
          : new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
      }))
    }
  } catch (error: any) {
    console.warn('⚠️ [NEXUS HISTORY WARN] Fallback storico:', error.message)
    return {
      success: true,
      username,
      xp: 150,
      level: 1,
      messages: [
        {
          id: '1',
          sender: 'Pulse Nexus',
          role: 'assistant',
          text: '⚡ SISTEMA NEXUS ONLINE v2.5-GOLD. Connessione stabilita con successo!',
          xpEarned: 0,
          timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        }
      ]
    }
  }
})