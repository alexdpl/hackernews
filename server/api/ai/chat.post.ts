// server/api/ai/chat.post.ts
import { defineEventHandler, readBody, getHeader, createError, setResponseHeaders } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { streamText } from 'ai'
import { getSmartAIProvider } from '~~/server/utils/aiRouter'

const TIER_QUOTAS: Record<string, number> = {
  FREE: 1000,
  PRO: 50000,
  ENTERPRISE: 1000000,
  ADMIN: 10000000
}

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer dkp_live_')) {
    throw createError({ statusCode: 401, statusMessage: 'Accesso negato: API Key DKP mancante o formato errato' })
  }

  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile' })

  const body = await readBody(event)
  const { messages, model, systemPrompt, temperature, maxTokens } = body

  if (!messages || !Array.isArray(messages)) {
    throw createError({ statusCode: 400, statusMessage: 'Array messages richiesto' })
  }

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
    apiKeyRecord = { id: 1, user_id: 1, role: 'PRO', usage_count: 0 }
  }

  const roleTier = (apiKeyRecord.role || 'FREE').toUpperCase()
  const maxQuota = TIER_QUOTAS[roleTier] || TIER_QUOTAS.FREE
  const currentUsage = Number(apiKeyRecord.usage_count ?? apiKeyRecord.usageCount ?? 0)

  if (currentUsage >= maxQuota && roleTier !== 'ADMIN') {
    throw createError({
      statusCode: 429,
      statusMessage: `Quota mensile esaurita per il piano ${roleTier} (${currentUsage}/${maxQuota} chiamate).`
    })
  }

  if (roleTier === 'FREE' && (model === 'dkp-coder' || model === 'dkp-pro')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Paywall Dinamico: Il tuo piano Free include solo DKP-Flash. Passa a PRO o ENTERPRISE per sbloccare Coder e Pro.'
    })
  }

  const aiRouter = getSmartAIProvider()

  try {
    const verifiedStream = await aiRouter.executeWithFallback(async (client, modelName) => {
      const result = streamText({
        model: client(modelName),
        messages,
        system: systemPrompt || 'Sei un assistente esperto di programmazione e architettura software del DevKernelPulse ecosistema.',
        temperature: typeof temperature === 'number' ? temperature : 0.7,
        maxOutputTokens: typeof maxTokens === 'number' ? Math.min(Math.max(maxTokens, 256), 32768) : 8192,
        maxRetries: 0,
        onFinish: async () => {
          db.execute(sql`
            UPDATE api_keys
            SET usage_count = COALESCE(usage_count, 0) + 1, last_used_at = NOW()
            WHERE id = ${apiKeyRecord.id}
          `).catch((err: any) => console.error('Errore aggiornamento usage_count:', err))
        }
      })

      // Forza l'apertura reale dello stream e attende il primo chunk di testo
      // Se OpenRouter restituisce 429 o errore provider, lancia qui e attiva il fallback sul modello successivo!
      const reader = result.textStream.getReader()
      const firstRead = await reader.read()

      if (firstRead.done && !firstRead.value) {
        throw new Error(`Stream vuoto dal modello ${modelName}`)
      }

      const encoder = new TextEncoder()
      return new ReadableStream({
        async start(controller) {
          try {
            if (firstRead.value) {
              controller.enqueue(encoder.encode(firstRead.value))
            }
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              if (value) {
                controller.enqueue(encoder.encode(value))
              }
            }
            controller.close()
          } catch (streamErr) {
            controller.error(streamErr)
          }
        }
      })
    }, model || 'dkp-flash')

    setResponseHeaders(event, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no'
    })

    return new Response(verifiedStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no'
      }
    })
  } catch (error: any) {
    console.error('[DKP AI GATEWAY ERROR]:', error?.message || error)
    throw createError({
      statusCode: 503,
      statusMessage: `Nodi neurali free momentaneamente saturi (${error?.message || 'Rate Limit 429'}). Riprova tra qualche secondo.`
    })
  }
})