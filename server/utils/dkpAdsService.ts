// server/utils/dkpAdsService.ts
import crypto from 'node:crypto'
import { sql } from 'drizzle-orm'

export type AdPlacement = 'nodeTalks' | 'blogSidebar' | 'feedInline' | 'docs' | 'global'
export type AdTier = 'HOUSE' | 'STARTER' | 'PRO_NODE' | 'ECOSYSTEM_TAKEOVER' | 'CLICKS_100'
export type AdBillingModel = 'CLICKS' | 'IMPRESSIONS' | 'HYBRID'

export interface DkpAdCampaign {
  id: string
  title: string
  tagline: string
  badge: string
  categoryTag?: string
  ctaText: string
  targetUrl: string
  isInternal: boolean
  placement: AdPlacement
  tier: AdTier
  billingModel: AdBillingModel
  accentColor: 'emerald' | 'sky' | 'purple' | 'amber'
  impressionsCount: number
  clicksCount: number
  maxImpressions: number | null
  maxClicks: number | null
  buyerName?: string
  buyerEmail?: string
  status: 'active' | 'paused' | 'exhausted' | 'pending'
  createdAt?: string
}

const LEGACY_ROUTE_REWRITES: Record<string, string> = {
  '/talks': '/nodes',
  '/node-talks': '/nodes',
  '/nodetalks': '/nodes',
  '/vault': '/nodes/n/blockchain-vault',
  '/proof-of-code': '/user/dashboard?tab=vault',
  '/sdk': '/docs/api',
  '/api-docs': '/docs/api',
  '/sentinel': '/docs/ecosystem',
  '/openui': '/playground',
  '/studio': '/playground',
  '/bounty': '/bounties',
  '/keys': '/user/dashboard?tab=api'
}

