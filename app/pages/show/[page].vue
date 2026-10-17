<-- app/pages/show/[page].vue -->
<script setup>
import { computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const currentPage = computed(() => Math.max(1, parseInt(route.params.page) || 1))

const { data, error, pending } = await useFetch('/api/show', {
  query: { page: currentPage, limit: 30 },
  watch: [currentPage]
})

const showList = computed(() => data.value?.data || [])
const hasMore = computed(() => data.value?.pagination?.hasMore || false)

function handleNextPage() {
  if (!hasMore.value || pending.value) return
  router.push(`/show/${currentPage.value + 1}`)
}

function handlePrevPage() {
  if (currentPage.value <= 1 || pending.value) return
  router.push(`/show/${currentPage.value - 1}`)
}

onUnmounted(() => {
  data.value = null
})
</script>

<template>
  <div class="hn-container">
    <h1 class="section-title">Show DKP — Repository & Progetti</h1>

    <div v-if="error" class="error-msg">Errore nel caricamento dei progetti.</div>
    <div v-if="pending" class="loading-msg">Caricamento in corso...</div>

    <ul v-else-if="showList.length > 0" class="items-list">
      <li v-for="item in showList" :key="item.id" class="item-row">
        <div class="item-content">
          <a :href="item.url" target="_blank" class="item-link">{{ item.title }}</a>
          <span class="item-meta"> Fonte: {{ item.domain }} • Inserito il {{ new Date(item.createdAt).toLocaleDateString() }}</span>
        </div>
      </li>
    </ul>
    
    <p v-else class="empty-msg">Nessun progetto in vetrina al momento. Esegui il crawler!</p>

    <div class="pagination-nav">
      <button @click="handlePrevPage" :disabled="currentPage <= 1 || pending" class="nav-btn">
        &lt; Precedente
      </button>
      <span class="page-indicator">Pagina {{ currentPage }}</span>
      <button @click="handleNextPage" :disabled="!hasMore || pending" class="nav-btn">
        More (Successiva) &gt;
      </button>
    </div>
  </div>
</template>

<style scoped>
.hn-container { background-color: #f6f6ef; padding: 1.5rem; font-family: Verdana, Geneva, sans-serif; }
.section-title { font-size: 1.2rem; font-weight: bold; margin-bottom: 1rem; color: #111827; }
.items-list { list-style-type: none; padding: 0; margin: 0; }
.item-row { padding: 0.6rem 0; border-bottom: 1px solid #e5e7eb; font-size: 0.9rem; }
.item-link { color: #000000; text-decoration: none; font-weight: 500; }
.item-link:hover { text-decoration: underline; }
.item-meta { font-size: 0.75rem; color: #828282; margin-top: 0.2rem; display: block; }
.pagination-nav { margin-top: 2rem; display: flex; align-items: center; gap: 1rem; }
.nav-btn { background: none; border: none; color: #000000; font-weight: bold; cursor: pointer; font-size: 0.85rem; }
.nav-btn:disabled { color: #d1d5db; cursor: not-allowed; }
.page-indicator { font-size: 0.85rem; color: #374151; }
.loading-msg, .empty-msg { font-size: 0.9rem; color: #6b7280; padding: 1rem 0; }
</style>