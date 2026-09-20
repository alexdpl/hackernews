<!-- app/pages/index.vue -->
<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const currentPage = ref(1)
const allPosts = ref<any[]>([])
const hasMore = ref(false)
const isLoading = ref(false)

// 1. Recupero iniziale con Nuxt 4 useFetch
const { data, error } = await useFetch('/api/posts', {
  query: { page: 1, limit: 30 }
})

// 2. Sincronizzazione reattiva sicura (gestisce SSR e idratazione Client)
watch(
  data,
  (newData) => {
    if (newData?.success && Array.isArray(newData.data)) {
      allPosts.value = newData.data
      hasMore.value = Boolean(newData.pagination?.hasMore)
    }
  },
  { immediate: true }
)

// 3. Helper sicuro per l'estrazione del dominio (evita crash su URL relative o malformate)
function getDomain(urlString: string | null): string {
  if (!urlString) return ''
  try {
    const url = new URL(urlString)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

// 4. Caricamento incrementale delle pagine successive (Pulsante "More")
async function loadMore() {
  if (isLoading.value || !hasMore.value) return
  isLoading.value = true

  const nextPage = currentPage.value + 1

  try {
    const response = await $fetch<any>('/api/posts', {
      query: { page: nextPage, limit: 30 }
    })

    if (response?.success && Array.isArray(response.data) && response.data.length > 0) {
      allPosts.value = [...allPosts.value, ...response.data]
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

// 5. Hard Cleanup per la gestione della memoria nei 12GB RAM
onUnmounted(() => {
  allPosts.value = []
  data.value = null
  hasMore.value = false
  currentPage.value = 1
})
</script>

<template>
  <div class="hn-container">
    <div v-if="error" class="error-msg">
      Si è verificato un errore nel caricamento delle storie.
    </div>

    <!-- Lista dei Post con numerazione progressiva stile HN -->
    <ol v-if="allPosts && allPosts.length > 0" class="posts-list">
      <li v-for="(post, index) in allPosts" :key="post.id || index" class="post-item">
        <span class="post-number">{{ index + 1 }}.</span>
        <div class="post-content">
          <div class="post-title-row">
            <!-- Se c'è una URL esterna la apre in nuova scheda, altrimenti naviga al dettaglio locale -->
            <a 
              v-if="post.url" 
              :href="post.url" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="post-title"
            >
              {{ post.title }}
            </a>
            <NuxtLink v-else :to="`/item/${post.id}`" class="post-title">
              {{ post.title }}
            </NuxtLink>

            <span v-if="getDomain(post.url)" class="post-domain">
              ({{ getDomain(post.url) }})
            </span>
          </div>

          <div class="post-subtext">
            {{ post.points ?? 1 }} punti | creato il 
            {{ post.createdAt ? new Date(post.createdAt).toLocaleDateString('it-IT') : 'di recente' }}
          </div>
        </div>
      </li>
    </ol>

    <p v-else-if="!error" class="empty-msg">Nessuna storia disponibile al momento.</p>

    <!-- Pulsante More in fondo alla lista -->
    <div v-if="hasMore" class="more-container">
      <button @click="loadMore" :disabled="isLoading" class="more-btn">
        {{ isLoading ? 'Caricamento...' : 'More' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.hn-container { 
  background-color: #f6f6ef; 
  padding: 1rem; 
  font-family: Verdana, Geneva, sans-serif; 
}
.posts-list { 
  list-style-type: none; 
  padding: 0; 
  margin: 0; 
}
.post-item { 
  display: flex; 
  align-items: flex-start; 
  margin-bottom: 0.5rem; 
  font-size: 0.9rem; 
}
.post-number { 
  color: #828282; 
  margin-right: 0.3rem; 
  min-width: 1.8rem; 
  text-align: right; 
}
.post-content { 
  display: flex; 
  flex-direction: column; 
}
.post-title { 
  color: #000000; 
  text-decoration: none; 
}
.post-title:visited { 
  color: #828282; 
}
.post-domain { 
  font-size: 0.75rem; 
  color: #828282; 
  margin-left: 0.2rem; 
}
.post-subtext { 
  font-size: 0.7rem; 
  color: #828282; 
  margin-top: 0.1rem; 
}
.more-container { 
  margin-top: 1.5rem; 
  padding-left: 2.1rem; 
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
</style>