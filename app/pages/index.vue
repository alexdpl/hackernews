<!-- app/pages/index.vue -->
<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

interface Post {
  id: number
  title: string
  url: string | null
  points: number
  createdAt: string
  commentCount?: number
  hasVoted?: boolean
}

const APP_NAME = 'DevKernelPulse' // Sostituisci qui con il nome definitivo che preferisci

const currentPage = ref(1)
const allPosts = ref<Post[]>([])
const hasMore = ref(false)
const isLoading = ref(false)
const votingPostId = ref<number | null>(null)

// 1. Fetch iniziale delle storie
const { data, error } = await useFetch('/api/posts', {
  query: { page: 1, limit: 30 }
})

// 2. Sincronizzazione reattiva
watch(
  data,
  (newData) => {
    if (newData?.success && Array.isArray(newData.data)) {
      allPosts.value = newData.data.map((p: any) => ({
        ...p,
        points: p.points ?? 1,
        hasVoted: false
      }))
      hasMore.value = Boolean(newData.pagination?.hasMore)
    }
  },
  { immediate: true }
)

// Helper per garantire URL assoluti sicuri (evita rotta errata su localhost)
function formatExternalUrl(urlString: string | null): string {
  if (!urlString) return '#'
  if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
    return urlString
  }
  return `https://${urlString}`
}

// Helper per estrazione nome dominio
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

// 3. Upvote Atomico
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
    }
  } catch (err: any) {
    if (err.statusCode === 409) {
      post.hasVoted = true
      alert('Hai già votato questa storia!')
    } else {
      alert(err.data?.statusMessage || 'Errore durante la registrazione del voto.')
    }
  } finally {
    votingPostId.value = null
  }
}

// 4. Caricamento paginato
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
    console.error('Errore nel caricamento dei post successivi:', err)
  } finally {
    isLoading.value = false
  }
}

onUnmounted(() => {
  allPosts.value = []
  data.value = null
  hasMore.value = false
  currentPage.value = 1
  votingPostId.value = null
})
</script>

<template>
  <div class="hn-container">
    <div v-if="error" class="error-msg">
      ⚠️ Si è verificato un errore nel caricamento delle storie.
    </div>

    <!-- Lista delle Storie Stile Hacker News -->
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
            <!-- Link Interno se assente URL -->
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

    <p v-else-if="!error" class="empty-msg">Nessuna storia disponibile al momento.</p>

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

.error-msg, .empty-msg { 
  font-size: 0.9rem; 
  color: #6b7280; 
  padding: 1rem 0; 
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