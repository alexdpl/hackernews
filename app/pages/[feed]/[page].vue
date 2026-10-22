<!-- app/pages/news/[page].vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

const route = useRoute()
const router = useRouter()

const currentPage = computed(() => Math.max(1, parseInt(route.params.page as string) || 1))
const itemsPerPage = 15

// Fetch della pagina corrente dal feed crawler
const { data: responseData, pending, error } = await useFetch('/api/pulse/stories', {
  key: `news-page-${currentPage.value}`,
  query: { type: 'news', page: currentPage, limit: itemsPerPage },
  watch: [currentPage]
})

const feedList = computed(() => {
  const raw = responseData.value?.stories || responseData.value?.data || []
  return raw.map((item: any) => ({
    ...item,
    author: typeof item.author === 'object' ? item.author?.username || 'community' : (item.author || 'community'),
    url: item.url || `/item/${item.id}`,
    domain: item.domain || (item.url && !item.url.startsWith('/') ? new URL(item.url).hostname.replace('www.', '') : 'devkernelpulse.org'),
    points: item.points || 1,
    comments_count: item.comments_count || item.commentsCount || 0,
    xp_awarded: item.xp_awarded || 15
  }))
})

const pagination = computed(() => responseData.value?.pagination || {})
const totalPages = computed(() => pagination.value?.totalPages || 1)
const hasMore = computed(() => currentPage.value < totalPages.value)

function handleNextPage() {
  if (!hasMore.value || pending.value) return
  router.push(`/news/${currentPage.value + 1}`)
}

function handlePrevPage() {
  if (currentPage.value <= 1 || pending.value) return
  if (currentPage.value === 2) {
    router.push('/')
  } else {
    router.push(`/news/${currentPage.value - 1}`)
  }
}

const featuredArticles = ref<any[]>([])

onMounted(async () => {
  try {
    const res: any = await $fetch('/api/blog/posts')
    const raw = res?.success ? res.data : (Array.isArray(res) ? res : [])
    featuredArticles.value = raw.slice(0, 2)
  } catch (err) {
    console.error('Errore recupero articoli Vault:', err)
  }
})

useHead({
  title: `Tech News Feed - Pagina ${currentPage.value} - DevKernelPulse`,
  meta: [
    { name: 'description', content: `Pagina ${currentPage.value} delle ultime notizie tech verificate dal crawler.` }
  ]
})
</script>

<template>
  <div class="feed-page-container">
    <div class="feed-header compact">
      <div class="header-text">
        <h1 class="feed-title">
          Tech News <span class="highlight-text">Feed</span>
        </h1>
        <p class="feed-subtitle">
          Stai visualizzando la <strong>Pagina {{ currentPage }} di {{ totalPages }}</strong> del feed crawler.
        </p>
      </div>
      <div class="header-action">
        <NuxtLink to="/submit" class="submit-btn">
          ⚡ Invia Post (+15 XP)
        </NuxtLink>
      </div>
    </div>

    <div v-if="error" class="error-state">Errore nel caricamento del feed.</div>
    <div v-if="pending" class="loading-state">
      <span class="spinner">⚡</span> Sincronizzazione Pagina {{ currentPage }} dal DB Neon...
    </div>

    <div v-else-if="feedList.length > 0">
      <div class="feed-list">
        <article 
          v-for="(item, index) in feedList" 
          :key="item.id || index" 
          class="feed-card"
        >
          <div class="card-body">
            <div class="title-row">
              <span class="item-index">{{ ((currentPage - 1) * itemsPerPage) + index + 1 }}.</span>
              <a :href="item.url" target="_blank" rel="noopener noreferrer" class="item-title">
                {{ item.title }}
              </a>
              <span v-if="item.domain" class="item-domain">({{ item.domain }})</span>
            </div>

            <div class="item-meta">
              <span class="source-pill">
                📡 {{ item.domain }}
              </span>
              <span class="meta-dot">•</span>
              <span class="author-tag">👤 @{{ item.author }}</span>
              <span class="meta-dot">•</span>
              <span class="points-tag">▲ {{ item.points }} pts</span>
              <span class="meta-dot">•</span>
              <span class="xp-tag">⭐ +{{ item.xp_awarded }} XP</span>
              <span class="meta-dot">•</span>
              <NuxtLink :to="`/item/${item.id}`" class="comments-link">
                💬 {{ item.comments_count }} commenti
              </NuxtLink>
            </div>
          </div>
        </article>
      </div>

      <!-- CONTROLLI PAGINAZIONE -->
      <div class="pagination-nav">
        <button @click="handlePrevPage" :disabled="currentPage <= 1 || pending" class="nav-btn">
          &lt; Pagina Precedente
        </button>
        <span class="page-indicator">Pagina {{ currentPage }} / {{ totalPages }}</span>
        <button @click="handleNextPage" :disabled="!hasMore || pending" class="nav-btn">
          Pagina Successiva &gt;
        </button>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>📭 Nessun'altra notizia trovata in questa pagina.</p>
      <NuxtLink to="/" class="admin-link">Torna alla prima pagina</NuxtLink>
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

    <DkpAdStrip categoryTag="DKP NEWS SPONSORED FEED" />
  </div>
