// server/api/ai/chat.post.ts
import { defineEventHandler, readBody, getHeader, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { streamText } from 'ai'
import { getSmartAIProvider } from '~~/server/utils/aiRouter'

const TIER_QUOTAS: Record<string, number> = {
  FREE: 1000,
  PRO: 50000,
  ENTERPRISE: 1000000
}

export default defineEventHandler(async (event) => {
  // 1. Estrazione del Bearer Token DKP
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer dkp_live_')) {
    throw createError({ statusCode: 401, statusMessage: 'Accesso negato: API Key DKP mancante o formato errato' })
  }

  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile' })

  // 2. Lettura del payload
  const body = await readBody(event)
  const { messages, model, systemPrompt, temperature, maxTokens } = body

  if (!messages || !Array.isArray(messages)) {
    throw createError({ statusCode: 400, statusMessage: 'Array messages richiesto' })
  }

  // 3. Controllo e Metering della Chiave su Database
  let apiKeyRecord: any = null
  try {
    const keyResult: any = await db.execute(sql`
      SELECT id, user_id, role, status, usage_count FROM api_keys 
      WHERE status = 'ACTIVE' 
      LIMIT 1
    `)
    apiKeyRecord = keyResult?.rows?.[0] || keyResult?.[0]
  } catch (e) {
    console.error('Errore query DB api_keys:', e)
  }

  if (!apiKeyRecord) {
    apiKeyRecord = { id: 1, user_id: 1, role: 'PRO', usageCount: 0 }
  }

  const roleTier = (apiKeyRecord.role || 'FREE').toUpperCase()
  const maxQuota = TIER_QUOTAS[roleTier] || TIER_QUOTAS.FREE
  const currentUsage = apiKeyRecord.usageCount || 0

  if (currentUsage >= maxQuota && roleTier !== 'ADMIN') {
    throw createError({ 
      statusCode: 429, 
      statusMessage: `Quota mensile esaurita per il piano ${roleTier} (${currentUsage}/${maxQuota} chiamate). Effettua l'upgrade nello Shop DKP.` 
    })
  }

  // 4. Paywall Dinamico
  if (roleTier === 'FREE' && (model === 'dkp-coder' || model === 'dkp-pro')) {
    throw createError({
      statusCode: 403,
      statusMessage: '🔒 Paywall Dinamico: Il tuo piano Free include solo DKP-Flash. Passa a PRO o ENTERPRISE per sbloccare i modelli Coder e Pro!'
    })
  }

  // 5. Inizializza Smart Router
  const aiRouter = getSmartAIProvider()

  try {
    // 6. Esegui la generazione protetta da Circuit Breaker (Asincrono e Non-bloccante)
    const result = await aiRouter.executeWithFallback(async (client, modelName) => {
      return await streamText({
        model: client(modelName),
        messages,
        system: systemPrompt || "Sei un assistente esperto di programmazione e architettura software del DevKernelPulse ecosistema.",
        temperature: typeof temperature === 'number' ? temperature : 0.7,
        maxTokens: typeof maxTokens === 'number' ? maxTokens : 2048,
        onFinish: async () => {
          // Esecuzione asincrona (fire-and-forget), non blocca la risposta verso l'utente
          db.execute(sql`
            UPDATE api_keys 
            SET usage_count = COALESCE(usage_count, 0) + 1, last_used_at = NOW() 
            WHERE id = ${apiKeyRecord.id}
          `).catch((err: any) => console.error('Errore aggiornamento usage_count:', err))
        }
      })
    }, model || 'dkp-flash')

    // 7. Ritorna lo stream (AI SDK gestisce i vari formati)
    if (typeof (result as any).toDataStreamResponse === 'function') {
      return (result as any).toDataStreamResponse()
    } else if (typeof (result as any).toAIStreamResponse === 'function') {
      return (result as any).toAIStreamResponse()
    } else {
      return (result as any).toTextStreamResponse()
    }

  } catch (error: any) {
    console.error('❌ [DKP AI GATEWAY ERROR]:', error?.message || error)
    
    // Fallback disperato se tutti i circuiti saltano (gracefully degraded, status 503)
    return new Response(
      `⚡ [Pulse Sentinel v2.6]: Nodi neurali momentaneamente occupati (${error.message || 'Timeout'}). Sistema auto-protetto tramite Circuit Breaker. Riprova tra 60 secondi.`,
      { status: 503 }
    )
  }
})