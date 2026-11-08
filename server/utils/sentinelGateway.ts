// server/utils/sentinelGateway.ts
import { useRuntimeConfig } from '#imports'

export interface SentinelAnalysisResult {
  allowed: boolean
  flaggedReason?: string
  sentimentScore: number
  suggestedAction: 'APPROVE' | 'FLAG' | 'BLOCK'
  providerUsed: 'GEMINI' | 'OPENAI' | 'FALLBACK_HEURISTIC'
}

/**
 * Wrapper di resilienza per Sentinel AI Gateway con gestione automatica di Fallback e Timeout.
 */
export async function analyzeContentWithSentinel(
  content: string, 
  contextType: 'COMMENT' | 'POST' | 'CODE_SCAN' = 'POST'
): Promise<SentinelAnalysisResult> {
  const config = useRuntimeConfig()
  const geminiApiKey = config.geminiApiKey || process.env.GEMINI_API_KEY
  const openAiApiKey = config.openaiApiKey || process.env.OPENAI_API_KEY

  const systemPrompt = `Sei Sentinel v2.5-GOLD, l'agente di moderazione e sicurezza dell'ecosistema DevKernelPulse.
  Analizza il seguente contenuto (${contextType}) e restituisci ESCLUSIVAMENTE un oggetto JSON valido con la seguente struttura:
  {
    "allowed": true/false,
    "flaggedReason": "Motivo eventuale o null",
    "sentimentScore": numero da 0.0 a 1.0,
    "suggestedAction": "APPROVE" | "FLAG" | "BLOCK"
  }`

  // 1. TENTATIVO PRIMARIO: Gemini API Gateway con Timeout a 6 secondi
  if (geminiApiKey) {
    try {
      const geminiResult = await callWithTimeout(
        fetchGeminiApi(content, systemPrompt, geminiApiKey),
        6000
      )
      if (geminiResult) {
        return { ...geminiResult, providerUsed: 'GEMINI' }
      }
    } catch (err: any) {
      console.warn('[Sentinel Gateway] Gemini API Fallita o in Timeout, attivazione Fallback...', err?.message || err)
    }
  }

  // 2. SECONDARY TENTATIVO (FALLBACK): OpenAI Gateway
  if (openAiApiKey) {
    try {
      const openAiResult = await callWithTimeout(
        fetchOpenAiApi(content, systemPrompt, openAiApiKey),
        6000
      )
      if (openAiResult) {
        return { ...openAiResult, providerUsed: 'OPENAI' }
      }
    } catch (err: any) {
      console.warn('[Sentinel Gateway] OpenAI Fallback fallito:', err?.message || err)
    }
  }

  // 3. TERZIARIO: Fallback Euristico Locale (Protezione totale anti-crash server)
  console.info('[Sentinel Gateway] Utilizzo motore di analisi euristico locale per sicurezza.')
  return runHeuristicFallback(content)
}

/**
 * Chiamata nativa a Gemini API con validazione dell'header di auth
 */
async function fetchGeminiApi(promptText: string, systemPrompt: string, apiKey: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nContenuto da analizzare:\n${promptText}` }]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    })
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
  return parseJsonSafe(rawText)
}

/**
 * Chiamata di backup a OpenAI API
 */
async function fetchOpenAiApi(promptText: string, systemPrompt: string, apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: promptText }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  const rawText = data?.choices?.[0]?.message?.content
  return parseJsonSafe(rawText)
}

/**
 * Parsing sicuro del JSON con pulizia da Markdown formatting
 */
function parseJsonSafe(rawText?: string) {
  if (!rawText) return null
  try {
    const cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()

    const parsed = JSON.parse(cleaned)
    return {
      allowed: typeof parsed.allowed === 'boolean' ? parsed.allowed : true,
      flaggedReason: parsed.flaggedReason || undefined,
      sentimentScore: typeof parsed.sentimentScore === 'number' ? parsed.sentimentScore : 0.9,
      suggestedAction: parsed.suggestedAction || 'APPROVE'
    }
  } catch {
    return null
  }
}

/**
 * Wrapper per forzare il timeout delle chiamate esterne
 */
function callWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout di ${ms}ms superato`)), ms)
    )
  ])
}

/**
 * Algoritmo euristico locale di emergenza
 */
function runHeuristicFallback(text: string): SentinelAnalysisResult {
  const forbiddenKeywords = ['malware', 'exploit', 'spam', 'phishing']
  const containsForbidden = forbiddenKeywords.some(kw => text.toLowerCase().includes(kw))

  return {
    allowed: !containsForbidden,
    flaggedReason: containsForbidden ? 'Keyword sospetta rilevata da euristica locale' : undefined,
    sentimentScore: containsForbidden ? 0.2 : 0.95,
    suggestedAction: containsForbidden ? 'FLAG' : 'APPROVE',
    providerUsed: 'FALLBACK_HEURISTIC'
  }
}