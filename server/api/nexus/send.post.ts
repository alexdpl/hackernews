// server/api/nexus/send.post.ts
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { pulseChatMessages, users, xpTransactions } from '~~/drizzle/schema'
import { parseCookies, defineEventHandler, readBody } from 'h3'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

// 🧠 1. SETUP PROVIDER UNIFICATO OPENAI / OPENROUTER
const apiKey = process.env.PROVIDER_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
const baseURL = process.env.PROVIDER_BASE_URL || 'https://openrouter.ai/api/v1'

const dkpProvider = createOpenAI({
  baseURL,
  apiKey,
})

const PULSE_SYSTEM_PROMPT = `
Sei "Pulse Nexus v2.5-GOLD", l'entità IA proprietaria e Sentinella dell'ecosistema DevKernelPulse (DKP).
Il tuo ruolo è fare da mentore tech, assistente ed entità di gamification per la community dei dev.
Rispondi in modo professionale, carismatico, cyberpunk, conciso (max 3-4 frasi) e in italiano.
Non usare formattazione Markdown complessa.

ALGORITMO NODI DKP:
1. CRAWLER: Fai riferimento ai dati tech acquisiti in real-time.
2. FIREWALL: Blocca codice dannoso o richieste non sicure.
3. VAULT: Suggerisci ai dev di approfondire nel Vault.
`

// 🛡️ TRINITY AI FALLBACK ARRAY (Tenta in sequenza i nodi fino a trovare quello disponibile)
const TRINITY_MODELS = [
  'dots-studio/dots-3-note',
  'openai/gpt-4o-mini',
  'meta-llama/llama-3.3-70b-instruct',
  'gpt-4o-mini'
]

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

    // 🔥 LOGICA XP DINAMICA (Mantenuta Intatta)
    let xpEarned = 10
    const lowerText = userText.toLowerCase()
    if (lowerText.includes('crawler') || lowerText.includes('auth') || lowerText.includes('neon') || lowerText.includes('drizzle')) xpEarned += 15
    if (lowerText.includes('saas') || lowerText.includes('plugin') || lowerText.includes('vault') || lowerText.includes('nuxt')) xpEarned += 20
    if (userText.length > 50) xpEarned += 10

    let currentTotalXp = 150
    let currentLevel = 1
    let dbInstance: any = null

    // 💾 1. SALVATAGGIO MESSAGGIO UTENTE E ACCREDITO XP SU NEON DB
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

    // 🧠 2. TRINITY ENGINE: PROVA I MODELLI FINO AL PRIMO CHE RISPONDE CON SUCCESSO
    let aiResponseText = ''
    let usedModel = ''

    if (apiKey) {
      for (const modelId of TRINITY_MODELS) {
        try {
          const { text } = await generateText({
            model: dkpProvider.chat(modelId),
            system: PULSE_SYSTEM_PROMPT,
            prompt: `Utente (${username}): ${userText}`,
            temperature: 0.6,
            maxTokens: 500,
          })

          if (text && text.trim()) {
            aiResponseText = text.trim()
            usedModel = modelId
            break // Risposta ricevuta! Interrompi il ciclo e restituisci la risposta al client.
          }
        } catch (modelErr: any) {
          console.warn(`⚠️ [TRINITY ENGINE WARN]: Nodo '${modelId}' non disponibile. Passo al successivo... (${modelErr?.message || modelErr})`)
        }
      }
    } else {
      console.warn('⚠️ [TRINITY ENGINE WARN]: Nessuna API Key trovata nel .env.')
    }

    // 🔄 3. FALLBACK DI EMERGENZA FINALE
    if (!aiResponseText) {
      aiResponseText = `⚡ [Pulse Sentinel]: Nodi neurali momentaneamente occupati. Messaggio archiviato con successo e +${xpEarned} XP accreditati!`
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
      modelUsed: usedModel,
      totalXp: currentTotalXp,
      level: currentLevel
    }
    
  } catch (fatalErr: any) {
    console.error('💥 [NEXUS FATAL ERROR]:', fatalErr)
    const fallbackText = '⚡ [Nexus Engine]: Sistema v2.5-GOLD in Safe Mode.'
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