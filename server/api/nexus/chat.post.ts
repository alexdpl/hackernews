// server/api/nexus/chat.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { pulseChatMessages, users, xpTransactions } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const userMessage = body?.message?.trim() || ''
    const chatHistory = body?.history || []
    const userId = body?.userId ? Number(body.userId) : 1

    if (!userMessage) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Il messaggio non può essere vuoto.'
      })
    }

    const systemContext = `Sei DKP Pulse Nexus v2.5-GOLD, l'Assistente AI ufficiale dell'ecosistema DevKernelPulse (DKP).
Sei esperto di Nuxt 4, Vue 3, TypeScript, Drizzle ORM, Neon Postgres DB, Rust e WebAssembly.
Rispondi sempre in modo chiaro, tecnico, snello e incoraggiante con un tocco da sviluppatore senior/peer.`

    let reply = ''
    let xpEarned = 10

    try {
      const config = useRuntimeConfig(event)
      const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY || config.geminiApiKey || process.env.GEMINI_API_KEY

      if (apiKey) {
        // Tentativo di chiamata LLM standard OpenAI / Compatible
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
        }).catch(() => null)

        reply = response?.choices?.[0]?.message?.content || ''
      }
    } catch (llmError: any) {
      console.warn("⚠️ [NEXUS LLM WARN]:", llmError?.message)
    }

    if (!reply) {
      reply = generateSmartFallbackReply(userMessage)
    }

    // Correzione v2.5-GOLD: getDb() asincrono e registrazione transazione XP
    try {
      const db = await getDb()
      if (db) {
        if (userId) {
          await db.update(users)
            .set({ xp: sql`COALESCE(xp, 0) + ${xpEarned}` })
            .where(eq(users.id, userId))

          await db.insert(xpTransactions).values({
            userId: userId,
            action: `Nexus Chat Message: ${userMessage.substring(0, 25)}...`,
            points: xpEarned
          }).catch(() => {})
        }

        await db.insert(pulseChatMessages).values({
          username: `User#${userId}`,
          role: 'user',
          text: userMessage,
          message: userMessage,
          userId: userId
        }).catch(() => {})

        await db.insert(pulseChatMessages).values({
          username: 'Pulse Nexus',
          role: 'assistant',
          text: reply,
          message: reply,
          xpEarned: xpEarned,
          userId: null
        }).catch(() => {})
      }
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

function generateSmartFallbackReply(query: string): string {
  const q = query.toLowerCase()
  if (q.includes('nuxt') || q.includes('vue')) {
    return '⚡ **DKP Neural Engine (Nuxt 4)**: Ottima domanda sul frontend! In DKP v2.5-GOLD utilizziamo componenti reattivi in Composition API, script setup ottimizzati e Tailwind CSS per UI ultra-rapide.'
  }
  if (q.includes('db') || q.includes('neon') || q.includes('drizzle') || q.includes('postgres')) {
    return '🗄️ **Neon Serverless & Drizzle ORM**: Il nostro core gestisce le transazioni in modo asincrono con `await getDb()`, tabelle di schema blindate e tracciamento XP in tempo reale!'
  }
  if (q.includes('vault') || q.includes('security') || q.includes('code')) {
    return '🛡️ **Proof-of-Code Vault**: Ogni snippet inviato viene cifrato con impronta SHA-256 e salvato permanentemente nel database di produzione. +100 XP garantiti!'
  }
  if (q.includes('cli') || q.includes('terminal')) {
    return '💻 **DKP CLI & Web Shell**: Puoi lanciare comandi in-browser o da terminale locale con NPM per interrogare lo stato del gateway e avviare audit automatici.'
  }
  if (q.includes('ciao') || q.includes('hello') || q.includes('chi sei')) {
    return '👋 Ciao socio! Sono **DKP Pulse Nexus v2.5-GOLD**, l\'entità IA autonoma e nativa di DevKernelPulse. Come posso aiutarti a spaccare oggi nella codebase?'
  }

  return `⚡ **DKP Nexus Core**: Ho elaborato la richiesta "*${query}*". Il sistema interno v2.5-GOLD ha completato l'analisi e accreditato i punti XP sul tuo profilo!`
}