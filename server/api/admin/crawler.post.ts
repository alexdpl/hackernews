import { defineEventHandler } from 'h3'
import { runDkpRoundRobinCrawler } from '~~/server/utils/dkpCrawlerService'

export default defineEventHandler(async () => {
  return await runDkpRoundRobinCrawler()
})