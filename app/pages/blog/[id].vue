<!-- app/pages/blog/[id].vue -->
<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBlog } from '~/composables/useBlog'

const route = useRoute()
const { posts, likePost, incrementView } = useBlog()

const postId = route.params.id as string

// 1. Fetch diretto dall'API Neon (Server Side & Client Hydration)
const { data: apiPost, pending, error } = await useFetch(`/api/posts/${postId}`)

// 2. Computed che unisce il post dall'API o dal composable locale
const post = computed(() => {
  if (apiPost.value) return apiPost.value
  return posts.value.find(p => String(p.id) === postId || p.slug === postId)
})

onMounted(() => {
  if (postId) {
    incrementView(postId)
  }
})

function handleLike() {
  if (post.value?.id) {
    likePost(String(post.value.id))
  }
}

const currentUrl = computed(() => {
  if (typeof window !== 'undefined') return window.location.href
  return ''
})

const linkedinShareUrl = computed(() => {
  if (!post.value) return '#'
  const text = encodeURIComponent(`${post.value.title} - Leggi sul DKP Blog`)
  const url = encodeURIComponent(currentUrl.value)
  return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
})
</script>

<template>
  <div class="article-page-wrapper">
    <!-- State: Loading -->
    <div v-if="pending" class="loading-state">
      <div class="spinner">⚡</div>
      <p>Caricamento articolo dal Kernel in corso...</p>
    </div>

    <!-- State: Post Trovato -->
    <div class="article-container" v-else-if="post">
      <div class="article-header">
        <NuxtLink to="/blog" class="back-link">← Torna al DKP Blog</NuxtLink>
        
        <div class="meta-row">
          <span class="post-cat">{{ post.category || 'Generale' }}</span>
          <span class="post-date">📅 {{ post.date || post.createdAt?.slice(0, 10) }}</span>
          <span class="post-stats">👁️ {{ post.views || 0 }} visualizzazioni</span>
        </div>

        <h1>{{ post.title }}</h1>

        <div class="author-box">
          <span>👤 Pubblicato da <strong>{{ post.author || 'DevKernelPulse Team' }}</strong></span>
        </div>
      </div>

      <div class="article-body">
        <p v-if="post.excerpt" class="lead">{{ post.excerpt }}</p>
        
        <!-- Renderizza sia HTML che testo formattato -->
        <div 
          class="content-text" 
          v-html="post.content || post.description || 'Nessun contenuto dettagliato disponibile.'"
        ></div>
      </div>

      <!-- Sezione Karma Likes & Social Share -->
      <div class="article-actions-footer">
        <div class="like-section">
          <button @click="handleLike" class="like-btn" type="button">
            🔥 Accendi Kernel <span class="like-count">{{ post.likes || 0 }}</span>
          </button>
          <span class="like-tip">Premi per premiare questo articolo con Karma!</span>
        </div>

        <div class="share-section">
          <span class="share-label">Condividi sui Social:</span>
          <a :href="linkedinShareUrl" target="_blank" rel="noopener noreferrer" class="linkedin-share-btn">
            💼 Condividi su LinkedIn
          </a>
        </div>
      </div>
    </div>

    <!-- State: Not Found -->
    <div v-else class="not-found">
      <h2>⚠️ Articolo non trovato</h2>
      <p>L'articolo richiesto non esiste o è stato rimosso dal kernel.</p>
      <NuxtLink to="/blog" class="back-link">← Torna al Blog</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.article-page-wrapper {
  min-height: 80vh;
  padding: 2rem 1rem;
}

.article-container {
  max-width: 850px;
  margin: 1rem auto 4rem auto;
  padding: 2.5rem;
  background: #0b0f19;
  border: 1px solid #1e293b;
  border-radius: 16px;
  color: #e2e8f0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.article-header {
  margin-bottom: 2.5rem;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 2rem;
}

.back-link {
  color: #38bdf8;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  display: inline-block;
  margin-bottom: 1.5rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: #00dc82;
  text-decoration: underline;
}

.meta-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
}

.post-cat {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
}

.post-date, .post-stats {
  color: #94a3b8;
  font-size: 0.85rem;
}

.article-header h1 {
  font-size: 2.4rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.25;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.author-box {
  color: #94a3b8;
  font-size: 0.95rem;
}

.author-box strong {
  color: #00dc82;
}

.article-body {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #cbd5e1;
  margin-bottom: 3rem;
}

.lead {
  font-weight: 600;
  color: #38bdf8;
  font-size: 1.25rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  padding-left: 1rem;
  border-left: 3px solid #38bdf8;
}

.content-text {
  white-space: pre-line;
  word-break: break-word;
}

/* Actions Footer */
.article-actions-footer {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.75rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  color: #ffffff;
}

.like-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.like-btn {
  background: #00dc82;
  color: #020420;
  border: none;
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s, background 0.2s;
}

.like-btn:hover {
  transform: translateY(-2px);
  background: #05f08f;
}

.like-count {
  background: #020420;
  color: #00dc82;
  padding: 0.1rem 0.6rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.like-tip {
  color: #94a3b8;
  font-size: 0.8rem;
}

.share-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  align-items: flex-end;
}

.share-label {
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 600;
}

.linkedin-share-btn {
  background: #0a66c2;
  color: #ffffff;
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: opacity 0.2s;
}

.linkedin-share-btn:hover {
  opacity: 0.9;
}

.loading-state, .not-found {
  text-align: center;
  padding: 6rem 1.5rem;
  color: #94a3b8;
}

.loading-state .spinner {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

.not-found h2 {
  font-size: 2rem;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.not-found p {
  color: #94a3b8;
  margin-bottom: 1.5rem;
}

@media (max-width: 650px) {
  .article-container {
    padding: 1.5rem;
  }
  .article-header h1 {
    font-size: 1.8rem;
  }
  .article-actions-footer {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  .share-section {
    align-items: stretch;
  }
  .linkedin-share-btn, .like-btn {
    justify-content: center;
  }
}
</style>