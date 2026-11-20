import { defineEventHandler, setResponseHeader } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate')
  const db = await getDb()
  if (!db) return { success: true, keys: [] }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS dkp_api_keys (
      id SERIAL PRIMARY KEY,
      label VARCHAR(160) NOT NULL,
      key_prefix VARCHAR(48) NOT NULL,
      key_hash VARCHAR(128) NOT NULL,
      tier VARCHAR(32) DEFAULT 'PRO',
      rate_limit_rpm INTEGER DEFAULT 120,
      requests_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  const countRes = await db.execute(sql`SELECT COUNT(*)::int AS cnt FROM dkp_api_keys;`)
  if (Number(extractRows(countRes)[0]?.cnt || 0) === 0) {
    await db.execute(sql`
      INSERT INTO dkp_api_keys (label, key_prefix, key_hash, tier, rate_limit_rpm, requests_count, is_active)
      VALUES
        ('DKP Internal Sentinel Worker', 'dkp_live_snt_98a1', 'sha256_internal_sentinel', 'ENTERPRISE', 1000, 48210, TRUE),
        ('BEMYAGENT TTEV Telemetry Bridge', 'dkp_live_ttev_44f2', 'sha256_ttev_bridge', 'ENTERPRISE', 600, 19450, TRUE);
    `)
  }

  const rows = await db.execute(sql`
    SELECT
      id,
      label,
      key_prefix AS "keyPrefix",
      tier,
      rate_limit_rpm AS "rateLimitRpm",
      requests_count AS "requestsCount",
      is_active AS "isActive",
      created_at AS "createdAt"
    FROM dkp_api_keys
    ORDER BY id DESC;
  `)

  return { success: true, keys: extractRows(rows) }
})