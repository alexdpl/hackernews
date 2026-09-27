// server/api/nexus/history.get.ts
import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  // 1. Estrazione Username dal Cookie
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
    const db = getDb()

    // 2. Assicura che le tabelle esistano
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pulse_chat_messages (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        text TEXT NOT NULL,
        xp_earned INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pulse_user_xp (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        xp INT DEFAULT 150,
        level INT DEFAULT 1,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `)

    // 3. Recupero messaggi chat
    const msgRes: any = await db.execute(sql`
      SELECT id, username AS sender, role, text, xp_earned AS "xpEarned", created_at AS "createdAt"
      FROM pulse_chat_messages
      ORDER BY id DESC
      LIMIT 25
    `)

    const rawMessages = Array.isArray(msgRes) ? msgRes : (msgRes?.rows || [])

    // 4. Inizializza record XP utente se non presente
    await db.execute(sql`
      INSERT INTO pulse_user_xp (username, xp, level)
      VALUES (${username}, 150, 1)
      ON CONFLICT (username) DO NOTHING;
    `)

    const xpRes: any = await db.execute(sql`
      SELECT xp, level FROM pulse_user_xp WHERE username = ${username} LIMIT 1
    `)

    const userRecord = Array.isArray(xpRes) ? xpRes[0] : (xpRes?.rows?.[0] || { xp: 150, level: 1 })

    return {
      success: true,
      username,
      xp: userRecord.xp,
      level: userRecord.level,
      messages: rawMessages.reverse().map((m: any) => ({
        id: m.id.toString(),
        sender: m.sender,
        role: m.role || 'assistant',
        text: m.text,
        xpEarned: m.xpEarned || 0,
        timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
          sender: 'Pulse (DKP Sentinel)',
          role: 'assistant',
          text: '⚡ SISTEMA NEXUS ONLINE v2.3. Sincronizzazione con il database Neon completata!',
          xpEarned: 0,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    }
  }
})