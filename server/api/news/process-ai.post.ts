// server/api/news/process-ai.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { processUnprocessedStories } from '../../utils/hnAiPipeline'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event).catch(() => ({}))
    const limit = Math.min(Number(body?.limit) || 3, 10)

    console.log(`[AI Pipeline Test] Elaborazione AI in corso per max ${limit} storie...`)

    const result = await processUnprocessedStories(limit)

    return {
      success: true,
      timestamp: new Date().toISOString(),
      processedCount: result.processedCount,
      stories: result.updated
    }
  } catch (error: any) {
    console.error('[AI Pipeline Error]:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Errore durante l'elaborazione AI: ${error.message}`
    })
  }
})