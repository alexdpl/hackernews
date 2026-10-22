<!-- app/pages/newest/[page].vue -->
<script setup>
import { computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

const route = useRoute()
const router = useRouter()

const currentPage = computed(() => Math.max(1, parseInt(route.params.page) || 1))
const itemsPerPage = 15

const { data: responseData, error, pending } = await useFetch('/api/posts', {
  key: `newest-page-${currentPage.value}`,
  query: { type: 'newest', page: currentPage, limit: itemsPerPage },
  watch: [currentPage]
})

const postsList = computed(() => {
  const raw = responseData.value?.data || responseData.value?.stories || []
  return raw.map((post) => ({
    ...post,
    author: typeof post.author === 'object' ? post.author?.username : (post.author || 'Anonimo'),
    url: post.url || null
  }))
})

const hasMore = computed(() => responseData.value?.pagination?.hasMore || false)

function getDomain(url) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return null
  }
}

function nextPage() {
  if (!hasMore.value || pending.value) return
  router.push('/newest/' + (currentPage.value + 1))
}

function prevPage() {
  if (currentPage.value <= 1 || pending.value) return
  router.push('/newest/' + (currentPage.value - 1))
}

onUnmounted(() => {
  responseData.value = null
})

useSeoMeta({
  title: `Nuove Pubblicazioni - Pagina ${currentPage.value} - DevKernelPulse`,
  description: `Pagina ${currentPage.value} delle ultime notizie e post tech in ordine cronologico.`
})
</script>

<template>
  <div class="news-container">
    <div class="news-header-box compact">
      <h1 class="text-white font-extrabold text-xl">📰 Nuove Pubblicazioni</h1>
      <p class="news-subtitle">Stai visualizzando la <strong>Pagina {{ currentPage }}</strong> del feed cronologico.</p>
    </div>

    <div v-if="error" class="error-msg">Errore nel caricamento delle ultime storie.</div>
    <div v-if="pending" class="loading-state">
      <span class="spinner">⚡</span> Sincronizzazione pagina {{ currentPage }} in corso...
    </div>

    <div v-else-if="postsList.length > 0" class="posts-list">
      <article v-for="(post, index) in postsList" :key="post.id || index" class="post-card">
        <span class="post-index">{{ ((currentPage - 1) * itemsPerPage) + index + 1 }}.</span>
        <div class="post-content">
          <div class="post-heading">
            <a v-if="post.url" :href="post.url" target="_blank" rel="noopener noreferrer" class="post-title">
              {{ post.title }}
            </a>
            <NuxtLink v-else :to="`/item/${post.id}`" class="post-title">
              {{ post.title }}
            </NuxtLink>
            
            <span v-if="getDomain(post.url)" class="post-domain">({{ getDomain(post.url) }})</span>
          </div>

          <div class="post-meta">
            <span class="points-tag">▲ {{ post.points || 1 }} punti</span>
            <span class="meta-dot">•</span>
            <span>da <strong class="author-tag">@{{ post.author }}</strong></span>
            <span class="meta-dot">•</span>
            <span>⏱️ {{ new Date(post.createdAt || post.created_at || Date.now()).toLocaleDateString('it-IT') }}</span>
            <span class="meta-dot">•</span>
            <NuxtLink :to="`/item/${post.id}`" class="comments-link">
              💬 {{ post.commentsCount || post.comments_count || 0 }} commenti
            </NuxtLink>
          </div>
        </div>
      </article>

      <!-- Barra Paginazione Dark -->
      <div class="pagination-nav">
        <button @click="prevPage" :disabled="currentPage <= 1 || pending" class="nav-btn">
          &lt; Precedente
        </button>
        <span class="page-indicator">Pagina {{ currentPage }}</span>
        <button @click="nextPage" :disabled="!hasMore || pending" class="nav-btn">
          Successiva &gt;
        </button>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>📭 Nessun post presente in questa pagina.</p>
      <NuxtLink to="/newest" class="admin-link">Torna alla prima pagina</NuxtLink>
    </div>

    <DkpAdStrip categoryTag="DKP NEWS SPONSORED FEED" />
  </div>
</template>

<style scoped>
.news-container { max-width: 950px; margin: 1.5rem auto; padding: 0 1rem; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; }

.news-header-box.compact { background: rgba(9, 13, 22, 0.85); backdrop-filter: blur(16px); border: 1px solid #1e293b; border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 2rem; }
.news-subtitle { color: #94a3b8; font-size: 0.85rem; margin-top: 0.2rem; }

.posts-list { display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 3rem; }
.post-card { background: rgba(9, 13, 22, 0.85); border: 1px solid #1e293b; border-radius: 12px; padding: 1.1rem 1.3rem; display: flex; gap: 1rem; align-items: flex-start; transition: border-color 0.2s ease; }
.post-card:hover { border-color: rgba(0, 220, 130, 0.4); }

.post-index { font-weight: 800; color: #00dc82; font-size: 0.95rem; min-width: 24px; text-align: right; }
.post-content { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; }
.post-heading { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.5rem; }
.post-title { font-weight: 800; color: #ffffff; text-decoration: none; font-size: 1.05rem; }
.post-title:hover { text-decoration: underline; color: #00dc82; }
.post-domain { font-size: 0.8rem; color: #38bdf8; }

.post-meta { font-size: 0.78rem; color: #64748b; display: flex; align-items: center; flex-wrap: wrap; gap: 0.4rem; }
.points-tag { color: #f59e0b; font-weight: 800; }
.author-tag { color: #00dc82; }
.meta-dot { color: #334155; }
.comments-link { color: #94a3b8; text-decoration: none; font-weight: 700; }
.comments-link:hover { color: #00dc82; text-decoration: underline; }

.pagination-nav { margin-top: 2rem; display: flex; justify-content: center; align-items: center; gap: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #1e293b; }
.nav-btn { background: #090d16; border: 1px solid #1e293b; color: #00dc82; font-weight: 800; cursor: pointer; font-size: 0.85rem; padding: 0.6rem 1.2rem; border-radius: 8px; transition: all 0.2s; }
.nav-btn:hover:not(:disabled) { border-color: #00dc82; background: rgba(0, 220, 130, 0.1); }
.nav-btn:disabled { color: #475569; border-color: #1e293b; cursor: not-allowed; background: transparent; }
.page-indicator { font-size: 0.9rem; font-weight: 800; color: #94a3b8; font-family: monospace; }

.loading-state, .empty-state, .error-msg { text-align: center; padding: 3rem 1rem; color: #94a3b8; background: #060a12; border: 1px solid #1e293b; border-radius: 12px; margin-bottom: 2rem; }
.admin-link { color: #38bdf8; text-decoration: underline; font-weight: 700; margin-top: 1rem; display: inline-block; }
</style>