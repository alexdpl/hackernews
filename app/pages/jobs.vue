<!-- app/pages/jobs.vue -->
<template>
  <div class="jobs-page-container">
    
    <!-- HEADER DELLA SEZIONE JOBS HUB -->
    <div class="jobs-header">
      <div class="header-text">
        <div class="jobs-badge">
          ⚡ DKP PROOF OF CODE JOBS • v2.4-GOLD
        </div>
        <h1 class="jobs-title">
          Opportunità Tech <span class="highlight-text">Meritocratiche</span>
        </h1>
        <p class="jobs-subtitle">
          Offerte di lavoro verificate e acquisite in tempo reale dal DKP Crawler da provider globali (RemoteOK, Dev.to). Candidati sfruttando il tuo profilo Proof of Code e accumula XP.
        </p>
      </div>

      <div class="header-action">
        <NuxtLink to="/submit?type=job" class="submit-job-btn">
          💼 Pubblica Offerta (+25 XP)
        </NuxtLink>
      </div>
    </div>

    <!-- FEED DEI JOB DA NEON DB -->
    <div v-if="pending" class="loading-state">
      <span class="spinner">⚡</span> Caricamento offerte dal Neon Kernel DB...
    </div>

    <div v-else-if="jobList && jobList.length > 0" class="jobs-feed-list">
      <article 
        v-for="(job, index) in jobList" 
        :key="job.id || index" 
        class="job-card"
      >
        <div class="job-info">
          <div class="job-title-row">
            <span class="job-index">{{ index + 1 }}.</span>
            <a :href="job.url" target="_blank" rel="noopener noreferrer" class="job-position-title">
              {{ job.title }}
            </a>
          </div>
          
          <div class="job-details-meta">
            <span class="detail-item company">🏢 {{ job.author || 'RemoteOK' }}</span>
            <span class="detail-item domain">🌐 {{ job.domain || 'remoteok.com' }}</span>
            <span class="detail-item xp-badge-tag">⭐ +{{ job.xp_awarded || 25 }} XP</span>
            <span class="detail-item time-tag">⏱️ {{ formatTime(job.created_at) }}</span>
          </div>
        </div>

        <div class="job-action">
          <a :href="job.url" target="_blank" rel="noopener noreferrer" @click="applyWithVault(job)" class="apply-btn">
            Candidati con Proof of Code ⚡
          </a>
        </div>
      </article>
    </div>

    <!-- EMPTY STATE FALLBACK (SE DB VUOTO) -->
    <div v-else class="empty-state">
      <p>📭 Nessun annuncio di lavoro presente nel database Neon.</p>
      <div class="empty-actions">
        <NuxtLink to="/admin/crawler" class="admin-link">🤖 Sincronizza Jobs dal Crawler Admin</NuxtLink>
        <span class="sep">•</span>
        <NuxtLink to="/submit?type=job" class="submit-inline-link">Pubblica la prima offerta!</NuxtLink>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

useHead({
  title: 'Opportunità Tech Meritocratiche - DKP Jobs v2.4-GOLD',
  meta: [
    { name: 'description', content: 'Offerte di lavoro tech verificate dal DKP Crawler e basate su Proof of Code e repository reali.' }
  ]
})

// Fetch dinamico diretto dal database Neon per la sezione 'jobs'
const { data: apiResponse, pending } = await useFetch('/api/pulse/stories?type=jobs')

const jobList = computed(() => {
  return apiResponse.value?.stories || []
})

// Gestione Candidatura via Proof of Code Vault
const applyWithVault = (job: any) => {
  if (typeof window !== 'undefined') {
    console.log(`[PROOF OF CODE] Candidatura registrata per "${job.title}" (+10 XP)`)
  }
}

// Helper formattazione data
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
.jobs-page-container { max-width: 1000px; margin: 1.5rem auto; padding: 0 1rem; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; }

.jobs-header { background: rgba(9, 13, 22, 0.85); backdrop-filter: blur(16px); border: 1px solid #1e293b; border-radius: 16px; padding: 1.75rem 2rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.25rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
.jobs-badge { display: inline-block; background: rgba(0, 220, 130, 0.12); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; padding: 0.25rem 0.6rem; border-radius: 6px; margin-bottom: 0.6rem; }
.jobs-title { font-size: 1.85rem; font-weight: 900; margin: 0 0 0.4rem 0; color: #ffffff; }
.highlight-text { color: #00dc82; }
.jobs-subtitle { font-size: 0.88rem; color: #94a3b8; margin: 0; max-width: 650px; line-height: 1.5; }

.submit-job-btn { background: #00dc82; color: #020420; font-weight: 900; font-size: 0.85rem; padding: 0.7rem 1.2rem; border-radius: 8px; text-decoration: none; transition: all 0.2s ease; white-space: nowrap; display: inline-block; }
.submit-job-btn:hover { transform: translateY(-2px); box-shadow: 0 0 20px rgba(0, 220, 130, 0.4); }

.jobs-feed-list { display: flex; flex-direction: column; gap: 1rem; }
.job-card { background: rgba(9, 13, 22, 0.85); border: 1px solid #1e293b; border-radius: 12px; padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; flex-wrap: wrap; transition: border-color 0.2s ease; }
.job-card:hover { border-color: rgba(0, 220, 130, 0.4); }

.job-info { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; min-width: 280px; }
.job-title-row { display: flex; align-items: baseline; gap: 0.5rem; }
.job-index { font-size: 0.9rem; color: #64748b; font-weight: 800; }
.job-position-title { font-size: 1.1rem; font-weight: 800; color: #ffffff; text-decoration: none; }
.job-position-title:hover { color: #00dc82; text-decoration: underline; }

.job-details-meta { display: flex; align-items: center; gap: 1rem; font-size: 0.82rem; color: #94a3b8; flex-wrap: wrap; }
.company { color: #f1f5f9; font-weight: 700; }
.domain { color: #38bdf8; }
.xp-badge-tag { color: #f59e0b; font-weight: 800; }

.apply-btn { background: #00dc82; color: #020420; border: none; font-size: 0.85rem; font-weight: 800; padding: 0.65rem 1.25rem; border-radius: 8px; cursor: pointer; text-decoration: none; transition: all 0.2s ease; white-space: nowrap; display: inline-block; }
.apply-btn:hover { transform: translateY(-2px); box-shadow: 0 0 15px rgba(0, 220, 130, 0.4); }

.loading-state, .empty-state { text-align: center; padding: 3rem 1rem; color: #94a3b8; background: #060a12; border: 1px solid #1e293b; border-radius: 12px; }
.empty-actions { margin-top: 0.8rem; display: flex; justify-content: center; gap: 0.8rem; align-items: center; }
.admin-link { color: #38bdf8; text-decoration: underline; font-weight: 700; }
.submit-inline-link { color: #00dc82; text-decoration: underline; font-weight: 700; }
.sep { color: #334155; }
</style>