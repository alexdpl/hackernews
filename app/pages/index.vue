<!-- app/pages/index.vue -->

<template>
  <div class="feed-container">
    
    <!-- HEADER FEED DINAMICO IN BASE ALLA CATEGORIA -->
    <div class="feed-header">
      <div class="feed-title-section">
        <h1 class="feed-title">
          {{ headerInfo.title }} 
          <span class="highlight-badge">{{ headerInfo.badge }}</span>
        </h1>
        <p class="feed-subtitle">
          {{ headerInfo.subtitle }}
        </p>
      </div>

      <div class="feed-actions">
        <NuxtLink to="/submit" class="submit-btn">
          ⚡ Invia Post (+15 XP)
        </NuxtLink>
      </div>
    </div>

    <!-- SPINNER CARICAMENTO NEON DB -->
    <div v-if="pending" class="loading-feed">
      <span class="spinner">⚡</span> Caricamento flussi dal Neon Kernel DB...
    </div>

    <!-- LISTA NOTIZIE / STORIES REALI DA NEON DB -->
    <div v-else-if="stories && stories.length > 0" class="story-list">
      <article 
        v-for="(story, index) in stories" 
        :key="story.id || index" 
        class="story-card"
      >
        <!-- BOTTONE VOTAZIONE / UPVOTE -->
        <button 
          @click="voteStory(story)" 
          class="vote-btn" 
          :class="{ voted: story.voted }"
          :disabled="story.voting"
          title="Vota questo post (+5 XP)"
        >
          <span class="vote-icon">▲</span>
          <span class="vote-count">{{ story.points || 1 }}</span>
        </button>

        <!-- CONTENUTO NOTIZIA -->
        <div class="story-content">
          <div class="story-main">
            <span class="story-index">{{ (currentPage - 1) * 15 + index + 1 }}.</span>
            
            <a :href="story.url" target="_blank" rel="noopener noreferrer" class="story-title">
              {{ story.title }}
            </a>

            <a v-if="story.domain" :href="story.url" target="_blank" rel="noopener noreferrer" class="story-domain">
              ({{ story.domain }}) ↗
            </a>
          </div>

          <!-- METADATI (Autore, tempo, verificabilità, XP) -->
          <div class="story-meta">
            <span>Inviato da <strong class="author-tag">@{{ story.author || 'dkp_crawler' }}</strong></span>
            <span class="meta-dot">•</span>
            <span class="time-tag">⏱️ {{ formatTime(story.created_at || story.timeAgo) }}</span>
            <span class="meta-dot">•</span>
            <span class="xp-tag">⭐ +{{ story.xp_awarded || 15 }} XP</span>
            <span class="meta-dot">•</span>
            <span class="verify-tag">
              Verified da <strong>DKP Crawler v2.4-GOLD</strong>
            </span>
          </div>
        </div>
      </article>

      <!-- BARRA DI PAGINAZIONE -->
      <div v-if="totalPages > 1" class="pagination-bar">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage <= 1"
          class="page-btn"
        >
          ◀ Precedente
        </button>

        <span class="page-info">
          Pagina <strong>{{ currentPage }}</strong> di <strong>{{ totalPages }}</strong>
        </span>

        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage >= totalPages"
          class="page-btn"
        >
          Successiva ▶
        </button>
      </div>
    </div>

    <!-- EMPTY STATE FALLBACK -->
    <div v-else class="empty-feed">
      <p>📭 Nessun contenuto trovato in questa sezione (<strong>{{ currentCategory.toUpperCase() }}</strong>).</p>
      <p class="empty-sub">Usa il <NuxtLink to="/admin/crawler" class="admin-link">Pannello Admin Crawler</NuxtLink> per popolarrla subito o invia un post!</p>
      <NuxtLink to="/submit" class="submit-btn-inline">Sii il primo a pubblicare un contenuto!</NuxtLink>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const { getMainUrl, getMailUrl, getApiUrl } = useDomain()
// 1. Riconoscimento Dinamico Categoria (Supporta sia URL query ?type=ask che rotte dirette /ask, /show, /jobs)
const currentCategory = computed(() => {
  const qType = route.query.type?.toString().toLowerCase()
  const path = route.path.toLowerCase()

  if (qType?.includes('ask') || path.includes('/ask')) return 'ask'
  if (qType?.includes('show') || path.includes('/show')) return 'show'
  if (qType?.includes('job') || path.includes('/jobs')) return 'jobs'
  return 'news'
})

// 2. Intestazioni Dinamiche per la Categoria Attiva
const headerInfo = computed(() => {
  switch (currentCategory.value) {
    case 'ask':
      return {
        title: 'Ask DKP Community',
        badge: 'Q&A v2.4',
        subtitle: 'Domande architetturali, dubbi tecnici e discussioni della community DevKernelPulse.'
      }
    case 'show':
      return {
        title: 'Show DKP Projects',
        badge: 'Showcasev 2.4',
        subtitle: 'Progetti Open Source, repository GitHub di tendenza e librerie create dagli sviluppatori.'
      }
    case 'jobs':
      return {
        title: 'Tech Jobs Hub',
        badge: 'Remote & Global v2.4',
        subtitle: 'Le migliori opportunità lavorative tech e posizioni da remoto verificate.'
      }
    default:
      return {
        title: 'Tech Feed',
        badge: 'v2.4-GOLD',
        subtitle: 'Le migliori notizie, progetti Open Source e discussioni verificate dal DKP Crawler.'
      }
  }
})

