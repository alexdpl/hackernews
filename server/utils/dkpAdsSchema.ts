// server/utils/dkpAdsSchema.ts
import { sql } from 'drizzle-orm'

let schemaEnsured = false

export async function ensureDkpAdsSchema(db: any) {
  if (!db || schemaEnsured) return

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ads (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      tagline TEXT,
      snippet TEXT,
      badge VARCHAR(64) DEFAULT 'SPONSORED',
      category_tag VARCHAR(64) DEFAULT 'LIBRI & TECH',
      cta_text VARCHAR(64) DEFAULT 'Scopri di più',
      target_url TEXT NOT NULL,
      placement VARCHAR(64) DEFAULT 'global',
      tier VARCHAR(64) DEFAULT 'CLICKS_100',
      billing_model VARCHAR(32) DEFAULT 'CLICKS',
      accent_color VARCHAR(32) DEFAULT 'emerald',
      buyer_name VARCHAR(120),
      buyer_email VARCHAR(255),
      advertiser_email VARCHAR(255),
      status VARCHAR(32) DEFAULT 'ACTIVE',
      budget_credits INTEGER DEFAULT 100,
      used_credits INTEGER DEFAULT 0,
      max_clicks INTEGER DEFAULT 100,
      clicks INTEGER DEFAULT 0,
      clicks_count INTEGER DEFAULT 0,
      max_impressions INTEGER DEFAULT 10000,
      impressions INTEGER DEFAULT 0,
      impressions_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  // Aggiunta idempotente di tutte le colonne v2.5 e v2.6 (zero perdita dati)
  const alterStatements = [
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS tagline TEXT;`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS snippet TEXT;`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS badge VARCHAR(64) DEFAULT 'SPONSORED';`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS category_tag VARCHAR(64) DEFAULT 'LIBRI & TECH';`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS cta_text VARCHAR(64) DEFAULT 'Scopri di più';`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS placement VARCHAR(64) DEFAULT 'global';`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS tier VARCHAR(64) DEFAULT 'CLICKS_100';`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS billing_model VARCHAR(32) DEFAULT 'CLICKS';`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS accent_color VARCHAR(32) DEFAULT 'emerald';`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(120);`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(255);`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS advertiser_email VARCHAR(255);`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'ACTIVE';`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS budget_credits INTEGER DEFAULT 100;`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS used_credits INTEGER DEFAULT 0;`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS max_clicks INTEGER DEFAULT 100;`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0;`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS clicks_count INTEGER DEFAULT 0;`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS max_impressions INTEGER DEFAULT 10000;`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS impressions INTEGER DEFAULT 0;`,
    sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS impressions_count INTEGER DEFAULT 0;`
  ]

  for (const stmt of alterStatements) {
    await db.execute(stmt).catch(() => {})
  }

  // Riallineamento automatico dei ~100 record v2.5 esistenti
  await db.execute(sql`
    UPDATE ads
    SET
      tagline = COALESCE(NULLIF(tagline, ''), snippet),
      buyer_email = COALESCE(NULLIF(buyer_email, ''), advertiser_email),
      clicks = GREATEST(COALESCE(clicks, 0), COALESCE(clicks_count, 0), COALESCE(used_credits, 0)),
      impressions = GREATEST(COALESCE(impressions, 0), COALESCE(impressions_count, 0)),
      max_clicks = COALESCE(NULLIF(max_clicks, 0), NULLIF(budget_credits, 0), 100),
      max_impressions = COALESCE(NULLIF(max_impressions, 0), 10000),
      billing_model = COALESCE(NULLIF(billing_model, ''), 'CLICKS'),
      status = COALESCE(NULLIF(UPPER(status), ''), 'ACTIVE')
    WHERE
      tagline IS NULL
      OR buyer_email IS NULL
      OR clicks < COALESCE(clicks_count, 0)
      OR impressions < COALESCE(impressions_count, 0)
      OR max_clicks IS NULL
      OR billing_model IS NULL;
  `).catch(() => {})

  schemaEnsured = true
}