// server/api/admin/cli-analytics.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { apiLogs } from '~~/server/db/schema'

export default defineEventHandler(async () => {
  const db = getDb()

  try {
    // Aggregazione chiamate per endpoint/operazione CLI nelle ultime 24 ore
    const commandStats = await db.execute(sql`
      SELECT 
        endpoint,
        COUNT(*) as total_calls,
        AVG(latency_ms) as avg_latency,
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
      FROM ${apiLogs}
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY endpoint
      ORDER BY total_calls DESC
    `)

    return {
      success: true,
      data: {
        timeframe: '24h',
        commands: commandStats.rows.map((row: any) => ({
          command: row.endpoint.includes('vault') ? 'dkp vault notarize' :
                   row.endpoint.includes('scan') ? 'dkp ai scan' :
                   row.endpoint.includes('data') ? 'dkp sync' : 'dkp api exec',
          endpoint: row.endpoint,
          totalCalls: Number(row.total_calls),
          avgLatencyMs: Math.round(Number(row.avg_latency) || 0),
          errorCount: Number(row.error_count)
        }))
      }
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})