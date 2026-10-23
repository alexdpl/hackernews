<!-- app/pages/newest/[page].vue -->
<script setup lang="ts">
import { computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

const route = useRoute()
const router = useRouter()

const currentPage = computed(() => Math.max(1, parseInt(route.params.page as string) || 1))
const itemsPerPage = 15

// 1. Fetch agganciato al BLOG interno, non al crawler
const { data: responseData, error, pending } = await useFetch('/api/blog/posts', {
  key: `newest-blog-page-${currentPage.value}`,
  query: { page: currentPage, limit: itemsPerPage },
  watch: [currentPage]
})

// Helper per estrarre in modo sicuro l'autore anche se è una stringa JSON
function parseAuthor(authorData: any): string {
  if (!authorData) return 'community'
  if (typeof authorData === 'object') return authorData.username || 'community'
  if (typeof authorData === 'string' && authorData.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(authorData)
      return parsed.username || 'community'
    } catch {
      return authorData
    }
  }
  return authorData
}

// 2. Normalizzazione Dati (Autore pulito, slug per i link)
const postsList = computed(() => {
  const raw = responseData.value?.data || responseData.value || []
  return raw.map((post: any) => ({
    ...post,
    authorName: parseAuthor(post.author),
    points: post.points || 0,
    commentsCount: post.commentsCount || post.comments_count || 0,
    slug: post.slug || post.id
  }))
})

// Calcolo paginazione in base ai dati del blog
const pagination = computed(() => responseData.value?.pagination || {})
const hasMore = computed(() => (pagination.value?.currentPage < pagination.value?.totalPages) || (postsList.value.length === itemsPerPage))

function nextPage() {
  if (!hasMore.value || pending.value) return
  router.push('/newest/' + (currentPage.value + 1))
}

function prevPage() {
  if (currentPage.value <= 1 || pending.value) return
  if (currentPage.value === 2) {
    router.push('/newest')
  } else {
    router.push('/newest/' + (currentPage.value - 1))
  }
}

onUnmounted(() => {
  if (responseData.value) responseData.value = null
})

useSeoMeta({
  title: `Blog Vault - Pagina ${currentPage.value} - DevKernelPulse`,
  description: `Pagina ${currentPage.value} degli articoli e approfondimenti editoriali del team DevKernelPulse.`
})
</script>

<template>
  <div class="news-container">
    <div class="news-header-box compact">
      <h1 class="feed-title">📚 DKP Blog <span class="highlight-text">Vault</span></h1>
      <p class="news-subtitle">Stai visualizzando la <strong>Pagina {{ currentPage }}</strong> degli articoli editoriali.</p>
    </div>

    <div v-if="error" class="error-msg">Errore nel caricamento degli articoli dal database.</div>
    <div v-if="pending" class="loading-state">
      <span class="spinner">⚡</span> Sincronizzazione pagina {{ currentPage }} in corso...
    </div>

    <!-- LISTA ARTICOLI BLOG (Design Unificato) -->
    <div v-else-if="postsList.length > 0" class="posts-list">
      <article v-for="(post, index) in postsList" :key="post.id || index" class="post-card">
        <span class="post-index">{{ ((currentPage - 1) * itemsPerPage) + index + 1 }}.</span>
        <div class="post-content">
          
          <div class="post-heading">
            <!-- Il titolo punta alla rotta del blog interno -->
            <NuxtLink :to="`/blog/${post.slug}`" class="post-title">
              {{ post.title }}
            </NuxtLink>
            <span class="post-domain">(devkernelpulse.org)</span>
          </div>

          <div class="post-meta">
            <span class="source-pill">📝 {{ post.categoryName || post.category || 'Editoriale' }}</span>
            <span class="meta-dot">•</span>
            <span class="points-tag">▲ {{ post.points }} punti</span>
            <span class="meta-dot">•</span>
            <span>da <strong class="author-tag">@{{ post.authorName }}</strong></span>
            <span class="meta-dot">•</span>
            <span>⏱️ {{ new Date(post.createdAt || post.created_at || Date.now()).toLocaleDateString('it-IT') }}</span>
            <span class="meta-dot">•</span>
            <!-- I commenti puntano all'articolo del blog, non alla sezione /item -->
            <NuxtLink :to="`/blog/${post.slug}#comments`" class="comments-link">
              💬 {{ post.commentsCount }} commenti
            </NuxtLink>
          </div>
        </div>
      </article>

      <!-- Barra Paginazione Dark -->
      <div class="pagination-nav">
        <button @click="prevPage" :disabled="currentPage <= 1 || pending" class="nav-btn">
          &lt; Pagina Precedente
        </button>
        <span class="page-indicator">Pagina {{ currentPage }}</span>
        <button @click="nextPage" :disabled="!hasMore || pending" class="nav-btn">
          Pagina Successiva &gt;
        </button>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>📭 Nessun articolo presente in questa pagina.</p>
      <NuxtLink to="/newest" class="admin-link">Torna alla prima pagina del Vault</NuxtLink>
    </div>

    <DkpAdStrip categoryTag="DKP BLOG SPONSORED" />
  </div>
