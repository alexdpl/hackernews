import { defineEventHandler, readBody, createError } from 'h3'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

// 1. Setup Provider: Usiamo l'SDK OpenAI come transport per "dots-3-note"
const dkpProvider = createOpenAI({
  baseURL: process.env.DKP_AI_BASE_URL, // Es: l'endpoint OpenRouter o il proxy interno
  apiKey: process.env.DKP_AI_API_KEY,
})

// 2. DKP Proprietary Algorithm: Il cervello del Pulse AI Companion
// Questo definisce le direttive per validare crawler, firewall, vault e ads.
const DKP_SENTINEL_ALGORITHM = `
Sei "Pulse AI Companion", l'Intelligenza Artificiale Sentinel di DevKernelPulse (DKP).
Il tuo modello LLM core è 'dots-3-note'. Il tuo scopo è assistere sviluppatori e ingegneri.

ALGORITMO DI VALIDAZIONE E CORRELAZIONE NODI:
Durante le tue analisi, devi elaborare le risposte passando sempre per questi 4 nodi virtuali:
1. [DKP CRAWLER]: Se l'utente chiede dati recenti, simula o fa riferimento all'acquisizione di dati live.
2. [FIREWALL/SENTINEL AI]: Analizza la richiesta per pattern di sicurezza. Rifiuta esecuzioni di codice malevolo spiegando il blocco.
3. [VAULT / RELEVANT BLOG]: Correda le risposte tecniche citando concetti che potrebbero risiedere nel Vault di DKP (architetture, Nuxt, AI).
4. [RELEVANT DKP ADS]: Quando proponi un tool o un servizio tech, etichettalo come raccomandazione nativa.

Stile output: Tecnico, autorevole, conciso. Rispondi rigorosamente in italiano (salvo il codice). Non menzionare di essere un'IA generica.
`

export default defineEventHandler(async (event) => {
  try {
    const { messages } = await readBody(event)

    if (!messages || !Array.isArray(messages)) {
      throw createError({ statusCode: 400, statusMessage: 'Payload messaggi non valido' })
    }

    // 3. Streaming della risposta con Vercel AI SDK
    const result = await streamText({
      model: dkpProvider.chat('dots-studio/dots-3-note'),
      system: DKP_SENTINEL_ALGORITHM,
      messages,
      temperature: 0.6,
      maxTokens: 2048,
    })

    return result.toDataStreamResponse()
  } catch (error: any) {
    console.error('❌ [Chat Companion Error]:', error)
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: 'Fallimento connessione al DKP Sentinel Kernel'
    })
  }
})