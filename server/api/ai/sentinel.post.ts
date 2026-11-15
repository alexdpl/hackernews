// server/api/ai/sentinel.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { generateText } from 'ai'
import { getSmartAIProvider } from '../../utils/aiRouter'
import { callOpenRouterStructured } from '../../utils/openrouterStructured'

export interface SentinelApiRequest {
  title?: string
  content: string
  contextType?: 'COMMENT' | 'POST' | 'CODE_SCAN'
}

export interface SentinelStructuredDecision {
  isAllowed: boolean
  isFlagged: boolean
  riskScore: number
  flagReason: string
  suggestedAction: 'approve' | 'flag_admin' | 'reject'
  detectedThreats: string[]
}

export interface SentinelApiResponse {
  success: boolean
  data: any
  timestamp: string
}

const SENTINEL_SYSTEM_PROMPT = `Sei DKP Pulse Sentinel, un firewall e moderatore AI per DevKernelPulse v2.6.
Analizza il contenuto e valuta il livello di sicurezza.
Linee guida:
- Contenuto sicuro = tech, coding, snippet di codice, discussioni civili -> isAllowed: true, isFlagged: false, suggestedAction: "approve", flagReason: "".
- Contenuto dubbio = link sospetti o linguaggio ambiguo -> isAllowed: true, isFlagged: true, suggestedAction: "flag_admin".
- Contenuto bloccato = spam commerciale, odio, credential leak reali o exploit malevoli attivi -> isAllowed: false, isFlagged: true, suggestedAction: "reject".`

export default defineEventHandler(async (event): Promise<SentinelApiResponse> => {
  try {
    const body = await readBody<SentinelApiRequest>(event)
    const content = body?.content?.trim()
    const title = body?.title?.trim() || 'Senza Titolo'
    const contextType = body?.contextType || 'POST'

    if (!content) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Il campo "content" è obbligatorio per l\'analisi di sicurezza Sentinel.'
      })
    }

    // 1. Chiamata primaria con OpenRouter Structured Outputs (strict: true + Response Healing)
    const structuredRes = await callOpenRouterStructured<SentinelStructuredDecision>({
      schemaName: 'dkp_sentinel_firewall_decision',
      model: 'google/gemini-2.0-flash-001',
      temperature: 0.1,
      systemPrompt: SENTINEL_SYSTEM_PROMPT,
      userPrompt: `CONTESTO: ${contextType}\nTITOLO: ${title}\nCONTENUTO:\n${content.slice(0, 8000)}`,
      schema: {
        type: 'object',
        properties: {
          isAllowed: { type: 'boolean', description: 'True se il contenuto può essere pubblicato' },
          isFlagged: { type: 'boolean', description: 'True se richiede attenzione o moderazione' },
          riskScore: { type: 'number', description: 'Punteggio rischio da 0 a 100' },
          flagReason: { type: 'string', description: 'Stringa vuota se sicuro, motivo dettagliato se flaggato/bloccato' },
          suggestedAction: {
            type: 'string',
            enum: ['approve', 'flag_admin', 'reject'],
            description: 'Azione consigliata dal firewall'
          },
          detectedThreats: {
            type: 'array',
            items: { type: 'string' },
            description: 'Elenco minacce rilevate oppure array vuoto'
          }
        },
        required: ['isAllowed', 'isFlagged', 'riskScore', 'flagReason', 'suggestedAction', 'detectedThreats']
      },
      fallback: {
        isAllowed: true,
        isFlagged: false,
        riskScore: 0,
        flagReason: '',
        suggestedAction: 'approve',
        detectedThreats: []
      }
    })

    if (!structuredRes.fallbackUsed) {
      return {
        success: true,
        data: {
          ...structuredRes.data,
          evaluatedByLlm: true,
          structuredSchema: 'dkp_sentinel_firewall_decision',
          providerUsed: `OpenRouter Structured (${structuredRes.providerModel})`
        },
        timestamp: new Date().toISOString()
      }
    }

    // 2. Fallback sul tuo Smart AI Router (Circuit Breaker) se OpenRouter direct non è disponibile
    const aiRouter = getSmartAIProvider()
    const result = await aiRouter.executeWithFallback(async (client, modelName) => {
      return await generateText({
        model: client(modelName),
        system: `${SENTINEL_SYSTEM_PROMPT}\nRestituisci SOLO JSON con: isAllowed, isFlagged, riskScore, flagReason, suggestedAction, detectedThreats.`,
        prompt: `TITOLO: ${title}\nCONTENUTO: ${content}`,
        temperature: 0.1
      })
    }, 'dkp-flash')

    const rawResponse = result.text.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsedData = JSON.parse(rawResponse)

    return {
      success: true,
      data: {
        ...parsedData,
        evaluatedByLlm: true,
        providerUsed: 'Smart AI Router (Circuit Breaker Fallback)'
      },
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    console.error('❌ [Sentinel API Endpoint Error]:', error)
    if (error.statusCode) throw error

    // FAIL-OPEN POLICY: Se l'IA è giù, non blocchiamo l'azione dell'utente ma lo flagghiamo per admin
    return {
      success: false,
      data: {
        isAllowed: true,
        isFlagged: true,
        riskScore: 50,
        flagReason: 'Errore interno Sentinel AI Router. Approvato con riserva (Fail-open).',
        suggestedAction: 'flag_admin',
        detectedThreats: ['API_GATEWAY_EXCEPTION'],
        evaluatedByLlm: false,
        providerUsed: 'SYSTEM_ERROR_FALLBACK'
      },
      timestamp: new Date().toISOString()
    }
  }
})