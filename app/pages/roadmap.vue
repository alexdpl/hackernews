<!-- app/pages/roadmap.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
const currentYear = new Date().getFullYear()

useDkpSeo({
  title: 'Roadmap Ecosistema 2026-2027 v2.5-GOLD - DevKernelPulse',
  description: 'Piano ufficiale di sviluppo dell\'ecosistema DKP: Firewall Live SSE, Code Vault, Proof of Code, AI Tools, Security Hardening e Visione Futura 2027.'
})

interface RoadmapMilestone {
  id: string
  quarter: string
  phaseTitle: string
  version: string
  status: 'completed' | 'in-progress' | 'upcoming'
  progress: number
  description: string
  features: string[]
}

const milestones = ref<RoadmapMilestone[]>([
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
    description: 'Lancio ufficiale del motore AI Link & Repository Scanner con calcolo dello score, Rank Tier (S-Tier Gold), sistema di reward XP e agente Pulse Nexus.',
    features: [
      'AI Repo Scanner per audit GitHub & Stack Detection',
      'Sistema di Rank Reputazione DKP (S/A/B Tier)',
      'Roadmap automatica di miglioramento del codice con reward XP',
      'Integrazione Agente Pulse Nexus context-aware',
      'Rilascio DKP CLI Toolkit v2.4 e restyling Guidelines'
    ]
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
      'Integrazione nativa delle transazioni XP su Neon DB Serverless'
    ]
  },
  {
    id: 'q4-2026',
    quarter: 'Q4 2026',
    phaseTitle: 'Security Hardening, Admin Telemetry & Proof of Code Vault',
    version: 'v2.5-GOLD',
    status: 'completed',
    progress: 100,
    description: 'Upgrade massiccio di sicurezza con scrypt KDF, notarizzazione crittografica Vault con XP (+100 XP), IP Whitelist Manager, Webhook Alerting e Telemetria CLI.',
    features: [
      'Hardening API Key: migrazione da SHA-256 a scrypt KDF con salt e pepper (CodeQL compliant)',
      'Proof of Code Vault con hash SHA-256 deterministico, SAST audit e +100 XP automatici',
      'Modulo Whitelist IP & Exemption Manager per runner CI/CD e sviluppatori fidati',
      'Webhook & Instant Alerting System per notifiche push critiche su Telegram e Discord',
      'CLI Telemetry & Analytics dashboard con tracciamento chiamate dkp-cli e latenze',
      'Nuova pagina FAQ interattiva v2.5-GOLD (/docs/faq.vue) e probe /health & /metrics GCP'
    ]
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
      'CLI Toolkit v3.0 con comandi di sincronizzazione Cloud bidirezionale'
    ]
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
      'Sandbox isolata in container WASM per l\'esecuzione sicura di codice untrusted'
    ]
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
      'Storage di Vault crittografato con HSM (Hardware Security Module) dedicati'
    ]
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
      'Governance decentralizzata DAO per votare le nuove feature dell\'ecosistema DKP'
    ]
  }
])

const activeFilter = ref<'all' | 'completed' | 'in-progress' | 'upcoming'>('all')

const filteredMilestones = computed(() => {
  if (activeFilter.value === 'all') return milestones.value
  return milestones.value.filter(m => m.status === activeFilter.value)
})

const overallCompletion = computed(() => {
  const completedCount = milestones.value.filter(m => m.status === 'completed').length
  const inProgressSum = milestones.value.filter(m => m.status === 'in-progress').reduce((acc, m) => acc + m.progress, 0)
  const totalWeight = (completedCount * 100) + inProgressSum
  return Math.round(totalWeight / milestones.value.length)
})
</script>

<template>
  <div class="roadmap-page-container">
    
    <!-- HERO HEADER -->
    <header class="roadmap-hero">
      <div class="hero-badge">
        <span class="badge-status gold">🚀 DKP ECOSYSTEM ROADMAP 2026-2027</span>
      </div>
      <h1>Piano di Sviluppo &amp; <span class="highlight">Vision v2.5-GOLD</span></h1>
      <p class="subtitle">
        Trasparenza totale sullo stato di avanzamento delle funzionalità, integrazioni IA, rilasci dell'ecosistema DevKernelPulse e la nuova visione strategica per il 2027.
      </p>

      <!-- PROGRESS OVERALL METRIC -->
      <div class="overall-progress-card">
        <div class="progress-info">
          <span>Stato Avanzamento Globale Ecosistema:</span>
          <strong class="progress-percent">{{ overallCompletion }}%</strong>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" :style="{ width: overallCompletion + '%' }"></div>
        </div>
      </div>
    </header>

    <!-- CONTROLS & FILTRI -->
    <div class="controls-bar">
      <div class="filter-pills">
        <button type="button" @click="activeFilter = 'all'" class="pill" :class="{ active: activeFilter === 'all' }">Tutte le Fasi</button>
        <button type="button" @click="activeFilter = 'completed'" class="pill" :class="{ active: activeFilter === 'completed' }">🟢 Completati (2026)</button>
        <button type="button" @click="activeFilter = 'in-progress'" class="pill" :class="{ active: activeFilter === 'in-progress' }">⚡ In Corso (2027)</button>
        <button type="button" @click="activeFilter = 'upcoming'" class="pill" :class="{ active: activeFilter === 'upcoming' }">🔮 Visione Futura</button>
      </div>
    </div>

    <!-- TIMELINE MILESTONES -->
    <div class="timeline-wrapper">
      <div v-for="item in filteredMilestones" :key="item.id" class="timeline-item" :class="item.status">
        
        <!-- MARKER E LINEA -->
        <div class="timeline-marker">
          <span class="marker-dot"></span>
        </div>

        <!-- CONTENT CARD -->
        <article class="milestone-card">
          <div class="card-header">
            <div class="quarter-box">
              <span class="quarter-text">{{ item.quarter }}</span>
              <span class="version-tag">{{ item.version }}</span>
            </div>

            <div class="status-badge" :class="item.status">
              <template v-if="item.status === 'completed'">🟢 COMPLETATO (100%)</template>
              <template v-else-if="item.status === 'in-progress'">⚡ IN CORSO ({{ item.progress }}%)</template>
              <template v-else>🔮 IN ARRIVO</template>
            </div>
          </div>

          <h2 class="milestone-title">{{ item.phaseTitle }}</h2>
          <p class="milestone-desc">{{ item.description }}</p>

          <div class="features-box">
            <h4>📋 Deliverables &amp; Moduli:</h4>
            <ul class="features-list">
              <li v-for="(feat, idx) in item.features" :key="idx">
                <span class="check-icon">▹</span> {{ feat }}
              </li>
            </ul>
          </div>
        </article>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ==========================================================================
   LAYOUT GENERALE
   ========================================================================== */
