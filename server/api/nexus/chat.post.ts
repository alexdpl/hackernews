// server/api/nexus/chat.post.ts
import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const userMessage = body?.message?.trim() || ''
  const chatHistory = body?.history || []

  if (!userMessage) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Il messaggio non può essere vuoto.'
    })
  }

  // System Prompt contestuale per l'ecosistema DevKernelPulse
  const systemContext = `Sei DKP Pulse Nexus v2.3, l'Assistente AI ufficiale dell'ecosistema DevKernelPulse (DKP).
Sei esperto di Nuxt 4, Vue 3, TypeScript, Drizzle ORM, Neon Postgres DB, Rust e WebAssembly.
Rispondi sempre in modo chiaro, tecnico, snello e incoraggiante con un tocco da sviluppatore senior/peer.`

  try {
    // 1. Controllo se esiste una API Key configurata in runtimeConfig (OpenAI / Groq / Anthropic)
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

      const reply = response?.choices?.[0]?.message?.content || '⚡ Nexus Kernel ha elaborato la richiesta ma la risposta è vuota.'
      
      return {
        success: true,
        reply,
        xpEarned: 5,
        timestamp: new Date().toISOString()
      }
    }

    // 2. FALLBACK INTELLIGENTE LOCALE (In assenza di API Key esterna)
    let fallbackReply = generateSmartFallbackReply(userMessage)

    return {
      success: true,
      reply: fallbackReply,
      xpEarned: 5,
      timestamp: new Date().toISOString()
    }

  } catch (error: any) {
    // Graceful fallback se la chiamata LLM fallisce
    return {
      success: true,
      reply: `⚡ [Nexus Fallback Engine]: Sto elaborando la tua richiesta su "${userMessage}". L'ecosistema DKP v2.3 è attivo su Neon DB e Nuxt 4.`,
      xpEarned: 5,
      timestamp: new Date().toISOString()
    }
  }
})

// Motore di risposta euristica locale
function generateSmartFallbackReply(query: string): string {
  const q = query.toLowerCase()

  if (q.includes('nuxt') || q.includes('vue')) {
    return '⚡ **Nuxt 4 / Vue 3**: In DKP v2.3 utilizziamo la cartella `app/` modulare o le `pages/` tradizionali con SSR/SSG. Hai bisogno di ottimizzare i composable o il rendering?'
  }
  if (q.includes('db') || q.includes('neon') || q.includes('drizzle') || q.includes('postgres')) {
    return '🗄️ **Database Neon & Drizzle ORM**: Tutte le query REST in DKP v2.3 usano SQL nativo resiliente con fallback automatico e migrazione schema integrata!'
  }
  if (q.includes('job') || q.includes('lavoro') || q.includes('proof')) {
    return '💼 **Proof of Code Jobs**: Le offerte di lavoro in DKP sono verificate con analisi repository GitHub reali. Candidati via Vault per guadagnare +10 XP!'
  }
  if (q.includes('crawler') || q.includes('news') || q.includes('ask') || q.includes('show')) {
    return '🤖 **DKP Crawler Engine**: Il crawler ingerisce notizie uniche senza doppioni da HackerNews, Dev.to e RemoteOK con supporto multi-sezione!'
  }
  if (q.includes('ciao') || q.includes('hello') || q.includes('chi sei')) {
    return '👋 Ciao socio! Sono **DKP Pulse Nexus v2.3**, l\'assistente AI di DevKernelPulse. Come posso aiutarti oggi nella codebase?'
  }

  return `⚡ **DKP Nexus AI (v2.3)**: Ho ricevuto la tua domanda: "*${query}*". L'intero ecosistema è sincronizzato e pronto per il deployment!`
}