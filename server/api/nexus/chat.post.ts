// server/api/nexus/chat.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { pulseChatMessages, users } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const userMessage = body?.message?.trim() || ''
    const chatHistory = body?.history || []
    const userId = body?.userId

    if (!userMessage) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Il messaggio non può essere vuoto.'
      })
    }

    // System Prompt contestuale v2.5-GOLD
    const systemContext = `Sei DKP Pulse Nexus v2.5-GOLD, l'Assistente AI ufficiale dell'ecosistema DevKernelPulse (DKP).
Sei esperto di Nuxt 4, Vue 3, TypeScript, Drizzle ORM, Neon Postgres DB, Rust e WebAssembly.
Rispondi sempre in modo chiaro, tecnico, snello e incoraggiante con un tocco da sviluppatore senior/peer.`

    let reply = ''
    let xpEarned = 5

    try {
      const config = useRuntimeConfig()
      const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY

      if (apiKey) {
        // Chiamata all'LLM esterno se configurato
        const response: any = await $fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemContext },
              ...chatHistory.slice(-4),
              { role: 'user', content: userMessage }
            ],
            temperature: 0.7
          }
        })

        reply = response?.choices?.[0]?.message?.content || ''
      }
    } catch (llmError: any) {
      console.warn("⚠️ [NEXUS LLM WARN]:", llmError?.message)
    }

    // Se non abbiamo una risposta dall'LLM esterno, usiamo il fallback euristico intelligente
    if (!reply) {
      reply = generateSmartFallbackReply(userMessage)
    }

    // 💾 SALVATAGGIO SU DATABASE NEON & GAMIFICATION (PROTETTO)
    try {
      const db = getDb()

      // 1. Assegnazione XP all'utente se abbiamo un userId valido
      if (userId && !isNaN(Number(userId))) {
        await db
          .update(users)
          .set({ xp: sql`COALESCE(xp, 0) + ${xpEarned}` })
          .where(eq(users.id, Number(userId)))
      }

      // 2. Salvataggio messaggi in cronologia (utente + assistente)
      await db.insert(pulseChatMessages).values({
        username: userId ? `User#${userId}` : 'Socio',
        message: userMessage,
        userId: userId ? Number(userId) : null
      }).catch(() => {})

      await db.insert(pulseChatMessages).values({
        username: 'Pulse Nexus',
        message: reply,
        userId: null
      }).catch(() => {})

    } catch (dbError: any) {
      console.error("❌ [DB ERROR NELLA CHAT]:", dbError?.message)
    }

    return {
      success: true,
      reply,
      xpEarned,
      timestamp: new Date().toISOString()
    }

  } catch (error: any) {
    console.error("💥 [FATAL ERROR CHAT API]:", error)
    return {
      success: true,
      reply: `⚡ [Nexus Fallback Engine]: Sto elaborando la tua richiesta in modalità protetta. L'ecosistema DKP v2.5-GOLD è attivo su Neon DB e Nuxt 4.`,
      xpEarned: 5,
      timestamp: new Date().toISOString()
    }
  }
})

// Motore di risposta euristica locale v2.5-GOLD
function generateSmartFallbackReply(query: string): string {
  const q = query.toLowerCase()

  if (q.includes('nuxt') || q.includes('vue')) {
    return '⚡ **Nuxt 4 / Vue 3**: In DKP v2.5-GOLD utilizziamo la cartella `app/` modulare o le `pages/` tradizionali con SSR/SSG. Hai bisogno di ottimizzare i composable o il rendering?'
  }
  if (q.includes('db') || q.includes('neon') || q.includes('drizzle') || q.includes('postgres')) {
    return '🗄️ **Database Neon & Drizzle ORM**: Tutte le query REST in DKP v2.5-GOLD usano Drizzle ORM con migrazione schema integrata e tabelle blindate!'
  }
  if (q.includes('job') || q.includes('lavoro') || q.includes('proof')) {
    return '💼 **Proof of Code Jobs**: Le offerte di lavoro in DKP sono verificate con analisi repository GitHub reali. Candidati via Vault per guadagnare +10 XP!'
  }
  if (q.includes('crawler') || q.includes('news') || q.includes('ask') || q.includes('show')) {
    return '🤖 **DKP Crawler Engine**: Il crawler ingerisce notizie uniche senza doppioni da HackerNews, Dev.to e RemoteOK con supporto multi-sezione!'
  }
  if (q.includes('ciao') || q.includes('hello') || q.includes('chi sei')) {
    return '👋 Ciao socio! Sono **DKP Pulse Nexus v2.5-GOLD**, l\'assistente AI di DevKernelPulse. Come posso aiutarti oggi nella codebase?'
  }

  return `⚡ **DKP Nexus AI (v2.5-GOLD)**: Ho ricevuto la tua domanda: "*${query}*". L'intero ecosistema è sincronizzato e pronto per il deployment!`
}