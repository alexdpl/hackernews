// server/utils/sentinelAi.ts
import { generateObject } from 'ai'
import { z } from 'zod'
import { AI_MODELS } from '~~/server/utils/ai'

export interface SentinelScanResult {
  isAllowed: boolean
  isFlagged: boolean
  riskScore: number
  flagReason?: string
  suggestedAction: 'approve' | 'flag_admin' | 'block'
  botComment?: string
  detectedThreats: string[]
  evaluatedByLlm?: boolean
  llmReasoning?: string
  providerUsed?: string
}

/**
 * Schema di risposta strutturata richiesto al modello AI tramite Zod
 */
const SentinelLlmSchema = z.object({
  isMalicious: z.boolean().describe("Indica se il contenuto contiene payload dannosi reali o exploit attivi"),
  isSpam: z.boolean().describe("Indica se il contenuto è spam promozionale, phishing o bot-generated"),
  semanticRiskScore: z.number().min(0).max(100).describe("Punteggio di rischio da 0 (totalmente sicuro) a 100 (attacco o spam grave)"),
  reasoning: z.string().describe("Motivazione breve della decisione in lingua italiana"),
  recommendedAction: z.enum(['approve', 'flag_admin', 'block']).describe("Azione raccomandata per i moderatori")
})

/**
 * Normalizzazione e decodifica entità HTML / Esadecimali per prevenire bypass da encoding
 */
function normalizePayload(text: string): string {
  return text
    .replace(/&#(\d+);?/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([a-fA-F0-9]+);?/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .toLowerCase()
}

/**
 * Helper per forzare il timeout delle chiamate esterne (6 secondi)
 */
function withTimeout<T>(promise: Promise<T>, ms = 6000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout Sentinel AI (${ms}ms) superato`)), ms)
    )
  ])
}

/**
 * Analisi Semantica in Zona d'Ombra tramite Vercel AI SDK (con fallback multi-provider resiliente)
 */
async function evaluateShadowZoneWithLLM(
  title: string, 
  content: string, 
  heuristicThreats: string[], 
  initialScore: number
) {
  const systemPrompt = `Sei Pulse Sentinel AI v2.5-GOLD, il sistema di moderazione e sicurezza di DevKernelPulse.
Il tuo compito è analizzare post in 'zona d'ombra' che hanno attivato alcune euristiche ma potrebbero essere discussioni tecniche legittime su sicurezza o codice.

Distingui rigorosamente tra:
1. Codice condiviso per scopi didattici/debug (ESEMPIO: "Come difendersi da XSS?") -> APPROVA (Score basso).
2. Tentativi reali di injection, spam promozionale, phishing o attacchi -> BLOCCO/FLAG (Score alto).`

  const promptText = `Titolo: "${title}"
Contenuto:
"""
${content}
"""

Threat Rilevati dall'Euristica: ${heuristicThreats.join(', ')}
Punteggio Rischio Euristico Iniziale: ${initialScore}/100`

  // 1. TENTATIVO PRIMARIO: Vercel AI SDK + OpenRouter / Centralized Model (AI_MODELS.FAST)
  try {
    const { object } = await withTimeout(
      generateObject({
        model: AI_MODELS.FAST,
        schema: SentinelLlmSchema,
        system: systemPrompt,
        prompt: promptText
      }),
      6000
    )

    if (object) {
      return {
        ...object,
        providerUsed: 'AI_MODELS_FAST'
      }
    }
  } catch (primaryErr: any) {
    console.warn('⚠️ [SENTINEL LLM PRIMARY FAILED]:', primaryErr?.message || primaryErr)
  }

  // 2. SECONDARY TENTATIVO: Direct Native Gemini API Fallback
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    try {
      const geminiRes = await withTimeout(callDirectGemini(systemPrompt, promptText, geminiKey), 6000)
      if (geminiRes) {
        return { ...geminiRes, providerUsed: 'GEMINI_DIRECT' }
      }
    } catch (geminiErr: any) {
      console.warn('⚠️ [SENTINEL DIRECT GEMINI FALLBACK FAILED]:', geminiErr?.message || geminiErr)
    }
  }

  // 3. TERZIARIO: Fallback Euristico di Emergenza (Evita di bloccare Nitro Server)
  return {
    isMalicious: false,
    isSpam: true,
    semanticRiskScore: initialScore,
    reasoning: 'Impossibile contattare i provider AI. Inviato alla coda di revisione admin per sicurezza.',
    recommendedAction: 'flag_admin' as const,
    providerUsed: 'LOCAL_HEURISTIC_FALLBACK'
  }
}

/**
 * Chiamata diretta di fallback a Gemini REST API
 */
async function callDirectGemini(systemPrompt: string, promptText: string, apiKey: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${promptText}` }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
    })
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = await response.json()
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!raw) return null

  const parsed = JSON.parse(raw.replace(/```json/gi, '').replace(/```/g, '').trim())
  return {
    isMalicious: !!parsed.isMalicious,
    isSpam: !!parsed.isSpam,
    semanticRiskScore: typeof parsed.semanticRiskScore === 'number' ? parsed.semanticRiskScore : 50,
    reasoning: parsed.reasoning || 'Analisi completata via fallback Gemini.',
    recommendedAction: (parsed.recommendedAction || 'flag_admin') as 'approve' | 'flag_admin' | 'block'
  }
}

