// server/utils/kernelSecurityPolicy.ts
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash, createHmac } from 'node:crypto'
import type { H3Event } from 'h3'
import { getHeader, getRequestIP } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from './db'

export type AgentPolicyMode = 'human' | 'verified_agent' | 'unverified_bot' | 'blocked_policy'

export interface KernelSecurityContext {
  ipHash: string
  uaHash: string
  userAgent: string
  agentMode: AgentPolicyMode
  agentIdentifier: string | null
  riskScore: number
  policyRulesLoaded: boolean
}

let cachedBemyAgentDoc: { content: string; loadedAt: number } | null = null
let schemaEnsured = false

export function getKernelHmacSecret(): string {
  return (
    process.env.NUXT_SESSION_SECRET ||
    process.env.JWT_SECRET ||
    process.env.DATABASE_URL ||
    'dkp-kernel-v2.6-pure-sql-fallback-secret'
  ).trim()
}

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export function signKernelPayload(payload: string): string {
  return createHmac('sha256', getKernelHmacSecret()).update(payload).digest('hex')
}

export async function loadBemyAgentPolicy(): Promise<{ content: string; loaded: boolean }> {
  const now = Date.now()
  if (cachedBemyAgentDoc && now - cachedBemyAgentDoc.loadedAt < 60_000) {
    return { content: cachedBemyAgentDoc.content, loaded: cachedBemyAgentDoc.content.length > 0 }
  }

  try {
    const filePath = resolve(process.cwd(), 'BEMYAGENT.md')
    const raw = await readFile(filePath, 'utf8')
    cachedBemyAgentDoc = { content: raw, loadedAt: now }
    return { content: raw, loaded: true }
  } catch {
    cachedBemyAgentDoc = { content: '', loadedAt: now }
    return { content: '', loaded: false }
  }
}

export async function ensureKernelSecurityTables(db: any): Promise<void> {
  if (schemaEnsured || !db) return

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS dkp_captcha_challenges (
      id VARCHAR(64) PRIMARY KEY,
      answer_hash VARCHAR(64) NOT NULL,
      difficulty SMALLINT NOT NULL DEFAULT 1,
      risk_score SMALLINT NOT NULL DEFAULT 0,
      agent_mode VARCHAR(32) NOT NULL DEFAULT 'human',
      ip_hash VARCHAR(64) NOT NULL,
      attempts SMALLINT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ NULL
    );
  `).catch(() => null)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS dkp_translation_cache (
      id SERIAL PRIMARY KEY,
      source_sha256 VARCHAR(64) NOT NULL,
      source_lang VARCHAR(8) NOT NULL DEFAULT 'AUTO',
      target_lang VARCHAR(8) NOT NULL,
      source_text TEXT NOT NULL,
      translated_text TEXT NOT NULL,
      provider VARCHAR(40) NOT NULL DEFAULT 'dkp-kernel-dict',
      hit_count INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (source_sha256, target_lang)
    );
  `).catch(() => null)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS dkp_sentinel_security_events (
      id SERIAL PRIMARY KEY,
      module VARCHAR(48) NOT NULL,
      event_type VARCHAR(64) NOT NULL,
      severity VARCHAR(16) NOT NULL DEFAULT 'info',
      ip_hash VARCHAR(64) NOT NULL,
      agent_mode VARCHAR(32) NOT NULL DEFAULT 'human',
      risk_score SMALLINT NOT NULL DEFAULT 0,
      details JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `).catch(() => null)

  schemaEnsured = true
}

export async function logSentinelSecurityEvent(
  db: any,
  params: {
    module: 'dkp-captcha' | 'dkp-translator' | 'kernel-gateway'
    eventType: string
    severity?: 'info' | 'warn' | 'block'
    ipHash: string
    agentMode: AgentPolicyMode
    riskScore: number
    details?: Record<string, unknown>
  }
): Promise<void> {
  if (!db) return
  try {
    await ensureKernelSecurityTables(db)
    const serialized = JSON.stringify(params.details || {})
    await db.execute(sql`
      INSERT INTO dkp_sentinel_security_events (module, event_type, severity, ip_hash, agent_mode, risk_score, details)
      VALUES (
        ${params.module},
        ${params.eventType},
        ${params.severity || 'info'},
        ${params.ipHash},
        ${params.agentMode},
        ${Math.max(0, Math.min(100, Math.round(params.riskScore)))},
        ${serialized}::jsonb
      )
    `)
  } catch {
    // Non-bloccante sul flusso principale
  }
}

export async function evaluateKernelSecurityContext(event: H3Event): Promise<KernelSecurityContext> {
  const rawIp = getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1'
  const userAgent = String(getHeader(event, 'user-agent') || '').slice(0, 300)
  const declaredAgent = String(getHeader(event, 'x-bemyagent-id') || getHeader(event, 'x-agent-name') || '').trim()
  const agentToken = String(getHeader(event, 'x-bemyagent-token') || '').trim()
  const acceptLang = String(getHeader(event, 'accept-language') || '')

  const salt = getKernelHmacSecret().slice(0, 16)
  const ipHash = sha256Hex(`${salt}:ip:${rawIp}`)
  const uaHash = sha256Hex(`${salt}:ua:${userAgent}`)

  const policy = await loadBemyAgentPolicy()
  let agentMode: AgentPolicyMode = 'human'
  let riskScore = 10

  const isAutomatedUa = /(curl|wget|python-requests|scrapy|httpclient|go-http-client|headless|playwright|puppeteer|selenium|bot|spider|crawler)/i.test(userAgent)

  if (declaredAgent || agentToken) {
    const expectedEnvToken = (process.env.BEMYAGENT_TOKEN || '').trim()
    const validSignature =
      (expectedEnvToken && agentToken === expectedEnvToken) ||
      (agentToken.length >= 16 && /^[a-z0-9_-]{2,48}$/i.test(declaredAgent))

    if (validSignature) {
      agentMode = 'verified_agent'
      riskScore = 15
    } else {
      agentMode = 'blocked_policy'
      riskScore = 90
    }
  } else if (isAutomatedUa) {
    agentMode = 'unverified_bot'
    riskScore = 72
  } else {
    if (!userAgent || userAgent.length < 12) riskScore += 30
    if (!acceptLang) riskScore += 15
  }

  // Telemetria storica Pure SQL su Sentinel negli ultimi 15 minuti
  try {
    const db = await getDb()
    if (db) {
      await ensureKernelSecurityTables(db)
      const recentRes: any = await db.execute(sql`
        SELECT
          COUNT(*) FILTER (WHERE severity IN ('warn', 'block'))::int AS bad_events,
          COUNT(*)::int AS total_events
        FROM dkp_sentinel_security_events
        WHERE ip_hash = ${ipHash}
          AND created_at > NOW() - INTERVAL '15 minutes'
      `)
      const row = (Array.isArray(recentRes) ? recentRes : (recentRes?.rows || []))[0] || {}
      const badEvents = Number(row.bad_events || 0)
      const totalEvents = Number(row.total_events || 0)
      if (badEvents > 0) riskScore += Math.min(45, badEvents * 15)
      if (totalEvents > 25) riskScore += 20
    }
  } catch {
    // Continua con score euristico
  }

  riskScore = Math.max(0, Math.min(100, riskScore))
  if (riskScore >= 85 && agentMode !== 'verified_agent') {
    agentMode = 'blocked_policy'
  }

  return {
    ipHash,
    uaHash,
    userAgent,
    agentMode,
    agentIdentifier: declaredAgent || null,
    riskScore,
    policyRulesLoaded: policy.loaded
  }
}