export const DKP_HOUSE_CAMPAIGNS: DkpAdCampaign[] = [
  {
    id: 'house-sdk-v1',
    title: '@devkernelpulse/sdk v1.0.0 Stable',
    tagline: 'Integra AI Trinity, notarizzazione SHA-256 on-chain e Pulse Sentinel SAST nelle tue app TypeScript/JS con 3 righe di codice.',
    badge: 'OFFICIAL NPM SDK',
    categoryTag: 'SDK',
    ctaText: 'Esplora Docs & Snippet',
    targetUrl: '/docs/api',
    isInternal: true,
    placement: 'global',
    tier: 'HOUSE',
    billingModel: 'IMPRESSIONS',
    accentColor: 'emerald',
    impressionsCount: 0,
    clicksCount: 0,
    maxImpressions: null,
    maxClicks: null,
    status: 'active'
  },
  {
    id: 'house-blockchain-vault',
    title: 'DKP Blockchain Vault© & Ledger Auditor',
    tagline: 'Notarizza thread, articoli e snippet con hash SHA-256 concatenato e Merkle Root verificabile pubblicamente su Pure-SQL.',
    badge: 'ON-CHAIN SECURITY',
    categoryTag: 'VAULT',
    ctaText: 'Apri Nodo Vault',
    targetUrl: '/nodes/n/blockchain-vault',
    isInternal: true,
    placement: 'global',
    tier: 'HOUSE',
    billingModel: 'IMPRESSIONS',
    accentColor: 'sky',
    impressionsCount: 0,
    clicksCount: 0,
    maxImpressions: null,
    maxClicks: null,
    status: 'active'
  },
  {
    id: 'house-sentinel-sast',
    title: 'Pulse Sentinel SAST • Strict JSON Engine',
    tagline: 'Audit statico del codice e firewall AI alimentato da OpenRouter Structured Outputs (strict: true) con risposta deterministica.',
    badge: 'AI FIREWALL v2.6',
    categoryTag: 'SECURITY',
    ctaText: 'Scopri Architettura',
    targetUrl: '/docs/ecosystem',
    isInternal: true,
    placement: 'global',
    tier: 'HOUSE',
    billingModel: 'IMPRESSIONS',
    accentColor: 'purple',
    impressionsCount: 0,
    clicksCount: 0,
    maxImpressions: null,
    maxClicks: null,
    status: 'active'
  },
  {
    id: 'house-api-console',
    title: 'DKP API Console & Neural Gateway',
    tagline: 'Genera le tue API Keys crittografate (dkp_live_) e accedi ai modelli DKP-Flash, DKP-Coder e DKP-Pro in streaming.',
    badge: 'DEVELOPER CLOUD',
    categoryTag: 'API',
    ctaText: 'Genera API Key',
    targetUrl: '/user/dashboard?tab=api',
    isInternal: true,
    placement: 'global',
    tier: 'HOUSE',
    billingModel: 'IMPRESSIONS',
    accentColor: 'emerald',
    impressionsCount: 0,
    clicksCount: 0,
    maxImpressions: null,
    maxClicks: null,
    status: 'active'
  },
  {
    id: 'house-bounties-pulse',
    title: 'DKP Bounty Hub & $PULSE Rewards',
    tagline: 'Risolvi issue open-source, supera l audit SAST e riscatta ricompense verificabili direttamente dal tuo profilo developer.',
    badge: 'BOUNTY PROGRAM',
    categoryTag: 'BOUNTIES',
    ctaText: 'Vedi Bounty Attivi',
    targetUrl: '/bounties',
    isInternal: true,
    placement: 'global',
    tier: 'HOUSE',
    billingModel: 'IMPRESSIONS',
    accentColor: 'amber',
    impressionsCount: 0,
    clicksCount: 0,
    maxImpressions: null,
    maxClicks: null,
    status: 'active'
  }
]

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export function resolveSafeAdUrl(rawUrl: string): { url: string; isInternal: boolean } {
  const trimmed = String(rawUrl || '').trim()
  if (!trimmed || /^(javascript|data|vbscript):/i.test(trimmed)) {
    return { url: '/nodes', isInternal: true }
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed)
      if (parsed.hostname.endsWith('devkernelpulse.org')) {
        const internalPath = `${parsed.pathname}${parsed.search}${parsed.hash}` || '/nodes'
        return resolveSafeAdUrl(internalPath)
      }
      return { url: parsed.toString(), isInternal: false }
    } catch {
      return { url: '/nodes', isInternal: true }
    }
  }

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const [basePath, queryPart] = normalizedPath.split('?')
  const cleanBase = basePath.replace(/\/+$/, '') || '/'

  if (LEGACY_ROUTE_REWRITES[cleanBase]) {
    const rewritten = LEGACY_ROUTE_REWRITES[cleanBase]
    return {
      url: queryPart && !rewritten.includes('?') ? `${rewritten}?${queryPart}` : rewritten,
      isInternal: true
    }
  }

  return { url: normalizedPath, isInternal: true }
}

function mapDbRowToCampaign(r: any, fallbackPlacement: AdPlacement = 'global'): DkpAdCampaign {
  const safe = resolveSafeAdUrl(r.target_url)
  const rawBilling = String(r.billing_model || 'HYBRID').toUpperCase()
  const billingModel: AdBillingModel =
    rawBilling === 'CLICKS' || rawBilling === 'IMPRESSIONS' || rawBilling === 'HYBRID'
      ? rawBilling
      : 'HYBRID'

  const rawStatus = String(r.status || 'active').toLowerCase()
  const status: DkpAdCampaign['status'] =
    rawStatus === 'paused' || rawStatus === 'exhausted' || rawStatus === 'pending'
      ? rawStatus
      : 'active'

  return {
    id: String(r.id),
    title: String(r.title || ''),
    tagline: String(r.tagline || ''),
    badge: String(r.badge || 'SPONSORED'),
    categoryTag: String(r.category_tag || r.badge || 'LIBRI AMAZON'),
    ctaText: String(r.cta_text || 'Vedi su Amazon'),
    targetUrl: safe.url,
    isInternal: Boolean(r.is_internal) && safe.isInternal,
    placement: (r.placement || fallbackPlacement) as AdPlacement,
    tier: (r.tier || 'CLICKS_100') as AdTier,
    billingModel,
    accentColor: (r.accent_color || 'amber') as DkpAdCampaign['accentColor'],
    impressionsCount: Number(r.impressions_count || 0),
    clicksCount: Number(r.clicks_count || 0),
    maxImpressions: r.max_impressions !== null && r.max_impressions !== undefined ? Number(r.max_impressions) : null,
    maxClicks: r.max_clicks !== null && r.max_clicks !== undefined ? Number(r.max_clicks) : 100,
    buyerName: r.buyer_name ? String(r.buyer_name) : 'alexdpl',
    buyerEmail: r.buyer_email ? String(r.buyer_email) : undefined,
    status,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined
  }
}

