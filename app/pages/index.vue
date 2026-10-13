<!-- app/pages/index.vue -->
<template>
  <div class="feed-container">
    
    <!-- HEADER FEED DINAMICO -->
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
        <NuxtLink to="/user/dashboard?tab=content" class="submit-btn">
          ⚡ Invia Post (+15 XP)
        </NuxtLink>
      </div>
    </div>

    <!-- SPINNER CARICAMENTO NEON DB -->
    <div v-if="pending" class="loading-feed">
      <span class="spinner">⚡</span> Connessione al Vault Neon DB in corso...
    </div>

    <!-- LISTA NOTIZIE / POST REALI DA NEON DB (v2.5-GOLD) -->
    <div v-else-if="paginatedPosts && paginatedPosts.length > 0" class="story-list">
      <article 
        v-for="(post, index) in paginatedPosts" 
        :key="post.id || index" 
        class="story-card group hover:-translate-y-1 transition-all hover:shadow-[0_4px_20px_rgba(0,220,130,0.15)]"
      >
        <!-- BOTTONE VOTAZIONE / KARMA LIKES -->
        <button 
          @click="voteStory(post)" 
          class="vote-btn" 
          :class="{ voted: post.voted }"
          title="Accendi Kernel (+5 XP)"
        >
          <span class="vote-icon">▲</span>
          <span class="vote-count">{{ post.likes || 0 }}</span>
        </button>

        <!-- CONTENUTO NOTIZIA -->
        <div class="story-content">
          <div class="story-main">
            <span class="story-index">{{ (currentPage - 1) * itemsPerPage + index + 1 }}.</span>
            
            <!-- 🟢 IL FIX DEL PROBLEMA 1: NUXTLINK INTERNO CON SLUG O ID -->
            <NuxtLink :to="`/blog/${post.slug || post.id}`" class="story-title group-hover:text-emerald-400 transition-colors">
              {{ post.title }}
            </NuxtLink>

            <span class="story-category-badge">
              {{ post.categoryName || post.category || 'Generale' }}
            </span>
          </div>

          <!-- METADATI (Autore, tempo, verificabilità, XP) -->
          <div class="story-meta mt-1">
            <span>By <strong class="author-tag">@{{ post.authorName || 'DevKernelPulse' }}</strong></span>
            <span class="meta-dot">•</span>
            <span class="time-tag">⏱️ {{ formatTime(post.createdAt || post.date) }}</span>
            <span class="meta-dot">•</span>
            <span class="views-tag">👁️ {{ post.views || 0 }} views</span>
            
            <template v-if="post.tags && post.tags.length > 0">
              <span class="meta-dot">•</span>
              <span class="tags-preview">
                <span v-for="tag in post.tags.slice(0, 2)" :key="tag" class="text-sky-400 font-mono text-[0.65rem] bg-[#020420] px-1.5 py-0.5 rounded border border-slate-700 mr-1">#{{ tag }}</span>
              </span>
            </template>

            <template v-if="post.isVerified">
              <span class="meta-dot">•</span>
              <span class="verify-tag text-emerald-400 font-bold flex items-center gap-1">
                🛡️ Vault Verified
              </span>
            </template>
          </div>
        </div>
      </article>

      <!-- BARRA DI PAGINAZIONE NUMERATA -->
      <div v-if="totalPages > 1" class="pagination-bar">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage <= 1"
          class="page-btn"
        >
          ◀ Prec
        </button>

        <span class="page-info">
          Pagina <strong class="text-emerald-400">{{ currentPage }}</strong> di <strong>{{ totalPages }}</strong>
        </span>

        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage >= totalPages"
          class="page-btn"
        >
          Succ ▶
        </button>
      </div>
    </div>

    <!-- EMPTY STATE FALLBACK -->
    <div v-else class="empty-feed">
      <div class="text-4xl mb-4">📭</div>
      <p>Nessun contenuto trovato nel Vault per questa sezione.</p>
      <NuxtLink to="/user/dashboard?tab=content" class="submit-btn-inline mt-4 inline-block">Sii il primo a pubblicare un articolo!</NuxtLink>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 1. Riconoscimento Dinamico Categoria (Per header dinamico)
const currentCategory = computed(() => {
  const qType = route.query.type?.toString().toLowerCase()
  const path = route.path.toLowerCase()

  if (qType?.includes('ask') || path.includes('/ask')) return 'ask'
  if (qType?.includes('show') || path.includes('/show')) return 'show'
  if (qType?.includes('job') || path.includes('/jobs')) return 'jobs'
  return 'news'
})

// 2. Intestazioni Dinamiche
const headerInfo = computed(() => {
  switch (currentCategory.value) {
    case 'ask':
      return { title: 'Ask DKP Community', badge: 'Q&A v2.5', subtitle: 'Domande architetturali, dubbi tecnici e discussioni della community.' }
    case 'show':
      return { title: 'Show DKP Projects', badge: 'Showcase v2.5', subtitle: 'Progetti Open Source, snippet e repository della community.' }
    case 'jobs':
      return { title: 'Tech Jobs Hub', badge: 'Remote v2.5', subtitle: 'Le migliori opportunità lavorative tech e posizioni da remoto.' }
    default:
      return { title: 'Global Tech Feed', badge: 'v2.5-GOLD', subtitle: 'Le migliori notizie, articoli e discussioni verificate dal DKP Vault.' }
  }
})

useHead({
  title: computed(() => `${headerInfo.value.title} | DevKernelPulse`),
  meta: [ { name: 'description', content: headerInfo.value.subtitle } ]
})

