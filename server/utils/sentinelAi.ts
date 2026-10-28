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
}

/**
 * Schema di risposta strutturata richiesto al modello AI tramite Zod
 */
const SentinelLlmSchema = z.object({
  isMalicious: z.boolean().describe("Indica se il contenuto contiene payload dannosi reali o exploit attivi"),
  isSpam: z.boolean().describe("Indica se il contenuto è spam promozionale, phishing o bot-generated"),
  semanticRiskScore: z.number().min(0).max(100).describe("Punteggio di rischio da 0 (totalmente sicuro/discussione tecnica) a 100 (attacco o spam grave)"),
  reasoning: z.string().describe("Motivazione breve della decisione in lingua italiana"),
  recommendedAction: z.enum(['approve', 'flag_admin', 'block']).describe("Azione raccomandata per i moderatori")
})

/**
 * Decodifica entità HTML ed esadecimali
 */
function normalizePayload(text: string): string {
  return text
    .replace(/&#(\d+);?/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([a-fA-F0-9]+);?/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .toLowerCase()
}

/**
 * Analisi Semantica contestuale tramite Vercel AI SDK + OpenRouter (Eseguita solo in Zona d'Ombra)
 */
async function evaluateShadowZoneWithLLM(title: string, content: string, heuristicThreats: string[], initialScore: number) {
  try {
    const { object } = await generateObject({
      model: AI_MODELS.FAST, // 🟢 Usa l'istanza centralizzata OpenRouter (es. Gemini Flash / GPT-4o-mini)
      schema: SentinelLlmSchema,
      system: `Sei Pulse Sentinel AI, un sistema di moderazione di sicurezza per il forum tecnico DevKernelPulse.
Il tuo compito è analizzare i post in 'zona d'ombra' che hanno attivato alcune euristiche di sicurezza ma potrebbero essere semplici discussioni tecniche legittime su sicurezza, vulnerabilità o codice.

Distingui rigorosamente tra:
1. Codice condiviso per scopi didattici/debug (ESEMPIO: "Come posso difendermi da questo snippet XSS?") -> APPROVA (Score basso).
2. Tentativi reali di injection, spam, phishing o attacchi al forum -> BLOCCO/FLAG (Score alto).`,
      prompt: `Titolo: "${title}"
Contenuto:
"""
${content}
"""

Euristiche Euristica Rilevate: ${heuristicThreats.join(', ')}
Punteggio di rischio euristico iniziale: ${initialScore}/100`
    })

    return object
  } catch (error) {
    console.warn('⚠️ [SENTINEL LLM FALLBACK FAILED]:', error)
    return {
      isMalicious: false,
      isSpam: true,
      semanticRiskScore: initialScore,
      reasoning: 'Impossibile completare la scansione LLM. Inviato alla coda di revisione.',
      recommendedAction: 'flag_admin' as const
    }
  }
}

/**
 * Motore Principale di Scansione Sentinel AI (Euristica + AI Hybrid)
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
      evaluatedByLlm: false
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
      evaluatedByLlm: false
    }
  }

  // 4. SHADOW ZONE (30 - 69): INVOCAZIONE ANALISI SEMANTICA CON VERCEL AI SDK + OPENROUTER
  const llmEvaluation = await evaluateShadowZoneWithLLM(title, content, threats, riskScore)

  const finalScore = llmEvaluation.semanticRiskScore
  const isAllowed = llmEvaluation.recommendedAction !== 'block'
  const isFlagged = llmEvaluation.recommendedAction !== 'approve'

  return {
    isAllowed,
    isFlagged,
    riskScore: finalScore,
    flagReason: `Sentinel AI (Analisi Semantica): ${llmEvaluation.reasoning}`,
    suggestedAction: llmEvaluation.recommendedAction,
    botComment: isFlagged 
      ? `🤖 **Pulse Sentinel AI Audit**: Discussione valutata dall'AI (${finalScore}/100). Esito: ${llmEvaluation.reasoning}` 
      : undefined,
    detectedThreats: threats,
    evaluatedByLlm: true,
    llmReasoning: llmEvaluation.reasoning
  }
}