.roadmap-page-container {
  max-width: 1100px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #f8fafc;
}

.roadmap-hero {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 2.5rem 2rem;
  text-align: center;
  margin-bottom: 2.5rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.hero-badge { margin-bottom: 0.85rem; }

.badge-status.gold {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  border: 1px solid #00dc82;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.2);
}

.roadmap-hero h1 {
  font-size: 2.4rem;
  font-weight: 900;
  margin: 0 0 0.8rem 0;
  color: #ffffff;
}

.highlight {
  color: #00dc82;
  text-shadow: 0 0 20px rgba(0, 220, 130, 0.3);
}

.subtitle {
  color: #94a3b8;
  max-width: 680px;
  margin: 0 auto 2rem auto;
  font-size: 1rem;
  line-height: 1.6;
}

/* OVERALL PROGRESS CARD */
.overall-progress-card {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  max-width: 600px;
  margin: 0 auto;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
  font-size: 0.88rem;
  color: #cbd5e1;
  font-weight: 700;
}

.progress-percent { color: #00dc82; font-size: 1.2rem; font-weight: 900; }

.progress-bar-track {
  height: 8px;
  background: #1e293b;
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8, #00dc82);
  box-shadow: 0 0 12px rgba(0, 220, 130, 0.5);
  border-radius: 999px;
  transition: width 0.5s ease;
}

/* FILTRI */
.controls-bar { margin-bottom: 2.5rem; display: flex; justify-content: center; }
.filter-pills { display: flex; gap: 0.6rem; flex-wrap: wrap; }

.pill {
  background: #090d16;
  border: 1px solid #1e293b;
  color: #cbd5e1;
  padding: 0.5rem 1.1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pill:hover { border-color: #00dc82; color: #00dc82; }
.pill.active { border-color: #00dc82; color: #00dc82; background: rgba(0, 220, 130, 0.12); box-shadow: 0 0 12px rgba(0, 220, 130, 0.2); }

/* TIMELINE STYLES */
.timeline-wrapper {
  position: relative;
  padding-left: 2rem;
}

.timeline-wrapper::before {
  content: '';
  position: absolute;
  left: 9px;
  top: 10px;
  bottom: 10px;
  width: 2px;
  background: #1e293b;
}

.timeline-item {
  position: relative;
  margin-bottom: 2rem;
}

.timeline-marker {
  position: absolute;
  left: -2rem;
  top: 1.5rem;
  transform: translateX(-50%);
  z-index: 2;
}

.marker-dot {
  display: block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #020420;
  border: 3px solid #64748b;
}

.timeline-item.completed .marker-dot { border-color: #00dc82; background: #00dc82; box-shadow: 0 0 12px #00dc82; }
.timeline-item.in-progress .marker-dot { border-color: #facc15; background: #facc15; box-shadow: 0 0 12px #facc15; }
.timeline-item.upcoming .marker-dot { border-color: #38bdf8; background: #38bdf8; box-shadow: 0 0 12px #38bdf8; }

/* MILESTONE CARD */
.milestone-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 1.75rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  transition: all 0.2s ease;
}

.milestone-card:hover { border-color: #38bdf8; transform: translateY(-2px); }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.quarter-box { display: flex; align-items: center; gap: 0.6rem; }
.quarter-text { font-size: 1.1rem; font-weight: 900; color: #ffffff; }

.version-tag {
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  letter-spacing: 0.04em;
}

.status-badge.completed { background: rgba(0, 220, 130, 0.15); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); }
.status-badge.in-progress { background: rgba(250, 204, 21, 0.15); color: #facc15; border: 1px solid rgba(250, 204, 21, 0.3); }
.status-badge.upcoming { background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }

.milestone-title { font-size: 1.3rem; font-weight: 800; margin: 0 0 0.6rem 0; color: #ffffff; }
.milestone-desc { color: #94a3b8; font-size: 0.92rem; line-height: 1.6; margin-bottom: 1.25rem; }

.features-box {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 1rem 1.25rem;
}

.features-box h4 { margin: 0 0 0.6rem 0; color: #38bdf8; font-size: 0.82rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }

.features-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.45rem; }

.features-list li { font-size: 0.88rem; color: #cbd5e1; display: flex; align-items: center; gap: 0.5rem; }

.check-icon { color: #00dc82; font-weight: bold; }
</style>