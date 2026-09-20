<!-- app/pages/jobs/[page].vue -->
<script setup>
import { computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Estrae la pagina corrente dall'URL della rotta di Nuxt 4
const currentPage = computed(() => Math.max(1, parseInt(route.params.page) || 1))

// Carica i dati in modo asincrono reattivo al cambio di rotta
const { data, error, pending } = await useFetch('/api/jobs', {
  query: { page: currentPage, limit: 30 },
  watch: [currentPage]
})

const jobsList = computed(() => data.value?.data || [])
const hasMore = computed(() => data.value?.pagination?.hasMore || false)

function handleNextPage() {
  if (!hasMore.value || pending.value) return
  router.push(`/jobs/${currentPage.value + 1}`)
}

function handlePrevPage() {
  if (currentPage.value <= 1 || pending.value) return
  router.push(`/jobs/${currentPage.value - 1}`)
}

// Garbage collection preventivo per bloccare leak su 12GB RAM
onUnmounted(() => {
  data.value = null
})
</script>

<template>
  <div class="hn-container">
    <h1 class="jobs-title">Offerte di Lavoro / Jobs</h1>

    <div v-if="error" class="error-msg">Errore nel caricamento delle offerte.</div>
    <div v-if="pending" class="loading-msg">Caricamento in corso...</div>

    <ul v-else-if="jobsList.length > 0" class="jobs-list">
      <li v-for="job in jobsList" :key="job.id" class="job-item">
        <div class="job-content">
          <a :href="job.url" target="_blank" class="job-link">{{ job.title }}</a>
          <span class="job-company"> @ {{ job.company }}</span>
          <div class="job-meta">Inserito il {{ new Date(job.createdAt).toLocaleDateString() }}</div>
        </div>
      </li>
    </ul>
    
    <p v-else class="empty-msg">Nessuna offerta di lavoro disponibile al momento.</p>

    <!-- Navigazione Paginata Uniformata -->
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
.jobs-title { font-size: 1.2rem; font-weight: bold; margin-bottom: 1rem; color: #111827; }
.jobs-list { list-style-type: none; padding: 0; margin: 0; }
.job-item { padding: 0.6rem 0; border-bottom: 1px solid #e5e7eb; font-size: 0.9rem; }
.job-link { color: #000000; text-decoration: none; font-weight: 500; }
.job-link:hover { text-decoration: underline; }
.job-company { color: #059669; font-weight: bold; } /* Verde smeraldo coordinato */
.job-meta { font-size: 0.75rem; color: #828282; margin-top: 0.2rem; }
.pagination-nav { margin-top: 2rem; display: flex; align-items: center; gap: 1rem; }
.nav-btn { background: none; border: none; color: #000000; font-weight: bold; cursor: pointer; font-size: 0.85rem; }
.nav-btn:disabled { color: #d1d5db; cursor: not-allowed; }
.page-indicator { font-size: 0.85rem; color: #374151; }
.loading-msg, .empty-msg { font-size: 0.9rem; color: #6b7280; padding: 1rem 0; }
</style>