// server/api/admin/cron-trigger.ts
export default defineEventHandler(async () => {
  const cronSecret = process.env.CRON_SECRET || ''

  try {
    // Invocazione server-to-server diretta con l'header di sicurezza
    const result = await $fetch<{
      success: boolean
      processed: number
      imported: number
      cachePurged: boolean
      timestamp: string
    }>('/api/cron/fetch-news', {
      method: 'POST',
      headers: {
        'x-cron-secret': cronSecret
      }
    })

    return result
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: `Errore trigger Admin: ${error.data?.statusMessage || error.message}`
    })
  }
})