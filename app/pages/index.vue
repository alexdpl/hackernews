<!-- app/pages/index.vue -->
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const APP_NAME = 'DevKernelPulse'

useHead({
  title: `${APP_NAME} — Dev News & Tech Community`,
  meta: [
    { name: 'description', content: 'Notizie, progetti e discussioni per sviluppatori e appassionati tech.' }
  ]
})

interface Post {
  id: number
  title: string
  url: string | null
  points: number
  createdAt: string
  commentCount?: number
  hasVoted?: boolean
}

// 3 Post di prova predefiniti (Fallback visibile sia in locale che su Vercel)
const defaultPosts: Post[] = [
  {
    id: 1,
    title: 'Benvenuti su DevKernelPulse — La nuova piattaforma per sviluppatori',
    url: 'https://github.com',
    points: 42,
    createdAt: new Date().toISOString(),
    commentCount: 5,
    hasVoted: false
  },
  {
    id: 2,
    title: 'Nuxt 3 & Vue 3: Guida all\'architettura Full-Stack moderna',
    url: 'https://nuxt.com',
    points: 28,
    createdAt: new Date().toISOString(),
    commentCount: 2,
    hasVoted: false
  },
  {
    id: 3,
    title: 'Ottimizzazione Serverless Database con Neon PostgreSQL',
    url: 'https://neon.tech',
    points: 19,
    createdAt: new Date().toISOString(),
    commentCount: 1,
    hasVoted: false
  }
]

const currentPage = ref(1)
const allPosts = ref<Post[]>([])
const hasMore = ref(false)
const isLoading = ref(false)
const votingPostId = ref<number | null>(null)

// Fetch API
const { data: apiRes, error, refresh } = await useFetch<any>('/api/posts', {
  query: { page: 1, limit: 30 },
  key: 'home-posts-list'
})

// Inizializza i post: se il DB restituisce dati li usa, altrimenti carica i 3 post di prova
function loadPostsData() {
  if (apiRes.value?.success && Array.isArray(apiRes.value.data) && apiRes.value.data.length > 0) {
    allPosts.value = apiRes.value.data.map((p: any) => ({
      ...p,
      points: p.points ?? 1,
      hasVoted: false
    }))
    hasMore.value = Boolean(apiRes.value.pagination?.hasMore)
  } else {
    // Carica i 3 post di default se il DB è vuoto o non risponde
    allPosts.value = defaultPosts
    hasMore.value = false
  }
}

// Esegui il caricamento iniziale
loadPostsData()

// Sincronizza reattivamente se l'API risponde successivamente
watch(apiRes, () => {
  loadPostsData()
})

// Garantisce che ad ogni apertura di sessione su '/' la pagina riparta da zero e rinfreschi i dati
onMounted(async () => {
  await refresh()
  loadPostsData()
})

// Helper per formattare URL esterni (evita il 404 su localhost)
function formatExternalUrl(urlString: string | null): string {
  if (!urlString) return '#'
  if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
    return urlString
  }
  return `https://${urlString}`
}

// Helper estrazione dominio
function getDomain(urlString: string | null): string {
  if (!urlString) return ''
  try {
    const formatted = formatExternalUrl(urlString)
    const url = new URL(formatted)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

// Gestione Voto Atomico
async function votePost(post: Post) {
  if (post.hasVoted || votingPostId.value === post.id) return
  votingPostId.value = post.id

  try {
    const response = await $fetch<any>(`/api/posts/${post.id}/vote`, {
      method: 'POST'
    })

    if (response?.success) {
      post.points = response.points
      post.hasVoted = true
    } else {
      post.points += 1
      post.hasVoted = true
    }
  } catch (err: any) {
    // Gestione ottimistica per post locali/demo
    post.points += 1
    post.hasVoted = true
  } finally {
    votingPostId.value = null
  }
}

// Caricamento Paginato
async function loadMore() {
  if (isLoading.value || !hasMore.value) return
  isLoading.value = true

  const nextPage = currentPage.value + 1

  try {
    const response = await $fetch<any>('/api/posts', {
      query: { page: nextPage, limit: 30 }
    })

    if (response?.success && Array.isArray(response.data) && response.data.length > 0) {
      const newFormattedPosts = response.data.map((p: any) => ({
        ...p,
        points: p.points ?? 1,
        hasVoted: false
      }))
      allPosts.value = [...allPosts.value, ...newFormattedPosts]
      currentPage.value = nextPage
      hasMore.value = Boolean(response.pagination?.hasMore)
    } else {
      hasMore.value = false
    }
  } catch (err) {
    console.error('Errore nel caricamento post:', err)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="hn-container">
    <!-- Lista delle Storie -->
    <ol v-if="allPosts && allPosts.length > 0" class="posts-list">
      <li v-for="(post, index) in allPosts" :key="post.id || index" class="post-item">
        <span class="post-number">{{ index + 1 }}.</span>

        <button 
          @click="votePost(post)" 
          class="vote-btn" 
          :class="{ voted: post.hasVoted }" 
          :disabled="post.hasVoted || votingPostId === post.id" 
          title="Upvote"
        >
          ▲
        </button>

        <div class="post-content">
          <div class="post-title-row">
            <!-- Link Esterno Corretto -->
            <a 
              v-if="post.url" 
              :href="formatExternalUrl(post.url)" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="post-title"
            >
              {{ post.title }}
            </a>
            <!-- Link Interno se senza URL -->
            <NuxtLink v-else :to="`/item/${post.id}`" class="post-title">
              {{ post.title }}
            </NuxtLink>

            <span v-if="getDomain(post.url)" class="post-domain">
              ({{ getDomain(post.url) }})
            </span>
          </div>

          <div class="post-subtext">
            <span>{{ post.points }} punti</span>
            | pubblicato il {{ post.createdAt ? new Date(post.createdAt).toLocaleDateString('it-IT') : 'di recente' }}
            | <NuxtLink :to="`/item/${post.id}`" class="sub-link">
                {{ post.commentCount ?? 0 }} commenti
              </NuxtLink>
          </div>
        </div>
      </li>
    </ol>

    <div v-if="hasMore" class="more-container">
      <button @click="loadMore" :disabled="isLoading" class="more-btn">
        {{ isLoading ? 'Caricamento...' : 'More' }}
      </button>
    </div>

    <!-- Footer Personalizzato -->
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
  min-height: 100vh;
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
  margin-bottom: 0.5rem; 
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
}

.vote-btn:hover:not(:disabled) {
  color: #ff6600;
}

.vote-btn.voted, .vote-btn:disabled {
  color: #e5e5e5;
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
  margin-left: 0.3rem; 
}

.post-subtext { 
  font-size: 0.7rem; 
  color: #828282; 
  margin-top: 0.15rem; 
}

.sub-link {
  color: #828282;
  text-decoration: none;
}

.sub-link:hover {
  text-decoration: underline;
}

.more-container { 
  margin-top: 1.5rem; 
  padding-left: 2.3rem; 
  margin-bottom: 2rem;
}

.more-btn { 
  background: none; 
  border: none; 
  color: #000000; 
  font-family: inherit; 
  font-size: 0.9rem; 
  cursor: pointer; 
  font-weight: bold; 
}

.more-btn:hover { 
  text-decoration: underline; 
}

/* Style Footer */
.app-footer {
  margin-top: auto;
  padding-top: 2rem;
  padding-bottom: 1rem;
  text-align: center;
}

.footer-divider {
  border-top: 2px solid #ff6600;
  margin-bottom: 1rem;
  width: 100%;
}

.footer-text {
  font-size: 0.75rem;
  color: #828282;
  margin: 0;
}
</style>