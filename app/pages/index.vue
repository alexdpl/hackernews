<!-- app/pages/index.vue -->
<script setup lang="ts">
useDkpSeo({
  title: 'News Feed - Tech Stories & DKP Kernel v2.0',
  description: 'Il feed meritocratico in tempo reale per sviluppatori con notizie verificate dal DKP Crawler Engine.'
})

interface PostItem {
  id: number
  title: string
  url: string | null
  content: string | null
  points: number
  created_at: string
  user_id: number
  author: string
  author_role: string
}

const posts = ref<PostItem[]>([])
const isLoading = ref(true)
const fetchError = ref('')

// Estrazione dominio pulito dal link esterno
function getDomain(urlStr: string | null): string {
  if (!urlStr) return 'devkernelpulse.org'
  try {
    const parsed = new URL(urlStr)
    return parsed.hostname.replace('www.', '')
  } catch {
    return 'external'
  }
}

// Formattazione data relativa (es. '2 ore fa')
function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return 'recente'
  const date = new Date(dateStr)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'ora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m fa`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h fa`
  const days = Math.floor(hours / 24)
  return `${days}g fa`
}

// Fetch delle notizie
async function loadFeed() {
  isLoading.value = true
  fetchError.value = ''

  try {
    const res = await $fetch<{ success: boolean; data: PostItem[] }>('/api/posts')
    if (res.success && Array.isArray(res.data)) {
      posts.value = res.data
    }
  } catch (err: any) {
    fetchError.value = err.statusMessage || 'Errore nel caricamento del Feed Notizie.'
  } finally {
    isLoading.value = false
  }
}

// Incremento voti locale reattivo
function upvote(post: PostItem) {
  post.points++
}

onMounted(() => {
  loadFeed()
})
</script>

