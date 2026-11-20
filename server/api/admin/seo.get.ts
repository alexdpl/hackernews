import { defineEventHandler, setResponseHeader } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate')
  const db = await getDb()
  if (!db) return { success: true, config: {} }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS dkp_seo_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      site_title VARCHAR(255) DEFAULT 'DevKernelPulse — Tech Intelligence, AI Sentinel & Developer Nodes',
      meta_description TEXT DEFAULT 'Piattaforma developer di nuova generazione con feed tech curati, audit SAST AI, forum tecnici e notarizzazione Vault.',
      og_image TEXT DEFAULT 'https://devkernelpulse.org/og-cover.png',
      robots_policy VARCHAR(120) DEFAULT 'index, follow',
      canonical_base VARCHAR(255) DEFAULT 'https://devkernelpulse.org',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  await db.execute(sql`
    INSERT INTO dkp_seo_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
  `)

  const res = await db.execute(sql`
    SELECT
      site_title AS "siteTitle",
      meta_description AS "metaDescription",
      og_image AS "ogImage",
      robots_policy AS "robotsPolicy",
      canonical_base AS "canonicalBase",
      updated_at AS "updatedAt"
    FROM dkp_seo_settings
    WHERE id = 1;
  `)

  return { success: true, config: extractRows(res)[0] }
})