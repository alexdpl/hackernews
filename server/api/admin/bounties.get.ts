import { defineEventHandler, setResponseHeader } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate')
  const db = await getDb()
  if (!db) return { success: true, data: [] }

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS dkp_bounties (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(80) DEFAULT 'Security & SAST',
        difficulty VARCHAR(32) DEFAULT 'MEDIUM',
        reward_eur INTEGER DEFAULT 150,
        reward_xp INTEGER DEFAULT 500,
        status VARCHAR(32) DEFAULT 'OPEN',
        claimed_by VARCHAR(120) DEFAULT '',
        repo_url TEXT DEFAULT '',
        description TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    const existing = await db.execute(sql`SELECT COUNT(*)::int AS cnt FROM dkp_bounties;`)
    const count = Number(extractRows(existing)[0]?.cnt || 0)

    if (count === 0) {
      await db.execute(sql`
        INSERT INTO dkp_bounties (title, category, difficulty, reward_eur, reward_xp, status, repo_url, description)
        VALUES
          ('Hardening SAST Parser per Snippet Rust & C++', 'Security & SAST', 'HARD', 350, 1200, 'OPEN', 'https://github.com/devkernelpulse', 'Estendere le regole euristiche AST di Pulse Sentinel per rilevare unsafe block e buffer overflow.'),
          ('Ottimizzazione Query Pure SQL Feed Cursor', 'Core Kernel', 'MEDIUM', 200, 750, 'IN_REVIEW', 'https://github.com/devkernelpulse', 'Ridurre la latenza p95 sotto 18ms sulle query paginate di pulse_stories.'),
          ('Connettore Webhook Telemetry BEMYAGENT TTEV', 'AI Sentinel', 'CRITICAL', 500, 2000, 'OPEN', 'https://github.com/devkernelpulse', 'Implementare firma HMAC-SHA256 e retry esponenziale per gli eventi sentinella.');
      `)
    }

    const res = await db.execute(sql`
      SELECT
        id,
        title,
        category,
        difficulty,
        reward_eur AS "rewardEur",
        reward_xp AS "rewardXp",
        status,
        claimed_by AS "claimedBy",
        repo_url AS "repoUrl",
        description,
        created_at AS "createdAt"
      FROM dkp_bounties
      ORDER BY id DESC;
    `)

    return { success: true, data: extractRows(res) }
  } catch (err: any) {
    console.error('[API /api/admin/bounties GET] Errore:', err)
    return { success: false, data: [], error: err?.message || 'Errore lettura bounties' }
  }
})