/**
 * Motore Principale di Scansione Sentinel AI (Euristica + Hybrid AI Gateway)
 */
export async function scanWithSentinelAI(title: string, content: string): Promise<SentinelScanResult> {
  const rawText = `${title}\n${content}`
  const normalizedText = normalizePayload(rawText)
  
  const threats: string[] = []
  let riskScore = 0

  // 1. SCANSIONE EURISTICA RAPIDA (Rule-based)
  const xssRules = [
    { pattern: /<script\b[^<]*(?:(?!<\/script\b)<[^<]*)*<\/script\b[^>]*>/gi, points: 100, name: 'Tag <script>' },
    { pattern: /javascript\s*:/gi, points: 90, name: 'Pseudo-protocollo javascript:' },
    { pattern: /on\w+\s*=\s*["']?[^"'>]+/gi, points: 85, name: 'Event Handler Injection' },
    { pattern: /(document\.cookie|eval\s*\(|window\.location)/gi, points: 80, name: 'Manipolazione DOM' }
  ]

  for (const rule of xssRules) {
    if (rule.pattern.test(normalizedText)) {
      threats.push(rule.name)
      riskScore += rule.points
    }
  }

  const spamRules = [
    { pattern: /(bit\.ly|tinyurl\.com|cutt\.ly|t\.me\/|wa\.me\/)/gi, points: 35, name: 'URL Shortener / Link Esterno Sospetto' },
    { pattern: /(guadagna\s+subito|free\s+crypto|casino\s+online|telegram\s+group)/gi, points: 50, name: 'Keyword Scam' }
  ]

  for (const rule of spamRules) {
    if (rule.pattern.test(normalizedText)) {
      threats.push(rule.name)
      riskScore += rule.points
    }
  }

  riskScore = Math.min(100, riskScore)

  // 2. FAST PATH - SICURO (< 30)
  if (riskScore < 30) {
    return {
      isAllowed: true,
      isFlagged: false,
      riskScore,
      suggestedAction: 'approve',
      detectedThreats: threats,
      evaluatedByLlm: false,
      providerUsed: 'FAST_PATH_HEURISTIC'
    }
  }

  // 3. FAST PATH - ATTACCO CRITICO (>= 70)
  if (riskScore >= 70) {
    return {
      isAllowed: false,
      isFlagged: true,
      riskScore,
      flagReason: `Bloccato da Sentinel Euristico (${threats.join(', ')})`,
      suggestedAction: 'block',
      botComment: `🛡️ **Pulse Sentinel AI**: Thread bloccato automaticamente per violazione critica di sicurezza (${threats.join(', ')}).`,
      detectedThreats: threats,
      evaluatedByLlm: false,
      providerUsed: 'CRITICAL_PATH_HEURISTIC'
    }
  }

  // 4. SHADOW ZONE (30 - 69): ANALISI SEMANTICA CON VERCEL AI SDK + FALLBACK RESILIENTE
  const llmEvaluation = await evaluateShadowZoneWithLLM(title, content, threats, riskScore)

  const finalScore = llmEvaluation.semanticRiskScore
  const isAllowed = llmEvaluation.recommendedAction !== 'block'
  const isFlagged = llmEvaluation.recommendedAction !== 'approve'

  return {
    isAllowed,
    isFlagged,
    riskScore: finalScore,
    flagReason: `Sentinel AI (${llmEvaluation.providerUsed}): ${llmEvaluation.reasoning}`,
    suggestedAction: llmEvaluation.recommendedAction,
    botComment: isFlagged 
      ? `🤖 **Pulse Sentinel AI Audit**: Discussione valutata dall'AI (${finalScore}/100 via ${llmEvaluation.providerUsed}). Esito: ${llmEvaluation.reasoning}` 
      : undefined,
    detectedThreats: threats,
    evaluatedByLlm: true,
    llmReasoning: llmEvaluation.reasoning,
    providerUsed: llmEvaluation.providerUsed
  }
}