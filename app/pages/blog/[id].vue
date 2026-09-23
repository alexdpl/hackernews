<!-- app/pages/blog/[id].vue -->
<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBlog } from '~/composables/useBlog'

const route = useRoute()
const { posts, likePost, incrementView } = useBlog()

const postId = route.params.id as string
const post = computed(() => posts.value.find(p => p.id === postId))

onMounted(() => {
  if (postId) {
    incrementView(postId)
  }
})

function handleLike() {
  if (postId) {
    likePost(postId)
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
  <div class="article-container" v-if="post">
    <div class="article-header">
      <NuxtLink to="/blog" class="back-link">← Torna al DKP Blog</NuxtLink>
      <div class="meta-row">
        <span class="post-cat">{{ post.category }}</span>
        <span class="post-date">📅 {{ post.date }}</span>
        <span class="post-stats">👁️ {{ post.views }} visualizzazioni</span>
      </div>
      <h1>{{ post.title }}</h1>
      <div class="author-box">
        <span>👤 Pubblicato da <strong>{{ post.author }}</strong></span>
      </div>
    </div>

    <div class="article-body">
      <p class="lead">{{ post.excerpt }}</p>
      <div class="content-text">
        {{ post.content }}
      </div>
    </div>

    <!-- Sezione Karma Likes & Social Share -->
    <div class="article-actions-footer">
      <div class="like-section">
        <button @click="handleLike" class="like-btn">
          🔥 Accendi Kernel <span class="like-count">{{ post.likes }}</span>
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

  <div v-else class="not-found">
    <h2>Articolo non trovato</h2>
    <p>L'articolo richiesto non esiste o è stato rimosso dal kernel.</p>
    <NuxtLink to="/blog" class="back-link">Torna al Blog</NuxtLink>
  </div>
</template>

<style scoped>
.article-container { max-width: 800px; margin: 3rem auto; padding: 0 1.5rem; color: #020420; }
.article-header { margin-bottom: 2.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 2rem; }
.back-link { color: #00a862; text-decoration: none; font-weight: 600; font-size: 0.9rem; display: inline-block; margin-bottom: 1.5rem; }
.back-link:hover { text-decoration: underline; }
.meta-row { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; }
.post-cat { background: #020420; color: #00dc82; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.85rem; font-weight: 700; }
.post-date, .post-stats { color: #64748b; font-size: 0.85rem; }
.article-header h1 { font-size: 2.3rem; font-weight: 800; color: #020420; line-height: 1.2; margin-bottom: 1rem; }
.author-box { color: #475569; font-size: 0.9rem; }
.article-body { font-size: 1.1rem; line-height: 1.8; color: #334155; margin-bottom: 3rem; }
.lead { font-weight: 600; color: #020420; font-size: 1.2rem; margin-bottom: 1.5rem; }
.content-text { white-space: pre-line; }

/* Actions Footer */
.article-actions-footer { background: #020420; border: 1px solid #1e293b; border-radius: 12px; padding: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: gap; gap: 1.5rem; color: #ffffff; }
.like-section { display: flex; flex-direction: column; gap: 0.4rem; }
.like-btn { background: #00dc82; color: #020420; border: none; padding: 0.7rem 1.2rem; border-radius: 8px; font-weight: 800; font-size: 1rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: transform 0.2s; }
.like-btn:hover { transform: scale(1.05); }
.like-count { background: #020420; color: #00dc82; padding: 0.1rem 0.5rem; border-radius: 4px; font-size: 0.9rem; }
.like-tip { color: #94a3b8; font-size: 0.8rem; }
.share-section { display: flex; flex-direction: column; gap: 0.4rem; align-items: flex-end; }
.share-label { color: #94a3b8; font-size: 0.85rem; font-weight: 600; }
.linkedin-share-btn { background: #0a66c2; color: #ffffff; padding: 0.7rem 1.2rem; border-radius: 8px; font-weight: 700; font-size: 0.9rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; transition: opacity 0.2s; }
.linkedin-share-btn:hover { opacity: 0.9; }

@media (max-width: 650px) {
  .article-actions-footer { flex-direction: column; align-items: stretch; text-align: center; }
  .share-section { align-items: stretch; }
  .linkedin-share-btn { justify-content: center; }
  .like-btn { justify-content: center; }
}

.not-found { text-align: center; padding: 5rem 1.5rem; }
.not-found h2 { font-size: 1.8rem; color: #020420; margin-bottom: 0.5rem; }
.not-found p { color: #64748b; margin-bottom: 1.5rem; }
</style>