// 3. 🟢 FETCH DIRETTO DAL NUOVO NEON DB (L'API dei Post Blog)
const { data: apiResponse, pending } = await useFetch('/api/blog/posts')

const allPosts = computed(() => {
  const raw = (apiResponse.value as any)?.success ? (apiResponse.value as any).data : apiResponse.value;
  return Array.isArray(raw) ? raw : []
})

// Filtriamo per non mostrare le bozze e per ordinare dal più recente
const feedPosts = computed(() => {
  let published = allPosts.value.filter((p: any) => p.status !== 'draft')
  // Ordine cronologico decrescente
  published.sort((a: any, b: any) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
  return published
})

// 4. LOGICA DI PAGINAZIONE LOCALE
const itemsPerPage = 15
const currentPage = computed(() => {
  const p = parseInt(route.query.page as string)
  return isNaN(p) || p < 1 ? 1 : p
})

const totalPages = computed(() => Math.ceil(feedPosts.value.length / itemsPerPage) || 1)

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return feedPosts.value.slice(start, start + itemsPerPage)
})

// Cambio pagina con scroll
function changePage(newPage: number) {
  if (newPage >= 1 && newPage <= totalPages.value) {
    router.push({ query: { ...route.query, page: newPage } })
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}

// Logica Voto Reattiva (Gamification)
const voteStory = (post: any) => {
  if (post.voted) {
    post.likes = (post.likes || 1) - 1
    post.voted = false
  } else {
    post.likes = (post.likes || 0) + 1
    post.voted = true
  }
}

// Helper Formattazione Tempo
function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return 'di recente'
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours < 1) return 'poco fa'
    if (diffHours < 24) return `${diffHours}h fa`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'ieri'
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
.highlight-badge { font-size: 0.75rem; background: rgba(0, 220, 130, 0.15); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); padding: 0.2rem 0.5rem; border-radius: 6px; vertical-align: middle; margin-left: 0.5rem; }
.feed-subtitle { font-size: 0.85rem; color: #94a3b8; margin: 0.25rem 0 0 0; }
.submit-btn { background: #00dc82; color: #020420; font-weight: 800; font-size: 0.85rem; padding: 0.6rem 1.1rem; border-radius: 8px; text-decoration: none; transition: all 0.2s; box-shadow: 0 0 15px rgba(0, 220, 130, 0.2); }
.submit-btn:hover { transform: translateY(-2px); box-shadow: 0 0 20px rgba(0, 220, 130, 0.4); text-decoration: none; }

.story-list { display: flex; flex-direction: column; gap: 0.75rem; }
.story-card { background: #090d16; border: 1px solid #1e293b; border-radius: 10px; padding: 0.9rem 1.1rem; display: flex; align-items: center; gap: 1.25rem; }
.story-card:hover { border-color: rgba(0, 220, 130, 0.4); }

.vote-btn { background: #020420; border: 1px solid #1e293b; color: #94a3b8; border-radius: 8px; padding: 0.4rem 0.6rem; display: flex; flex-direction: column; align-items: center; cursor: pointer; min-width: 46px; transition: all 0.2s; }
.vote-btn:hover { border-color: #00dc82; color: #00dc82; background: rgba(0, 220, 130, 0.05); }
.vote-btn.voted { background: rgba(0, 220, 130, 0.15); border-color: #00dc82; color: #00dc82; }
.vote-icon { font-size: 0.8rem; }
.vote-count { font-size: 0.85rem; font-weight: 800; margin-top: 0.1rem; }

.story-content { display: flex; flex-direction: column; gap: 0.3rem; flex: 1; min-width: 0; }
.story-main { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
.story-index { font-size: 0.85rem; color: #64748b; font-weight: 700; }
.story-title { color: #f8fafc; font-size: 1.05rem; font-weight: 700; text-decoration: none; line-height: 1.3; }
.story-category-badge { font-size: 0.65rem; text-transform: uppercase; font-weight: 800; color: #38bdf8; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); padding: 0.15rem 0.4rem; border-radius: 4px; letter-spacing: 0.05em; }

.story-meta { font-size: 0.78rem; color: #64748b; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.author-tag { color: #cbd5e1; font-weight: 600; }
.meta-dot { color: #334155; }
.views-tag { color: #94a3b8; }
.verify-tag { font-size: 0.7rem; background: rgba(0,220,130,0.1); padding: 0.1rem 0.4rem; border-radius: 4px; border: 1px solid rgba(0,220,130,0.2); }

.pagination-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid #1e293b; }
.page-btn { background: #090d16; border: 1px solid #1e293b; color: #00dc82; font-weight: 700; padding: 0.55rem 1.1rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; }
.page-btn:hover:not(:disabled) { border-color: #00dc82; box-shadow: 0 0 10px rgba(0, 220, 130, 0.25); }
.page-btn:disabled { opacity: 0.35; cursor: not-allowed; border-color: #1e293b; color: #64748b; }
.page-info { font-size: 0.85rem; color: #94a3b8; }

.loading-feed, .empty-feed { text-align: center; padding: 4rem 1rem; color: #94a3b8; background: #060a12; border: 1px solid #1e293b; border-radius: 12px; }
.spinner { display: inline-block; animation: spin 1.5s linear infinite; font-size: 1.5rem; margin-right: 0.5rem; vertical-align: middle; }
@keyframes spin { 100% { transform: rotate(360deg); } }
.submit-btn-inline { color: #020420; background: #00dc82; padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none; font-weight: 700; transition: background 0.2s; }
.submit-btn-inline:hover { background: #38bdf8; }
</style>