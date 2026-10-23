<!-- app/pages/newest/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

const router = useRouter()
const itemsPerPage = 15

// 1. Recupero post del blog interno (con limiti per la paginazione)
const { data: responseData, pending } = await useFetch('/api/blog/posts', {
  query: { page: 1, limit: itemsPerPage }
})

// Helper per estrarre in modo sicuro il nome utente
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

// Estrazione dell'array di post e gestione paginazione
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

// Calcolo se ci sono altre pagine
const pagination = computed(() => responseData.value?.pagination || {})
const hasMore = computed(() => (pagination.value?.currentPage < pagination.value?.totalPages) || (postsList.value.length >= itemsPerPage))

function nextPage() {
  if (!hasMore.value || pending.value) return
  router.push('/newest/2')
}

// 2. Recupero articoli in evidenza per il Vault
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

useSeoMeta({
  title: 'Blog Vault & Guide - DevKernelPulse',
  description: 'Le ultime pubblicazioni editoriali, guide tech e approfondimenti dal Vault di DevKernelPulse.'
})
</script>

<template>
  <div class="news-container">
    
    <!-- HEADER BLOG UNIFICATO CON PULSANTE -->
    <div class="news-header-box">
      <div class="header-content">
        <div class="feed-badge">
          📚 DKP BLOG VAULT • v2.5-GOLD
        </div>
        <h1 class="feed-title">
          Ultime <span class="highlight-text">Pubblicazioni</span>
        </h1>
        <p class="news-subtitle">Gli articoli editoriali, le guide e gli approfondimenti tecnici redatti dalla community.</p>
      </div>
      
      <!-- 🟢 Pulsante Ripristinato -->
      <div class="header-action">
        <NuxtLink to="/user/dashboard?tab=content" class="submit-btn">
          ✍️ Scrivi Articolo
        </NuxtLink>
      </div>
    </div>

    <div v-if="pending" class="loading-state">
      <span class="spinner">⚡</span> Sincronizzazione Vault in corso...
    </div>

    <!-- FEED PRINCIPALE ARTICOLI BLOG -->
    <div v-else-if="postsList.length > 0" class="posts-wrapper">
      <div class="posts-list">
        <article v-for="(post, index) in postsList" :key="post.id" class="post-card">
          <span class="post-index">{{ index + 1 }}.</span>
          <div class="post-content">
            
            <div class="post-heading">
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
              <span>⏱️ {{ new Date(post.createdAt || post.date || Date.now()).toLocaleDateString('it-IT') }}</span>
              <span class="meta-dot">•</span>
              <NuxtLink :to="`/blog/${post.slug}#comments`" class="comments-link">
                💬 {{ post.commentsCount }} commenti
              </NuxtLink>
            </div>
          </div>
        </article>
      </div>

      <!-- 🟢 Barra di Paginazione Ripristinata -->
      <div v-if="hasMore" class="pagination-nav">
        <button @click="nextPage" class="nav-btn">
          Vedi articoli precedenti &gt;
        </button>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <p>📭 Nessun articolo recente trovato nel Blog Vault.</p>
    </div>

    <!-- SEZIONE CONSIGLIATI DAL VAULT -->
    <div v-if="featuredArticles.length > 0" class="vault-recommended-section">
      <h3 class="recommended-title">🔗 Consigliati dal Vault DKP</h3>
      <div class="recommended-grid">
        <NuxtLink 
          v-for="art in featuredArticles" 
          :key="art.id" 
          :to="`/blog/${art.slug || art.id}`"
          class="recommended-card"
        >
          <span class="rec-cat">{{ art.categoryName || art.category || 'Tech' }}</span>
          <h4>{{ art.title }}</h4>
          <p>{{ art.excerpt || art.summary || 'Approfondimento tecnico verificato.' }}</p>
          <span class="rec-read">Leggi articolo ➔</span>
        </NuxtLink>
      </div>
    </div>
    
    <DkpAdStrip categoryTag="DKP BLOG SPONSORED" />
  </div>
</template>

<style scoped>
.news-container { max-width: 950px; margin: 1.5rem auto; padding: 0 1rem; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; }

