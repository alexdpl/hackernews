// server/utils/openrouter.ts
import { createOpenAI } from '@ai-sdk/openai'

if (!process.env.OPENROUTER_API_KEY) {
  console.warn('[OpenRouter] WARNING: OPENROUTER_API_KEY non presente nel file .env')
}

export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
  headers: {
    'HTTP-Referer': 'https://devkernelpulse.org',
    'X-Title': 'DevKernelPulse Trinity Engine'
  }
})