export class DkpAdsService {
  private static schemaReady = false

  static async ensureSchema(db: any): Promise<{ importedFrom: string[]; totalRows: number }> {
    const info = { importedFrom: [] as string[], totalRows: 0 }
    if (!db) return info

    if (!this.schemaReady) {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS dkp_ads_campaigns (
          id VARCHAR(64) PRIMARY KEY,
          title VARCHAR(160) NOT NULL,
          tagline TEXT NOT NULL,
          badge VARCHAR(48) DEFAULT 'SPONSORED',
          category_tag VARCHAR(64) DEFAULT 'LIBRI AMAZON',
          cta_text VARCHAR(64) DEFAULT 'Vedi su Amazon',
          target_url TEXT NOT NULL,
          is_internal BOOLEAN DEFAULT FALSE,
          placement VARCHAR(32) DEFAULT 'global',
          tier VARCHAR(32) DEFAULT 'CLICKS_100',
          billing_model VARCHAR(24) DEFAULT 'HYBRID',
          accent_color VARCHAR(24) DEFAULT 'amber',
          buyer_name VARCHAR(120),
          buyer_email VARCHAR(160),
          buyer_api_key_hash VARCHAR(128),
          price_paid_cents INTEGER DEFAULT 0,
          impressions_count INTEGER DEFAULT 0,
          clicks_count INTEGER DEFAULT 0,
          max_impressions INTEGER DEFAULT 10000,
          max_clicks INTEGER DEFAULT 100,
          status VARCHAR(24) DEFAULT 'active',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          expires_at TIMESTAMPTZ
        );
      `)

      await db.execute(sql`ALTER TABLE dkp_ads_campaigns ADD COLUMN IF NOT EXISTS category_tag VARCHAR(64) DEFAULT 'LIBRI AMAZON';`).catch(() => null)
      await db.execute(sql`ALTER TABLE dkp_ads_campaigns ADD COLUMN IF NOT EXISTS billing_model VARCHAR(24) DEFAULT 'HYBRID';`).catch(() => null)
      await db.execute(sql`ALTER TABLE dkp_ads_campaigns ADD COLUMN IF NOT EXISTS max_clicks INTEGER DEFAULT 100;`).catch(() => null)

      await db.execute(sql`
        UPDATE dkp_ads_campaigns
        SET
          max_clicks = COALESCE(max_clicks, 100),
          billing_model = COALESCE(NULLIF(billing_model, ''), 'HYBRID'),
          category_tag = COALESCE(NULLIF(category_tag, ''), COALESCE(badge, 'LIBRI AMAZON')),
          buyer_name = COALESCE(NULLIF(buyer_name, ''), 'alexdpl')
        WHERE max_clicks IS NULL OR billing_model IS NULL OR category_tag IS NULL OR buyer_name IS NULL;
      `).catch(() => null)

      // Migrazione dinamica sicura da eventuali tabelle legacy (ads, dkp_ads, ad_campaigns, affiliate_links)
      const legacyCandidates = ['ads', 'dkp_ads', 'ad_campaigns', 'affiliate_links']
      for (const tbl of legacyCandidates) {
        try {
          const colsRows = extractRows(
            await db.execute(sql`
              SELECT column_name
              FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = ${tbl};
            `)
          )
          if (colsRows.length === 0) continue

          const cols = new Set(colsRows.map((c: any) => String(c.column_name)))
          const urlCol = cols.has('target_url') ? 'target_url' : cols.has('url') ? 'url' : null
          const titleCol = cols.has('title') ? 'title' : cols.has('name') ? 'name' : null
          if (!urlCol || !titleCol) continue

          const idExpr = cols.has('id') ? `'legacy_${tbl}_' || id::text` : `'legacy_${tbl}_' || md5(${urlCol})`
          const descCol = cols.has('tagline') ? 'tagline' : cols.has('snippet') ? 'snippet' : cols.has('description') ? 'description' : null
          const descExpr = descCol ? `COALESCE(NULLIF(${descCol}, ''), 'Risorsa consigliata dalla community DevKernelPulse.')` : `'Risorsa consigliata dalla community DevKernelPulse.'`
          const emailCol = cols.has('buyer_email') ? 'buyer_email' : cols.has('advertiser_email') ? 'advertiser_email' : cols.has('email') ? 'email' : null
          const emailExpr = emailCol ? emailCol : `NULL`
          const buyerExpr = cols.has('buyer_name') ? `COALESCE(NULLIF(buyer_name, ''), 'alexdpl')` : `'alexdpl'`
          const clicksCol = cols.has('clicks_count') ? 'clicks_count' : cols.has('clicks') ? 'clicks' : cols.has('used_credits') ? 'used_credits' : null
          const clicksExpr = clicksCol ? `COALESCE(${clicksCol}, 0)` : `0`
          const impCol = cols.has('impressions_count') ? 'impressions_count' : cols.has('impressions') ? 'impressions' : null
          const impExpr = impCol ? `COALESCE(${impCol}, 0)` : `0`
          const maxClicksCol = cols.has('max_clicks') ? 'max_clicks' : cols.has('budget_credits') ? 'budget_credits' : null
          const maxClicksExpr = maxClicksCol ? `GREATEST(COALESCE(${maxClicksCol}, 100), 100)` : `100`
          const statusExpr = cols.has('status') ? `LOWER(COALESCE(NULLIF(status, ''), 'active'))` : `'active'`
          const createdExpr = cols.has('created_at') ? `COALESCE(created_at, NOW())` : `NOW()`

          await db.execute(
            sql.raw(`
              INSERT INTO dkp_ads_campaigns (
                id, title, tagline, badge, category_tag, cta_text, target_url, is_internal,
                placement, tier, billing_model, accent_color, buyer_name, buyer_email,
                impressions_count, clicks_count, max_impressions, max_clicks, status, created_at
              )
              SELECT
                ${idExpr},
                LEFT(COALESCE(${titleCol}, 'Libro Consigliato DKP'), 160),
                ${descExpr},
                'SPONSORED',
                'LIBRI AMAZON',
                'Vedi su Amazon',
                ${urlCol},
                FALSE,
                'global',
                'CLICKS_100',
                'CLICKS',
                'amber',
                ${buyerExpr},
                ${emailExpr},
                ${impExpr},
                ${clicksExpr},
                10000,
                ${maxClicksExpr},
                ${statusExpr},
                ${createdExpr}
              FROM ${tbl}
              WHERE ${urlCol} IS NOT NULL AND ${urlCol} <> ''
              ON CONFLICT (id) DO NOTHING;
            `)
          )
          info.importedFrom.push(tbl)
        } catch (err: any) {
          console.warn(`[DkpAdsService] Migrazione tabella ${tbl} ignorata:`, err?.message || err)
        }
      }

      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_dkp_ads_active_placement
        ON dkp_ads_campaigns (status, placement);
      `).catch(() => null)

      this.schemaReady = true
    }

