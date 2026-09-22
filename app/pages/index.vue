<!-- app/pages/index.vue -->
<script setup lang="ts">
const route = useRoute()

// Calcolo pagina corrente dalle query string (?page=1)
const page = computed(() => {
  const p = Number(route.query.page)
  return isNaN(p) || p < 1 ? 1 : p
})

// Fetch delle notizie dall'endpoint /api/posts con filtro per tipo "story" e ordinamento ranking
const { data: responseData, pending, error } = await useFetch('/api/posts', {
  query: { type: 'story', sort: 'ranking', page },
  watch: [page],
  // Trasforma e unifica la risposta (sia array diretto che wrapper { data: [...] })
  transform: (res: any) => {
    if (Array.isArray(res)) return res
    if (res && Array.isArray(res.data)) return res.data
    return []
  }
})

// Computata per garantire sempre un array valido
const items = computed(() => responseData.value || [])

useSeoMeta({
  title: 'News & Discussioni Tech',
  description: 'Le migliori notizie, discussioni e storie dal mondo developer ordinate con l\'algoritmo di Hacker News.'
})
</script>

<template>
  <div class="hn-container">
    <!-- Loader durante l'attesa iniziale -->
    <div v-if="pending && items.length === 0" class="state-message">
      Caricamento notizie in corso...
    </div>

    <!-- Errore di caricamento -->
    <div v-else-if="error" class="state-message error">
      Si è verificato un errore nel recupero delle notizie.
    </div>

    <!-- Lista storie -->
    <div v-else-if="items.length > 0" class="stories-list">
      <ol class="story-items" :start="(page - 1) * 30 + 1">
        <li v-for="item in items" :key="item.id" class="story-item">
          <Item :item="item" />
        </li>
      </ol>

      <!-- Paginazione -->
      <div class="pagination">
        <NuxtLink 
          v-if="page > 1" 
          :to="{ path: '/', query: { page: page - 1 } }" 
          class="page-link"
        >
          &laquo; Pagina precedente
        </NuxtLink>
        <span class="page-number">Pagina {{ page }}</span>
        <NuxtLink 
          v-if="items.length >= 30" 
          :to="{ path: '/', query: { page: page + 1 } }" 
          class="page-link"
        >
          Altre notizie &raquo;
        </NuxtLink>
      </div>
    </div>

    <!-- Nessun contenuto presente -->
    <div v-else class="state-message">
      Nessuna notizia trovata.
    </div>
  </div>
</template>

<style scoped>
.hn-container {
  padding: 1rem;
}

.state-message {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
  font-size: 0.95rem;
}

.state-message.error {
  color: #ef4444;
}

.story-items {
  padding-left: 1.5rem;
  margin: 0;
}

.story-item {
  margin-bottom: 0.5rem;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-left: 1.5rem;
  font-size: 0.9rem;
}

.page-link {
  color: #00dc82;
  font-weight: 600;
  text-decoration: none;
}

.page-link:hover {
  text-decoration: underline;
}

.page-number {
  color: #64748b;
}
</style>