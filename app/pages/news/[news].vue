<!-- app/pages/news/[page].vue -->
<template>
  <div class="news-page-container">
    <div class="news-feed">
      <!-- LISTA NOTIZIE -->
      <div v-if="pending" class="loading-state">
        ⚡ Caricamento notizie dal Kernel...
      </div>

      <div v-else-if="stories && stories.length > 0" class="stories-list">
        <div 
          v-for="(story, index) in stories" 
          :key="story.id || index" 
          class="story-card"
        >
          <div class="story-rank">{{ (currentPage - 1) * 30 + index + 1 }}.</div>
          <div class="story-content">
            <a :href="story.url" target="_blank" class="story-title">
              {{ story.title }}
            </a>
            <span v-if="story.domain" class="story-domain">({{ story.domain }})</span>
            <div class="story-meta">
              Inviato da <span class="author">@{{ story.author || 'alexdpl' }}</span> • 
              {{ story.timeAgo || 'di recente' }} • 
              Voti community: {{ story.points || 0 }} PTS
            </div>
          </div>
        </div>
      </div>

      <!-- BARRA DI PAGINAZIONE (PULSANTI IN BASSO) -->
      <div class="pagination-bar">
        <NuxtLink 
          v-if="currentPage > 1" 
          :to="currentPage === 2 ? '/' : `/news/${currentPage - 1}`" 
          class="pag-btn prev"
        >
          ◄ Pagina Precedente
        </NuxtLink>

        <span class="page-indicator">Pagina {{ currentPage }}</span>

        <NuxtLink 
          :to="`/news/${currentPage + 1}`" 
          class="pag-btn next"
        >
          Altre Notizie (Pagina {{ currentPage + 1 }}) ►
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const currentPage = computed(() => Math.max(1, parseInt(route.params.page as string, 10) || 1))

// Fetch dei dati tramite API
const { data: response, pending } = await useAsyncData(`news-page-${currentPage.value}`, () => 
  $fetch(`/api/news/${currentPage.value}`).catch(() => null)
)

const stories = computed(() => response.value?.items || [])
</script>

<style scoped>
.news-page-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.stories-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.story-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.story-rank {
  font-weight: 800;
  color: #00dc82;
  font-size: 1.1rem;
  min-width: 35px;
}

.story-title {
  color: #f8fafc;
  font-weight: 700;
  font-size: 1.05rem;
  text-decoration: none;
}

.story-title:hover {
  color: #38bdf8;
}

.story-domain {
  color: #64748b;
  font-size: 0.85rem;
  margin-left: 0.5rem;
}

.story-meta {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-top: 0.35rem;
}

/* BARRA DI PAGINAZIONE IN BASSO */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #1e293b;
}

.pag-btn {
  background: #090d16;
  border: 1px solid #00dc82;
  color: #00dc82;
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.2s ease;
}

.pag-btn:hover {
  background: #00dc82;
  color: #020420;
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.4);
}

.page-indicator {
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 600;
}
</style>