    const countRows = extractRows(await db.execute(sql`SELECT COUNT(*)::int AS cnt FROM dkp_ads_campaigns;`))
    info.totalRows = Number(countRows[0]?.cnt || 0)
    return info
  }

  static async listCampaigns(
    db: any,
    options: {
      buyerName?: string
      buyerEmail?: string
      isAdmin?: boolean
      scope?: 'all' | 'mine'
    } = {}
  ): Promise<{ campaigns: DkpAdCampaign[]; diagnostics: { importedFrom: string[]; totalRows: number } }> {
    if (!db) return { campaigns: [], diagnostics: { importedFrom: [], totalRows: 0 } }
    const diagnostics = await this.ensureSchema(db)

    const buyerName = String(options.buyerName || '').trim()
    const buyerEmail = String(options.buyerEmail || '').trim().toLowerCase()
    const isAdmin = Boolean(options.isAdmin)
    const showAll = isAdmin && options.scope !== 'mine'

    const rows = showAll
      ? extractRows(
          await db.execute(sql`
            SELECT *
            FROM dkp_ads_campaigns
            ORDER BY created_at DESC, id DESC
            LIMIT 500;
          `)
        )
      : extractRows(
          await db.execute(sql`
            SELECT *
            FROM dkp_ads_campaigns
            WHERE (${buyerName} <> '' AND LOWER(COALESCE(buyer_name, '')) = LOWER(${buyerName}))
               OR (${buyerEmail} <> '' AND LOWER(COALESCE(buyer_email, '')) = LOWER(${buyerEmail}))
               OR (${isAdmin} AND COALESCE(buyer_name, '') = '')
            ORDER BY created_at DESC, id DESC
            LIMIT 500;
          `)
        )

    return {
      campaigns: rows.map((r) => mapDbRowToCampaign(r, 'global')),
      diagnostics
    }
  }

  static async serveCampaign(db: any, placement: AdPlacement = 'nodeTalks'): Promise<DkpAdCampaign> {
    let externalCandidates: DkpAdCampaign[] = []

    if (db) {
      try {
        await this.ensureSchema(db)
        const rows = extractRows(
          await db.execute(sql`
            SELECT *
            FROM dkp_ads_campaigns
            WHERE LOWER(status) = 'active'
              AND (placement = ${placement} OR placement = 'global')
              AND (
                COALESCE(billing_model, 'HYBRID') = 'CLICKS'
                OR max_impressions IS NULL
                OR COALESCE(impressions_count, 0) < max_impressions
              )
              AND (
                COALESCE(billing_model, 'HYBRID') = 'IMPRESSIONS'
                OR max_clicks IS NULL
                OR COALESCE(clicks_count, 0) < max_clicks
              )
              AND (expires_at IS NULL OR expires_at > NOW())
            ORDER BY
              CASE tier
                WHEN 'ECOSYSTEM_TAKEOVER' THEN 1
                WHEN 'PRO_NODE' THEN 2
                WHEN 'CLICKS_100' THEN 3
                WHEN 'STARTER' THEN 4
                ELSE 5
              END ASC,
              COALESCE(clicks_count, 0) ASC,
              COALESCE(impressions_count, 0) ASC,
              RANDOM()
            LIMIT 15;
          `)
        )

        externalCandidates = rows.map((r: any) => mapDbRowToCampaign(r, placement))
      } catch (err) {
        console.warn('[DkpAdsService.serveCampaign] Fallback su House Ads:', err)
      }
    }

    if (externalCandidates.length > 0 && Math.random() < 0.75) {
      const idx = Math.floor(Math.random() * externalCandidates.length)
      return externalCandidates[idx]
    }

    const houseIdx = Math.floor(Math.random() * DKP_HOUSE_CAMPAIGNS.length)
    return {
      ...DKP_HOUSE_CAMPAIGNS[houseIdx],
      placement
    }
  }

  static async serveBatch(
    db: any,
    placement: AdPlacement = 'nodeTalks',
    count = 3
  ): Promise<DkpAdCampaign[]> {
    const safeCount = Math.max(1, Math.min(6, count))
    let externalCandidates: DkpAdCampaign[] = []

    if (db) {
      try {
        await this.ensureSchema(db)
        const rows = extractRows(
          await db.execute(sql`
            SELECT *
            FROM dkp_ads_campaigns
            WHERE LOWER(status) = 'active'
              AND (placement = ${placement} OR placement = 'global')
              AND (
                COALESCE(billing_model, 'HYBRID') = 'CLICKS'
                OR max_impressions IS NULL
                OR COALESCE(impressions_count, 0) < max_impressions
              )
              AND (
                COALESCE(billing_model, 'HYBRID') = 'IMPRESSIONS'
                OR max_clicks IS NULL
                OR COALESCE(clicks_count, 0) < max_clicks
              )
              AND (expires_at IS NULL OR expires_at > NOW())
            ORDER BY
              CASE tier
                WHEN 'ECOSYSTEM_TAKEOVER' THEN 1
                WHEN 'PRO_NODE' THEN 2
                WHEN 'CLICKS_100' THEN 3
                WHEN 'STARTER' THEN 4
                ELSE 5
              END ASC,
              COALESCE(clicks_count, 0) ASC,
              COALESCE(impressions_count, 0) ASC,
              RANDOM()
            LIMIT ${safeCount};
          `)
        )

        externalCandidates = rows.map((r: any) => mapDbRowToCampaign(r, placement))
      } catch (err) {
        console.warn('[DkpAdsService.serveBatch] Fallback su House Ads:', err)
      }
    }

    const usedIds = new Set(externalCandidates.map((c) => c.id))
    const housePool = DKP_HOUSE_CAMPAIGNS.filter((h) => !usedIds.has(h.id)).map((h) => ({
      ...h,
      placement
    }))

    return [...externalCandidates, ...housePool].slice(0, safeCount)
  }

  static async trackEvent(db: any, campaignId: string, eventType: 'impression' | 'click'): Promise<void> {
    if (!db || !campaignId || campaignId.startsWith('house-')) return

    await this.ensureSchema(db)

    if (eventType === 'impression') {
      await db.execute(sql`
        UPDATE dkp_ads_campaigns
        SET
          impressions_count = COALESCE(impressions_count, 0) + 1,
          status = CASE
            WHEN COALESCE(billing_model, 'HYBRID') IN ('IMPRESSIONS', 'HYBRID')
              AND max_impressions IS NOT NULL
              AND (COALESCE(impressions_count, 0) + 1) >= max_impressions
            THEN 'exhausted'
            ELSE status
          END
        WHERE id = ${campaignId} AND LOWER(status) = 'active';
      `)
    } else if (eventType === 'click') {
      await db.execute(sql`
        UPDATE dkp_ads_campaigns
        SET
          clicks_count = COALESCE(clicks_count, 0) + 1,
          status = CASE
            WHEN COALESCE(billing_model, 'HYBRID') IN ('CLICKS', 'HYBRID')
              AND max_clicks IS NOT NULL
              AND (COALESCE(clicks_count, 0) + 1) >= max_clicks
            THEN 'exhausted'
            ELSE status
          END
        WHERE id = ${campaignId};
      `)
    }
  }

  static async createPaidCampaign(
    db: any,
    payload: {
      title: string
      tagline: string
      badge?: string
      categoryTag?: string
      ctaText?: string
      targetUrl: string
      placement?: AdPlacement
      tier?: Exclude<AdTier, 'HOUSE'>
      billingModel?: AdBillingModel
      maxClicks?: number
      maxImpressions?: number
      accentColor?: DkpAdCampaign['accentColor']
      buyerName: string
      buyerEmail: string
      apiKey?: string
    }
  ): Promise<DkpAdCampaign> {
    await this.ensureSchema(db)

    const tierConfigs: Record<Exclude<AdTier, 'HOUSE'>, { maxImpressions: number; maxClicks: number; priceCents: number; days: number }> = {
      CLICKS_100: { maxImpressions: 25_000, maxClicks: 100, priceCents: 0, days: 90 },
      STARTER: { maxImpressions: 10_000, maxClicks: 100, priceCents: 4900, days: 30 },
      PRO_NODE: { maxImpressions: 50_000, maxClicks: 500, priceCents: 14900, days: 60 },
      ECOSYSTEM_TAKEOVER: { maxImpressions: 200_000, maxClicks: 2000, priceCents: 39900, days: 90 }
    }

    const billingModel: AdBillingModel =
      payload.billingModel && ['CLICKS', 'IMPRESSIONS', 'HYBRID'].includes(payload.billingModel)
        ? payload.billingModel
        : 'CLICKS'

    const selectedTier: Exclude<AdTier, 'HOUSE'> =
      payload.tier && tierConfigs[payload.tier]
        ? payload.tier
        : billingModel === 'CLICKS'
          ? 'CLICKS_100'
          : 'PRO_NODE'

    const cfg = tierConfigs[selectedTier]
    const maxClicks = payload.maxClicks ? Math.max(10, Number(payload.maxClicks)) : cfg.maxClicks
    const maxImpressions = payload.maxImpressions ? Math.max(1000, Number(payload.maxImpressions)) : cfg.maxImpressions

    const safeLink = resolveSafeAdUrl(payload.targetUrl)
    const id = `ads_${crypto.randomBytes(6).toString('hex')}`
    const apiKeyHash = payload.apiKey
      ? crypto.createHash('sha256').update(payload.apiKey).digest('hex')
      : null

    const cleanTitle = String(payload.title).trim().slice(0, 160)
    const cleanTagline = String(payload.tagline || 'Risorsa tecnica consigliata dalla community DevKernelPulse.').trim().slice(0, 320)
    const cleanBadge = String(payload.badge || 'SPONSORED').trim().toUpperCase().slice(0, 32)
    const cleanCategoryTag = String(payload.categoryTag || 'LIBRI AMAZON').trim().toUpperCase().slice(0, 48)
    const cleanCta = String(payload.ctaText || 'Vedi su Amazon').trim().slice(0, 40)
    const cleanPlacement: AdPlacement = payload.placement || 'global'
    const cleanColor = payload.accentColor || 'amber'
    const cleanBuyerName = String(payload.buyerName || 'alexdpl').trim()
    const cleanBuyerEmail = String(payload.buyerEmail || '').trim().toLowerCase()
    const intervalLiteral = `${cfg.days} days`

    await db.execute(sql`
      INSERT INTO dkp_ads_campaigns (
        id, title, tagline, badge, category_tag, cta_text, target_url, is_internal,
        placement, tier, billing_model, accent_color, buyer_name, buyer_email, buyer_api_key_hash,
        price_paid_cents, max_impressions, max_clicks, status, expires_at
      ) VALUES (
        ${id}, ${cleanTitle}, ${cleanTagline}, ${cleanBadge}, ${cleanCategoryTag}, ${cleanCta}, ${safeLink.url}, ${safeLink.isInternal},
        ${cleanPlacement}, ${selectedTier}, ${billingModel}, ${cleanColor}, ${cleanBuyerName}, ${cleanBuyerEmail}, ${apiKeyHash},
        ${cfg.priceCents}, ${maxImpressions}, ${maxClicks}, 'active', NOW() + (${intervalLiteral})::INTERVAL
      );
    `)

    return {
      id,
      title: cleanTitle,
      tagline: cleanTagline,
      badge: cleanBadge,
      categoryTag: cleanCategoryTag,
      ctaText: cleanCta,
      targetUrl: safeLink.url,
      isInternal: safeLink.isInternal,
      placement: cleanPlacement,
      tier: selectedTier,
      billingModel,
      accentColor: cleanColor,
      impressionsCount: 0,
      clicksCount: 0,
      maxImpressions,
      maxClicks,
      buyerName: cleanBuyerName,
      buyerEmail: cleanBuyerEmail,
      status: 'active'
    }
  }

  static async updateCampaign(
    db: any,
    id: string,
    action: { type: 'status'; status: 'active' | 'paused' } | { type: 'topup'; addClicks?: number; addImpressions?: number }
  ): Promise<DkpAdCampaign | null> {
    await this.ensureSchema(db)

    if (action.type === 'topup') {
      const addClicks = Math.max(10, Number(action.addClicks || 100))
      const addImpressions = Math.max(1000, Number(action.addImpressions || 10000))
      const rows = extractRows(
        await db.execute(sql`
          UPDATE dkp_ads_campaigns
          SET
            max_clicks = COALESCE(max_clicks, 100) + ${addClicks},
            max_impressions = COALESCE(max_impressions, 10000) + ${addImpressions},
            status = 'active',
            expires_at = GREATEST(COALESCE(expires_at, NOW()), NOW()) + INTERVAL '60 days'
          WHERE id = ${id}
          RETURNING *;
        `)
      )
      return rows[0] ? mapDbRowToCampaign(rows[0]) : null
    }

    const rows = extractRows(
      await db.execute(sql`
        UPDATE dkp_ads_campaigns
        SET status = ${action.status}
        WHERE id = ${id}
        RETURNING *;
      `)
    )
    return rows[0] ? mapDbRowToCampaign(rows[0]) : null
  }

  static async deleteCampaign(db: any, id: string): Promise<boolean> {
    await this.ensureSchema(db)
    await db.execute(sql`DELETE FROM dkp_ads_campaigns WHERE id = ${id};`)
    return true
  }
}