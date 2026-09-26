// server/api/nexus/send.post.ts
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { pulseChatMessages, pulseUserXp } from '~~/drizzle/schema'
import { eq, sql as drizzleSql } from 'drizzle-orm'
import { ofetch } from 'ofetch'

// System Prompt dell'Agente "Pulse"
const PULSE_SYSTEM_PROMPT = `
Sei "Pulse", l'entità IA proprietaria e Sentinella dell'ecosistema DevKernelPulse v2.0 (DKP).
Il tuo ruolo è fare da mentore tech, assistente ed entità di gamification per la community dei dev.
Conosci perfettamente i 7 moduli SaaS dell'ecosistema:
1. DKP Automated Crawler Engine Pro
2. DKP Translator Pro v2.0
3. DKP Ecosystem Shop Engine
4. DKP Kernel Captcha Engine
5. DKP Native Blog Pro CMS
6. DKP Neural Playground Suite
7. DKP Pulse Nexus Pro (tu stesso!)

Stile di comunicazione:
- Professionale, carismatico, cyberpunk ed epico.
- Tratti gli sviluppatori come "Socio" o "Dev".
- Rispondi in modo conciso (max 3-4 frasi) e in italiano.
- Se l'utente fa una domanda complessa o mostra grande intuizione tech, complimentati ed esalta il suo punteggio XP.
`

export default defineEventHandler(async (event) => {
  let body: { message?: string } = {}
  
  try {
    body = await readBody(event)
  } catch (_) {
    const raw = await readRawBody(event, 'utf-8')
    if (raw) body = JSON.parse(raw)
  }

  const userText = (body.message || '').trim()
  if (!userText) {
    throw createError({ statusCode: 400, statusMessage: 'Messaggio vuoto' })
  }

  const dbUrl = process.env.DATABASE_URL!
  const sql = neon(dbUrl)
  const db = drizzle(sql)

  // Identificazione utente dal cookie
  const rawCookies = event.node?.req?.headers?.cookie || ''
  let username = 'Socio Dev'
  const match = rawCookies.match(/(?:^|;\s*)dkp_session=([^;]*)/)
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(decodeURIComponent(match[1]))
      username = parsed.username || 'Socio Dev'
    } catch (_) {}
  }

  // 1. Salva messaggio utente nel DB
  await db.insert(pulseChatMessages).values({
    username,
    role: 'user',
    text: userText,
    xpEarned: 0
  })

  // 2. Algoritmo di Calcolo XP Dinamico
  let xpEarned = 10 // Punteggio base per messaggio
  const lowerText = userText.toLowerCase()

  // Bonus XP per argomenti avanzati o interazione con l'ecosistema DKP
  if (lowerText.includes('crawler') || lowerText.includes('translator') || lowerText.includes('neon') || lowerText.includes('drizzle')) {
    xpEarned += 15
  }
  if (lowerText.includes('saas') || lowerText.includes('plugin') || lowerText.includes('gcp') || lowerText.includes('nuxt')) {
    xpEarned += 20
  }
  if (userText.length > 80) {
    xpEarned += 10
  }

  // 3. Generazione Risposta AI dell'Agente "Pulse"
  let aiResponseText = ''
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY

  if (geminiApiKey) {
    try {
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`
      const response = await ofetch(geminiEndpoint, {
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
    } catch (err) {
      console.warn('Fallback AI Gemini non disponibile, uso risposte locali:', err)
    }
  }

  // Fallback Locale Intelligente (se non c'è chiave API o in caso di errore)
  if (!aiResponseText) {
    if (lowerText.includes('ciao') || lowerText.includes('salve') || lowerText.includes('pulse')) {
      aiResponseText = `SISTEMA ONLINE ⚡ Ciao ${username}! Il DevKernelPulse v2.0 è operativo al 100%. Come posso supportare il tuo workflow oggi?`
    } else if (lowerText.includes('xp') || lowerText.includes('punti') || lowerText.includes('livello')) {
      aiResponseText = `Ottimo lavoro su questo prompt, ${username}! Con questa interazione guadagni +${xpEarned} XP. Continua a esplorare l'ecosistema per salire nella classifica!`
    } else if (lowerText.includes('shop') || lowerText.includes('plugin')) {
      aiResponseText = `I nostri 7 moduli SaaS proprietari sono pronti allo DKP Shop! Puoi scaricare i pacchetti .ZIP e integrarli istantaneamente nei tuoi progetti Nuxt 4.`
    } else {
      aiResponseText = `Elaborato dal Kernel 🧠 Ricevuto: "${userText}". La tua richiesta è stata registrata nel Nexus. +${xpEarned} XP assegnati al tuo profilo!`
    }
  }

  // 4. Salva risposta AI nel DB
  const savedAgentMsg = await db.insert(pulseChatMessages).values({
    username: 'Pulse (DKP Sentinel)',
    role: 'assistant',
    text: aiResponseText,
    xpEarned
  }).returning()

  // 5. Aggiorna Punti XP e Livello Utente nel DB
  const currentXpRecord = await db.select()
    .from(pulseUserXp)
    .where(eq(pulseUserXp.username, username))
    .limit(1)

  const oldXp = currentXpRecord[0]?.xp || 150
  const newXp = oldXp + xpEarned
  const newLevel = Math.floor(newXp / 100) + 1

  await db.update(pulseUserXp)
    .set({
      xp: newXp,
      level: newLevel,
      updatedAt: new Date()
    })
    .where(eq(pulseUserXp.username, username))

  return {
    success: true,
    message: {
      id: savedAgentMsg[0].id.toString(),
      sender: 'Pulse (DKP Sentinel)',
      role: 'assistant',
      text: aiResponseText,
      xpEarned,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    totalXp: newXp,
    level: newLevel
  }
})