<!-- pages/roadmap.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'Roadmap Ecosistema 2026 — DevKernelPulse',
  meta: [
    { name: 'description', content: 'Roadmap ufficiale dello sviluppo DKP per il 2026: feature, pietre miliari e aggiornamenti dell\'ecosistema.' }
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
  xpReward?: string
}

const milestones: RoadmapItem[] = [
  {
    id: 'm1',
    quarter: 'Q1',
    year: '2026',
    title: 'Pulse Nexus v2.4 Release & Micro-Frontend',
    description: 'Riprogettazione completa dell\'interfaccia in Nuxt 3, Nitro Engine a bassissima latenza e architettura modulare.',
    status: 'completed',
    module: 'Core System',
    xpReward: '+50 XP'
  },
  {
    id: 'm2',
    quarter: 'Q1',
    year: '2026',
    title: 'Notarizzazione SHA-256 Multi-Chain',
    description: 'Integrazione nel Vault del supporto all\'esportazione notarizzata JSON-LD e verifica dell\'impronta software.',
    status: 'completed',
    module: 'Proof of Code'
  },
  {
    id: 'm3',
    quarter: 'Q2',
    year: '2026',
    title: 'AI Scanner v2.3 Pro con Analisi Statica SAST',
    description: 'Supporto esteso a 18+ linguaggi con rilevamento automatico secret-leak, SQL Injection e antipattern.',
    status: 'completed',
    module: 'AI Code Scanner',
    xpReward: '+30 XP'
  },
  {
    id: 'm4',
    quarter: 'Q2',
    year: '2026',
    title: 'DKP Native SDK (Node.js, Python, Go)',
    description: 'Pacchetti SDK ufficiali pubblicati su npm, PyPI e pkg.go.dev con client tipizzato e rate-limiting integrato.',
    status: 'completed',
    module: 'Developer Tools'
  },
  {
    id: 'm5',
    quarter: 'Q3',
    year: '2026',
    title: 'Marketplace di Integrazioni & Webhook API',
    description: 'Possibilità di collegare DKP a GitHub Actions, GitLab CI, Slack e Discord tramite pipeline ad eventi.',
    status: 'completed',
    module: 'API Ecosystem'
  },
  {
    id: 'm6',
    quarter: 'Q4',
    year: '2026',
    title: 'Decentralized Reputation Network & Enterprise SSO',
    description: 'Sistema di governance Gamification su nodi distribuiti e autenticazione SAML/OIDC per licenze Pro.',
    status: 'planned',
    module: 'Enterprise & Auth'
  }
]

const filteredMilestones = computed(() => {
  if (activeQuarter.value === 'all') return milestones
  return milestones.filter(m => m.quarter.toLowerCase() === activeQuarter.value)
})

function getStatusLabel(status: RoadmapItem['status']) {
  switch (status) {
    case 'completed': return '✅ Rilasciato'
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
        <div class="breadcrumb">Ecosistema DKP / Vision</div>
        <h1>🚀 Roadmap Ecosistema 2026</h1>
        <p class="subtitle">
          Pianificazione strategica, evoluzione dei moduli IA/Crittografici e pietre miliari per il rilascio della piattaforma.
        </p>

        <!-- FILTRI QUARTER -->
        <div class="quarter-tabs">
          <button @click="activeQuarter = 'all'" :class="{ active: activeQuarter === 'all' }">Tutti i Trimestri</button>
          <button @click="activeQuarter = 'q1'" :class="{ active: activeQuarter === 'q1' }">Q1 2026</button>
          <button @click="activeQuarter = 'q2'" :class="{ active: activeQuarter === 'q2' }">Q2 2026</button>
          <button @click="activeQuarter = 'q3'" :class="{ active: activeQuarter === 'q3' }">Q3 2026</button>
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

          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>

          <div class="card-footer">
            <span class="module-tag">🧩 {{ item.module }}</span>
            <span v-if="item.xpReward" class="xp-tag">{{ item.xpReward }}</span>
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
  font-family: ui-sans-serif, system-ui, sans-serif;
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
}

.subtitle {
  font-size: 1.05rem;
  color: #94a3b8;
  margin-bottom: 2rem;
}

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
  transition: border-color 0.2s ease;
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
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}
</style>