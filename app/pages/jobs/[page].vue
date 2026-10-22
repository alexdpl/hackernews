<!-- app/pages/jobs/[page].vue -->
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

const route = useRoute()
const router = useRouter()

const currentPage = computed(() => Math.max(1, parseInt(route.params.page) || 1))
const itemsPerPage = 15

// Puntiamo all'endpoint dedicato /api/jobs con paginazione
const { data: responseData, pending, error } = await useFetch('/api/jobs', {
  query: { page: currentPage, limit: itemsPerPage },
  watch: [currentPage]
})

// Estrazione dati sicura con normalizzazione al volo della compagnia e link
const jobList = computed(() => {
  const raw = responseData.value?.data || responseData.value?.stories || []
  return raw.map((job) => ({
    ...job,
    company: typeof job.company === 'object' ? job.company?.username : (job.company || job.author || 'Remote Partner'),
    url: job.url || '#'
  }))
})

const hasMore = computed(() => responseData.value?.pagination?.hasMore || false)

function handleNextPage() {
  if (!hasMore.value || pending.value) return
  router.push(`/jobs/${currentPage.value + 1}`)
}

function handlePrevPage() {
  if (currentPage.value <= 1 || pending.value) return
  router.push(`/jobs/${currentPage.value - 1}`)
}

const applyWithVault = (job) => {
  if (typeof window !== 'undefined') {
    console.log(`[PROOF OF CODE] Candidatura registrata per "${job.title}" (+10 XP)`)
  }
}

function formatTime(dateStr) {
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

const featuredArticles = ref([])

onMounted(async () => {
  try {
    const res = await $fetch('/api/blog/posts')
    const raw = res?.success ? res.data : (Array.isArray(res) ? res : [])
    featuredArticles.value = raw.slice(0, 2)
  } catch (err) {
    console.error('Errore recupero articoli in evidenza:', err)
  }
})

onUnmounted(() => {
  responseData.value = null
})

useSeoMeta({
  title: `Jobs DKP - Pagina ${currentPage.value} - DevKernelPulse`,
  description: 'Scopri la pagina ' + currentPage.value + ' delle offerte di lavoro tech.'
})
</script>

<template>
  <div class="jobs-page-container">
    <div class="jobs-header compact">
      <div class="header-text">
        <h1 class="jobs-title">
          Opportunità Tech <span class="highlight-text">Meritocratiche</span>
        </h1>
        <p class="jobs-subtitle">
          Jobs Board DKP — Stai visualizzando la <strong>Pagina {{ currentPage }}</strong>.
        </p>
      </div>
      <div class="header-action">
        <NuxtLink to="/submit?type=job" class="submit-job-btn">
          💼 Pubblica Offerta
        </NuxtLink>
      </div>
    </div>

    <div v-if="error" class="error-msg">Errore nel caricamento delle offerte di lavoro.</div>
    <div v-if="pending" class="loading-state">
      <span class="spinner">⚡</span> Sincronizzazione pagina {{ currentPage }} in corso...
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
              <span class="job-index">{{ ((currentPage - 1) * itemsPerPage) + index + 1 }}.</span>
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
              Candidati ⚡
            </a>
          </div>
        </article>
      </div>

      <div class="pagination-nav">
        <button @click="handlePrevPage" :disabled="currentPage <= 1 || pending" class="nav-btn prev">
          &lt; Pagina Precedente
        </button>
        <span class="page-indicator">Pag {{ currentPage }}</span>
        <button @click="handleNextPage" :disabled="!hasMore || pending" class="nav-btn next">
          Pagina Successiva &gt;
        </button>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>📭 Nessun'altra offerta trovata in questa pagina.</p>
      <NuxtLink to="/jobs" class="admin-link">Torna alla prima pagina</NuxtLink>
    </div>

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

    <DkpAdStrip categoryTag="DKP JOBS SPONSORED FEED" />
  </div>
</template>

<style scoped>
.jobs-page-container { max-width: 1000px; margin: 1.5rem auto; padding: 0 1rem; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; }
.jobs-header.compact { background: rgba(9, 13, 22, 0.85); backdrop-filter: blur(16px); border: 1px solid #1e293b; border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
.jobs-title { font-size: 1.4rem; font-weight: 900; margin: 0 0 0.2rem 0; color: #ffffff; }
.highlight-text { color: #00dc82; }
.jobs-subtitle { font-size: 0.85rem; color: #94a3b8; margin: 0; }
.submit-job-btn { background: rgba(0, 220, 130, 0.1); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.4); font-weight: 800; font-size: 0.8rem; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; transition: all 0.2s ease; }
.submit-job-btn:hover { background: #00dc82; color: #020420; }
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
.pagination-nav { margin-top: 2.5rem; display: flex; justify-content: center; align-items: center; gap: 1.5rem; padding-top: 1rem; border-top: 1px solid #1e293b; }
.nav-btn { background: #090d16; border: 1px solid #1e293b; color: #00dc82; font-weight: 800; cursor: pointer; font-size: 0.85rem; padding: 0.6rem 1.2rem; border-radius: 8px; transition: all 0.2s; }
.nav-btn:hover:not(:disabled) { border-color: #00dc82; background: rgba(0, 220, 130, 0.1); }
.nav-btn:disabled { color: #475569; border-color: #1e293b; cursor: not-allowed; background: transparent; }
.page-indicator { font-size: 0.9rem; font-weight: 800; color: #94a3b8; font-family: monospace; }
.loading-state, .empty-state, .error-msg { text-align: center; padding: 3rem 1rem; color: #94a3b8; background: #060a12; border: 1px solid #1e293b; border-radius: 12px; margin-bottom: 2rem; }
.admin-link { color: #38bdf8; text-decoration: underline; font-weight: 700; margin-top: 1rem; display: inline-block; }
.vault-recommended-section { margin: 3rem 0; padding-top: 2rem; border-top: 1px solid #1e293b; }
.recommended-title { font-size: 1.2rem; font-weight: 800; color: #ffffff; margin-bottom: 1rem; }
.recommended-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
.recommended-card { background: #090d16; border: 1px solid #1e293b; border-radius: 10px; padding: 1.2rem; text-decoration: none; display: flex; flex-direction: column; gap: 0.5rem; transition: transform 0.2s, border-color 0.2s; }
.recommended-card:hover { transform: translateY(-2px); border-color: #00dc82; }
.rec-cat { font-size: 0.65rem; font-weight: 800; color: #00dc82; text-transform: uppercase; }
.recommended-card h4 { color: #ffffff; font-size: 1rem; font-weight: 700; margin: 0; line-height: 1.3; }
.rec-read { color: #38bdf8; font-size: 0.75rem; font-weight: 700; margin-top: 0.5rem; }
</style>

