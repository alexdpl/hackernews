<!-- pages/roadmap.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'Roadmap Ecosistema 2026 v2.4-GOLD — DevKernelPulse',
  meta: [
    { name: 'description', content: 'Roadmap ufficiale dello sviluppo DKP per il 2026: feature v2.4-GOLD, pietre miliari completate, tassonomia Blog, CLI Toolkit e rewards XP.' }
  ]
})

const activeQuarter = ref<'all' | 'q1' | 'q2' | 'q3' | 'q4'>('all')

interface RoadmapItem {
  id: string
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  year: '2026'
  title: string
  description: string
  status: 'completed' | 'in-progress' | 'planned'
  module: string
  xpReward: string
  badgeIcon?: string
}

const milestones: RoadmapItem[] = [
  {
    id: 'm1',
    quarter: 'Q1',
    year: '2026',
    title: 'Pulse Nexus v2.4-GOLD & Micro-Frontend',
    description: 'Riprogettazione completa dell\'interfaccia in Nuxt 3, Nitro Engine a bassissima latenza e architettura modulare.',
    status: 'completed',
    module: 'Core System',
    xpReward: '+50 XP',
    badgeIcon: '⚡'
  },
  {
    id: 'm2',
    quarter: 'Q1',
    year: '2026',
    title: 'Code Vault & Notarizzazione SHA-256',
    description: 'Integrazione nel Vault del supporto all\'esportazione notarizzata JSON-LD e verifica dell\'impronta software Proof-of-Code.',
    status: 'completed',
    module: 'Proof of Code',
    xpReward: '+40 XP',
    badgeIcon: '🛡️'
  },
  {
    id: 'm3',
    quarter: 'Q2',
    year: '2026',
    title: 'AI Scanner v2.4-GOLD SAST Audit Engine',
    description: 'Supporto esteso a 18+ linguaggi con rilevamento automatico secret-leak, SQL Injection, Buffer Overflow e antipattern.',
    status: 'completed',
    module: 'AI Code Scanner',
    xpReward: '+30 XP',
    badgeIcon: '🔍'
  },
  {
    id: 'm4',
    quarter: 'Q2',
    year: '2026',
    title: 'DKP CLI Toolkit v2.4-GOLD & SDK Multi-Language',
    description: 'Interfaccia a riga di comando nativa e pacchetti SDK ufficiali su NPM per integrare scansioni, audit e Vault da terminale.',
    status: 'completed',
    module: 'Developer Tools',
    xpReward: '+45 XP',
    badgeIcon: '💻'
  },
  {
    id: 'm5',
    quarter: 'Q3',
    year: '2026',
    title: 'DKP Blog & Content Vault Taxonomy System',
    description: 'Motore editoriale avanzato su database Neon Postgres & Drizzle ORM. Tassonomia a 2 livelli con icone Emoji e badge neon.',
    status: 'completed',
    module: 'Blog & Content Vault',
    xpReward: '+50 XP',
    badgeIcon: '📰'
  },
  {
    id: 'm6',
    quarter: 'Q3',
    year: '2026',
    title: 'Marketplace di Integrazioni & Webhook API',
    description: 'Possibilità di collegare DKP a GitHub Actions, GitLab CI, Slack e Discord tramite pipeline ad eventi in tempo reale.',
    status: 'completed',
    module: 'API Ecosystem',
    xpReward: '+35 XP',
    badgeIcon: '🔌'
  },
  {
    id: 'm7',
    quarter: 'Q4',
    year: '2026',
    title: 'Decentralized Reputation Network & Enterprise SSO',
    description: 'Sistema di governance Gamification su nodi distribuiti, autenticazione SAML/OIDC e licenze Enterprise Pro.',
    status: 'in-progress',
    module: 'Enterprise & Auth',
    xpReward: '+100 XP',
    badgeIcon: '🔑'
  }
]

const filteredMilestones = computed(() => {
  if (activeQuarter.value === 'all') return milestones
  return milestones.filter(m => m.quarter.toLowerCase() === activeQuarter.value)
})

const completedCount = computed(() => milestones.filter(m => m.status === 'completed').length)
const totalXpClaimable = computed(() => {
  return milestones.reduce((sum, m) => {
    const xpVal = parseInt(m.xpReward.replace(/\D/g, '')) || 0
    return sum + xpVal
  }, 0)
})

function getStatusLabel(status: RoadmapItem['status']) {
  switch (status) {
    case 'completed': return '✅ Rilasciato v2.4-GOLD'
    case 'in-progress': return '⚡ In Sviluppo'
    case 'planned': return '🎯 Pianificato'
  }
}
</script>

