<!-- app/pages/newest/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

// 1. Recupero notizie del crawler (Pagina 1, limite 15, ordinamento 'newest')
const { data: responseData, pending } = await useFetch('/api/posts', {
  query: { type: 'newest', page: 1, limit: 15 }
})

// Estrazione corretta dell'array di post e paginazione
const postsList = computed(() => responseData.value?.data || [])
const hasMore = computed(() => responseData.value?.pagination?.hasMore || false)

// Helper nativo HN per pulire gli URL (evita crash se l'URL è assente o malformato)
function getDomain(url?: string | null) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return null
  }
}

// 2. Recupero articoli interni in evidenza per la sezione Vault
const featuredArticles = ref<any[]>([])

onMounted(async () => {
  try {
    const res: any = await $fetch('/api/blog/posts')
    const raw = res?.success ? res.data : (Array.isArray(res) ? res : [])
    // Prendiamo i primi 2 articoli di punta del tuo blog interno
    featuredArticles.value = raw.slice(0, 2)
  } catch (err) {
    console.error('Errore recupero articoli in evidenza:', err)
  }
})

useSeoMeta({
  title: 'Nuove Pubblicazioni - DevKernelPulse',
  description: 'Le ultime notizie tech, di programmazione e gli approfondimenti dal Vault di DevKernelPulse in ordine cronologico.'
})
</script>

<template>
  <div class="news-container">
    <div class="news-header-box">
      <h1>📰 Nuove Pubblicazioni (Newest)</h1>
      <p class="news-subtitle">Le notizie più recenti dalla community e dall'ecosistema tech.</p>
    </div>

    <div v-if="pending" class="loading-msg text-slate-400 mb-6">
      Sincronizzazione feed in corso...
    </div>

    <!-- 🟢 Feed Principale delle Notizie (Logica Nativa HN) -->
    <div v-else-if="postsList.length > 0" class="posts-list">
      <div v-for="(post, index) in postsList" :key="post.id" class="post-item">
        <span class="post-index">{{ index + 1 }}.</span>
        <div class="post-content">
          
          <div class="post-heading">
            <!-- Gestione Ibrida: Link esterno o Link interno se è un post testuale -->
            <a v-if="post.url" :href="post.url" target="_blank" rel="noopener noreferrer" class="post-title">
              {{ post.title }}
            </a>
            <NuxtLink v-else :to="`/item/${post.id}`" class="post-title">
              {{ post.title }}
            </NuxtLink>
            
            <span v-if="getDomain(post.url)" class="post-domain">({{ getDomain(post.url) }})</span>
          </div>

          <div class="post-meta">
            <span>{{ post.points || 0 }} punti</span> • 
            <span>da <strong>{{ post.author || 'Anonimo' }}</strong></span> • 
            <span>{{ new Date(post.createdAt || post.date).toLocaleDateString('it-IT') }}</span> • 
            <NuxtLink :to="`/item/${post.id}`" class="comments-link">
              {{ post.commentsCount || 0 }} commenti
            </NuxtLink>
          </div>
        </div>
      </div>
      
      <!-- Tasto per passare alla pagina 2 della paginazione -->
      <div v-if="hasMore" class="mt-6 flex justify-center">
        <NuxtLink to="/newest/2" class="more-btn">
          Vedi altre notizie ➔
        </NuxtLink>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <p>Nessun post recente trovato nel Tech News Feed.</p>
    </div>

    <!-- 🟢 SEZIONE AGGIUNTIVA: ARTICOLI CONSIGLIATI DAL VAULT -->
    <div v-if="featuredArticles.length > 0" class="vault-recommended-section">
      <h3 class="recommended-title">🔗 Consigliati dal Vault DKP</h3>
      <div class="recommended-grid">
        <NuxtLink 
          v-for="art in featuredArticles" 
          :key="art.id" 
          :to="`/blog/${art.slug || art.id}`"
          class="recommended-card"
        >
          <span class="rec-cat">{{ art.categoryName || art.category || 'Tech' }}</span>
          <h4>{{ art.title }}</h4>
          <p>{{ art.excerpt || art.summary || 'Approfondimento tecnico verificato.' }}</p>
          <span class="rec-read">Leggi articolo ➔</span>
        </NuxtLink>
      </div>
    </div>
    
    <!-- 🟢 BANNER DKP ADS STRIP -->
    <DkpAdStrip categoryTag="DKP NEWS SPONSORED FEED" />
  </div>
</template>

<style scoped>
.news-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.news-header-box {
  margin-bottom: 2rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 1rem;
}
.news-container h1 {
  font-size: 1.8rem;
  font-weight: 800;
  color: #020420;
  margin-bottom: 0.25rem;
}
.news-subtitle {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0;
}
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 3rem;
}
.post-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}
.post-index {
  font-weight: 600;
  color: #64748b;
  min-width: 24px;
  text-align: right;
}
.post-content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.post-heading {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.post-title {
  font-weight: 600;
  color: #020420;
  text-decoration: none;
  font-size: 0.95rem;
}
.post-title:hover {
  text-decoration: underline;
  color: #00dc82;
}
.post-domain {
  font-size: 0.8rem;
  color: #64748b;
}
.post-meta {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.1rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.comments-link {
  color: #64748b;
  text-decoration: none;
  font-weight: 600;
}
.comments-link:hover {
  text-decoration: underline;
  color: #00dc82;
}
.empty-state {
  color: #64748b;
  text-align: center;
  padding: 2rem;
}
.more-btn {
  background: #090d16;
  color: #00dc82;
  border: 1px solid #1e293b;
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  font-weight: bold;
  text-decoration: none;
  transition: all 0.2s;
}
.more-btn:hover {
  border-color: #00dc82;
  background: rgba(0, 220, 130, 0.1);
}

/* Stili per la sezione correlati/consigliati nel feed */
.vault-recommended-section {
  margin: 3rem 0;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}
.recommended-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #020420;
  margin-bottom: 1rem;
}
.recommended-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}
.recommended-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 1.2rem;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: transform 0.2s, border-color 0.2s;
}
.recommended-card:hover {
  transform: translateY(-2px);
  border-color: #00dc82;
}
.rec-cat {
  font-size: 0.65rem;
  font-weight: 800;
  color: #00dc82;
  text-transform: uppercase;
}
.recommended-card h4 {
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
}
.recommended-card p {
  color: #94a3b8;
  font-size: 0.8rem;
  margin: 0;
  line-height: 1.4;
  flex-grow: 1;
}
.rec-read {
  color: #38bdf8;
  font-size: 0.75rem;
  font-weight: 700;
  margin-top: 0.5rem;
}
</style>