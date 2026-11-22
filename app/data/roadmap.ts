// app/data/roadmap.ts
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

export const roadmapMilestones: RoadmapMilestone[] = [
  {
    id: 'q1-2026',
    quarter: 'Q1 2026',
    phaseTitle: 'Architettura Core & Admin Control Center',
    version: 'v2.4-GOLD',
    status: 'completed',
    progress: 100,
    description: 'Consolidamento completo dell\'area riservata Admin su moduli unificati con rotte relative, eliminazione dei redirect e gestione dei cookie di sessione.',
    features: [
      'Standardizzazione Navbar Admin Grid e Control Plane',
      'Persistenza Sessione Admin & Cookie dkp_session',
      'Crawler Engine Pro con pulizia automatica Neon DB',
      'Modulo DKP Shop SaaS & Gestione Licenze .ZIP',
      'Sitemap XML Dinamica con Sync Automatica',
    ],
  },
  {
    id: 'q2-2026',
    quarter: 'Q2 2026',
    phaseTitle: 'AI Repo Scanner & Reputazione S-TIER GOLD',
    version: 'v2.4-GOLD',
    status: 'completed',
    progress: 100,
    description: 'Lancio ufficiale del motore AI Link & Repository Scanner con calcolo dello score, Rank Tier (S-Tier Gold), sistema di reward XP e agente Pulse Nexus.',
    features: [
      'AI Repo Scanner per audit GitHub & Stack Detection',
      'Sistema di Rank Reputazione DKP (S/A/B Tier)',
      'Roadmap automatica di miglioramento del codice con reward XP',
      'Integrazione Agente Pulse Nexus context-aware',
      'Rilascio DKP CLI Toolkit v2.4 e restyling Guidelines',
    ],
  },
  {
    id: 'q3-2026',
    quarter: 'Q3 2026',
    phaseTitle: 'Firewall Live SSE, Code Vault Blog & Enterprise Security',
    version: 'v2.5-GOLD',
    status: 'completed',
    progress: 100,
    description: 'Rilascio delle tecnologie di sicurezza in tempo reale con Firewall Live SSE, potenziamento del Blog Engine con Code Vault & Zen Mode, e gestione API Key.',
    features: [
      'Firewall di Sicurezza con streaming Live SSE (Server-Sent Events)',
      'Blog Engine Pro con Code Vault, Tabelle Markdown & Zen Mode Fullscreen',
      'API Key Management con Rate Limiting Nitro Enterprise',
      'Pipeline CI/CD con GitHub Actions e test E2E Playwright',
      'Integrazione nativa delle transazioni XP su Neon DB Serverless',
    ],
  },
  {
    id: 'q4-2026',
    quarter: 'Q4 2026',
    phaseTitle: 'DKP Kernel v2.6 Pure SQL: Vault Ledger Unificato, Talks Tree & Knowledge Dependabot',
    version: 'v2.6-PURE-SQL',
    status: 'completed',
    progress: 100,
    description: 'Unificazione completa del design system (Home, User Dashboard & Admin Control Center), DKP Blockchain Vault Ledger unificato su Blog/Forum/Tools, albero gerarchico DKP Talks e Sentinel Knowledge Dependabot (DocKeeper + ArchGuard) con RBAC Pure SQL.',
    features: [
      'Blockchain Vault Ledger Unificato (n/blockchain-vault): certificazione SHA-256 concatenata per Editorial Blog, Forum Thread e Developer Tools con verifica live',
      'DKP Talks Tree Navigation: gerarchia interattiva Macro-Categorie -> Nodi -> Sub-Nodi sincronizzata con Neon PostgreSQL',
      'Sentinel Network — Knowledge Dependabot: Sentinel DocKeeper (parser semantico code block & dipendenze obsolete) + Sentinel ArchGuard (pattern architetturali & doc aggiornata) con auto-commento',
      'Matrice Ruoli & Permessi RBAC dedicata su DB (sentinel_role_permissions) con isolamento scrittura core DB',
      'Restyling Admin Master Control Center allineato al template Hero della Home + DKP Ai Nexus & Mail Nexus 2.6',
    ],
  },
  {
    id: 'q1-2027',
    quarter: 'Q1 2027',
    phaseTitle: 'DKP ADS Marketplace, Public SDK & Sentinel Network Expansion',
    version: 'v2.7-NEXT',
    status: 'in-progress',
    progress: 45,
    description: 'Lancio del marketplace self-service DKP ADS, rilascio del pacchetto npm @devkernelpulse/sdk ed espansione autonoma del Sentinel Network.',
    features: [
      'Marketplace DKP ADS self-service con verifica crittografica e metriche trasparenti',
      'Rilascio pacchetto npm ufficiale @devkernelpulse/sdk per integrare Vault e DKP Ai Nexus',
      'Estensione Knowledge Dependabot con diff patch suggerite 1-click nei commenti tecnici',
      'Reputation Tier dinamici collegati ai certificati del Proof of Code Vault',
    ],
  },
  {
    id: 'q2-2027',
    quarter: 'Q2 2027',
    phaseTitle: 'Autonomous Neural Agents & Auto-Patching PR Engine',
    version: 'v3.0',
    status: 'upcoming',
    progress: 10,
    description: 'Evoluzione degli agenti autonomi BEMYAGENT.md per suggerire e validare patch di sicurezza direttamente via pull request GitHub.',
    features: [
      'Agentic AI per auto-remediation delle vulnerabilità SAST via PR su GitHub',
      'Canary & Honeypot Endpoints per ban istantaneo degli scanner malevoli',
      'Sandbox isolata in container WASM per l\'esecuzione sicura di snippet untrusted',
    ],
  },
  {
    id: 'q3-2027',
    quarter: 'Q3 2027',
    phaseTitle: 'Global VIP Developers Guild & Smart Contract Settlement',
    version: 'v4.0-VISION',
    status: 'upcoming',
    progress: 0,
    description: 'Classifica globale gamificata con regolamento automatico Web3 per le Bounty e governance DAO della community.',
    features: [
      'Smart Contract Settlement automatico per il pagamento delle Bounty in $PULSE su PR merged',
      'Badge verificati crittograficamente per i contributori Open Source',
      'Governance decentralizzata DAO per votare le nuove feature dell\'ecosistema DKP',
    ],
  },
]