</template>

<style scoped>
.news-container { max-width: 950px; margin: 1.5rem auto; padding: 0 1rem; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; }

.news-header-box.compact { background: rgba(9, 13, 22, 0.85); backdrop-filter: blur(16px); border: 1px solid #1e293b; border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 2rem; }
.feed-title { font-size: 1.5rem; font-weight: 900; margin: 0 0 0.2rem 0; color: #ffffff; }
.highlight-text { color: #f59e0b; }
.news-subtitle { color: #94a3b8; font-size: 0.85rem; margin-top: 0.2rem; }

.posts-list { display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 3rem; }
.post-card { background: rgba(9, 13, 22, 0.85); border: 1px solid #1e293b; border-radius: 12px; padding: 1.1rem 1.3rem; display: flex; gap: 1rem; align-items: flex-start; transition: border-color 0.2s ease; }
.post-card:hover { border-color: rgba(245, 158, 11, 0.4); }

.post-index { font-weight: 800; color: #f59e0b; font-size: 0.95rem; min-width: 24px; text-align: right; }
.post-content { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; }
.post-heading { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.5rem; }
.post-title { font-weight: 800; color: #ffffff; text-decoration: none; font-size: 1.05rem; }
.post-title:hover { text-decoration: underline; color: #f59e0b; }
.post-domain { font-size: 0.8rem; color: #64748b; }

.post-meta { font-size: 0.78rem; color: #94a3b8; display: flex; align-items: center; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.2rem; }
.source-pill { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.25); padding: 0.15rem 0.5rem; border-radius: 6px; font-weight: 700; font-size: 0.75rem; }
.points-tag { color: #00dc82; font-weight: 800; }
.author-tag { color: #a78bfa; }
.meta-dot { color: #334155; }
.comments-link { color: #38bdf8; text-decoration: none; font-weight: 700; }
.comments-link:hover { color: #f59e0b; text-decoration: underline; }

.pagination-nav { margin-top: 2rem; display: flex; justify-content: center; align-items: center; gap: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #1e293b; }
.nav-btn { background: #090d16; border: 1px solid #1e293b; color: #f59e0b; font-weight: 800; cursor: pointer; font-size: 0.85rem; padding: 0.6rem 1.2rem; border-radius: 8px; transition: all 0.2s; }
.nav-btn:hover:not(:disabled) { border-color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
.nav-btn:disabled { color: #475569; border-color: #1e293b; cursor: not-allowed; background: transparent; }
.page-indicator { font-size: 0.9rem; font-weight: 800; color: #94a3b8; font-family: monospace; }

.loading-state, .empty-state, .error-msg { text-align: center; padding: 3rem 1rem; color: #94a3b8; background: #060a12; border: 1px solid #1e293b; border-radius: 12px; margin-bottom: 2rem; }
.admin-link { color: #38bdf8; text-decoration: underline; font-weight: 700; margin-top: 1rem; display: inline-block; }
</style>