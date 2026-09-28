// server/api/admin/crawler/purge.post.ts
import { CrawlerService } from '~~/server/services/crawler.service'

export default defineEventHandler(async () => {
  const deletedCount = await CrawlerService.purgeDuplicates()
  return { success: true, message: `Eliminati ${deletedCount} doppioni dal DB Neon.` }
})