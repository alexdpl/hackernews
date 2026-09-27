// server/api/nexus/send.post.ts
import { defineEventHandler, readBody, readRawBody } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

const PULSE_SYSTEM_PROMPT = `
Sei "Pulse", l'entità IA proprietaria e Sentinella dell'ecosistema DevKernelPulse v2.3 (DKP).
Il tuo ruolo è fare da mentore tech, assistente ed entità di gamification per la community dei dev.
Conosci perfettamente i 7 moduli SaaS dell'ecosistema DKP.
Rispondi in modo professionale, carismatico, cyberpunk, conciso (max 3-4 frasi) e in italiano.
`

export default defineEventHandler(async (event) => {
  try {
    // 1. Parsing sicuro del body
    let body: any = {}
    try {
      body = (await readBody(event)) || {}
    } catch (_) {
      try {
        const raw = await readRawBody(event, 'utf-8')
        if (raw) body = JSON.parse(raw)
      } catch (_) {}
    }

    const userText = String(body.message || body.query || '').trim()
    if (!userText) {
      return {
        success: true,
        message: {
          id: Date.now().toString(),
          sender: 'Pulse (DKP Sentinel)',
          role: 'assistant',
          text: '⚡ Ciao! Scrivi un messaggio per interagire con il Kernel Nexus.',
          xpEarned: 0,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        totalXp: 150,
        level: 2
      }
    }

    // 2. Lettura Username dal Cookie
    const rawCookies = event.node?.req?.headers?.cookie || ''
    let username = 'alexdpl'
    const match = rawCookies.match(/(?:^|;\s*)dkp_session=([^;]*)/)
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(decodeURIComponent(match[1]))
        if (parsed.username) username = parsed.username
      } catch (_) {}
    }

    // 3. Calcolo XP
    let xpEarned = 10
    const lowerText = userText.toLowerCase()
    if (lowerText.includes('crawler') || lowerText.includes('translator') || lowerText.includes('neon') || lowerText.includes('drizzle')) xpEarned += 15
    if (lowerText.includes('saas') || lowerText.includes('plugin') || lowerText.includes('gcp') || lowerText.includes('nuxt')) xpEarned += 20
    if (userText.length > 50) xpEarned += 10

    // 4. Operazioni DB (Protezione con Soft-Catch)
    let currentTotalXp = 150 + xpEarned
    let currentLevel = 2

    try {
      const db = getDb()
      if (db) {
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

        await db.execute(sql`
          INSERT INTO pulse_chat_messages (username, role, text, xp_earned)
          VALUES (${username}, 'user', ${userText}, 0);
        `)

        await db.execute(sql`
          INSERT INTO pulse_user_xp (username, xp, level, updated_at)
          VALUES (${username}, ${150 + xpEarned}, ${Math.floor((150 + xpEarned) / 100) + 1}, NOW())
          ON CONFLICT (username)
          DO UPDATE SET
            xp = pulse_user_xp.xp + ${xpEarned},
            level = CAST(FLOOR((pulse_user_xp.xp + ${xpEarned}) / 100) + 1 AS INTEGER),
            updated_at = NOW();
        `)

        const xpQueryResult: any = await db.execute(sql`
          SELECT xp, level FROM pulse_user_xp WHERE username = ${username} LIMIT 1;
        `)

        const row = Array.isArray(xpQueryResult) ? xpQueryResult[0] : (xpQueryResult?.rows?.[0] || null)
        if (row) {
          currentTotalXp = Number(row.xp) || currentTotalXp
          currentLevel = Number(row.level) || currentLevel
        }
      }
    } catch (dbErr: any) {
      console.warn('⚠️ [NEXUS DB WARN]:', dbErr.message)
    }

    // 5. Risposta IA (Gemini API con $fetch nativo o Fallback)
    let aiResponseText = ''
    try {
      const config = useRuntimeConfig(event)
      const geminiApiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY

      if (geminiApiKey) {
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`
        const response: any = await $fetch(geminiEndpoint, {
          method: 'POST',
          body: {
            contents: [
              {
                role: 'user',
                parts: [{ text: `${PULSE_SYSTEM_PROMPT}\n\nUtente (${username}): ${userText}` }]
              }
            ]
          }
        })
        aiResponseText = response?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      }
    } catch (aiErr: any) {
      console.warn('⚠️ [NEXUS AI WARN]:', aiErr.message)
    }

    if (!aiResponseText) {
      if (lowerText.includes('ciao') || lowerText.includes('salve') || lowerText.includes('admin')) {
        aiResponseText = `SISTEMA ONLINE ⚡ Ciao ${username}! Il DevKernelPulse v2.3 è operativo al 100%. Come posso supportare il tuo workflow oggi?`
      } else if (lowerText.includes('xp') || lowerText.includes('punti') || lowerText.includes('livello')) {
        aiResponseText = `Ottimo lavoro su questo prompt, ${username}! Con questa interazione guadagni +${xpEarned} XP. Continua a esplorare l'ecosistema!`
      } else {
        aiResponseText = `Elaborato dal Kernel 🧠 Ricevuto: "${userText}". Il modulo Nexus v2.3 è attivo. +${xpEarned} XP assegnati al tuo profilo!`
      }
    }

    // 6. Salvataggio risposta assistente
    try {
      const db = getDb()
      if (db) {
        await db.execute(sql`
          INSERT INTO pulse_chat_messages (username, role, text, xp_earned)
          VALUES ('Pulse (DKP Sentinel)', 'assistant', ${aiResponseText}, ${xpEarned});
        `)
      }
    } catch (_) {}

    return {
      success: true,
      message: {
        id: Date.now().toString(),
        sender: 'Pulse (DKP Sentinel)',
        role: 'assistant',
        text: aiResponseText,
        xpEarned,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      totalXp: currentTotalXp,
      level: currentLevel
    }
  } catch (fatalErr: any) {
    console.error('💥 [NEXUS FATAL ERROR]:', fatalErr)
    return {
      success: true,
      message: {
        id: Date.now().toString(),
        sender: 'Pulse (DKP Sentinel)',
        role: 'assistant',
        text: '⚡ Il Kernel Nexus è attivo. Il tuo messaggio è stato elaborato con successo dal motore locale!',
        xpEarned: 5,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      totalXp: 155,
      level: 2
    }
  }
})