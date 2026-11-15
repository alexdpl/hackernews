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
    phaseTitle: 'DKP Blockchain Vault©, Forum & Blog On-Chain v2.6-PURE-SQL',
    version: 'v2.6-PURE-SQL',
    status: 'completed',
    progress: 100,
    description: 'Notarizzazione crittografica SHA-256 concatenata su ledger Pure-SQL per Forum (DKP Nodes), Blog Editoriale e nodo pubblico n/blockchain-vault.',
    features: [
      'DKP Blockchain Vault© (dkp_vault_ledger con Block #N, previous_hash e Merkle Root)',
      'Forum On-Chain (DKP Nodes) con notarizzazione automatica, upvote karma e badge VaultTrustBadge',
      'Editorial Blog On-Chain con certificato Proof-of-Code e audit anti-manomissione live',
      'Nodo Pubblico Auditor n/blockchain-vault con verifica istantanea hash SHA-256',
      'OpenUI Studio, DKP Trinity Engine & Pulse Sentinel SAST'
    ]
  },
  {
    id: 'q1-2027',
    quarter: 'Q1 2027',
    phaseTitle: 'DKP Public SDK & Developer Ecosystem',
    version: 'v3.0-BETA',
    status: 'completed',
    progress: 100,
    description: 'Rilascio ufficiale del pacchetto NPM @devkernelpulse/sdk. Permette a chiunque di integrare Vault, AI e NewsRoom nelle proprie app.',
    features: [
      'Rilascio pacchetto npm ufficiale @devkernelpulse/sdk',
      'Documentazione interattiva API Hub con snippet TS/JS',
      'Integrazione client-side sicura con token crittografati',
      'Supporto per framework moderni (Vue, React, Svelte, Vanilla)'
    ]
  },
  {
    id: 'q2-2027',
    quarter: 'Q2 2027',
    phaseTitle: 'Autonomous Neural Agents & Auto-Patching',
    version: 'v3.2',
    status: 'in-progress',
    progress: 15,
    description: 'Evoluzione del Neural Playground in un agente autonomo capace di PR su GitHub.',
    features: [
      'Agentic AI per auto-remediation delle vulnerabilità via PR',
      'Canary Endpoints per ban istantaneo scanner malevoli',
      'Sandbox in container WASM per esecuzione untrusted'
    ]
  },
  {
    id: 'q3-2027',
    quarter: 'Q3 2027',
    phaseTitle: 'Multi-Tenant Enterprise Cloud & Web3',
    version: 'v4.0-VISION',
    status: 'upcoming',
    progress: 0,
    description: 'Soluzione enterprise per grandi aziende e settlement Smart Contract per Bounty Open Source.',
    features: [
      'Chiavi API Effimere a tempo (15m - 1h) per CI/CD',
      'Federazione Multi-Tenant per Kubernetes',
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
  let milestones = [...DEFAULT_MILESTONES]

  // Se in futuro aggiorni lo stato/progresso di una milestone su Neon DB, viene letto automaticamente
  try {
    const db = await getDb()
    if (db) {
      const res: any = await db.execute(sql`
        SELECT id, status, progress
        FROM roadmap_milestones;
      `).catch(() => null)

      const rows = Array.isArray(res) ? res : (res?.rows || [])
      if (rows.length > 0) {
        const overrideMap = new Map<string, any>(rows.map((r: any) => [String(r.id), r]))
        milestones = milestones.map((m) => {
          const ov = overrideMap.get(m.id)
          if (!ov) return m
          const status = (ov.status || m.status) as RoadmapMilestone['status']
          const progress = status === 'completed' ? 100 : Number(ov.progress ?? m.progress)
          return { ...m, status, progress }
        })
      }
    }
  } catch {
    // Fallback silenzioso sulle milestone statiche v2.6-PURE-SQL
  }

  const overallCompletion = computeCompletion(milestones)

  return {
    success: true,
    version: 'v2.6-PURE-SQL',
    overallCompletion,
    completedMilestones: milestones.filter((m) => m.status === 'completed').length,
    totalMilestones: milestones.length,
    milestones
  }
})