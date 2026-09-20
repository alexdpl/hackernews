<!-- app/pages/newest/[page].vue -->
<script setup>
import { computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Legge dinamicamente il parametro della pagina dall'URL di Nuxt 4
const currentPage = computed(() => Math.max(1, parseInt(route.params.page) || 1))

// useFetch agganciato ai dati strutturati dal backend
const { data, error, pending } = await useFetch('/api/posts', {
  query: { page: currentPage, limit: 30 },
  watch: [currentPage]
})

// RISOLUZIONE BUG DELLO SCREENSHOT: Estraiamo l'array corretto racchiuso in .data
const postsList = computed(() => data.value?.data || [])
const hasMore = computed(() => data.value?.pagination?.hasMore || false)

function nextPage() {
  if (!hasMore.value || pending.value) return
  router.push('/newest/' + (currentPage.value + 1))
}

function prevPage() {
  if (currentPage.value <= 1 || pending.value) return
  router.push('/newest/' + (currentPage.value - 1))
}

// Garbage collection immediato per i 12GB di RAM hardware
onUnmounted(() => {
  data.value = null
})
</script>

<template>
  <div class="hn-container">
    <div v-if="error" class="error-msg">Errore nel caricamento delle ultime storie.</div>
    <div v-if="pending" class="loading-msg">Sincronizzazione feed in corso...</div>

    <!-- Lista dei post renderizzata in modo pulito ed esplicito -->
    <ol v-else-if="postsList.length > 0" :start="((currentPage - 1) * 30) + 1" class="posts-list">
      <li v-for="post in postsList" :key="post.id" class="post-item">
        <div class="post-content">
          <div class="post-title-row">
            <a :href="post.url || '/posts/' + post.id" target="_blank" class="post-title">
              {{ post.title }}
            </a>
            <span v-if="post.url" class="post-domain">
              ({{ new URL(post.url).hostname }})
            </span>
          </div>
          <div class="post-subtext">
            {{ post.points || 1 }} punti | inserito il {{ new Date(post.createdAt).toLocaleDateString() }}
          </div>
        </div>
      </li>
    </ol>

    <p v-else class="empty-msg">Nessun post presente in questa pagina.</p>

    <!-- Barra di navigazione HN unificata con tasto More -->
    <div class="pagination-nav" v-if="postsList.length > 0">
      <button @click="prevPage" :disabled="currentPage <= 1 || pending" class="nav-btn">
        &lt; Precedente
      </button>
      <span class="page-indicator">Pagina {{ currentPage }}</span>
      <button @click="nextPage" :disabled="!hasMore || pending" class="nav-btn">
        More &gt;
      </button>
    </div>
  </div>
</template>

<style scoped>
.hn-container { background-color: #f6f6ef; padding: 1rem; font-family: Verdana, Geneva, sans-serif; }
.posts-list { padding-left: 1.5rem; margin: 0; }
.post-item { margin-bottom: 0.6rem; font-size: 0.9rem; color: #828282; }
.post-content { display: inline-flex; flex-direction: column; vertical-align: top; }
.post-title { color: #000000; text-decoration: none; }
.post-title:visited { color: #828282; }
.post-domain { font-size: 0.75rem; color: #828282; margin-left: 0.2rem; }
.post-subtext { font-size: 0.7rem; color: #828282; margin-top: 0.1rem; }
.pagination-nav { margin-top: 1.5rem; padding-left: 1.5rem; display: flex; align-items: center; gap: 1rem; }
.nav-btn { background: none; border: none; color: #000000; font-weight: bold; cursor: pointer; font-size: 0.85rem; }
.nav-btn:disabled { color: #d1d5db; cursor: not-allowed; }
.page-indicator { font-size: 0.85rem; color: #374151; }
.loading-msg, .empty-msg { font-size: 0.9rem; color: #6b7280; padding: 1rem; }
</style>