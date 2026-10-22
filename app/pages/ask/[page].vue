<!-- app/pages/ask/[page].vue -->
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

const route = useRoute()
const router = useRouter()

// 1. Gestione Paginazione Dinamica
const currentPage = computed(() => Math.max(1, parseInt(route.params.page) || 1))
const itemsPerPage = 15

// 2. Fetch API Dedicato con chiave reattiva per evitare la deduplicazione
const { data: responseData, pending, error } = await useFetch('/api/ask', {
  key: `ask-page-${currentPage.value}`,
  query: { page: currentPage, limit: itemsPerPage },
  watch: [currentPage]
})

// Estrazione dati sicura con normalizzazione al volo di autore e link
const askList = computed(() => {
  const raw = responseData.value?.data || responseData.value?.stories || []
  return raw.map((item) => ({
    ...item,
    author: typeof item.author === 'object' ? item.author?.username : (item.author || item.user || 'community_ask'),
    url: item.url || `/item/${item.id}`
  }))
})

const hasMore = computed(() => responseData.value?.pagination?.hasMore || false)

// Navigazione
function handleNextPage() {
  if (!hasMore.value || pending.value) return
  router.push(`/ask/${currentPage.value + 1}`)
}

function handlePrevPage() {
  if (currentPage.value <= 1 || pending.value) return
  router.push(`/ask/${currentPage.value - 1}`)
}

const voteAsk = (item) => {
  if (item.voted) {
    item.points = (item.points || 1) - 1
    item.voted = false
  } else {
    item.points = (item.points || 0) + 1
    item.voted = true
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
  title: `Ask DKP - Pagina ${currentPage.value} - DevKernelPulse`,
  description: 'Scopri la pagina ' + currentPage.value + ' delle discussioni e Q&A tecniche della community DKP.'
})
</script>

<template>
  <div class="ask-page-container">
    
    <!-- HEADER COMPATTO PER PAGINE SUCCESSIVE -->
    <div class="ask-header compact">
      <div class="header-text">
        <h1 class="ask-title">
          Ask <span class="highlight-text">DKP Community</span>
        </h1>
        <p class="ask-subtitle">
          Community Q&A — Stai visualizzando la <strong>Pagina {{ currentPage }}</strong>.
        </p>
      </div>
      <div class="header-action">
        <NuxtLink to="/submit?type=ask" class="submit-ask-btn">
          💬 Fai una Domanda
        </NuxtLink>
      </div>
    </div>

    <!-- FEED DISCUSSIONI -->
    <div v-if="error" class="error-msg">Errore nel caricamento delle discussioni.</div>
    <div v-if="pending" class="loading-state">
      <span class="spinner">⚡</span> Sincronizzazione pagina {{ currentPage }} in corso...
    </div>

    <div v-else-if="askList.length > 0">
      <div class="ask-feed-list">
        <article 
          v-for="(item, index) in askList" 
          :key="item.id || index" 
          class="ask-card"
        >
          <button 
            @click="voteAsk(item)" 
            class="vote-btn" 
            :class="{ voted: item.voted }"
          >
            <span class="vote-icon">▲</span>
            <span class="vote-count">{{ item.points || 1 }}</span>
          </button>

          <div class="ask-info">
            <div class="ask-title-row">
              <span class="ask-index">{{ ((currentPage - 1) * itemsPerPage) + index + 1 }}.</span>
              <a :href="item.url" target="_blank" rel="noopener noreferrer" class="ask-question-title">
                {{ item.title }}
              </a>
            </div>

            <div class="ask-meta">
              <span>👤 Chiesto da <strong class="author-tag">@{{ item.author }}</strong></span>
              <span class="meta-dot">•</span>
              <span class="time-tag">⏱️ {{ formatTime(item.createdAt || item.created_at) }}</span>
              <span class="meta-dot">•</span>
              <span class="verify-tag">Verified da <strong>DKP Crawler</strong></span>
            </div>
          </div>
        </article>
      </div>

      <!-- NAVIGAZIONE PAGINAZIONE -->
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
      <p>📭 Nessun'altra discussione trovata in questa pagina.</p>
      <NuxtLink to="/ask" class="admin-link">Torna alla prima pagina</NuxtLink>
    </div>

    <!-- 🟢 SEZIONE VAULT -->
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
    <DkpAdStrip categoryTag="DKP ASK SPONSORED FEED" />
  </div>
</template>

<style scoped>
.ask-page-container { max-width: 1000px; margin: 1.5rem auto; padding: 0 1rem; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; }
.ask-header.compact { background: rgba(9, 13, 22, 0.85); backdrop-filter: blur(16px); border: 1px solid #1e293b; border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
.ask-title { font-size: 1.4rem; font-weight: 900; margin: 0 0 0.2rem 0; color: #ffffff; }
.highlight-text { color: #00dc82; }
.ask-subtitle { font-size: 0.85rem; color: #94a3b8; margin: 0; }
.submit-ask-btn { background: rgba(0, 220, 130, 0.1); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.4); font-weight: 800; font-size: 0.8rem; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; transition: all 0.2s ease; }
.submit-ask-btn:hover { background: #00dc82; color: #020420; }
.ask-feed-list { display: flex; flex-direction: column; gap: 0.8rem; }
.ask-card { background: rgba(9, 13, 22, 0.85); border: 1px solid #1e293b; border-radius: 12px; padding: 1.1rem 1.3rem; display: flex; align-items: center; gap: 1rem; transition: border-color 0.2s ease; }
.ask-card:hover { border-color: rgba(0, 220, 130, 0.4); }
.vote-btn { background: #020420; border: 1px solid #1e293b; color: #94a3b8; border-radius: 8px; padding: 0.4rem 0.6rem; display: flex; flex-direction: column; align-items: center; cursor: pointer; min-width: 44px; transition: all 0.2s; }
.vote-btn:hover { border-color: #00dc82; color: #00dc82; }
.vote-btn.voted { background: rgba(0, 220, 130, 0.15); border-color: #00dc82; color: #00dc82; }
.vote-icon { font-size: 0.7rem; }
.vote-count { font-size: 0.82rem; font-weight: 800; }
.ask-info { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; }
.ask-title-row { display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
.ask-index { font-size: 0.88rem; color: #64748b; font-weight: 800; }
.ask-question-title { font-size: 1.05rem; font-weight: 800; color: #ffffff; text-decoration: none; }
.ask-question-title:hover { color: #00dc82; text-decoration: underline; }
.ask-meta { font-size: 0.78rem; color: #64748b; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.author-tag { color: #00dc82; }
.verify-tag { color: #94a3b8; }
.meta-dot { color: #334155; }
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