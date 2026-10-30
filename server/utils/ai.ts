// server/utils/ai.ts

export const AI_MODELS = {
  SENTINEL: 'google/gemini-2.0-flash-exp:free',
  MODERATOR: 'google/gemini-2.0-flash-exp:free',
  TRINITY: 'dots-studio/dots-3-note-preview:free',
  FLASH: 'google/gemini-2.0-flash-exp:free',
  CODER: 'dots-studio/dots-3-note-preview:free',
  PRO: 'nvidia/nemotron-3-ultra-550b-a55b:free'
} as const

export const OPENROUTER_MODEL_MAP: Record<string, string> = {
  'sentinel': AI_MODELS.SENTINEL,
  'moderator': AI_MODELS.MODERATOR,
  'trinity': AI_MODELS.TRINITY,
  'dkp-flash': AI_MODELS.FLASH,
  'dkp-coder': AI_MODELS.CODER,
  'dkp-pro': AI_MODELS.PRO
}

interface CallAiOptions {
  model?: string
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

export async function callOpenRouterAI(options: CallAiOptions) {
  const config = useRuntimeConfig()
  
  const apiKey = process.env.OPENROUTER_API_KEY || 
                 process.env.PROVIDER_API_KEY || 
                 config.openrouterApiKey

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY mancante nel file .env')
  }

  const requestedModel = options.model?.toLowerCase() || 'sentinel'
  const resolvedModel = OPENROUTER_MODEL_MAP[requestedModel] || options.model || AI_MODELS.SENTINEL

  const messages: Array<{ role: string; content: string }> = []
  if (options.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt })
  }
  messages.push({ role: 'user', content: options.prompt })

  const response = await $fetch<any>('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://devkernelpulse.org',
      'X-Title': 'DevKernelPulse Sentinel & Services',
      'Content-Type': 'application/json'
    },
    body: {
      model: resolvedModel,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 1000
    }
  })

  return {
    content: response.choices?.[0]?.message?.content || '',
    modelUsed: resolvedModel,
    usage: response.usage || null
  }
}