// server/api/ai/sentinel.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { generateText } from 'ai'
import { getSmartAIProvider } from '~~/server/utils/aiRouter'

export interface SentinelApiRequest {
  title?: string
  content: string
  contextType?: 'COMMENT' | 'POST' | 'CODE_SCAN'
}

export interface SentinelApiResponse {
  success: boolean
  data: any
  timestamp: string
}

export default defineEventHandler(async (event): Promise<SentinelApiResponse> => {
  try {
    const body = await readBody<SentinelApiRequest>(event)
    const content = body?.content?.trim()
    const title = body?.title?.trim() || 'Senza Titolo'

    if (!content) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Il campo "content" è obbligatorio per l\'analisi di sicurezza Sentinel.'
      })
    }

    // 1. Inizializziamo lo Smart AI Router
    const aiRouter = getSmartAIProvider()
    
    const systemPrompt = `Sei DKP Pulse Sentinel, un firewall e moderatore AI. Analizza il seguente contenuto e restituisci ESATTAMENTE e SOLO un JSON valido con questa struttura:
    {
      "isAllowed": boolean,
      "isFlagged": boolean,
      "riskScore": numero da 0 a 100,
      "flagReason": "stringa vuota se ok, motivo se bloccato",
      "suggestedAction": "approve" | "flag_admin" | "reject",
      "detectedThreats": ["array di stringhe con minacce, o array vuoto"]
    }
    Linee guida:
    - Contenuto sicuro = tech, coding, discussioni civili.
    - Contenuto bloccato = spam, odio, codice malevolo evidente.`

    // 2. Chiamata con Circuit Breaker usando "generateText" invece di "streamText"
    const result = await aiRouter.executeWithFallback(async (client, modelName) => {
      return await generateText({
        model: client(modelName),
        system: systemPrompt,
        prompt: `TITOLO: ${title}\nCONTENUTO: ${content}`,
        temperature: 0.1, // Bassa per JSON deterministico
      })
    }, 'dkp-flash') // DKP-Flash (Gemini) è velocissimo ed economico per moderare

    // 3. Parsing e pulizia del JSON restituito dall'AI
    const rawResponse = result.text.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsedData = JSON.parse(rawResponse)

    return {
      success: true,
      data: {
        ...parsedData,
        evaluatedByLlm: true,
        providerUsed: 'Smart AI Router (Circuit Breaker)'
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