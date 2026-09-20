<!-- app/pages/index.vue -->
<script setup>
import { ref, onUnmounted } from 'vue'

const currentPage = ref(1)
const allPosts = ref([])
const hasMore = ref(false)
const isLoading = ref(false)

// Recupero iniziale dei dati con Nuxt 4 useFetch
const { data, error } = await useFetch('/api/posts', {
  query: { page: currentPage, limit: 30 },
  watch: false
})

// RISOLUZIONE BUG: Estraiamo correttamente l'array annidato dentro .data
if (data.value && data.value.success) {
  allPosts.value = data.value.data || []
  hasMore.value = data.value.pagination?.hasMore || false
}

async function loadMore() {
  if (isLoading.value || !hasMore.value) return
  isLoading.value = true
  
  const nextPage = currentPage.value + 1

  try {
    const response = await $fetch('/api/posts', {
      query: { page: nextPage, limit: 30 }
    })

    if (response.success && response.data && response.data.length > 0) {
      allPosts.value = [...allPosts.value, ...response.data]
      currentPage.value = nextPage
      hasMore.value = response.pagination?.hasMore || false
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
  allPosts.value = null
  hasMore.value = null
  currentPage.value = null
})
</script>

<template>
  <div class="hn-container">
    <div v-if="error" class="error-msg">
      Si è verificato un errore nel caricamento delle storie.
    </div>

    <!-- Lista dei Post con numerazione progressiva stile HN -->
    <ol :start="1" class="posts-list" v-if="allPosts && allPosts.length > 0">
      <li v-for="(post, index) in allPosts" :key="post.id" class="post-item">
        <span class="post-number">{{ index + 1 }}.</span>
        <div class="post-content">
          <div class="post-title-row">
            <a :href="post.url || `/posts/${post.id}`" target="_blank" class="post-title">
              {{ post.title }}
            </a>
            <span v-if="post.url" class="post-domain">
              ({{ new URL(post.url).hostname }})
            </span>
          </div>
          <div class="post-subtext">
            {{ post.points || 1 }} punti | creato il {{ new Date(post.createdAt).toLocaleDateString() }}
          </div>
        </div>
      </li>
    </ol>

    <p v-else class="empty-msg">Nessuna storia disponibile al momento.</p>

    <!-- Pulsante More in fondo alla lista -->
    <div v-if="hasMore" class="more-container">
      <button @click="loadMore" :disabled="isLoading" class="more-btn">
        {{ isLoading ? 'Caricamento...' : 'More' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.hn-container { background-color: #f6f6ef; padding: 1rem; font-family: Verdana, Geneva, sans-serif; }
.posts-list { list-style-type: none; padding: 0; margin: 0; }
.post-item { display: flex; align-items: flex-start; margin-bottom: 0.5rem; font-size: 0.9rem; }
.post-number { color: #828282; margin-right: 0.3rem; min-width: 1.5rem; text-align: right; }
.post-content { display: flex; flex-direction: column; }
.post-title { color: #000000; text-decoration: none; }
.post-title:visited { color: #828282; }
.post-domain { font-size: 0.75rem; color: #828282; margin-left: 0.2rem; }
.post-subtext { font-size: 0.7rem; color: #828282; margin-top: 0.1rem; }
.more-container { margin-top: 1.5rem; padding-left: 1.8rem; }
.more-btn { background: none; border: none; color: #000000; font-family: inherit; font-size: 0.9rem; cursor: pointer; text-decoration: none; font-weight: bold; }
.more-btn:hover { text-decoration: underline; }
.error-msg, .empty-msg { font-size: 0.9rem; color: #6b7280; padding: 1rem 0; }
</style>