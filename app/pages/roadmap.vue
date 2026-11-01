<!-- app/pages/roadmap.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { roadmapMilestones } from '~/data/roadmap'

useDkpSeo({
  title: 'Roadmap Ecosistema 2026-2027 v2.5-GOLD - DevKernelPulse',
  description: 'Piano ufficiale di sviluppo dell\'ecosistema DKP: Firewall Live SSE, OpenUI Studio, OpenRouter AI Gateway, Pulse Sentinel, DKP Nodes e Visione Futura 2027.',
})

const milestones = roadmapMilestones

// ✅ FIX: usa direttamente il campo progress, include anche gli "upcoming" parziali
const overallCompletion = computed(() => {
  if (!milestones.length) return 0
  const total = milestones.reduce((acc, m) => acc + m.progress, 0)
  return Math.round(total / milestones.length)
})

type FilterKey = 'all' | 'completed' | 'in-progress' | 'upcoming'

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Tutte le Fasi' },
  { key: 'completed', label: '🟢 Completati (2026)' },
  { key: 'in-progress', label: '⚡ In Corso (2027)' },
  { key: 'upcoming', label: '🔮 Visione Futura' },
]

const activeFilter = ref<FilterKey>('all')

const filteredMilestones = computed(() => {
  if (activeFilter.value === 'all') return milestones
  return milestones.filter(m => m.status === activeFilter.value)
})

const statusLabel = (item: typeof milestones[number]) => {
  if (item.status === 'completed') return `🟢 COMPLETATO (${item.progress}%)`
  if (item.status === 'in-progress') return `⚡ IN CORSO (${item.progress}%)`
  return '🔮 IN ARRIVO'
}

// ✅ Structured data per rich snippet su Google/Bing
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'DevKernelPulse Roadmap 2026-2027',
        itemListElement: milestones.map((m, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `${m.quarter} - ${m.phaseTitle}`,
          description: m.description,
        })),
      }),
    },
  ],
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
        Trasparenza totale sullo stato di avanzamento delle funzionalità, integrazioni IA OpenRouter, moderazione Sentinel per i DKP Nodes e la nuova visione strategica per il 2027.
      </p>

      <!-- PROGRESS OVERALL METRIC -->
      <div class="overall-progress-card">
        <div class="progress-info">
          <span id="overall-progress-label">Stato Avanzamento Globale Ecosistema:</span>
          <strong class="progress-percent">{{ overallCompletion }}%</strong>
        </div>
        <div
          class="progress-bar-track"
          role="progressbar"
          :aria-valuenow="overallCompletion"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-labelledby="overall-progress-label"
        >
          <div class="progress-bar-fill" :style="{ width: overallCompletion + '%' }"></div>
        </div>
      </div>
    </header>

    <!-- CONTROLS & FILTRI -->
    <div class="controls-bar">
      <div class="filter-pills" role="tablist" aria-label="Filtra milestone per stato">
        <button
          v-for="f in filters"
          :key="f.key"
          type="button"
          role="tab"
          :aria-selected="activeFilter === f.key"
          :class="['pill', { active: activeFilter === f.key }]"
          @click="activeFilter = f.key"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- TIMELINE MILESTONES -->
    <div class="timeline-wrapper">
      <div
        v-for="item in filteredMilestones"
        :key="item.id"
        class="timeline-item"
        :class="item.status"
      >

        <!-- MARKER E LINEA -->
        <div class="timeline-marker" aria-hidden="true">
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
              {{ statusLabel(item) }}
            </div>
          </div>

          <h2 class="milestone-title">{{ item.phaseTitle }}</h2>
          <p class="milestone-desc">{{ item.description }}</p>

          <div class="features-box">
            <h4>📋 Deliverables &amp; Moduli:</h4>
            <ul class="features-list">
              <li v-for="(feat, idx) in item.features" :key="idx">
                <span class="check-icon" aria-hidden="true">▹</span> {{ feat }}
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
</style>