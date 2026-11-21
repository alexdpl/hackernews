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
      'Standardizzazione Navbar Admin Grid a 8 Moduli',
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
    phaseTitle: 'DKP Kernel v2.6 Pure SQL: Unificazione Ecosistema, DKP Ai Nexus© & Mail Nexus©',
    version: 'v2.6-PURE-SQL',
    status: 'completed',
    progress: 100,
    description: 'Unificazione completa del design system (DKP Sentinel Style), DKP Ai Nexus© con Sentinella Passiva Grammarly-Style, DKP Mail Nexus© dual-provider (Resend + Brevo), gerarchia a 10 Macro-Nodi e Sentinella guardiana Pulsebot.',
    features: [
      'Unificazione Ecosistema (DKP Sentinel Style Dark Cyberpunk / White Sepia) su Feed, Nodes, Blog e Tools',
      'DKP Ai Nexus© & Sentinella Passiva Grammarly-Style integrati negli editor con Prism.js dinamico',
      'DKP Mail Nexus© 2.6: Resend per Sentinel Network & Chat Nexus + Brevo per Newsletter Double Opt-In con failover',
      'Refactor Gerarchia DB Nodi su 10 Macro-Domini semantici e DKP Blockchain Vault© SHA-256',
      'Pulsebot (BEMYAGENT.md): Sentinella guardiana per audit build, sicurezza, dipendenze e CI/CD Playwright',
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
      'Rilascio pacchetto npm ufficiale @devkernelpulse/sdk per integrare Vault e DKP Ai Nexus©',
      'Auto-remediation assistita da Pulsebot su dipendenze e audit SAST nei tutorial del Blog',
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