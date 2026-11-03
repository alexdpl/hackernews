<!-- app/pages/roadmap.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useDkpSeo({
  title: 'Roadmap Ecosistema 2026-2027 v2.5-GOLD - DevKernelPulse',
  description: 'Piano ufficiale di sviluppo dell\'ecosistema DKP: SDK Pubblica @devkernelpulse/sdk, Firewall Live SSE, OpenUI Studio e Visione Futura 2027.'
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
    description: 'Consolidamento completo dell\'area riservata Admin su moduli unificati con rotte relative.',
    features: [
      'Standardizzazione Navbar Admin Grid a 8 Moduli',
      'Persistenza Sessione Admin & Cookie dkp_session',
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
    phaseTitle: 'Neural Gateway, Trinity & DKP Nodes',
    version: 'v2.5-GOLD',
    status: 'completed',
    progress: 100,
    description: 'Infrastruttura AI decentralizzata, moderazione automatica Nodes tramite Gemini 2.0 e Paywall Dinamico.',
    features: [
      'OpenUI Studio: Generazione Tailwind Live',
      'DKP Trinity Engine (Gemini 2.0, Dots-3, Nemotron-3)',
      'Pulse Sentinel SAST & DKP Nodes Moderation',
      'Proof of Code Vault con hash SHA-256 deterministico'
    ]
  },
  {
    id: 'q1-2027',
    quarter: 'Q1 2027',
    phaseTitle: 'DKP Public SDK & Developer Ecosystem',
    version: 'v3.0-BETA',
    status: 'completed', // 🟢 AGGIORNATO A COMPLETED
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
    status: 'in-progress', // ⚡ PASSATO IN CORSO
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
    <header class="roadmap-hero">
      <div class="hero-badge">
        <span class="badge-status gold">🚀 DKP ECOSYSTEM ROADMAP 2026-2027</span>
      </div>
      <h1>Piano di Sviluppo &amp; <span class="highlight">Vision v3.0</span></h1>
      <p class="subtitle">
        Trasparenza totale sullo stato di avanzamento delle funzionalità, integrazioni IA, lancio SDK ufficiale e la nuova visione strategica.
      </p>

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

    <div class="controls-bar">
      <div class="filter-pills">
        <button type="button" @click="activeFilter = 'all'" class="pill" :class="{ active: activeFilter === 'all' }">Tutte le Fasi</button>
        <button type="button" @click="activeFilter = 'completed'" class="pill" :class="{ active: activeFilter === 'completed' }">🟢 Completati (Lanciati)</button>
        <button type="button" @click="activeFilter = 'in-progress'" class="pill" :class="{ active: activeFilter === 'in-progress' }">⚡ In Corso</button>
        <button type="button" @click="activeFilter = 'upcoming'" class="pill" :class="{ active: activeFilter === 'upcoming' }">🔮 Visione Futura</button>
      </div>
    </div>

    <div class="timeline-wrapper">
      <div v-for="item in filteredMilestones" :key="item.id" class="timeline-item" :class="item.status">
        <div class="timeline-marker"><span class="marker-dot"></span></div>
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
              <li v-for="(feat, idx) in item.features" :key="idx"><span class="check-icon">▹</span> {{ feat }}</li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* (Mantieni esattamente lo stesso CSS che avevamo già per la roadmap, non cambia nulla nel design) */
.roadmap-page-container { max-width: 1100px; margin: 2rem auto; padding: 0 1.5rem; font-family: system-ui, sans-serif; color: #f8fafc; }
.roadmap-hero { background: #090d16; border: 1px solid #1e293b; border-radius: 16px; padding: 2.5rem 2rem; text-align: center; margin-bottom: 2.5rem; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); }
.hero-badge { margin-bottom: 0.85rem; }
.badge-status.gold { background: rgba(0, 220, 130, 0.15); color: #00dc82; border: 1px solid #00dc82; padding: 0.35rem 0.85rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.05em; }
.roadmap-hero h1 { font-size: 2.4rem; font-weight: 900; margin: 0 0 0.8rem 0; color: #ffffff; }
.highlight { color: #00dc82; text-shadow: 0 0 20px rgba(0, 220, 130, 0.3); }
.subtitle { color: #94a3b8; max-width: 680px; margin: 0 auto 2rem auto; font-size: 1rem; line-height: 1.6; }
.overall-progress-card { background: #020420; border: 1px solid #1e293b; border-radius: 12px; padding: 1.25rem 1.5rem; max-width: 600px; margin: 0 auto; }
.progress-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; font-size: 0.88rem; color: #cbd5e1; font-weight: 700; }
.progress-percent { color: #00dc82; font-size: 1.2rem; font-weight: 900; }
.progress-bar-track { height: 8px; background: #1e293b; border-radius: 999px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: linear-gradient(90deg, #38bdf8, #00dc82); border-radius: 999px; transition: width 0.5s ease; }
.controls-bar { margin-bottom: 2.5rem; display: flex; justify-content: center; }
.filter-pills { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.pill { background: #090d16; border: 1px solid #1e293b; color: #cbd5e1; padding: 0.5rem 1.1rem; border-radius: 20px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
.pill:hover { border-color: #00dc82; color: #00dc82; }
.pill.active { border-color: #00dc82; color: #00dc82; background: rgba(0, 220, 130, 0.12); }
.timeline-wrapper { position: relative; padding-left: 2rem; }
.timeline-wrapper::before { content: ''; position: absolute; left: 9px; top: 10px; bottom: 10px; width: 2px; background: #1e293b; }
.timeline-item { position: relative; margin-bottom: 2rem; }
.timeline-marker { position: absolute; left: -2rem; top: 1.5rem; transform: translateX(-50%); z-index: 2; }
.marker-dot { display: block; width: 16px; height: 16px; border-radius: 50%; background: #020420; border: 3px solid #64748b; }
.timeline-item.completed .marker-dot { border-color: #00dc82; background: #00dc82; box-shadow: 0 0 12px #00dc82; }
.timeline-item.in-progress .marker-dot { border-color: #facc15; background: #facc15; box-shadow: 0 0 12px #facc15; }
.timeline-item.upcoming .marker-dot { border-color: #38bdf8; background: #38bdf8; box-shadow: 0 0 12px #38bdf8; }
.milestone-card { background: #090d16; border: 1px solid #1e293b; border-radius: 14px; padding: 1.75rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4); transition: all 0.2s ease; }
.milestone-card:hover { border-color: #38bdf8; transform: translateY(-2px); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem; }
.quarter-box { display: flex; align-items: center; gap: 0.6rem; }
.quarter-text { font-size: 1.1rem; font-weight: 900; color: #ffffff; }
.version-tag { background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.5rem; border-radius: 4px; }
.status-badge { font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: 6px; }
.status-badge.completed { background: rgba(0, 220, 130, 0.15); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); }
.status-badge.in-progress { background: rgba(250, 204, 21, 0.15); color: #facc15; border: 1px solid rgba(250, 204, 21, 0.3); }
.status-badge.upcoming { background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
.milestone-title { font-size: 1.3rem; font-weight: 800; margin: 0 0 0.6rem 0; color: #ffffff; }
.milestone-desc { color: #94a3b8; font-size: 0.92rem; line-height: 1.6; margin-bottom: 1.25rem; }
.features-box { background: #020420; border: 1px solid #1e293b; border-radius: 10px; padding: 1rem 1.25rem; }
.features-box h4 { margin: 0 0 0.6rem 0; color: #38bdf8; font-size: 0.82rem; font-weight: 800; text-transform: uppercase; }
.features-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.45rem; }
.features-list li { font-size: 0.88rem; color: #cbd5e1; display: flex; align-items: center; gap: 0.5rem; }
.check-icon { color: #00dc82; font-weight: bold; }
</style>