<template>
  <div class="roadmap-page">
    <div class="roadmap-container">
      
      <!-- HERO -->
      <header class="roadmap-hero">
        <div class="breadcrumb">Ecosistema DKP / Vision 2026</div>
        <h1>🚀 Roadmap Ecosistema <span class="highlight">v2.4-GOLD</span></h1>
        <p class="subtitle">
          Pianificazione strategica, evoluzione dei moduli IA, notarizzazione crittografica, tassonomia Blog e pietre miliari completate con rewards XP per la community.
        </p>

        <!-- STATS KPI WIDGET -->
        <div class="roadmap-stats-grid">
          <div class="stat-card">
            <span class="stat-value">{{ completedCount }} / {{ milestones.length }}</span>
            <span class="stat-label">Pietre Miliari Rilasciate</span>
          </div>
          <div class="stat-card highlight">
            <span class="stat-value">+{{ totalXpClaimable }} XP</span>
            <span class="stat-label">Punti XP Ecosistema</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ Math.round((completedCount / milestones.length) * 100) }}%</span>
            <span class="stat-label">Completamento 2026</span>
          </div>
        </div>

        <!-- FILTRI QUARTER -->
        <div class="quarter-tabs">
          <button @click="activeQuarter = 'all'" :class="{ active: activeQuarter === 'all' }">Tutti i Trimestri</button>
          <button @click="activeQuarter = 'q1'" :class="{ active: activeQuarter === 'q1' }">Q1 2026</button>
          <button @click="activeQuarter = 'q2'" :class="{ active: activeQuarter === 'q2' }">Q2 2026</button>
          <button @click="activeQuarter = 'q3'" :class="{ active: activeQuarter === 'q3' }">Q3 2026 (v2.4-GOLD)</button>
          <button @click="activeQuarter = 'q4'" :class="{ active: activeQuarter === 'q4' }">Q4 2026</button>
        </div>
      </header>

      <!-- TIMELINE GRID -->
      <div class="timeline-grid">
        <div 
          v-for="item in filteredMilestones" 
          :key="item.id"
          class="roadmap-card"
          :class="item.status"
        >
          <div class="card-top">
            <span class="quarter-badge">{{ item.quarter }} {{ item.year }}</span>
            <span class="status-badge" :class="item.status">{{ getStatusLabel(item.status) }}</span>
          </div>

          <h3><span class="badge-icon" v-if="item.badgeIcon">{{ item.badgeIcon }}</span> {{ item.title }}</h3>
          <p>{{ item.description }}</p>

          <div class="card-footer">
            <span class="module-tag">🧩 {{ item.module }}</span>
            <span v-if="item.xpReward" class="xp-tag" :class="{ gold: item.status === 'completed' }">
              {{ item.xpReward }}
            </span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.roadmap-page {
  background: #020420;
  color: #cbd5e1;
  min-height: 100vh;
  padding: 3rem 1.5rem 5rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.roadmap-container {
  max-width: 1100px;
  margin: 0 auto;
}

.breadcrumb {
  font-size: 0.8rem;
  color: #38bdf8;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.roadmap-hero h1 {
  font-size: 2.3rem;
  color: #ffffff;
  font-weight: 900;
  margin: 0 0 0.5rem;
  letter-spacing: -0.02em;
}

.highlight {
  color: #00dc82;
}

.subtitle {
  font-size: 1.05rem;
  color: #94a3b8;
  margin-bottom: 2rem;
  line-height: 1.6;
}

/* STATS KPI GRID */
.roadmap-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: #090d16;
  border: 1px solid #1e293b;
  padding: 1rem 1.25rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.stat-card.highlight {
  border-color: rgba(0, 220, 130, 0.4);
  background: rgba(0, 220, 130, 0.05);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 900;
  color: #ffffff;
}

.stat-card.highlight .stat-value {
  color: #00dc82;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* QUARTER TABS */
.quarter-tabs {
  display: flex;
  gap: 0.5rem;
  background: #090d16;
  padding: 0.35rem;
  border-radius: 8px;
  border: 1px solid #1e293b;
  width: fit-content;
  flex-wrap: wrap;
}

.quarter-tabs button {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.quarter-tabs button.active {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
}

/* TIMELINE GRID */
.timeline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-top: 2.5rem;
}

.roadmap-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.roadmap-card:hover {
  transform: translateY(-2px);
}

.roadmap-card.completed { border-left: 4px solid #00dc82; }
.roadmap-card.in-progress { border-left: 4px solid #38bdf8; }
.roadmap-card.planned { border-left: 4px solid #64748b; }

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.quarter-badge {
  background: #020420;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #1e293b;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.status-badge.completed { background: rgba(0, 220, 130, 0.15); color: #00dc82; }
.status-badge.in-progress { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
.status-badge.planned { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }

.roadmap-card h3 {
  color: #ffffff;
  font-size: 1.15rem;
  margin: 0 0 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.badge-icon {
  font-size: 1.1rem;
}

.roadmap-card p {
  color: #94a3b8;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #1e293b;
  padding-top: 0.8rem;
}

.module-tag {
  font-size: 0.78rem;
  color: #cbd5e1;
  font-weight: 600;
}

.xp-tag {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
}

.xp-tag.gold {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.3);
}
</style>