// server/utils/aiRouter.ts
import { createOpenAI } from '@ai-sdk/openai'

let consecutiveErrorsOpenRouter = 0
let consecutiveErrorsOpenAI = 0
const MAX_ERRORS = 4
const CIRCUIT_COOLDOWN_MS = 30000
let openRouterCircuitOpenUntil = 0
let openAICircuitOpenUntil = 0

const PROVIDER_TIMEOUT_MS = 45000

let cachedFreeModelIds: Set<string> | null = null
let cachedFreeModelsFetchedAt = 0
const FREE_MODELS_CACHE_TTL_MS = 10 * 60 * 1000

async function getLiveOpenRouterFreeModels(baseURL: string): Promise<Set<string>> {
  const now = Date.now()
  if (cachedFreeModelIds && now - cachedFreeModelsFetchedAt < FREE_MODELS_CACHE_TTL_MS) {
    return cachedFreeModelIds
  }
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
    const res = await fetch(`${cleanBase}/models`, { signal: controller.signal })
    clearTimeout(timer)
    if (res.ok) {
      const json: any = await res.json()
      const ids = new Set<string>(
        (json?.data || [])
          .map((m: any) => String(m?.id || ''))
          .filter((id: string) => id.endsWith(':free'))
      )
      if (ids.size > 0) {
        cachedFreeModelIds = ids
        cachedFreeModelsFetchedAt = now
        return ids
      }
    }
  } catch (err: any) {
    console.warn('[AI Router] Auto-discovery modelli :free saltato:', err?.message || err)
  }
  return cachedFreeModelIds || new Set<string>()
}

export function getSmartAIProvider() {
  let config: any = {}
  try {
    config = useRuntimeConfig()
  } catch {}

  const baseURL = (process.env.PROVIDER_BASE_URL || 'https://openrouter.ai/api/v1').trim()

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
        baseURL,
        headers: {
          'HTTP-Referer': 'https://devkernelpulse.org',
          'X-Title': 'DevKernelPulse Trinity Engine'
        }
      })
    : null

  const openAIClient = openAIKey
    ? createOpenAI({
        apiKey: openAIKey
      })
    : null

  const getCandidateList = (dkpModel: string): string[] => {
    switch (dkpModel) {
      case 'dkp-coder':
        return [
          'nvidia/nemotron-3.5-super-vl:free',
          'nvidia/nemotron-3.5-lightning:free',
          'nvidia/nemotron-3-ultra-550b-a55b:free',
          'openrouter/free'
        ]
      case 'dkp-pro':
        return [
          'nvidia/nemotron-3-ultra-550b-a55b:free',
          'nvidia/nemotron-3.5-super-vl:free',
          'google/gemma-4-31b-it:free',
          'nvidia/nemotron-3.5-lightning:free',
          'openrouter/free'
        ]
      case 'dkp-flash':
      default:
        return [
          'nvidia/nemotron-3.5-lightning:free',
          'google/gemma-4-26b-a4b-it:free',
          'google/gemma-4-31b-it:free',
          'nvidia/nemotron-3-ultra-550b-a55b:free',
          'openrouter/free'
        ]
    }
  }

  const getModelNames = (dkpModel: string) => {
    const list = getCandidateList(dkpModel)
    return {
      primary: list[0],
      fallback: list[1]
    }
  }

  return {
    openRouterClient,
    openAIClient,
    getModelNames,

    async executeWithFallback(executeStream: (client: any, modelName: string) => Promise<any>, dkpModel: string) {
      const now = Date.now()
      const tryOpenRouterFirst = openRouterClient && now > openRouterCircuitOpenUntil
      const tryOpenAIFirst = openAIClient && now > openAICircuitOpenUntil && !tryOpenRouterFirst

      if (!tryOpenRouterFirst && !tryOpenAIFirst) {
        throw new Error('Chiave provider AI mancante (OPENROUTER_API_KEY / PROVIDER_API_KEY) o circuit breaker aperto.')
      }

      const chatClientAdapter = (rawClient: any) => (modelId: string) => rawClient.chat(modelId)

      const executeWithTimeout = async (rawClient: any, model: string, isOpenRouter: boolean) => {
        const adaptedClient = chatClientAdapter(rawClient)
        return Promise.race([
          executeStream(adaptedClient, model),
          new Promise((_, reject) => setTimeout(() => reject(new Error(`TIMEOUT (${model})`)), PROVIDER_TIMEOUT_MS))
        ])
          .then((res) => {
            if (isOpenRouter) consecutiveErrorsOpenRouter = 0
            else consecutiveErrorsOpenAI = 0
            return res
          })
          .catch((err: any) => {
            if (isOpenRouter) {
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
        const liveFreeSet = await getLiveOpenRouterFreeModels(baseURL)
        const rawCandidates = getCandidateList(dkpModel)
        const verifiedCandidates = liveFreeSet.size > 0
          ? rawCandidates.filter(m => m === 'openrouter/free' || liveFreeSet.has(m))
          : rawCandidates

        if (liveFreeSet.size > 0) {
          for (const id of liveFreeSet) {
            if (!verifiedCandidates.includes(id) && verifiedCandidates.length < 6) {
              verifiedCandidates.push(id)
            }
          }
        }

        const modelsToTry = verifiedCandidates.length > 0 ? verifiedCandidates : rawCandidates
        let lastError: any = null

        for (const candidateModel of modelsToTry) {
          try {
            return await executeWithTimeout(openRouterClient, candidateModel, true)
          } catch (err: any) {
            lastError = err
            console.warn(`[AI Router] Modello ${candidateModel} fallito per ${dkpModel}: ${err?.message || err}. Passo al successivo...`)
          }
        }

        if (openAIClient && now > openAICircuitOpenUntil) {
          return await executeWithTimeout(openAIClient, 'gpt-4o-mini', false)
        }

        throw new Error(`Nessun modello free disponibile al momento per ${dkpModel}: ${lastError?.message || 'Errore upstream'}`)
      }

      if (tryOpenAIFirst) {
        return await executeWithTimeout(openAIClient, 'gpt-4o-mini', false)
      }
    }
  }
}