// server/api/ai/sentinel.post.ts
import { defineEventHandler, readBody, createError } from 'h3'

export interface SentinelApiRequest {
  title?: string
  content: string
  contextType?: 'COMMENT' | 'POST' | 'CODE_SCAN'
}

export interface SentinelApiResponse {
  success: boolean
  data: SentinelScanResult
  timestamp: string
}

export default defineEventHandler(async (event): Promise<SentinelApiResponse> => {
  try {
    const body = await readBody<SentinelApiRequest>(event)

    // Convalida dell'input
    const content = body?.content?.trim()
    const title = body?.title?.trim() || 'Senza Titolo'

    if (!content) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Il campo "content" è obbligatorio per l\'analisi di sicurezza Sentinel.'
      })
    }

    // Invocazione del motore ibrido di analisi (Euristica + AI Multi-Provider Fallback)
    const scanResult = await scanWithSentinelAI(title, content)

    return {
      success: true,
      data: scanResult,
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    console.error('❌ [Sentinel API Endpoint Error]:', error)

    // Se l'errore è già una H3Error (es. 400 Bad Request), lo rilanciamo
    if (error.statusCode) {
      throw error
    }

    // Risposta di emergenza strutturata in caso di eccezione non prevista
    return {
      success: false,
      data: {
        isAllowed: true,
        isFlagged: true,
        riskScore: 50,
        flagReason: 'Errore interno del gateway Sentinel. Inviato in coda di revisione.',
        suggestedAction: 'flag_admin',
        detectedThreats: ['API_GATEWAY_EXCEPTION'],
        evaluatedByLlm: false,
        providerUsed: 'SYSTEM_ERROR_FALLBACK'
      },
      timestamp: new Date().toISOString()
    }
  }
})