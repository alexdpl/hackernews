<!-- app/pages/jobs/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

// 1. Puntiamo all'endpoint dedicato /api/jobs con paginazione a 15
const { data: responseData, pending } = await useFetch('/api/jobs', {
  query: { page: 1, limit: 15 }
})

// Estrazione dati sicura con normalizzazione al volo di link, compagnia e autore
const jobList = computed(() => {
  const raw = responseData.value?.data || responseData.value?.stories || []
  return raw.map((job: any) => ({
    ...job,
    // Estrazione stringa pulita per la compagnia / autore
    company: typeof job.company === 'object' ? job.company?.username : (job.company || job.author || 'Remote Partner'),
    // Fallback sicuro per il link dell'offerta
    url: job.url || '#'
  }))
})

const hasMore = computed(() => responseData.value?.pagination?.hasMore || false)

// 2. Articoli Consigliati dal Vault
const featuredArticles = ref<any[]>([])

onMounted(async () => {
  try {
    const res: any = await $fetch('/api/blog/posts')
    const raw = res?.success ? res.data : (Array.isArray(res) ? res : [])
    featuredArticles.value = raw.slice(0, 2)
  } catch (err) {
    console.error('Errore recupero articoli in evidenza:', err)
  }
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

useHead({
  title: 'Opportunità Tech Meritocratiche - DKP Jobs v2.5-GOLD',
  meta: [
    { name: 'description', content: 'Offerte di lavoro tech verificate dal DKP Crawler e basate su Proof of Code e repository reali.' }
  ]
})
</script>

<template>
  <div class="jobs-page-container">
    
    <!-- HEADER DELLA SEZIONE JOBS HUB -->
    <div class="jobs-header">
      <div class="header-text">
        <div class="jobs-badge">
          ⚡ DKP PROOF OF CODE JOBS • v2.5-GOLD
        </div>
        <h1 class="jobs-title">
          Opportunità Tech <span class="highlight-text">Meritocratiche</span>
        </h1>
        <p class="jobs-subtitle">
          Offerte di lavoro verificate e acquisite in tempo reale dal DKP Crawler da provider globali. Candidati sfruttando il tuo profilo Proof of Code e accumula XP.
        </p>
      </div>

      <div class="header-action">
        <NuxtLink to="/submit?type=job" class="submit-job-btn">
          💼 Pubblica Offerta (+25 XP)
        </NuxtLink>
      </div>
    </div>

    <!-- FEED DEI JOB -->
    <div v-if="pending" class="loading-state">
      <span class="spinner">⚡</span> Caricamento offerte dal Neon Kernel DB...
    </div>

    <div v-else-if="jobList.length > 0">
      <div class="jobs-feed-list">
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
              <span class="detail-item company">🏢 {{ job.company }}</span>
              <span class="detail-item domain">🌐 {{ job.domain || 'remoteok.com' }}</span>
              <span class="detail-item xp-badge-tag">⭐ +{{ job.xp_awarded || 25 }} XP</span>
              <span class="detail-item time-tag">⏱️ {{ formatTime(job.createdAt || job.created_at) }}</span>
            </div>
          </div>

          <div class="job-action">
            <a :href="job.url" target="_blank" rel="noopener noreferrer" @click="applyWithVault(job)" class="apply-btn">
              Candidati con Proof of Code ⚡
            </a>
          </div>
        </article>
      </div>
      
      <!-- Bottone Paginazione -->
      <div v-if="hasMore" class="mt-6 flex justify-center">
        <NuxtLink to="/jobs/2" class="more-btn">
          Vedi altre offerte ➔
        </NuxtLink>
      </div>
    </div>

    <!-- EMPTY STATE FALLBACK -->
    <div v-else class="empty-state">
      <p>📭 Nessun annuncio di lavoro presente nel database Neon.</p>
      <div class="empty-actions">
        <NuxtLink to="/admin/crawler" class="admin-link">🤖 Sincronizza Jobs dal Crawler Admin</NuxtLink>
        <span class="sep">•</span>
        <NuxtLink to="/submit?type=job" class="submit-inline-link">Pubblica la prima offerta!</NuxtLink>
      </div>
    </div>

    <!-- 🟢 SEZIONE VAULT (Incrocio Dati) -->
    <div v-if="featuredArticles.length > 0" class="vault-recommended-section">
      <h3 class="recommended-title">🔗 Approfondimenti dal Vault</h3>
      <div class="recommended-grid">
        <NuxtLink 
          v-for="art in featuredArticles" 
          :key="art.id" 
          :to="`/blog/${art.slug || art.id}`"
          class="recommended-card"
        >
          <span class="rec-cat">{{ art.categoryName || art.category || 'Tech' }}</span>
          <h4>{{ art.title }}</h4>
          <span class="rec-read">Leggi articolo ➔</span>
        </NuxtLink>
      </div>
    </div>

    <!-- 🟢 BANNER DKP ADS STRIP -->
    <DkpAdStrip categoryTag="DKP JOBS SPONSORED FEED" />
  </div>
</template>

<style scoped>
.jobs-page-container { max-width: 1000px; margin: 1.5rem auto; padding: 0 1rem; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; }

.jobs-header { background: rgba(9, 13, 22, 0.85); backdrop-filter: blur(16px); border: 1px solid #1e293b; border-radius: 16px; padding: 1.75rem 2rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.25rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
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

.mt-6 { margin-top: 1.5rem; }
.flex { display: flex; }
.justify-center { justify-content: center; }
.more-btn { background: #090d16; color: #00dc82; border: 1px solid #1e293b; padding: 0.6rem 1.5rem; border-radius: 8px; font-weight: bold; text-decoration: none; transition: all 0.2s; }
.more-btn:hover { border-color: #00dc82; background: rgba(0, 220, 130, 0.1); }

.loading-state, .empty-state { text-align: center; padding: 3rem 1rem; color: #94a3b8; background: #060a12; border: 1px solid #1e293b; border-radius: 12px; margin-bottom: 2rem; }
.empty-actions { margin-top: 0.8rem; display: flex; justify-content: center; gap: 0.8rem; align-items: center; }
.admin-link { color: #38bdf8; text-decoration: underline; font-weight: 700; }
.submit-inline-link { color: #00dc82; text-decoration: underline; font-weight: 700; }
.sep { color: #334155; }

.vault-recommended-section { margin: 3rem 0; padding-top: 2rem; border-top: 1px solid #1e293b; }
.recommended-title { font-size: 1.2rem; font-weight: 800; color: #ffffff; margin-bottom: 1rem; }
.recommended-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
.recommended-card { background: #090d16; border: 1px solid #1e293b; border-radius: 10px; padding: 1.2rem; text-decoration: none; display: flex; flex-direction: column; gap: 0.5rem; transition: transform 0.2s, border-color 0.2s; }
.recommended-card:hover { transform: translateY(-2px); border-color: #00dc82; }
.rec-cat { font-size: 0.65rem; font-weight: 800; color: #00dc82; text-transform: uppercase; }
.recommended-card h4 { color: #ffffff; font-size: 1rem; font-weight: 700; margin: 0; line-height: 1.3; }
.rec-read { color: #38bdf8; font-size: 0.75rem; font-weight: 700; margin-top: 0.5rem; }
</style>