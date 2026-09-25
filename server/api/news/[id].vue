<!-- app/pages/news/[id].vue -->
<script setup lang="ts">
import { ref } from 'vue'

const route = useRoute()
const id = computed(() => route.params.id)

const { currentUser, isAuthenticated } = useAuthCore()

// Fetch dinamico della storia
const { data: story, pending, error } = await useFetch(`/api/news/${id.value}`)

// Form Inserimento Nuovo Commento
const newCommentText = ref('')
const isSubmittingComment = ref(false)

function submitComment() {
  if (!newCommentText.value.trim()) return
  isSubmittingComment.value = true
  
  setTimeout(() => {
    if (story.value && story.value.comments) {
      story.value.comments.unshift({
        id: Date.now(),
        user: currentUser.value?.username || 'alexdpl',
        time_ago: 'Adesso',
        text: newCommentText.value.trim()
      })
      story.value.comments_count = story.value.comments.length
    }
    newCommentText.value = ''
    isSubmittingComment.value = false
  }, 400)
}
</script>

<template>
  <div class="news-detail-container">
    <div v-if="pending" class="loading-state">
      ⚡ Caricamento storia #{{ id }}...
    </div>

    <div v-else-if="error || !story" class="error-state">
      <h2>⚠️ Impossibile caricare la notizia</h2>
      <NuxtLink to="/feed" class="back-link">← Torna al Feed</NuxtLink>
    </div>

    <div v-else class="story-wrapper">
      <!-- Dettaglio Notizia -->
      <article class="story-main-card">
        <h1 class="story-title">
          <a :href="story.url" target="_blank" class="title-link">{{ story.title }}</a>
          <span v-if="story.domain" class="story-domain">({{ story.domain }})</span>
        </h1>

        <div class="story-meta">
          <span>🔥 {{ story.points }} punti</span> • 
          <span>inviato da <NuxtLink :to="`/user/${story.user}`" class="meta-link">@{{ story.user }}</NuxtLink></span> • 
          <span>{{ story.time_ago }}</span>
        </div>

        <p v-if="story.content" class="story-description">
          {{ story.content }}
        </p>
      </article>

      <!-- Form Commenti -->
      <section class="comments-section">
        <h3>💬 Commenti ({{ story.comments_count || 0 }})</h3>

        <!-- Input se loggato -->
        <div v-if="isAuthenticated" class="comment-box">
          <textarea 
            v-model="newCommentText" 
            rows="3" 
            placeholder="Aggiungi il tuo commento alla discussione..."
            class="comment-input"
          ></textarea>
          <button @click="submitComment" :disabled="isSubmittingComment" class="send-comment-btn">
            {{ isSubmittingComment ? 'Invio...' : 'Pubblica Commento' }}
          </button>
        </div>

        <div v-else class="login-prompt">
          <NuxtLink to="/login" class="login-link">Accedi</NuxtLink> per partecipare alla discussione.
        </div>

        <!-- Lista Commenti -->
        <div class="comments-list">
          <div v-for="c in story.comments" :key="c.id" class="comment-card">
            <div class="comment-header">
              <NuxtLink :to="`/user/${c.user}`" class="comment-author">@{{ c.user }}</NuxtLink>
              <span class="comment-time">{{ c.time_ago }}</span>
            </div>
            <p class="comment-body">{{ c.text }}</p>
          </div>
        </div>
      </section>

      <NuxtLink to="/feed" class="back-link">← Torna al Feed Notizie</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.news-detail-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
  color: #f8fafc;
}

.loading-state, .error-state {
  text-align: center;
  padding: 3rem;
  color: #00dc82;
  font-weight: 700;
}

.story-main-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.75rem;
  margin-bottom: 2rem;
}

.story-title {
  font-size: 1.4rem;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
}

.title-link {
  color: #38bdf8;
  text-decoration: none;
}

.title-link:hover {
  color: #00dc82;
  text-decoration: underline;
}

.story-domain {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 400;
  margin-left: 0.5rem;
}

.story-meta {
  color: #94a3b8;
  font-size: 0.85rem;
}

.meta-link {
  color: #38bdf8;
  text-decoration: none;
  font-weight: 600;
}

.meta-link:hover { color: #00dc82; }

.story-description {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #1e293b;
  color: #cbd5e1;
  font-size: 0.95rem;
  line-height: 1.6;
}

.comments-section h3 {
  font-size: 1.15rem;
  margin-bottom: 1rem;
}

.comment-box {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.comment-input {
  background: #020420;
  border: 1px solid #1e293b;
  color: #fff;
  padding: 0.8rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.comment-input:focus {
  outline: none;
  border-color: #00dc82;
}

.send-comment-btn {
  align-self: flex-start;
  background: #00dc82;
  color: #020420;
  font-weight: 800;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  cursor: pointer;
}

.login-prompt {
  background: #090d16;
  border: 1px solid #1e293b;
  padding: 1rem;
  border-radius: 8px;
  color: #94a3b8;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.login-link { color: #38bdf8; font-weight: 700; }

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.comment-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 1rem;
}

.comment-header {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.4rem;
}

.comment-author {
  color: #38bdf8;
  font-weight: 700;
  text-decoration: none;
  font-size: 0.85rem;
}

.comment-time { color: #64748b; font-size: 0.75rem; }
.comment-body { margin: 0; color: #cbd5e1; font-size: 0.9rem; line-height: 1.5; }

.back-link {
  color: #00dc82;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.9rem;
}

.back-link:hover { text-decoration: underline; }
</style>