<!-- app/pages/index.vue -->
<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const page = computed(() => Number(route.query.page) || 1)

// Eseguiamo il fetch dell'API notizie
const { data: stories, pending, error } = await useFetch('/api/news', {
  query: { page },
  watch: [page]
})
</script>

<template>
  <div class="home-container">
    <div v-if="pending" class="loading-state">
      ⚡ Caricamento notizie DevKernelPulse...
    </div>

    <div v-else class="news-list">
      <article 
        v-for="(item, index) in stories" 
        :key="item.id || index" 
        class="news-item"
      >
        <span class="news-number">{{ (page - 1) * 30 + index + 1 }}.</span>
        
        <div class="news-content">
          <h2 class="news-title">
            <a 
              :href="item.url || `/story/${item.id}`" 
              :target="item.url?.startsWith('http') ? '_blank' : '_self'"
              class="story-link"
            >
              {{ item.title }}
            </a>
            <span v-if="item.domain" class="story-domain">({{ item.domain }})</span>
          </h2>

          <div class="news-meta">
            <span>{{ item.points || 1 }} punti</span>
            <span class="meta-sep">•</span>
            <span>da <a :href="`/user/${item.user}`" class="meta-link">{{ item.user || 'alexdpl' }}</a></span>
            <span class="meta-sep">•</span>
            <span>{{ item.time_ago || 'di recente' }}</span>
            <span class="meta-sep">•</span>
            <NuxtLink :to="`/story/${item.id}`" class="comments-link">
              💬 {{ item.comments_count || 0 }} commenti
            </NuxtLink>
          </div>
        </div>
      </article>

      <!-- Paginazione -->
      <div class="pagination">
        <NuxtLink v-if="page > 1" :to="`/?page=${page - 1}`" class="page-btn">← Precedente</NuxtLink>
        <span class="page-current">Pagina {{ page }}</span>
        <NuxtLink :to="`/?page=${page + 1}`" class="page-btn">Successiva →</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1100px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.loading-state {
  text-align: center;
  color: #00dc82;
  font-weight: 700;
  padding: 3rem 0;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.news-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: #090d16;
  padding: 1.1rem 1.25rem;
  border-radius: 8px;
  border: 1px solid #1e293b;
  transition: border-color 0.2s, transform 0.15s;
}

.news-item:hover {
  border-color: rgba(0, 220, 130, 0.4);
  transform: translateX(2px);
}

.news-number {
  color: #64748b;
  font-weight: 700;
  font-size: 0.95rem;
  min-width: 25px;
  margin-top: 2px;
}

.news-content {
  flex: 1;
}

/* Palette Link: Azzurro DKP -> Verde Neon */
.story-link {
  color: #38bdf8 !important;
  text-decoration: none;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.4;
  transition: color 0.2s;
}

.story-link:hover {
  color: #00dc82 !important;
  text-decoration: underline;
}

.story-domain {
  color: #64748b;
  font-size: 0.85rem;
  margin-left: 0.5rem;
  font-weight: 400;
}

.news-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #94a3b8;
  margin-top: 0.45rem;
  flex-wrap: wrap;
}

.meta-sep {
  color: #334155;
}

.meta-link,
.comments-link {
  color: #38bdf8 !important;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.meta-link:hover,
.comments-link:hover {
  color: #00dc82 !important;
  text-decoration: underline;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin-top: 2.5rem;
}

.page-btn {
  background: #090d16;
  color: #38bdf8;
  border: 1px solid #1e293b;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.page-btn:hover {
  border-color: #00dc82;
  color: #00dc82;
}

.page-current {
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 600;
}
</style>