// server/utils/ai.ts
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

const apiKey = process.env.OPENROUTER_API_KEY

if (!apiKey) {
  console.warn('⚠️ OPENROUTER_API_KEY non trovata nelle variabili d\'ambiente (.env).')
}

// Inizializzazione istanza centralizzata OpenRouter
export const openrouter = createOpenRouter({
  apiKey: apiKey || '',
  // Opzionale: aggiunge informazioni sulle metriche DKP ad OpenRouter
  extraBody: {
    site_url: 'https://devkernelpulse.org',
    site_name: 'DevKernelPulse Platform'
  }
})

// Alias pratici per i modelli per tutta la piattaforma:
export const AI_MODELS = {
  // Modello ultra-veloce ed economico per moderation e sentiment (Sentinel AI, Tagging)
  FAST: openrouter('google/gemini-2.0-flash-001'), 
  
  // Modello bilanciato per generazione articoli, summary e SAST review
  BALANCED: openrouter('openai/gpt-4o-mini'),
  
  // Modello avanzato per la Chat Pulse Nexus e l'analisi di architetture complesse
  SMART: openrouter('anthropic/claude-3.5-haiku')
}