<!-- app/pages/show.vue -->
<template>
  <div class="show-page-container">
    
    <!-- HEADER SHOWCASE UNIFICATO -->
    <div class="show-header">
      <div class="header-text">
        <div class="show-badge">
          🚀 DKP SHOWCASE • v2.4-GOLD
        </div>
        <h1 class="show-title">
          Progetti & Repo <span class="highlight-text">Open Source</span>
        </h1>
        <p class="show-subtitle">
          Le migliori repository GitHub di tendenza e i progetti creati dalla community, sincronizzati dal DKP Crawler. Vota i progetti e accumula XP!
        </p>
      </div>

      <div class="header-action">
        <NuxtLink to="/submit?type=show" class="submit-show-btn">
          🚀 Invia Progetto (+30 XP)
        </NuxtLink>
      </div>
    </div>

    <!-- FEED SHOWCASE DA NEON DB -->
    <div v-if="pending" class="loading-state">
      <span class="spinner">⚡</span> Caricamento showcase dal Neon Kernel DB...
    </div>

    <div v-else-if="projects && projects.length > 0" class="show-feed-list">
      <article 
        v-for="(project, index) in projects" 
        :key="project.id || index" 
        class="show-card"
      >
        <button 
          @click="voteProject(project)" 
          class="vote-btn" 
          :class="{ voted: project.voted }"
          title="Vota questo progetto (+5 XP)"
        >
          <span class="vote-icon">▲</span>
          <span class="vote-count">{{ project.points || 1 }}</span>
        </button>

        <div class="show-info">
          <div class="show-title-row">
            <span class="show-index">{{ index + 1 }}.</span>
            <a :href="project.url" target="_blank" rel="noopener noreferrer" class="show-project-title">
              {{ project.title }}
            </a>
            <span v-if="project.domain" class="show-domain">({{ project.domain }}) ↗</span>
          </div>

          <div class="show-meta">
            <span>👤 Owner: <strong class="author-tag">@{{ project.author || 'github_user' }}</strong></span>
            <span class="meta-dot">•</span>
            <span class="xp-tag">⭐ +{{ project.xp_awarded || 30 }} XP</span>
            <span class="meta-dot">•</span>
            <span class="time-tag">⏱️ {{ formatTime(project.created_at) }}</span>
            <span class="meta-dot">•</span>
            <span class="verify-tag">Verified da <strong>DKP Crawler</strong></span>
          </div>
        </div>
      </article>
    </div>

    <!-- EMPTY STATE FALLBACK (NESSUN DATO MOCK) -->
    <div v-else class="empty-state">
      <p>📭 Nessun progetto presente nella vetrina Showcase.</p>
      <div class="empty-actions">
        <NuxtLink to="/admin/crawler" class="admin-link">🤖 Avvia Crawler GitHub Trending</NuxtLink>
        <span class="sep">•</span>
        <NuxtLink to="/submit?type=show" class="submit-inline-link">Invia il tuo primo progetto!</NuxtLink>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

useHead({
  title: 'Show DKP - Progetti & GitHub Trending v2.4-GOLD',
  meta: [
    { name: 'description', content: 'Vetrina dei migliori progetti Open Source e repository GitHub sincronizzati da DKP Crawler.' }
  ]
})

// Fetch reattivo dal DB Neon per la sezione 'show' (SENZA FALLBACK MOCK)
const { data: apiResponse, pending } = await useFetch('/api/pulse/stories?type=show')

const projects = computed(() => {
  return apiResponse.value?.stories || []
})

const voteProject = (project: any) => {
  if (project.voted) {
    project.points = (project.points || 1) - 1
    project.voted = false
  } else {
    project.points = (project.points || 0) + 1
    project.voted = true
  }
}

function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return 'di recente'
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    if (diffHours < 1) return 'poco fa'
    if (diffHours < 24) return `${diffHours}h fa`
    return `${Math.floor(diffHours / 24)}g fa`
  } catch {
    return 'di recente'
  }
}
</script>

<style scoped>
.show-page-container { max-width: 1000px; margin: 1.5rem auto; padding: 0 1rem; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; }

.show-header { background: rgba(9, 13, 22, 0.85); backdrop-filter: blur(16px); border: 1px solid #1e293b; border-radius: 16px; padding: 1.75rem 2rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.25rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
.show-badge { display: inline-block; background: rgba(0, 220, 130, 0.12); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; padding: 0.25rem 0.6rem; border-radius: 6px; margin-bottom: 0.6rem; }
.show-title { font-size: 1.85rem; font-weight: 900; margin: 0 0 0.4rem 0; color: #ffffff; }
.highlight-text { color: #00dc82; }
.show-subtitle { font-size: 0.88rem; color: #94a3b8; margin: 0; max-width: 650px; line-height: 1.5; }

.submit-show-btn { background: #00dc82; color: #020420; font-weight: 900; font-size: 0.85rem; padding: 0.7rem 1.2rem; border-radius: 8px; text-decoration: none; transition: all 0.2s ease; white-space: nowrap; display: inline-block; }
.submit-show-btn:hover { transform: translateY(-2px); box-shadow: 0 0 20px rgba(0, 220, 130, 0.4); }

.show-feed-list { display: flex; flex-direction: column; gap: 0.8rem; }
.show-card { background: rgba(9, 13, 22, 0.85); border: 1px solid #1e293b; border-radius: 12px; padding: 1.1rem 1.3rem; display: flex; align-items: center; gap: 1rem; transition: border-color 0.2s ease; }
.show-card:hover { border-color: rgba(0, 220, 130, 0.4); }

.vote-btn { background: #020420; border: 1px solid #1e293b; color: #94a3b8; border-radius: 8px; padding: 0.4rem 0.6rem; display: flex; flex-direction: column; align-items: center; cursor: pointer; min-width: 44px; transition: all 0.2s; }
.vote-btn:hover { border-color: #00dc82; color: #00dc82; }
.vote-btn.voted { background: rgba(0, 220, 130, 0.15); border-color: #00dc82; color: #00dc82; }
.vote-icon { font-size: 0.7rem; }
.vote-count { font-size: 0.82rem; font-weight: 800; }

.show-info { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; }
.show-title-row { display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
.show-index { font-size: 0.88rem; color: #64748b; font-weight: 800; }
.show-project-title { font-size: 1.05rem; font-weight: 800; color: #ffffff; text-decoration: none; }
.show-project-title:hover { color: #00dc82; text-decoration: underline; }
.show-domain { font-size: 0.8rem; color: #38bdf8; }

.show-meta { font-size: 0.78rem; color: #64748b; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.author-tag { color: #00dc82; }
.xp-tag { color: #f59e0b; font-weight: 800; }
.verify-tag { color: #94a3b8; }
.meta-dot { color: #334155; }

.loading-state, .empty-state { text-align: center; padding: 3rem 1rem; color: #94a3b8; background: #060a12; border: 1px solid #1e293b; border-radius: 12px; }
.empty-actions { margin-top: 0.8rem; display: flex; justify-content: center; gap: 0.8rem; align-items: center; }
.admin-link { color: #38bdf8; text-decoration: underline; font-weight: 700; }
.submit-inline-link { color: #00dc82; text-decoration: underline; font-weight: 700; }
.sep { color: #334155; }
</style>