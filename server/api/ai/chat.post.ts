// server/api/ai/chat.post.ts
import { defineEventHandler, readBody, getHeader, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

// Definizione delle quote mensili per ciascun Tier
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

  // 2. Lettura DINAMICA della chiave OpenRouter a runtime
  const config = useRuntimeConfig()
  const openrouterKey = process.env.OPENROUTER_API_KEY || 
                        process.env.PROVIDER_API_KEY || 
                        config.openrouterApiKey

  if (!openrouterKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'OPENROUTER_API_KEY non presente nelle variabili d\'ambiente del server.'
    })
  }

  // Provider inizializzato con la chiave verificata ad ogni richiesta
  const dkpProvider = createOpenAI({
    apiKey: openrouterKey,
    baseURL: 'https://openrouter.ai/api/v1',
    headers: {
      'HTTP-Referer': 'https://devkernelpulse.org',
      'X-Title': 'DevKernelPulse'
    }
  })

  const token = authHeader.replace('Bearer ', '').trim()
  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile' })

  // 3. Lettura del payload dal Neural Playground
  const body = await readBody(event)
  const { messages, model, systemPrompt, temperature, maxTokens } = body

  if (!messages || !Array.isArray(messages)) {
    throw createError({ statusCode: 400, statusMessage: 'Array messages richiesto' })
  }

  // 4. Controllo e Metering della Chiave su Database
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

  // 5. Paywall Dinamico
  if (roleTier === 'FREE' && (model === 'dkp-coder' || model === 'dkp-pro')) {
    throw createError({
      statusCode: 403,
      statusMessage: '🔒 Paywall Dinamico: Il tuo piano Free include solo DKP-Flash. Passa a PRO o ENTERPRISE per sbloccare i modelli Coder e Pro!'
    })
  }

  // 6. Routing sui modelli gratuiti di OpenRouter
  let targetModel = 'google/gemini-2.0-flash-exp:free'
  if (model === 'dkp-coder') targetModel = 'dots-studio/dots-3-note-preview:free'
  if (model === 'dkp-pro') targetModel = 'nvidia/nemotron-3-ultra-550b-a55b:free'

  try {
    const result = await streamText({
      model: dkpProvider(targetModel),
      messages,
      system: systemPrompt || "Sei un assistente esperto di programmazione OpenUI.",
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      maxTokens: typeof maxTokens === 'number' ? maxTokens : 2048,
      onFinish: async () => {
        try {
          await db.execute(sql`
            UPDATE api_keys 
            SET usage_count = COALESCE(usage_count, 0) + 1, last_used_at = NOW() 
            WHERE id = ${apiKeyRecord.id}
          `)
        } catch(err) {
          console.error('Errore aggiornamento usage_count su DB:', err)
        }
      }
    })

    if (typeof (result as any).toDataStreamResponse === 'function') {
      return (result as any).toDataStreamResponse()
    } else if (typeof (result as any).toAIStreamResponse === 'function') {
      return (result as any).toAIStreamResponse()
    } else {
      return (result as any).toTextStreamResponse()
    }

  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[DKP AI GATEWAY ERROR]:', error?.message || error)
    throw createError({ 
      statusCode: 500, 
      statusMessage: `Errore OpenRouter: ${error?.message || 'Connessione fallita'}` 
    })
  }
})