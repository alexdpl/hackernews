<!-- pages/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const APP_NAME = 'DevKernelPulse'

useHead({
  title: `${APP_NAME} — Dev News & Tech Community`,
  meta: [
    { name: 'description', content: 'Notizie, progetti e discussioni per sviluppatori e appassionati tech.' }
  ]
})

interface Post {
  id: number | string
  title: string
  url?: string | null
  domain?: string | null
  points: number
  author?: string
  createdAt: string | Date
  commentCount?: number
  comments?: any[]
  hasVoted?: boolean
}

// 3 Articoli introduttivi / Default
const defaultPosts: Post[] = [
  {
    id: 'def-1',
    title: 'Benvenuti su DevKernelPulse — La nuova piattaforma per sviluppatori',
    url: 'https://github.com',
    domain: 'github.com',
    points: 42,
    author: 'admin',
    createdAt: new Date().toISOString(),
    commentCount: 5,
    hasVoted: false
  },
  {
    id: 'def-2',
    title: 'Nuxt 3 & Vue 3: Guida all\'architettura Full-Stack moderna',
    url: 'https://nuxt.com',
    domain: 'nuxt.com',
    points: 28,
    author: 'NuxtTeam',
    createdAt: new Date().toISOString(),
    commentCount: 2,
    hasVoted: false
  },
  {
    id: 'def-3',
    title: 'Ottimizzazione Serverless Database con Neon PostgreSQL',
    url: 'https://neon.tech',
    domain: 'neon.tech',
    points: 19,
    author: 'NeonDev',
    createdAt: new Date().toISOString(),
    commentCount: 1,
    hasVoted: false
  }
]

// Fetching automatico (SSR + Client)
const { data: apiRes, pending, refresh } = await useFetch<any>('/api/posts', {
  query: { page: 1, limit: 30 },
  key: 'home-posts-list'
})

// Tracciamento locale dei voti utente
const votedPosts = ref<Record<string | number, boolean>>({})
const pointsDelta = ref<Record<string | number, number>>({})
const votingPostId = ref<number | string | null>(null)

// Computed property "items": Unisce i post dal Database con i post di Default
const items = computed<Post[]>(() => {
  let dbRawPosts: any[] = []

  // Estrazione sicura da qualsiasi risposta API
  if (apiRes.value?.success && Array.isArray(apiRes.value.data)) {
    dbRawPosts = apiRes.value.data
  } else if (Array.isArray(apiRes.value)) {
    dbRawPosts = apiRes.value
  } else if (apiRes.value?.posts && Array.isArray(apiRes.value.posts)) {
    dbRawPosts = apiRes.value.posts
  }

  // Normalizzazione flessibile dei campi del DB
  const normalizedDbPosts: Post[] = dbRawPosts.map((p: any) => ({
    id: p.id,
    title: p.title || 'Senza titolo',
    url: p.url || p.link || null,
    domain: p.domain || null,
    points: p.points ?? p.votes ?? p.upvotes ?? 1,
    author: p.author || p.username || p.user || 'Admin',
    createdAt: p.createdAt || p.created_at || p.date || new Date().toISOString(),
    commentCount: p.commentCount ?? p.commentsCount ?? (Array.isArray(p.comments) ? p.comments.length : 0),
    hasVoted: p.hasVoted || false
  }))

  // Unione: I post del DB vanno in testa, poi quelli di Default se non sono duplicati
  const combined: Post[] = [...normalizedDbPosts]

  for (const defPost of defaultPosts) {
    const exists = combined.some(
      p => String(p.id) === String(defPost.id) || p.title.trim().toLowerCase() === defPost.title.trim().toLowerCase()
    )
    if (!exists) {
      combined.push(defPost)
    }
  }

  // Applicazione dello stato voti
  return combined.map(p => {
    const id = p.id
    const extraPoints = pointsDelta.value[id] || 0

    return {
      ...p,
      points: (p.points ?? 1) + extraPoints,
      hasVoted: votedPosts.value[id] || p.hasVoted || false
    }
  })
})

function formatExternalUrl(urlString?: string | null): string {
  if (!urlString) return '#'
  if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
    return urlString
  }
  return `https://${urlString}`
}

