<!-- components/blog/DkpRelatedPosts.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  currentPostId: number
  category: string
  tags: string[]
}>()

const relatedPosts = ref<any[]>([])
const isLoading = ref(true)

// Simulazione fetch articoli correlati dal DB (Neon)
async function fetchRelated() {
  isLoading.value = true
  try {
    // In produzione chiamerai: await $fetch(`/api/blog/related?id=${props.currentPostId}&cat=${props.category}`)
    // Per ora usiamo dati dummy per vedere il layout
    setTimeout(() => {
      relatedPosts.value = [
        {
          id: 101,
          slug: 'guida-nuxt-4-novita',
          title: 'Nuxt 4: Tutte le novità della nuova major release',
          excerpt: 'Scopri i nuovi pattern architetturali e come migrare da Nuxt 3 in modo indolore.',
          category: 'Cloud Native & DevOps',
          date: '2026-10-10'
        },
        {
          id: 102,
          slug: 'implementare-ollama-locale',
          title: 'AI Locale: Setup di Ollama in 5 minuti',
          excerpt: 'Esegui modelli Llama 3 e Mistral direttamente sulla tua macchina senza costi Cloud.',
          category: 'AI, LLM & Machine Learning',
          date: '2026-10-12'
        }
      ]
      isLoading.value = false
    }, 800)
  } catch (error) {
    console.error("Errore recupero correlati:", error)
    isLoading.value = false
  }
}

onMounted(() => {
  fetchRelated()
})
</script>

<template>
  <div class="dkp-related-section">
    <div class="section-header">
      <h3 class="related-title">🔗 Potrebbe interessarti anche...</h3>
      <span class="related-badge">Selezionati dal Vault</span>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="skeleton-card"></div>
      <div class="skeleton-card hidden-mobile"></div>
    </div>

    <div v-else-if="relatedPosts.length > 0" class="related-grid">
      <NuxtLink 
        v-for="post in relatedPosts" 
        :key="post.id" 
        :to="`/news/${post.slug}`"
        class="related-card"
      >
        <div class="card-meta">
          <span class="card-cat">{{ post.category }}</span>
          <span class="card-date">{{ post.date }}</span>
        </div>
        <h4 class="card-title">{{ post.title }}</h4>
        <p class="card-excerpt">{{ post.excerpt }}</p>
        <div class="card-footer">
          <span class="read-more">Leggi Articolo ➔</span>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="empty-state">
      Nessun articolo correlato trovato per questa categoria.
    </div>
  </div>
</template>

<style scoped>
.dkp-related-section {
  margin: 3rem 0;
  padding-top: 2rem;
  border-top: 1px solid rgba(30, 41, 59, 0.6);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.related-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #f8fafc;
  margin: 0;
}

.related-badge {
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.related-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.25rem;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.25s ease-in-out;
  position: relative;
  overflow: hidden;
}

.related-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00dc82, transparent);
  transform: translateX(-100%);
  transition: transform 0.4s ease;
}

.related-card:hover {
  border-color: rgba(0, 220, 130, 0.4);
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
}

.related-card:hover::before {
  transform: translateX(100%);
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.card-cat { color: #00dc82; }
.card-date { color: #64748b; }

.card-title {
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0;
  line-height: 1.4;
}

.card-excerpt {
  color: #94a3b8;
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0;
  flex-grow: 1;
}

.card-footer {
  margin-top: 0.5rem;
  display: flex;
  justify-content: flex-end;
}

.read-more {
  color: #38bdf8;
  font-size: 0.8rem;
  font-weight: 700;
  transition: color 0.2s;
}

.related-card:hover .read-more {
  color: #00dc82;
}

/* Skeletons */
.loading-state {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.skeleton-card {
  height: 160px;
  background: linear-gradient(90deg, #090d16 25%, #1e293b 50%, #090d16 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 12px;
  border: 1px solid #1e293b;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 768px) {
  .hidden-mobile { display: none; }
}
</style>