useHead({
  title: computed(() => `${headerInfo.value.title} | DevKernelPulse`),
  meta: [
    { name: 'description', content: headerInfo.value.subtitle }
  ]
})

// 3. Calcolo Pagina Corrente
const currentPage = computed(() => {
  const p = parseInt(route.query.page as string)
  return isNaN(p) || p < 1 ? 1 : p
})

// 4. Fetch dinamico reattivo da Neon DB collegato alla categoria e pagina corrente
const { data: apiResponse, pending } = await useFetch(
  () => `/api/pulse/stories?type=${currentCategory.value}&page=${currentPage.value}&limit=15`, 
  { watch: [currentCategory, currentPage] }
)

const stories = computed(() => apiResponse.value?.stories || [])
const totalPages = computed(() => apiResponse.value?.pagination?.totalPages || 1)

// Cambio pagina con scroll fluido
function changePage(newPage: number) {
  if (newPage >= 1 && newPage <= totalPages.value) {
    router.push({ query: { ...route.query, page: newPage } })
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}

// Logica Voto Reattiva
const voteStory = (story: any) => {
  if (story.voted) {
    story.points = (story.points || 1) - 1
    story.voted = false
  } else {
    story.points = (story.points || 0) + 1
    story.voted = true
  }
}

// Helper Formattazione Tempo
function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return 'di recente'
  if (dateStr.includes('fa') || dateStr.includes('m') || dateStr.includes('h')) return dateStr

  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours < 1) return 'poco fa'
    if (diffHours < 24) return `${diffHours}h fa`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}g fa`
  } catch {
    return 'di recente'
  }
}
</script>

<style scoped>
.feed-container { max-width: 1000px; margin: 1.5rem auto; padding: 0 1rem; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; }
.feed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #1e293b; flex-wrap: wrap; gap: 1rem; }
.feed-title { font-size: 1.75rem; font-weight: 900; margin: 0; color: #ffffff; }
.highlight-badge { font-size: 0.75rem; background: rgba(0, 220, 130, 0.15); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); padding: 0.2rem 0.5rem; border-radius: 6px; vertical-align: middle; }
.feed-subtitle { font-size: 0.85rem; color: #94a3b8; margin: 0.25rem 0 0 0; }
.submit-btn { background: #00dc82; color: #020420; font-weight: 800; font-size: 0.85rem; padding: 0.6rem 1.1rem; border-radius: 8px; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s; display: inline-block; }
.submit-btn:hover { transform: translateY(-2px); box-shadow: 0 0 15px rgba(0, 220, 130, 0.4); text-decoration: none; }

.story-list { display: flex; flex-direction: column; gap: 0.75rem; }
.story-card { background: rgba(9, 13, 22, 0.85); border: 1px solid #1e293b; border-radius: 10px; padding: 0.9rem 1.1rem; display: flex; align-items: center; gap: 1rem; transition: border-color 0.2s; }
.story-card:hover { border-color: rgba(0, 220, 130, 0.3); }

.vote-btn { background: #020420; border: 1px solid #1e293b; color: #94a3b8; border-radius: 8px; padding: 0.4rem 0.6rem; display: flex; flex-direction: column; align-items: center; cursor: pointer; min-width: 44px; transition: all 0.2s; }
.vote-btn:hover { border-color: #00dc82; color: #00dc82; }
.vote-btn.voted { background: rgba(0, 220, 130, 0.15); border-color: #00dc82; color: #00dc82; }
.vote-icon { font-size: 0.7rem; }
.vote-count { font-size: 0.82rem; font-weight: 800; }

.story-content { display: flex; flex-direction: column; gap: 0.3rem; flex: 1; }
.story-main { display: flex; align-items: baseline; gap: 0.4rem; flex-wrap: wrap; }
.story-index { font-size: 0.85rem; color: #64748b; font-weight: 700; }
.story-title { color: #f8fafc; font-size: 0.95rem; font-weight: 700; text-decoration: none; }
.story-title:hover { color: #00dc82; text-decoration: underline; }
.story-domain { font-size: 0.78rem; color: #38bdf8; text-decoration: none; }
.story-domain:hover { text-decoration: underline; }

.story-meta { font-size: 0.75rem; color: #64748b; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
.author-tag { color: #00dc82; }
.meta-dot { color: #334155; }
.xp-tag { color: #f59e0b; font-weight: 700; }
.verify-tag { color: #94a3b8; }

.pagination-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid #1e293b; }
.page-btn { background: #090d16; border: 1px solid #1e293b; color: #00dc82; font-weight: 700; padding: 0.55rem 1.1rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.page-btn:hover:not(:disabled) { border-color: #00dc82; box-shadow: 0 0 10px rgba(0, 220, 130, 0.25); }
.page-btn:disabled { opacity: 0.35; cursor: not-allowed; border-color: #1e293b; color: #64748b; }
.page-info { font-size: 0.85rem; color: #94a3b8; }

.loading-feed, .empty-feed { text-align: center; padding: 3rem 1rem; color: #94a3b8; background: #060a12; border: 1px solid #1e293b; border-radius: 10px; }
.empty-sub { font-size: 0.85rem; color: #64748b; margin-top: 0.5rem; }
.admin-link { color: #38bdf8; text-decoration: underline; }
.submit-btn-inline { color: #00dc82; text-decoration: underline; margin-top: 0.8rem; display: inline-block; font-weight: 700; }
</style>