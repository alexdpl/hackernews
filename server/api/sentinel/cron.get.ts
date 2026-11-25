// server/api/sentinel/cron.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { getDb } from '~~/server/utils/db'
import { verifyAdminOrCronAuth } from '~~/server/utils/cronAuth'
import { runSentinelSweep } from '~~/server/utils/sentinelNetwork'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  await verifyAdminOrCronAuth(event, db)

  const query = getQuery(event)
  const recipientEmail = query.to ? String(query.to) : undefined
  const result = await runSentinelSweep({
    recipientEmail,
    triggerSource: 'github-actions-cron'
  })

  return result
})