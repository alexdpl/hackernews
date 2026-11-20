import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async () => {
  const db = await getDb()
  if (!db) return { success: true, stats: [] }

  const res = await db.execute(sql`
    SELECT
      COALESCE(feed_channel, type, 'feed') AS channel,
      COALESCE(source_provider, 'HN') AS provider,
      COUNT(*)::int AS total
    FROM news
    GROUP BY 1, 2
    ORDER BY 1, 2;
  `).catch(() => [])

  const rows = Array.isArray(res) ? res : (res?.rows || [])
  return {
    success: true,
    sentinelActive: true,
    contract: 'BEMYAGENT.md',
    providers: {
      feed: ['Hacker News', 'Reddit Tech (r/programming, r/netsec)'],
      ask: ['Hacker News Ask', 'Reddit Ask (r/AskProgramming)'],
      show: ['GitHub Trending', 'GitLab Public Projects'],
      jobs: ['Datapizza Jobs (Italia)', 'TechCompenso (Italia RAL)']
    },
    stats: rows
  }
})