<script setup lang="ts">
import { computed } from 'vue'
import { roadmapMilestones } from '~/data/roadmap'

useDkpSeo({
  title: 'Roadmap Ecosistema 2026-2027 v2.5-GOLD - DevKernelPulse',
  description: 'Piano ufficiale di sviluppo dell\'ecosistema DKP: Firewall Live SSE, OpenUI Studio, OpenRouter AI Gateway, Pulse Sentinel, DKP Nodes e Visione Futura 2027.',
})

const milestones = roadmapMilestones

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

    <!-- FILTRI -->
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

    <!-- TIMELINE -->
    <div class="timeline-wrapper">
      <div
        v-for="item in filteredMilestones"
        :key="item.id"
        class="timeline-item"
        :class="item.status"
      >
        <div class="timeline-marker" aria-hidden="true">
          <span class="marker-dot"></span>
        </div>

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

.highlight { color: #00dc82; text-shadow: 0 0 20px rgba(0, 220, 130, 0.3); }

.subtitle {
  color: #94a3b8;
  max-width: 680px;
  margin: 0 auto 2rem auto;
  font-size: 1rem;
  line-height: 1.6;
}

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

.timeline-wrapper { position: relative; padding-left: 2rem; }

.timeline-wrapper::before {
  content: '';
  position: absolute;
  left: 9px;
  top: 10px;
  bottom: 10px;
  width: 2px;
  background: #1e293b;
}

.timeline-item { position: relative; margin-bottom: 2rem; }

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

.timeline-item.completed .marker-dot { border-color: #00dc82; background: #00```css
dc82; box-shadow: 0 0 12px #00dc82; }
.timeline-item.in-progress .marker-dot { border-color: #facc15; background: #facc15; box-shadow: 0 0 12px #facc15; }
.timeline-item.upcoming .marker-dot { border-color: #38bdf8; background: #38bdf8; box-shadow: 0 0 12px #38bdf8; }

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