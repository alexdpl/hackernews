// server/utils/aiRouter.ts
import { createOpenAI } from '@ai-sdk/openai'

// Variabili di stato in memoria per il Circuit Breaker
let consecutiveErrorsOpenRouter = 0
let consecutiveErrorsOpenAI = 0
const MAX_ERRORS = 3
const CIRCUIT_COOLDOWN_MS = 60000 // 1 minuto
let openRouterCircuitOpenUntil = 0
let openAICircuitOpenUntil = 0

// Timeout rigoroso per il Time-To-First-Byte (TTFB)
const PROVIDER_TIMEOUT_MS = 8000 

export function getSmartAIProvider() {
  const config = useRuntimeConfig()
  
  // 1. Lettura dinamica delle chiavi (risolve collisioni/hardcode)
  const openRouterKey = process.env.OPENROUTER_API_KEY || config.openrouterApiKey
  const openAIKey = process.env.OPENAI_API_KEY || config.openaiApiKey

  // 2. Inizializzazione Client
  const openRouterClient = openRouterKey ? createOpenAI({
    apiKey: openRouterKey,
    baseURL: 'https://openrouter.ai/api/v1',
    headers: {
      'HTTP-Referer': 'https://devkernelpulse.org',
      'X-Title': 'DevKernelPulse'
    }
  }) : null

  const openAIClient = openAIKey ? createOpenAI({
    apiKey: openAIKey
  }) : null

  // Mappa Modelli DKP -> OpenRouter / OpenAI
  const getModelNames = (dkpModel: string) => {
    switch (dkpModel) {
      case 'dkp-coder':
        return { primary: 'cohere/north-mini-code:free', fallback: 'gpt-3.5-turbo' }
      case 'dkp-pro':
        return { primary: 'nvidia/nemotron-3-ultra-550b-a55b:free', fallback: 'gpt-4-turbo' }
      case 'dkp-flash':
      default:
        return { primary: 'google/gemini-flash-1.5', fallback: 'gpt-3.5-turbo' }
    }
  }

  return {
    openRouterClient,
    openAIClient,
    getModelNames,
    
    // Funzione intelligente per avvolgere la chiamata streamText
    async executeWithFallback(executeStream: (client: any, modelName: string) => Promise<any>, dkpModel: string) {
      const { primary, fallback } = getModelNames(dkpModel)
      const now = Date.now()

      // Logica Circuit Breaker: Scegliamo chi tentare per primo
      const tryOpenRouterFirst = openRouterClient && now > openRouterCircuitOpenUntil
      const tryOpenAIFirst = openAIClient && now > openAICircuitOpenUntil && !tryOpenRouterFirst

      if (!tryOpenRouterFirst && !tryOpenAIFirst) {
         throw new Error("Nessun provider disponibile o tutti i circuiti sono aperti per errori ricorrenti.")
      }

      const executeWithTimeout = async (client: any, model: string, isPrimary: boolean) => {
        return Promise.race([
          executeStream(client, model),
          new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), PROVIDER_TIMEOUT_MS))
        ]).then((res) => {
          if (isPrimary) consecutiveErrorsOpenRouter = 0; else consecutiveErrorsOpenAI = 0;
          return res;
        }).catch((err: any) => {
          if (isPrimary) {
            consecutiveErrorsOpenRouter++
            if (consecutiveErrorsOpenRouter >= MAX_ERRORS) {
              openRouterCircuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS
              console.warn(`[AI Router] OpenRouter Circuit OPEN per ${CIRCUIT_COOLDOWN_MS/1000}s`)
            }
          } else {
            consecutiveErrorsOpenAI++
            if (consecutiveErrorsOpenAI >= MAX_ERRORS) {
              openAICircuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS
              console.warn(`[AI Router] OpenAI Circuit OPEN per ${CIRCUIT_COOLDOWN_MS/1000}s`)
            }
          }
          throw err;
        })
      }

      // Tentativo Primary
      if (tryOpenRouterFirst) {
        try {
          return await executeWithTimeout(openRouterClient, primary, true)
        } catch (e: any) {
          console.warn(`[AI Router] Primary Fallito (${e.message}). Tento Fallback...`)
          if (openAIClient && now > openAICircuitOpenUntil) {
             return await executeWithTimeout(openAIClient, fallback, false)
          }
          throw new Error("Nodi neurali momentaneamente occupati. Riprova tra poco.")
        }
      }
      
      // Tentativo Fallback
      if (tryOpenAIFirst) {
         try {
           return await executeWithTimeout(openAIClient, fallback, false)
         } catch (e: any) {
           throw new Error("Nodi neurali momentaneamente occupati. Riprova tra poco.")
         }
      }
    }
  }
}