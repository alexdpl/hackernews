// server/utils/aiRouter.ts
import { createOpenAI } from '@ai-sdk/openai'

let consecutiveErrorsOpenRouter = 0
let consecutiveErrorsOpenAI = 0
const MAX_ERRORS = 3
const CIRCUIT_COOLDOWN_MS = 60000
let openRouterCircuitOpenUntil = 0
let openAICircuitOpenUntil = 0

const PROVIDER_TIMEOUT_MS = 15000

export function getSmartAIProvider() {
  let config: any = {}
  try {
    config = useRuntimeConfig()
  } catch {}

  const openRouterKey = (
    process.env.OPENROUTER_API_KEY ||
    process.env.PROVIDER_API_KEY ||
    config.openrouterApiKey ||
    ''
  ).trim()

  const openAIKey = (
    process.env.OPENAI_API_KEY ||
    config.openaiApiKey ||
    ''
  ).trim()

  const openRouterClient = openRouterKey
    ? createOpenAI({
        apiKey: openRouterKey,
        baseURL: process.env.PROVIDER_BASE_URL || 'https://openrouter.ai/api/v1',
        headers: {
          'HTTP-Referer': 'https://devkernelpulse.org',
          'X-Title': 'DevKernelPulse'
        }
      })
    : null

  const openAIClient = openAIKey
    ? createOpenAI({
        apiKey: openAIKey
      })
    : null

 const getModelNames = (dkpModel: string) => {
    switch (dkpModel) {
      case 'dkp-coder':
        return {
          primary: 'cohere/north-mini-code:free',
          fallback: 'dots-studio/dots-3-note-preview:free'
        }
      case 'dkp-pro':
        return {
          primary: 'nvidia/nemotron-3-ultra-550b-a55b:free',
          fallback: 'dots-studio/dots-3-note-preview:free'
        }
      case 'dkp-flash':
      default:
        return {
          primary: 'dots-studio/dots-3-note-preview:free',
          fallback: 'nvidia/nemotron-3-ultra-550b-a55b:free'
        }
    }
  }

  return {
    openRouterClient,
    openAIClient,
    getModelNames,

    async executeWithFallback(executeStream: (client: any, modelName: string) => Promise<any>, dkpModel: string) {
      const { primary, fallback } = getModelNames(dkpModel)
      const now = Date.now()

      const tryOpenRouterFirst = openRouterClient && now > openRouterCircuitOpenUntil
      const tryOpenAIFirst = openAIClient && now > openAICircuitOpenUntil && !tryOpenRouterFirst

      if (!tryOpenRouterFirst && !tryOpenAIFirst) {
        throw new Error('Chiave provider AI mancante (OPENROUTER_API_KEY / PROVIDER_API_KEY) o circuit breaker aperto.')
      }

      // Wrapper che forza .chat(model) su /v1/chat/completions invece di /v1/responses
      const chatClientAdapter = (rawClient: any) => (modelId: string) => rawClient.chat(modelId)

      const executeWithTimeout = async (rawClient: any, model: string, isPrimary: boolean) => {
        const adaptedClient = chatClientAdapter(rawClient)
        return Promise.race([
          executeStream(adaptedClient, model),
          new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), PROVIDER_TIMEOUT_MS))
        ])
          .then((res) => {
            if (isPrimary) consecutiveErrorsOpenRouter = 0
            else consecutiveErrorsOpenAI = 0
            return res
          })
          .catch((err: any) => {
            if (isPrimary) {
              consecutiveErrorsOpenRouter++
              if (consecutiveErrorsOpenRouter >= MAX_ERRORS) {
                openRouterCircuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS
              }
            } else {
              consecutiveErrorsOpenAI++
              if (consecutiveErrorsOpenAI >= MAX_ERRORS) {
                openAICircuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS
              }
            }
            throw err
          })
      }

      if (tryOpenRouterFirst) {
        try {
          return await executeWithTimeout(openRouterClient, primary, true)
        } catch (e: any) {
          console.warn(`[AI Router] Primary (${primary}) fallito: ${e.message}. Tento fallback (${fallback})...`)
          try {
            return await executeWithTimeout(openRouterClient, fallback, true)
          } catch (e2: any) {
            if (openAIClient && now > openAICircuitOpenUntil) {
              return await executeWithTimeout(openAIClient, 'gpt-4o-mini', false)
            }
            throw new Error(`Provider AI non raggiungibile: ${e2?.message || e?.message}`)
          }
        }
      }

      if (tryOpenAIFirst) {
        return await executeWithTimeout(openAIClient, 'gpt-4o-mini', false)
      }
    }
  }
}