.news-header-box { background: rgba(9, 13, 22, 0.85); backdrop-filter: blur(16px); border: 1px solid #1e293b; border-radius: 16px; padding: 1.75rem 2rem; margin-bottom: 2rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem; }
.header-content { flex: 1; }
.feed-badge { display: inline-block; background: rgba(0, 220, 130, 0.12); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; padding: 0.25rem 0.6rem; border-radius: 6px; margin-bottom: 0.6rem; }
.feed-title { font-size: 1.85rem; font-weight: 900; margin: 0 0 0.4rem 0; color: #ffffff; }
.highlight-text { color: #00dc82; }
.news-subtitle { color: #94a3b8; font-size: 0.88rem; margin: 0; }

.submit-btn { background: #00dc82; color: #020420; font-weight: 900; font-size: 0.85rem; padding: 0.7rem 1.2rem; border-radius: 8px; text-decoration: none; transition: all 0.2s ease; white-space: nowrap; display: inline-block; }
.submit-btn:hover { transform: translateY(-2px); box-shadow: 0 0 20px rgba(0, 220, 130, 0.4); }

.posts-wrapper { margin-bottom: 3rem; }
.posts-list { display: flex; flex-direction: column; gap: 0.8rem; }
.post-card { background: rgba(9, 13, 22, 0.85); border: 1px solid #1e293b; border-radius: 12px; padding: 1.1rem 1.3rem; display: flex; gap: 1rem; align-items: flex-start; transition: border-color 0.2s ease; }
.post-card:hover { border-color: rgba(0, 220, 130, 0.4); }

.post-index { font-weight: 800; color: #00dc82; font-size: 0.95rem; min-width: 24px; text-align: right; }
.post-content { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; }
.post-heading { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.5rem; }
.post-title { font-weight: 800; color: #ffffff; text-decoration: none; font-size: 1.05rem; }
.post-title:hover { text-decoration: underline; color: #00dc82; }
.post-domain { font-size: 0.8rem; color: #38bdf8; }

.post-meta { font-size: 0.78rem; color: #64748b; display: flex; align-items: center; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.2rem; }
.source-pill { background: rgba(0, 220, 130, 0.1); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.25); padding: 0.15rem 0.5rem; border-radius: 6px; font-weight: 700; font-size: 0.75rem; }
.points-tag { color: #f59e0b; font-weight: 800; }
.author-tag { color: #a78bfa; }
.meta-dot { color: #334155; }
.comments-link { color: #94a3b8; text-decoration: none; font-weight: 700; }
.comments-link:hover { color: #00dc82; text-decoration: underline; }

.pagination-nav { margin-top: 2rem; display: flex; justify-content: center; align-items: center; padding-top: 1.5rem; border-top: 1px solid #1e293b; }
.nav-btn { background: #090d16; border: 1px solid #1e293b; color: #00dc82; font-weight: 800; cursor: pointer; font-size: 0.85rem; padding: 0.6rem 1.2rem; border-radius: 8px; transition: all 0.2s; }
.nav-btn:hover { border-color: #00dc82; background: rgba(0, 220, 130, 0.1); }

.loading-state, .empty-state { text-align: center; padding: 3rem 1rem; color: #94a3b8; background: #060a12; border: 1px solid #1e293b; border-radius: 12px; margin-bottom: 2rem; }

.vault-recommended-section { margin: 3rem 0; padding-top: 2rem; border-top: 1px solid #1e293b; }
.recommended-title { font-size: 1.2rem; font-weight: 800; color: #ffffff; margin-bottom: 1rem; }
.recommended-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
.recommended-card { background: #090d16; border: 1px solid #1e293b; border-radius: 10px; padding: 1.2rem; text-decoration: none; display: flex; flex-direction: column; gap: 0.5rem; transition: transform 0.2s, border-color 0.2s; }
.recommended-card:hover { transform: translateY(-2px); border-color: #00dc82; }
.rec-cat { font-size: 0.65rem; font-weight: 800; color: #00dc82; text-transform: uppercase; }
.recommended-card h4 { color: #ffffff; font-size: 1rem; font-weight: 700; margin: 0; line-height: 1.3; }
.recommended-card p { color: #94a3b8; font-size: 0.8rem; margin: 0; line-height: 1.4; flex-grow: 1; }
.rec-read { color: #38bdf8; font-size: 0.75rem; font-weight: 700; margin-top: 0.5rem; }
</style>