</template>

<style scoped>
.feed-page-container { max-width: 1000px; margin: 1.5rem auto; padding: 0 1rem; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; }

.feed-header.compact { background: rgba(9, 13, 22, 0.85); backdrop-filter: blur(16px); border: 1px solid #1e293b; border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
.feed-title { font-size: 1.4rem; font-weight: 900; margin: 0 0 0.2rem 0; color: #ffffff; }
.highlight-text { color: #00dc82; }
.feed-subtitle { font-size: 0.85rem; color: #94a3b8; margin: 0; }

.submit-btn { background: rgba(0, 220, 130, 0.1); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.4); font-weight: 800; font-size: 0.8rem; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; transition: all 0.2s ease; }
.submit-btn:hover { background: #00dc82; color: #020420; }

.feed-list { display: flex; flex-direction: column; gap: 0.8rem; }
.feed-card { background: rgba(9, 13, 22, 0.85); border: 1px solid #1e293b; border-radius: 12px; padding: 1.1rem 1.3rem; transition: border-color 0.2s ease; }
.feed-card:hover { border-color: rgba(0, 220, 130, 0.4); }

.card-body { display: flex; flex-direction: column; gap: 0.4rem; }
.title-row { display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
.item-index { font-size: 1rem; color: #00dc82; font-weight: 900; }
.item-title { font-size: 1.05rem; font-weight: 800; color: #ffffff; text-decoration: none; }
.item-title:hover { color: #00dc82; text-decoration: underline; }
.item-domain { font-size: 0.82rem; color: #64748b; font-weight: 500; }

.item-meta { font-size: 0.78rem; color: #94a3b8; display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; margin-top: 0.2rem; }
.source-pill { background: rgba(0, 220, 130, 0.1); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.25); padding: 0.15rem 0.5rem; border-radius: 6px; font-weight: 700; font-size: 0.75rem; }
.author-tag { color: #a78bfa; font-weight: 600; }
.points-tag { color: #f59e0b; font-weight: 800; }
.xp-tag { color: #00dc82; font-weight: 800; }
.comments-link { color: #38bdf8; text-decoration: none; font-weight: 700; }
.comments-link:hover { text-decoration: underline; color: #00dc82; }
.meta-dot { color: #334155; }

.pagination-nav { margin-top: 2.5rem; display: flex; justify-content: center; align-items: center; gap: 1.5rem; padding-top: 1rem; border-top: 1px solid #1e293b; }
.nav-btn { background: #090d16; border: 1px solid #1e293b; color: #00dc82; font-weight: 800; cursor: pointer; font-size: 0.85rem; padding: 0.6rem 1.2rem; border-radius: 8px; transition: all 0.2s; }
.nav-btn:hover:not(:disabled) { border-color: #00dc82; background: rgba(0, 220, 130, 0.1); }
.nav-btn:disabled { color: #475569; border-color: #1e293b; cursor: not-allowed; background: transparent; }
.page-indicator { font-size: 0.9rem; font-weight: 800; color: #94a3b8; font-family: monospace; }

.loading-state, .empty-state, .error-state { text-align: center; padding: 3rem 1rem; color: #94a3b8; background: #060a12; border: 1px solid #1e293b; border-radius: 12px; margin-bottom: 2rem; }
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