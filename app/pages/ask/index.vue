<!-- app/pages/ask/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

// 1. Puntiamo all'endpoint dedicato /api/ask che restituisce dati strutturati e puliti
const { data: responseData, pending } = await useFetch('/api/ask', {
  query: { page: 1, limit: 15 }
})

// Estrazione dati sicura con normalizzazione al volo di link e autore
const askList = computed(() => {
  const raw = responseData.value?.data || responseData.value?.stories || []
  return raw.map((item: any) => ({
    ...item,
    // Estrazione stringa pulita dell'autore per evitare il blocco JSON nell'interfaccia
    author: typeof item.author === 'object' ? item.author?.username || 'community_ask' : (item.author || item.user || 'community_ask'),
    // Fallback sicuro per il link
    url: item.url || `/item/${item.id}`
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

// Logica Voti
const voteAsk = (item: any) => {
  if (item.voted) {
    item.points = (item.points || 1) - 1
    item.voted = false
  } else {
    item.points = (item.points || 0) + 1
    item.voted = true
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
  title: 'Ask DKP Community - Q&A & Discussioni v2.5-GOLD',
  meta: [
    { name: 'description', content: 'Fai domande sull\'architettura software, chiedi code review e discuti con gli sviluppatori della community DKP.' }
  ]
})
</script>

<template>
  <div class="ask-page-container">
    
    <!-- HEADER DELLA SEZIONE ASK -->
    <div class="ask-header">
      <div class="header-text">
        <div class="ask-badge">
          💬 COMMUNITY Q&A • v2.5-GOLD
        </div>
        <h1 class="ask-title">
          Ask <span class="highlight-text">DKP Community</span>
        </h1>
        <p class="ask-subtitle">
          Fai domande sull'architettura software, chiedi code review o apri un dibattito tecnico con la community.
        </p>
      </div>

      <div class="header-action">
        <NuxtLink to="/submit?type=ask" class="submit-ask-btn">
          💬 Fai una Domanda (+15 XP)
        </NuxtLink>
      </div>
    </div>

    <!-- FEED DELLE DISCUSSIONI -->
    <div v-if="pending" class="loading-state">
      <span class="spinner">⚡</span> Caricamento discussioni dal Neon Kernel DB...
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
            title="Vota questa domanda (+5 XP)"
          >
            <span class="vote-icon">▲</span>
            <span class="vote-count">{{ item.points || 1 }}</span>
          </button>

          <div class="ask-info">
            <div class="ask-title-row">
              <span class="ask-index">{{ index + 1 }}.</span>
              <a :href="item.url" target="_blank" rel="noopener noreferrer" class="ask-question-title">
                {{ item.title }}
              </a>
            </div>

            <div class="ask-meta">
              <span>👤 Chiesto da <strong class="author-tag">@{{ item.author }}</strong></span>
              <span class="meta-dot">•</span>
              <span class="xp-tag">⭐ +{{ item.xp_awarded || 20 }} XP</span>
              <span class="meta-dot">•</span>
              <span class="time-tag">⏱️ {{ formatTime(item.createdAt || item.created_at) }}</span>
              <span class="meta-dot">•</span>
              <span class="verify-tag">Verified da <strong>DKP Crawler</strong></span>
            </div>
          </div>
        </article>
      </div>
      
      <!-- Bottone Paginazione -->
      <div v-if="hasMore" class="mt-6 flex justify-center">
        <NuxtLink to="/ask/2" class="more-btn">
          Vedi altre discussioni ➔
        </NuxtLink>
      </div>
    </div>

    <!-- EMPTY STATE FALLBACK -->
    <div v-else class="empty-state">
      <p>📭 Nessuna domanda trovata in Ask DKP.</p>
      <div class="empty-actions">
        <NuxtLink to="/admin/crawler" class="admin-link">🤖 Sincronizza Ask dal Crawler Admin</NuxtLink>
        <span class="sep">•</span>
        <NuxtLink to="/submit?type=ask" class="submit-inline-link">Sii il primo ad aprire una discussione!</NuxtLink>
      </div>
    </div>

    <!-- 🟢 SEZIONE VAULT (Consigliati) -->
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

.ask-header { background: rgba(9, 13, 22, 0.85); backdrop-filter: blur(16px); border: 1px solid #1e293b; border-radius: 16px; padding: 1.75rem 2rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.25rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
.ask-badge { display: inline-block; background: rgba(0, 220, 130, 0.12); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; padding: 0.25rem 0.6rem; border-radius: 6px; margin-bottom: 0.6rem; }
.ask-title { font-size: 1.85rem; font-weight: 900; margin: 0 0 0.4rem 0; color: #ffffff; }
.highlight-text { color: #00dc82; }
.ask-subtitle { font-size: 0.88rem; color: #94a3b8; margin: 0; max-width: 650px; line-height: 1.5; }

.submit-ask-btn { background: #00dc82; color: #020420; font-weight: 900; font-size: 0.85rem; padding: 0.7rem 1.2rem; border-radius: 8px; text-decoration: none; transition: all 0.2s ease; white-space: nowrap; display: inline-block; }
.submit-ask-btn:hover { transform: translateY(-2px); box-shadow: 0 0 20px rgba(0, 220, 130, 0.4); }

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
.xp-tag { color: #f59e0b; font-weight: 800; }
.verify-tag { color: #94a3b8; }
.meta-dot { color: #334155; }

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