<template>
  <div class="feed-container">
    <!-- HERO HEADER FEED -->
    <div class="feed-header">
      <div class="header-left">
        <span class="pulse-tag">LIVE KERNEL FEED v2.0</span>
        <h1>Developer <span class="highlight">Pulse Feed</span></h1>
        <p class="subtitle">Notizie tech, release e discussioni verificate dal nostro motore DKP.</p>
      </div>

      <div class="header-right">
        <NuxtLink to="/submit" class="btn-submit-story">
          ➕ Invia Notizia
        </NuxtLink>
        <button @click="loadFeed" class="btn-refresh" title="Ricarica Feed">
          🔄 Aggiorna
        </button>
      </div>
    </div>

    <!-- CARICAMENTO / LOADING SKELETON -->
    <div v-if="isLoading" class="loading-box">
      <div class="spinner"></div>
      <p>Sincronizzazione notizie con Neon PostgreSQL DB in corso...</p>
    </div>

    <!-- ERRORE CARICAMENTO -->
    <div v-else-if="fetchError" class="error-box">
      <h3>⚠️ Impossibile caricare le notizie</h3>
      <p>{{ fetchError }}</p>
      <button @click="loadFeed" class="btn-retry">Riprova Connessione 🔄</button>
    </div>

    <!-- NESSUNA NOTIZIA DISPONIBILE -->
    <div v-else-if="posts.length === 0" class="empty-box">
      <div class="empty-icon">📰</div>
      <h3>Il Feed è attualmente vuoto</h3>
      <p>Usa il DKP Crawler Engine dal Pannello Admin oppure invia prima una storia!</p>
      <NuxtLink to="/admin/crawler" class="btn-crawler-link">🤖 Apri Crawler Admin</NuxtLink>
    </div>

    <!-- LISTA NOTIZIE REALI DKP + PAGINAZIONE -->
    <div v-else class="feed-content-wrapper">
      <div class="posts-list">
        <div v-for="(post, index) in posts" :key="post.id" class="post-item">
          <div class="vote-section">
            <button @click="upvote(post)" class="upvote-btn" title="Vota questa notizia">
              ▲
            </button>
            <span class="points-count">{{ post.points }}</span>
          </div>

          <div class="post-content">
            <div class="post-title-row">
              <span class="post-index">{{ index + 1 }}.</span>
              
              <a v-if="post.url" :href="post.url" target="_blank" rel="noopener" class="post-title-link">
                {{ post.title }}
              </a>
              <span v-else class="post-title-text">{{ post.title }}</span>

              <span v-if="post.url" class="domain-badge">
                ({{ getDomain(post.url) }}) ↗
              </span>
            </div>

            <div class="post-meta">
              <span>Inviato da <strong class="author-tag">@{{ post.author }}</strong></span>
              <span class="meta-dot">•</span>
              <span>🕒 {{ formatTimeAgo(post.created_at) }}</span>
              <span v-if="post.content" class="meta-dot">•</span>
              <span v-if="post.content" class="content-excerpt">{{ post.content }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- BARRA DI PAGINAZIONE IN BASSO -->
      <div class="pagination-bar">
        <span class="page-indicator">Pagina 1 (Live Feed)</span>
        <NuxtLink to="/news/2" class="pag-btn next">
          Altre Notizie (Pagina 2) ►
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feed-container { max-width: 1050px; margin: 0 auto; padding: 2rem 1.5rem; color: #f8fafc; }

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
}

.pulse-tag {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  border: 1px solid rgba(0, 220, 130, 0.3);
}

.feed-header h1 { font-size: 2rem; font-weight: 900; margin: 0.4rem 0 0.2rem; }
.highlight { color: #00dc82; }
.subtitle { color: #94a3b8; font-size: 0.9rem; margin: 0; }

.header-right { display: flex; gap: 0.75rem; }
.btn-submit-story {
  background: #00dc82;
  color: #020420;
  font-weight: 800;
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.88rem;
  transition: background 0.2s;
}
.btn-submit-story:hover { background: #00bf71; }

.btn-refresh {
  background: #020420;
  border: 1px solid #1e293b;
  color: #cbd5e1;
  font-weight: 700;
  padding: 0.65rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.88rem;
}
.btn-refresh:hover { border-color: #00dc82; color: #00dc82; }

/* LOADING & ERRORS */
.loading-box, .error-box, .empty-box {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  color: #94a3b8;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(0, 220, 130, 0.2);
  border-top-color: #00dc82;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-box h3 { color: #f87171; margin-bottom: 0.5rem; }
.btn-retry { background: #020420; border: 1px solid #f87171; color: #f87171; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; margin-top: 1rem; }

.empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
.btn-crawler-link { display: inline-block; margin-top: 1rem; color: #00dc82; font-weight: 700; text-decoration: none; border: 1px solid #00dc82; padding: 0.5rem 1rem; border-radius: 6px; }

/* FEED POSTS LIST */
.feed-content-wrapper { display: flex; flex-direction: column; gap: 1.5rem; }
.posts-list { display: flex; flex-direction: column; gap: 0.75rem; }

.post-item {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  transition: border-color 0.15s, transform 0.15s;
}

.post-item:hover {
  border-color: rgba(0, 220, 130, 0.4);
  transform: translateX(2px);
}

.vote-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 36px;
}

.upvote-btn {
  background: #020420;
  border: 1px solid #1e293b;
  color: #00dc82;
  font-size: 0.75rem;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.upvote-btn:hover { background: #00dc82; color: #020420; }

.points-count {
  font-size: 0.8rem;
  font-weight: 800;
  color: #cbd5e1;
  margin-top: 0.2rem;
}

.post-content { flex: 1; }

.post-title-row {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.post-index { font-weight: 800; color: #64748b; font-size: 0.9rem; }

.post-title-link {
  color: #f8fafc;
  font-weight: 700;
  font-size: 1.05rem;
  text-decoration: none;
  transition: color 0.15s;
}

.post-title-link:hover { color: #00dc82; }

.post-title-text { color: #f8fafc; font-weight: 700; font-size: 1.05rem; }

.domain-badge { font-size: 0.75rem; color: #38bdf8; font-weight: 600; }

.post-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.35rem;
  flex-wrap: wrap;
}

.author-tag { color: #00dc82; font-weight: 700; }
.meta-dot { color: #334155; }
.content-excerpt { color: #94a3b8; font-style: italic; max-width: 500px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* BARRA PAGINAZIONE FEED */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #1e293b;
}

.page-indicator {
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 700;
}

.pag-btn {
  background: #020420;
  border: 1px solid #00dc82;
  color: #00dc82;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 800;
  font-size: 0.88rem;
  text-decoration: none;
  transition: all 0.2s ease;
}

.pag-btn:hover {
  background: #00dc82;
  color: #020420;
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.35);
}
</style>