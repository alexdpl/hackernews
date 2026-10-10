// server/api/nexus/send.post.ts
import { defineEventHandler, readBody, readRawBody } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { pulseChatMessages, users } from '~~/drizzle/schema'

const PULSE_SYSTEM_PROMPT = `
Sei "Pulse Nexus v2.5-GOLD", l'entità IA proprietaria e Sentinella dell'ecosistema DevKernelPulse (DKP).
Il tuo ruolo è fare da mentore tech, assistente ed entità di gamification per la community dei dev.
Conosci perfettamente i 7 moduli SaaS dell'ecosistema DKP (News, Blog, Tools, Auth, Vault, API, Dashboard).
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
    
    // 2. Lettura Username dal Cookie
    const rawCookies = event.node?.req?.headers?.cookie || ''
    let username = 'Socio' // Default
    const match = rawCookies.match(/(?:^|;\s*)dkp_session=([^;]*)/)
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(decodeURIComponent(match[1]))
        if (parsed.username) username = parsed.username
      } catch (_) {}
    }

    if (!userText) {
      return {
        success: true,
        message: {
          id: Date.now().toString(),
          sender: 'Pulse Nexus',
          role: 'assistant',
          text: '⚡ Ciao! Scrivi un messaggio per interagire con il Kernel Nexus.',
          xpEarned: 0,
          timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        },
        totalXp: 150,
        level: 2
      }
    }

    // 3. Calcolo XP Intelligente (Gamification)
    let xpEarned = 10
    const lowerText = userText.toLowerCase()
    if (lowerText.includes('crawler') || lowerText.includes('auth') || lowerText.includes('neon') || lowerText.includes('drizzle')) xpEarned += 15
    if (lowerText.includes('saas') || lowerText.includes('plugin') || lowerText.includes('vault') || lowerText.includes('nuxt')) xpEarned += 20
    if (userText.length > 50) xpEarned += 10

    let currentTotalXp = 150
    let currentLevel = 1
    let dbInstance: any = null;

    // 4. Salvataggio Messaggio Utente e Assegnazione XP (con Drizzle)
    try {
      dbInstance = await getDb()
      
      // Inseriamo il messaggio dell'utente (la colonna nello schema si chiama 'message')
      await dbInstance.insert(pulseChatMessages).values({
        username: username,
        message: userText
      })

      // Aggiorniamo la vera tabella Utenti (users)
      const [updatedUser] = await dbInstance
        .update(users)
        .set({ 
          xp: sql`${users.xp} + ${xpEarned}`,
          level: sql`FLOOR((${users.xp} + ${xpEarned}) / 100) + 1`
        })
        .where(eq(users.username, username))
        .returning({ xp: users.xp, level: users.level })

      if (updatedUser) {
        currentTotalXp = updatedUser.xp
        currentLevel = updatedUser.level
      }
      
    } catch (dbErr: any) {
      console.warn('⚠️ [NEXUS DB WARN]:', dbErr.message)
    }

    // 5. Risposta IA (Gemini API / Fallback Locale)
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

    // 6. Generazione Fallback se Gemini fallisce
    if (!aiResponseText) {
      if (lowerText.includes('ciao') || lowerText.includes('salve') || lowerText.includes('admin')) {
        aiResponseText = `SISTEMA ONLINE ⚡ Ciao ${username}! Il DevKernelPulse v2.5-GOLD è operativo al 100%. Come posso supportare il tuo workflow oggi?`
      } else if (lowerText.includes('xp') || lowerText.includes('punti') || lowerText.includes('livello')) {
        aiResponseText = `Ottimo lavoro su questo prompt, ${username}! Con questa interazione hai guadagnato +${xpEarned} XP DKP. Sei al livello ${currentLevel}.`
      } else {
        aiResponseText = `Elaborato dal Kernel 🧠 Ricevuto: "${userText}". Il modulo Nexus v2.5-GOLD è attivo. +${xpEarned} XP assegnati al tuo profilo!`
      }
    }

    // 7. Salvataggio risposta assistente
    try {
      if (dbInstance) {
        await dbInstance.insert(pulseChatMessages).values({
          username: 'Pulse Nexus',
          message: aiResponseText
        })
      }
    } catch (_) {}

    return {
      success: true,
      message: {
        id: Date.now().toString(),
        sender: 'Pulse Nexus',
        role: 'assistant',
        text: aiResponseText,
        xpEarned,
        timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
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
        sender: 'Pulse Nexus',
        role: 'assistant',
        text: '⚡ Il Kernel Nexus è in modalità di emergenza. Connessione database interrotta, ma continuo a processare offline!',
        xpEarned: 5,
        timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
      },
      totalXp: 155,
      level: 2
    }
  }
})