<!-- app/pages/roadmap.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
const currentYear = new Date().getFullYear()

useDkpSeo({
  title: 'Roadmap Ecosistema 2026 v2.5-BETA - DevKernelPulse',
  description: 'Piano ufficiale di sviluppo dell ecosistema DKP: Firewall Live SSE, Code Vault Blog Engine, API Key Management, AI Repo Scanner e Gamification XP.'
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
    description: 'Consolidamento completo dell area riservata Admin su 8 moduli unificati con rotte relative, eliminazione dei redirect e gestione dei cookie di sessione.',
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
    description: 'Lancio ufficiale del motore AI Link & Repository Scanner con calcolo dello score (94/100), Rank Tier (S-Tier Gold), sistema di reward +250 XP e agente Pulse Nexus v2.4.',
    features: [
      'AI Repo Scanner per audit GitHub & Stack Detection',
      'Sistema di Rank Reputazione DKP (S/A/B Tier)',
      'Roadmap automatica di miglioramento del codice con reward XP',
      'Integrazione Agente Pulse Nexus v2.4 context-aware',
      'Rilascio DKP CLI Toolkit v2.4-GOLD e restyling Guidelines'
    ]
  },
  {
    id: 'q3-2026',
    quarter: 'Q3 2026',
    phaseTitle: 'Firewall Live SSE, Code Vault Blog & Enterprise Security',
    version: 'v2.5-BETA',
    status: 'in-progress',
    progress: 92,
    description: 'Rilascio delle tecnologie di sicurezza in tempo reale con Firewall Live SSE, potenziamento del Blog Engine con Code Vault & Zen Mode, e gestione avanzata API Key.',
    features: [
      'Firewall di Sicurezza con streaming Live SSE (Server-Sent Events) (Completato)',
      'Blog Engine Pro con Code Vault, Tabelle Markdown & Zen Mode Fullscreen (Completato)',
      'API Key Management con Rate Limiting Nitro Enterprise (Completato)',
      'Pipeline CI/CD con GitHub Actions e test E2E Playwright (Completato)',
      'Stripe & PayPal Checkout per acquisto istantaneo licenze Shop (In Corso)'
    ]
  },
  {
    id: 'q4-2026',
    quarter: 'Q4 2026',
    phaseTitle: 'Ecosystem SDK & Multi-Tenant Cloud Federation',
    version: 'v3.0-VISION',
    status: 'upcoming',
    progress: 15,
    description: 'Rilascio dell SDK pubblico npm per consentire a sviluppatori terzi di integrare i microservizi DKP nelle proprie architetture SaaS.',
    features: [
      'Rilascio pacchetto npm @devkernelpulse/sdk',
      'Integrazione LLM Custom nel Neural Playground',
      'Federazione Multi-Tenant per installazioni On-Premise',
      'Leaderboard pubblica VIP Developers DKP basata su XP'
    ]
  }
])

const activeFilter = ref<'all' | 'completed' | 'in-progress' | 'upcoming'>('all')

const filteredMilestones = computed(() => {
  if (activeFilter.value === 'all') return milestones.value
  return milestones.value.filter(m => m.status === activeFilter.value)
})

const overallCompletion = computed(() => {
  const total = milestones.value.reduce((acc, m) => acc + m.progress, 0)
  return Math.round(total / milestones.value.length)
})
</script>

<template>
  <div class="roadmap-page-container">
    
    <!-- HERO HEADER -->
    <header class="roadmap-hero">
      <div class="hero-badge">
        <span class="badge-status gold">🚀 DKP ECOSYSTEM ROADMAP 2026</span>
      </div>
      <h1>Piano di Sviluppo & <span class="highlight">Vision v2.5-BETA</span></h1>
      <p class="subtitle">
        Trasparenza totale sullo stato di avanzamento delle funzionalità, integrazioni IA e rilasci dell ecosistema DevKernelPulse.
      </p>

      <!-- PROGRESS OVERALL METRIC -->
      <div class="overall-progress-card">
        <div class="progress-info">
          <span>Stato Completamento Ecosistema 2026:</span>
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
        <button type="button" @click="activeFilter = 'completed'" class="pill" :class="{ active: activeFilter === 'completed' }">🟢 Completati</button>
        <button type="button" @click="activeFilter = 'in-progress'" class="pill" :class="{ active: activeFilter === 'in-progress' }">⚡ In Corso</button>
        <button type="button" @click="activeFilter = 'upcoming'" class="pill" :class="{ active: activeFilter === 'upcoming' }">🔮 In Arrivo</button>
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
              <template v-if="item.status === 'completed'">🟢 RAGGIUNTO (100%)</template>
              <template v-else-if="item.status === 'in-progress'">⚡ IN CORSO ({{ item.progress }}%)</template>
              <template v-else>🔮 IN ARRIVO</template>
            </div>
          </div>

          <h2 class="milestone-title">{{ item.phaseTitle }}</h2>
          <p class="milestone-desc">{{ item.description }}</p>

          <div class="features-box">
            <h4>📋 Deliverables & Moduli:</h4>
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
.status-badge.in-progress { background: rgba(250, 204, 21, 0.15); color: finup; color: #facc15; border: 1px solid rgba(250, 204, 21, 0.3); }
.status-badge.upcoming { background: rgba(148, 163, 184, 0.12); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); }

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