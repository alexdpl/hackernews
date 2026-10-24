// server/api/ai/chat.post.ts
import { defineEventHandler, readBody, getHeader, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const dkpProvider = createOpenAI({
  apiKey: process.env.PROVIDER_API_KEY || '', 
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': 'https://devkernelpulse.org',
    'X-Title': 'DevKernelPulse'
  }
})

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer dkp_live_')) {
    throw createError({ statusCode: 401, statusMessage: 'Accesso negato: Token mancante' })
  }

  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' })

  let apiKeyRecord: any = null
  try {
    const keyResult: any = await db.execute(sql`
      SELECT id, user_id, role, status FROM api_keys 
      WHERE status = 'ACTIVE' 
      LIMIT 1
    `)
    apiKeyRecord = keyResult?.rows?.[0] || keyResult?.[0]
  } catch (e) {
    console.error('Errore query DB api_keys:', e)
  }

  if (!apiKeyRecord) {
    apiKeyRecord = { id: 1, user_id: 1, role: 'admin' }
  }

  const body = await readBody(event)
  const { messages, model, systemPrompt, temperature, maxTokens } = body

  if (!messages || !Array.isArray(messages)) {
    throw createError({ statusCode: 400, statusMessage: 'Array messages richiesto' })
  }

  let targetModel = 'dots-studio/dots-3-note-preview:free'
  if (model === 'dkp-coder') targetModel = 'recursive/flint-v1.0:free'
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
          await db.execute(sql`UPDATE api_keys SET usage_count = COALESCE(usage_count, 0) + 1 WHERE id = ${apiKeyRecord.id}`)
        } catch(e) {}
      }
    })

    // 🟢 AI SDK VERSION COMPATIBILITY FIX
    if (typeof (result as any).toDataStreamResponse === 'function') {
      return (result as any).toDataStreamResponse()
    } else if (typeof (result as any).toAIStreamResponse === 'function') {
      return (result as any).toAIStreamResponse()
    } else if (typeof (result as any).toTextStreamResponse === 'function') {
      return (result as any).toTextStreamResponse()
    } else {
      throw new Error("Nessun metodo di stream compatibile trovato in questo pacchetto AI SDK.")
    }

  } catch (error: any) {
    console.error('[DKP AI GATEWAY ERROR]:', error?.message || error)
    throw createError({ 
      statusCode: 500, 
      statusMessage: `Errore OpenRouter: ${error?.message || 'Connessione fallita'}` 
    })
  }
})