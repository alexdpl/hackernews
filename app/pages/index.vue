<!-- app/pages/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

// Fetch dal feed crawler del Neon DB (15 notizie per pagina)
const { data: responseData, pending } = await useFetch('/api/pulse/stories', {
  query: { type: 'news', page: 1, limit: 15 }
})

// Normalizzazione e sanitizzazione dei dati del crawler
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
const hasMore = computed(() => (pagination.value?.currentPage < pagination.value?.totalPages) || pagination.value?.totalItems > 15)

// Articoli consigliati dal Vault
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
  title: 'Tech News Feed v2.5-GOLD - DevKernelPulse',
  meta: [
    { name: 'description', content: 'Ultime notizie e articoli dal web raccolti in tempo reale in ordine cronologico.' }
  ]
})
</script>

<template>
  <div class="feed-page-container">
    
    <!-- HEADER TECH NEWS FEED -->
    <div class="feed-header">
      <div class="header-text">
        <div class="feed-badge">
          v2.5-GOLD
        </div>
        <h1 class="feed-title">
          Tech News <span class="highlight-text">Feed</span>
        </h1>
        <p class="feed-subtitle">
          Ultime notizie e articoli dal web raccolti in tempo reale in ordine cronologico.
        </p>
      </div>

      <div class="header-action">
        <NuxtLink to="/submit" class="submit-btn">
          ⚡ Invia Post (+15 XP)
        </NuxtLink>
      </div>
    </div>

    <!-- CARICAMENTO FEED -->
    <div v-if="pending" class="loading-state">
      <span class="spinner">⚡</span> Caricamento Tech News dal DB Neon...
    </div>

    <!-- FEED NOTIZIE CRAWLER -->
    <div v-else-if="feedList.length > 0">
      <div class="feed-list">
        <article 
          v-for="(item, index) in feedList" 
          :key="item.id || index" 
          class="feed-card"
        >
          <div class="card-body">
            <div class="title-row">
              <span class="item-index">{{ index + 1 }}.</span>
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
      
      <!-- BOTTONE PAGINAZIONE: punta a /news/2 del feed crawler -->
      <div v-if="hasMore" class="mt-6 flex justify-center">
        <NuxtLink to="/news/2" class="more-btn">
          Vedi altre notizie ➔
        </NuxtLink>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>📭 Nessuna notizia presente nel Tech News Feed.</p>
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

.feed-header { background: rgba(9, 13, 22, 0.85); backdrop-filter: blur(16px); border: 1px solid #1e293b; border-radius: 16px; padding: 1.75rem 2rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.25rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
.feed-badge { display: inline-block; background: rgba(0, 220, 130, 0.12); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; padding: 0.25rem 0.6rem; border-radius: 6px; margin-bottom: 0.6rem; }
.feed-title { font-size: 1.85rem; font-weight: 900; margin: 0 0 0.4rem 0; color: #ffffff; }
.highlight-text { color: #00dc82; }
.feed-subtitle { font-size: 0.88rem; color: #94a3b8; margin: 0; max-width: 650px; line-height: 1.5; }

.submit-btn { background: #00dc82; color: #020420; font-weight: 900; font-size: 0.85rem; padding: 0.7rem 1.2rem; border-radius: 8px; text-decoration: none; transition: all 0.2s ease; white-space: nowrap; display: inline-block; }
.submit-btn:hover { transform: translateY(-2px); box-shadow: 0 0 20px rgba(0, 220, 130, 0.4); }

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

.mt-6 { margin-top: 1.5rem; }
.flex { display: flex; }
.justify-center { justify-content: center; }
.more-btn { background: #090d16; color: #00dc82; border: 1px solid #1e293b; padding: 0.6rem 1.5rem; border-radius: 8px; font-weight: bold; text-decoration: none; transition: all 0.2s; }
.more-btn:hover { border-color: #00dc82; background: rgba(0, 220, 130, 0.1); }

.loading-state, .empty-state { text-align: center; padding: 3rem 1rem; color: #94a3b8; background: #060a12; border: 1px solid #1e293b; border-radius: 12px; margin-bottom: 2rem; }

.vault-recommended-section { margin: 3rem 0; padding-top: 2rem; border-top: 1px solid #1e293b; }
.recommended-title { font-size: 1.2rem; font-weight: 800; color: #ffffff; margin-bottom: 1rem; }
.recommended-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
.recommended-card { background: #090d16; border: 1px solid #1e293b; border-radius: 10px; padding: 1.2rem; text-decoration: none; display: flex; flex-direction: column; gap: 0.5rem; transition: transform 0.2s, border-color 0.2s; }
.recommended-card:hover { transform: translateY(-2px); border-color: #00dc82; }
.rec-cat { font-size: 0.65rem; font-weight: 800; color: #00dc82; text-transform: uppercase; }
.recommended-card h4 { color: #ffffff; font-size: 1rem; font-weight: 700; margin: 0; line-height: 1.3; }
.rec-read { color: #38bdf8; font-size: 0.75rem; font-weight: 700; margin-top: 0.5rem; }
</style>