function getDomain(urlString?: string | null, fallbackDomain?: string | null): string {
  if (fallbackDomain) return fallbackDomain
  if (!urlString) return ''
  try {
    const formatted = formatExternalUrl(urlString)
    const url = new URL(formatted)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function formatDate(dateVal: any): string {
  if (!dateVal) return 'di recente'
  if (typeof dateVal === 'string' && dateVal.includes('/') && dateVal.length <= 10) return dateVal
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return 'di recente'
    return d.toLocaleDateString('it-IT')
  } catch {
    return 'di recente'
  }
}

// Gestione voto ottimistico
async function votePost(post: Post) {
  if (post.hasVoted || votingPostId.value === post.id) return
  votingPostId.value = post.id

  votedPosts.value[post.id] = true
  pointsDelta.value[post.id] = (pointsDelta.value[post.id] || 0) + 1

  try {
    await $fetch(`/api/posts/${post.id}/vote`, {
      method: 'POST'
    })
  } catch (err) {
    console.warn('Voto aggiornato in locale, sincronizzazione server fallita:', err)
  } finally {
    votingPostId.value = null
  }
}
</script>

<template>
  <div class="hn-container">
    <!-- Loader durante l'attesa iniziale -->
    <div v-if="pending && (!items || items.length === 0)" class="state-message">
      <p>Caricamento articoli in corso...</p>
    </div>

    <!-- Lista articoli (DB + Default uniti) -->
    <ol v-else-if="items && items.length > 0" class="posts-list">
      <li v-for="(item, index) in items" :key="item.id || index" class="post-item">
        <span class="post-number">{{ index + 1 }}.</span>

        <!-- Bottone Freccetta Voto ▲ -->
        <button 
          @click="votePost(item)" 
          class="vote-btn" 
          :class="{ voted: item.hasVoted }" 
          :disabled="item.hasVoted || votingPostId === item.id" 
          title="Upvote (Vota articolo)"
        >
          ▲
        </button>

        <div class="post-content">
          <!-- Titolo e Dominio -->
          <div class="post-title-row">
            <a 
              v-if="item.url" 
              :href="formatExternalUrl(item.url)" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="post-title external-link"
            >
              {{ item.title }}
            </a>
            <NuxtLink v-else :to="`/item/${item.id}`" class="post-title internal-link">
              {{ item.title }}
            </NuxtLink>

            <span v-if="getDomain(item.url, item.domain)" class="post-domain">
              ({{ getDomain(item.url, item.domain) }})
            </span>
          </div>

          <!-- Sottotesto: Punti, Autore, Data e Link Commenti -->
          <div class="post-subtext">
            <span class="points">{{ item.points || 0 }} punti</span>
            <span class="dot">•</span>
            <span class="author">da {{ item.author || 'Anonimo' }}</span>
            <span class="dot">•</span>
            <span class="time">{{ formatDate(item.createdAt) }}</span>
            <span class="dot">•</span>
            <NuxtLink :to="`/item/${item.id}`" class="comments-link">
              💬 {{ item.commentCount ?? 0 }} commenti
            </NuxtLink>
          </div>
        </div>
      </li>
    </ol>

    <!-- Fallback se nessun articolo è presente -->
    <div v-else class="state-message">
      <p>Nessun articolo disponibile al momento.</p>
      <button class="retry-btn" @click="refresh()">Riprova</button>
    </div>

    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-divider"></div>
      <p class="footer-text">
        © 2026 <strong>{{ APP_NAME }}</strong>. Tutti i diritti riservati.
      </p>
    </footer>
  </div>
</template>

<style scoped>
.hn-container { 
  background-color: #f6f6ef; 
  padding: 1rem; 
  font-family: Verdana, Geneva, sans-serif; 
  min-height: 80vh;
  display: flex;
  flex-direction: column;
}

.posts-list { 
  list-style-type: none; 
  padding: 0; 
  margin: 0; 
  flex-grow: 1;
}

.post-item { 
  display: flex; 
  align-items: flex-start; 
  margin-bottom: 0.65rem; 
  font-size: 0.9rem; 
}

.post-number { 
  color: #828282; 
  margin-right: 0.2rem; 
  min-width: 1.8rem; 
  text-align: right; 
  line-height: 1.2;
}

.vote-btn {
  background: none;
  border: none;
  color: #828282;
  font-size: 0.65rem;
  cursor: pointer;
  padding: 0 0.3rem;
  line-height: 1.2;
  margin-right: 0.2rem;
  transition: color 0.15s ease;
}

.vote-btn:hover:not(:disabled) {
  color: #ff6600;
}

.vote-btn.voted, .vote-btn:disabled {
  color: #d1d5db;
  cursor: default;
}

.post-content { 
  display: flex; 
  flex-direction: column; 
}

.post-title-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
}

.post-title { 
  color: #000000; 
  text-decoration: none; 
  line-height: 1.2;
  font-weight: 500;
}

.post-title:visited { 
  color: #828282; 
}

.post-title:hover {
  text-decoration: underline;
}

.post-domain { 
  font-size: 0.75rem; 
  color: #828282; 
  margin-left: 0.35rem; 
}

.post-subtext { 
  font-size: 0.72rem; 
  color: #828282; 
  margin-top: 0.2rem; 
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.dot {
  color: #94a3b8;
  font-size: 0.65rem;
}

.comments-link {
  color: #828282;
  text-decoration: none;
  font-weight: 500;
}

.comments-link:hover {
  text-decoration: underline;
  color: #2563eb;
}

.state-message {
  padding: 3rem 1rem;
  text-align: center;
  color: #64748b;
  font-size: 0.95rem;
  flex-grow: 1;
}

.retry-btn {
  margin-top: 0.8rem;
  background-color: #020420;
  color: #00dc82;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.retry-btn:hover {
  opacity: 0.9;
}

/* Footer */
.app-footer {
  margin-top: auto;
  padding-top: 2rem;
  padding-bottom: 1rem;
  text-align: center;
}

.footer-divider {
  border-top: 2px solid #10b981;
  margin-bottom: 1rem;
  width: 100%;
}

.footer-text {
  font-size: 0.75rem;
  color: #828282;
  margin: 0;
}
</style>