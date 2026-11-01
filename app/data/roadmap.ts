// app/data/roadmap.ts
import { roadmapMilestones } from '~/app/data/roadmap'

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
    phaseTitle: 'Neural Gateway, DKP Trinity, DKP Nodes & Security Hardening',
    version: 'v2.5-GOLD',
    status: 'completed',
    progress: 100,
    description: 'Lancio dell\'infrastruttura AI decentralizzata con OpenRouter, moderazione automatica DKP Nodes tramite Gemini 2.0, OpenUI Live Studio e Paywall Dinamico.',
    features: [
      'OpenUI Studio: Sandbox interattiva per la generazione e rendering live di componenti Tailwind',
      'DKP Trinity Engine: Integrazione di Gemini 2.0 Flash (Flash), Dots-3 (Coder) e Nemotron-3 (Pro)',
      'Pulse Sentinel SAST & DKP Nodes: Moderazione automatizzata post e codice tramite Gemini 2.0',
      'API Gateway H3 con unificazione OPENROUTER_API_KEY e metering atomico su Neon DB',
      'Paywall Dinamico basato su Tier (Free, Pro, Enterprise) e metering usabilità API',
      'Proof of Code Vault con hash SHA-256 deterministico, SAST audit e +100 XP automatici',
    ],
  },
  {
    id: 'q1-2027',
    quarter: 'Q1 2027',
    phaseTitle: 'DKP Public SDK & Developer Ecosystem Expansion',
    version: 'v3.0-BETA',
    status: 'in-progress',
    progress: 50,
    description: 'Apertura dell\'ecosistema agli sviluppatori terzi con il rilascio del pacchetto npm ufficiale e librerie SDK per integrare i servizi DKP ovunque.',
    features: [
      'Rilascio pacchetto npm ufficiale @devkernelpulse/sdk',
      'Documentazione interattiva API Hub v3 con playground live',
      'Sistema di Webhook ed Eventi personalizzati per Vault, Sentinel AI & Firewall',
      'CLI Toolkit v3.0 con comandi di sincronizzazione Cloud bidirezionale',
    ],
  },
  {
    id: 'q2-2027',
    quarter: 'Q2 2027',
    phaseTitle: 'Autonomous Neural Agents & Auto-Patching PR Engine',
    version: 'v3.2',
    status: 'upcoming',
    progress: 10,
    description: 'Evoluzione del Neural Playground in un agente autonomo in grado di correggere e applicare patch di sicurezza direttamente via pull request GitHub.',
    features: [
      'Agentic AI per auto-remediation delle vulnerabilità SAST via PR automatica su GitHub',
      'Canary & Honeypot Endpoints trappola per ban istantaneo degli scanner malevoli',
      'Fine-tuning di modelli custom focalizzati su architetture Nuxt e Neon DB',
      'Sandbox isolata in container WASM per l\'esecuzione sicura di codice untrusted',
    ],
  },
  {
    id: 'q3-2027',
    quarter: 'Q3 2027',
    phaseTitle: 'Multi-Tenant Enterprise Cloud & Ephemeral CI/CD Keys',
    version: 'v3.5-ENTERPRISE',
    status: 'upcoming',
    progress: 0,
    description: 'Soluzione enterprise per grandi aziende con chiavi API effimere a tempo, federazione multi-tenant e supporto On-Premise.',
    features: [
      'Chiavi API Effimere a tempo (15m - 1h) per pipeline CI/CD GitHub Actions e GitLab CI',
      'Federazione Multi-Tenant per cluster Kubernetes isolati in GCP europe-west4',
      'Supporto a SSO Enterprise (SAML, Okta, Active Directory)',
      'Storage di Vault crittografato con HSM (Hardware Security Module) dedicati',
    ],
  },
  {
    id: 'q4-2027',
    quarter: 'Q4 2027',
    phaseTitle: 'Global VIP Developers Guild & Smart Contract Settlement',
    version: 'v4.0-VISION',
    status: 'upcoming',
    progress: 0,
    description: 'Lancio della Leaderboard globale gamificata con regolamento automatico Web3 per le Bounty e governance DAO della community.',
    features: [
      'Web3 / Smart Contract Settlement automatico per il pagamento delle Bounty in $PULSE su PR merged',
      'Classifica globale VIP Developers basata su XP verificati nel Vault',
      'Rilascio di badge NFT crittografati per i contributori Open Source',
      'Governance decentralizzata DAO per votare le nuove feature dell\'ecosistema DKP',
    ],
  },
]
