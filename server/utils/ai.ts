// server/utils/ai.ts
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

// 🟢 Legge sia PROVIDER_API_KEY che OPENROUTER_API_KEY dal file .env
const apiKey = process.env.PROVIDER_API_KEY || process.env.OPENROUTER_API_KEY

if (!apiKey) {
  console.warn('⚠️ [AI SDK WARNING]: Nessuna API Key trovata in PROVIDER_API_KEY o OPENROUTER_API_KEY!')
}

export const openrouter = createOpenRouter({
  apiKey: apiKey || ''
})

// 🟢 MODELLI 100% GRATUITI DI OPENROUTER (Non richiedono credito)
export const AI_MODELS = {
  // Router automatico gratuito che seleziona il modello disponibile migliore
  AUTO_FREE: openrouter('openrouter/free'),

  // Modello veloce per risposte rapide ed euristiche
  FAST: openrouter('meta-llama/llama-3.3-70b-instruct:free'),

  // Modello bilanciato per audit di codice, blog e Neural Playground
  BALANCED: openrouter('deepseek/deepseek-chat:free'),

  // Modello avanzato di reasoning per analisi SAST complesse e Sentinel AI
  ADVANCED: openrouter('deepseek/deepseek-r1:free')
}