// server/api/roadmap.get.ts
import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '../utils/db'

export interface RoadmapMilestone {
  id: string
  quarter: string
  phaseTitle: string
  version: string
  status: 'completed' | 'in-progress' | 'upcoming'
  progress: number
  description: string
  features: string[]
}

const DEFAULT_MILESTONES: RoadmapMilestone[] = [
  {
    id: 'q1-2026',
    quarter: 'Q1 2026',
    phaseTitle: 'Architettura Core & Admin Control Center',
    version: 'v2.4-GOLD',
    status: 'completed',
    progress: 100,
    description: 'Consolidamento completo dell\'area riservata Admin su moduli unificati con rotte relative.',
    features: [
      'Standardizzazione Navbar Admin Grid a 8 Moduli',
      'Persistenza Sessione Admin & Cookie dkp_session',
      'Modulo DKP Shop SaaS & Gestione Licenze',
      'Sitemap XML Dinamica con Sync Automatica'
    ]
  },
  {
    id: 'q2-2026',
    quarter: 'Q2 2026',
    phaseTitle: 'AI Repo Scanner & Reputazione S-TIER GOLD',
    version: 'v2.4-GOLD',
    status: 'completed',
    progress: 100,
    description: 'Lancio ufficiale del motore AI Link & Repository Scanner con calcolo dello score XP.',
    features: [
      'AI Repo Scanner per audit GitHub & Stack Detection',
      'Sistema di Rank Reputazione DKP (S/A/B Tier)',
      'Integrazione Agente Pulse Nexus context-aware'
    ]
  },
  {
    id: 'q3-2026',
    quarter: 'Q3 2026',
    phaseTitle: 'Firewall Live SSE & Blog Vault',
    version: 'v2.5-GOLD',
    status: 'completed',
    progress: 100,
    description: 'Rilascio delle tecnologie di sicurezza in tempo reale e Blog Engine Pro.',
    features: [
      'Firewall di Sicurezza con streaming Live SSE',
      'Blog Engine Pro con Code Vault e Tabelle Markdown',
      'API Key Management con Rate Limiting Nitro Enterprise'
    ]
  },
  {
    id: 'q4-2026',
    quarter: 'Q4 2026',
    phaseTitle: 'DKP Kernel v2.6 Pure SQL: Unificazione Ecosistema, DKP Ai Nexus© & Mail Nexus©',
    version: 'v2.6-PURE-SQL',
    status: 'completed',
    progress: 100,
    description: 'Design system unificato, DKP Ai Nexus© con Sentinella Passiva, DKP Mail Nexus© (Resend + Brevo), 10 Macro-Nodi semantici, Pulsebot (BEMYAGENT.md) e Blockchain Vault© SHA-256.',
    features: [
      'Unificazione Ecosistema (DKP Sentinel Style) su Tech Feed, Nodes, Blog e Tools',
      'DKP Ai Nexus© & Sentinella Passiva Grammarly-Style negli editor con Prism.js dinamico',
      'DKP Mail Nexus© 2.6: Resend (Sentinel/Nexus) + Brevo (Newsletter Double Opt-In & Webhooks idempotenti)',
      'Gerarchia DB Nodi ristrutturata su 10 Macro-Domini semantici & DKP Blockchain Vault© SHA-256',
      'Pulsebot (BEMYAGENT.md): Sentinella guardiana per audit build, sicurezza, dipendenze e CI/CD Playwright'
    ]
  },
  {
    id: 'q1-2027',
    quarter: 'Q1 2027',
    phaseTitle: 'DKP ADS Marketplace, Public SDK & Sentinel Network Expansion',
    version: 'v2.7-NEXT',
    status: 'in-progress',
    progress: 45,
    description: 'Marketplace self-service DKP ADS, rilascio pacchetto NPM @devkernelpulse/sdk ed espansione del Sentinel Network.',
    features: [
      'Marketplace DKP ADS self-service con metriche trasparenti',
      'Rilascio pacchetto npm ufficiale @devkernelpulse/sdk',
      'Auto-remediation assistita da Pulsebot su dipendenze e audit SAST',
      'Reputation Tier dinamici collegati al Proof of Code Vault'
    ]
  },
  {
    id: 'q2-2027',
    quarter: 'Q2 2027',
    phaseTitle: 'Autonomous Neural Agents & Auto-Patching',
    version: 'v3.0',
    status: 'upcoming',
    progress: 10,
    description: 'Evoluzione degli agenti BEMYAGENT.md per suggerire e validare patch di sicurezza via PR su GitHub.',
    features: [
      'Agentic AI per auto-remediation delle vulnerabilità via PR',
      'Canary Endpoints per ban istantaneo scanner malevoli',
      'Sandbox in container WASM per esecuzione untrusted'
    ]
  },
  {
    id: 'q3-2027',
    quarter: 'Q3 2027',
    phaseTitle: 'Multi-Tenant Enterprise Cloud & Web3 Settlement',
    version: 'v4.0-VISION',
    status: 'upcoming',
    progress: 0,
    description: 'Soluzione enterprise per team e settlement Smart Contract per Bounty Open Source.',
    features: [
      'Chiavi API Effimere a tempo (15m - 1h) per CI/CD',
      'Federazione Multi-Tenant su Google Cloud Run',
      'Web3 Settlement per Bounty in $PULSE su PR merged'
    ]
  }
]

function computeCompletion(items: RoadmapMilestone[]): number {
  if (!items.length) return 0
  const totalWeight = items.reduce((acc, m) => {
    if (m.status === 'completed') return acc + 100
    return acc + Math.max(0, Math.min(100, Number(m.progress || 0)))
  }, 0)
  return Math.round(totalWeight / items.length)
}

export default defineEventHandler(async () => {
  const milestones = [...DEFAULT_MILESTONES]

  try {
    const db = await getDb()
    if (db) {
      const res: any = await db.execute(sql`
        SELECT id, status, progress
        FROM roadmap_milestones;
      `).catch(() => [])
      const rows = Array.isArray(res) ? res : (res?.rows || [])
      if (rows.length > 0) {
        const overrideMap = new Map<string, any>(rows.map((r: any) => [String(r.id), r]))
        for (const m of milestones) {
          const ov = overrideMap.get(m.id)
          if (ov) {
            if (ov.status === 'completed' || ov.status === 'in-progress' || ov.status === 'upcoming') {
              m.status = ov.status
            }
            if (typeof ov.progress === 'number') {
              m.progress = ov.progress
            }
          }
        }
      }
    }
  } catch {}

  return {
    success: true,
    version: 'v2.6-PURE-SQL',
    completion: computeCompletion(milestones),
    milestones
  }
})