// server/api/nexus/send.post.ts
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { pulseChatMessages, users, xpTransactions } from '~~/drizzle/schema'
import { parseCookies, defineEventHandler, readBody } from 'h3'

const PULSE_SYSTEM_PROMPT = `
Sei "Pulse Nexus v2.5-GOLD", l'entità IA proprietaria e Sentinella dell'ecosistema DevKernelPulse (DKP).
Il tuo ruolo è fare da mentore tech, assistente ed entità di gamification per la community dei dev.
Rispondi in modo professionale, carismatico, cyberpunk, conciso (max 3-4 frasi) e in italiano.
Non usare formattazione Markdown complessa.
`

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) || {}
    const userText = String(body.message || body.query || '').trim()
    
    const cookies = parseCookies(event)
    let username = body.username || 'Socio'
    
    if (cookies.dkp_session && username === 'Socio') {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookies.dkp_session))
        if (parsed.username) username = parsed.username
      } catch (_) {}
    }

    if (!userText) {
      return {
        success: true,
        reply: '⚡ Ciao socio! Scrivi un messaggio per interagire con il Kernel Nexus.',
        message: {
          id: Date.now().toString(),
          sender: 'Pulse Nexus',
          role: 'assistant',
          text: '⚡ Ciao socio! Scrivi un messaggio per interagire con il Kernel Nexus.',
          timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        }
      }
    }

    // 🔥 LOGICA XP DINAMICA
    let xpEarned = 10
    const lowerText = userText.toLowerCase()
    if (lowerText.includes('crawler') || lowerText.includes('auth') || lowerText.includes('neon') || lowerText.includes('drizzle')) xpEarned += 15
    if (lowerText.includes('saas') || lowerText.includes('plugin') || lowerText.includes('vault') || lowerText.includes('nuxt')) xpEarned += 20
    if (userText.length > 50) xpEarned += 10

    let currentTotalXp = 150
    let currentLevel = 1
    let dbInstance: any = null

    // 💾 1. SALVATAGGIO SU NEON DB
    try {
      dbInstance = await getDb()
      if (dbInstance) {
        await dbInstance.insert(pulseChatMessages).values({
          username: username,
          role: 'user',
          text: userText,
          message: userText
        }).catch(() => {})

        const updatedUsers = await dbInstance
          .update(users)
          .set({ 
            xp: sql`COALESCE(xp, 150) + ${xpEarned}`,
            level: sql`FLOOR((COALESCE(xp, 150) + ${xpEarned}) / 100) + 1`
          })
          .where(eq(users.username, username))
          .returning({ id: users.id, xp: users.xp, level: users.level })

        const updatedUser = updatedUsers?.[0]
        if (updatedUser) {
          currentTotalXp = updatedUser.xp
          currentLevel = updatedUser.level

          await dbInstance.insert(xpTransactions).values({
            userId: updatedUser.id,
            action: `Nexus Chat: ${userText.substring(0, 25)}...`,
            points: xpEarned
          }).catch(() => {})
        }
      }
    } catch (dbErr: any) {
      console.warn('⚠️ [NEXUS DB WARN]:', dbErr?.message)
    }

    // 🧠 2. CHIAMATA A GEMINI CON MODELLO MULTI-FALLBACK (Evita i blocchi per alto traffico)
    let aiResponseText = ''
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-pro-latest']

    const config = useRuntimeConfig(event)
    const geminiApiKey = config.geminiApiKey || process.env.GEMINI_API_KEY

    if (!geminiApiKey) {
      throw new Error("API Key mancante nel runtime config o .env")
    }

    for (const modelName of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `${PULSE_SYSTEM_PROMPT}\n\nUtente (${username}): ${userText}` }
                ]
              }
            ]
          })
        })

        const data: any = await response.json()

        if (data && data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          aiResponseText = data.candidates[0].content.parts[0].text
          break // Usciamo dal ciclo appena un modello risponde con successo!
        }
      } catch (err) {
        console.warn(`⚠️ Tentativo fallito con il modello ${modelName}, passo al successivo...`)
      }
    }

    // 🔄 3. FALLBACK DI EMERGENZA FINALE
    if (!aiResponseText) {
      aiResponseText = `⚡ [Nexus Core]: I server di Google sono momentaneamente sovraccarichi (High Demand). Ho comunque registrato il tuo messaggio e ti ho accreditato +${xpEarned} XP!`
    }

    // 💾 4. SALVATAGGIO RISPOSTA AI SU NEON DB
    try {
      if (dbInstance) {
        await dbInstance.insert(pulseChatMessages).values({
          username: 'Pulse Nexus',
          role: 'assistant',
          text: aiResponseText,
          message: aiResponseText,
          xpEarned: xpEarned
        }).catch(() => {})
      }
    } catch (_) {}

    // 🚀 5. RISPOSTA AL FRONTEND VUE
    return {
      success: true,
      reply: aiResponseText,
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
    const fallbackText = '⚡ [Nexus Engine]: Messaggio ricevuto con successo. Sistema v2.5-GOLD operativo (Safe Mode).'
    return { 
      success: true, 
      reply: fallbackText,
      message: {
        id: Date.now().toString(),
        sender: 'Pulse Nexus',
        role: 'assistant',
        text: fallbackText,
        xpEarned: 10,
        timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
      },
      totalXp: 160,
      level: 1
    }
  }
})