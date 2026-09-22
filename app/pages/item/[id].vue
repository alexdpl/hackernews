<!-- app/pages/item/[id].vue -->
<script setup lang="ts">
import { ref } from 'vue'

const route = useRoute()
const postId = route.params.id

// Recupera i dettagli del post dal database Neon
const { data: postData, pending: postPending } = await useFetch(`/api/posts/${postId}`)
const post = computed(() => postData.value?.post || postData.value)

// Recupera i commenti locali
const { data: commentsData, refresh: refreshComments } = await useFetch(`/api/comments?postId=${postId}`)
const comments = computed(() => commentsData.value?.comments || [])

// Stato utente corrente
const { data: authData } = await useFetch('/api/auth/me')
const currentUser = computed(() => authData.value?.username || null)

// Nuovo commento
const newCommentText = ref('')
const submitting = ref(false)

async function submitComment() {
  if (!newCommentText.value.trim() || submitting.value) return
  submitting.value = true
  try {
    const res: any = await $fetch('/api/comments', {
      method: 'POST',
      body: {
        postId: Number(postId),
        text: newCommentText.value
      }
    })
    if (res.success) {
      newCommentText.value = ''
      await refreshComments()
    } else {
      alert(res.error || 'Errore nell invio del commento')
    }
  } catch (err) {
    console.error(err)
    alert('Errore di connessione')
  } finally {
    submitting.value = false
  }
}

useSeoMeta({
  title: computed(() => post.value ? `${post.value.title} - DevKernelPulse` : 'Dettaglio Post - DevKernelPulse')
})
</script>

<template>
  <div class="item-detail-container">
    <div v-if="postPending" class="state-msg">Caricamento post in corso...</div>
    
    <div v-else-if="!post" class="state-msg error">Post non trovato o rimosso.</div>

    <div v-else class="post-content-card">
      <div class="post-header-line">
        <a v-if="post.url" :href="post.url" target="_blank" rel="noopener noreferrer" class="main-title">
          {{ post.title }}
        </a>
        <h1 v-else class="main-title">{{ post.title }}</h1>
      </div>

      <div class="post-submeta">
        <span>{{ post.points || 1 }} punti</span>
        <span>•</span>
        <span>da <NuxtLink :to="`/user/${post.author}`" class="author-link">{{ post.author || 'Anonimo' }}</NuxtLink></span>
        <span>•</span>
        <span>{{ post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'recentemente' }}</span>
      </div>

      <div v-if="post.text" class="post-body-text">
        {{ post.text }}
      </div>
    </div>

    <!-- Sezione Commenti Locali -->
    <div class="comments-section">
      <h3>Discussione ({{ comments.length }})</h3>

      <!-- Form inserimento commento -->
      <div v-if="currentUser" class="comment-form-box">
        <p class="logged-as">Commenta come <span class="highlight">{{ currentUser }}</span>:</p>
        <textarea v-model="newCommentText" rows="3" class="comment-textarea" placeholder="Scrivi un commento tecnico..."></textarea>
        <button @click="submitComment" :disabled="submitting" class="comment-submit-btn">
          {{ submitting ? 'Invio in corso...' : 'Aggiungi Commento' }}
        </button>
      </div>
      <div v-else class="login-prompt">
        Devi effettuare il <NuxtLink to="/login" class="login-link">Login</NuxtLink> per partecipare alla discussione.
      </div>

      <!-- Lista Commenti -->
      <div class="comments-list">
        <div v-for="c in comments" :key="c.id" class="comment-card">
          <div class="comment-meta">
            <NuxtLink :to="`/user/${c.author}`" class="comment-author">{{ c.author }}</NuxtLink>
            <span class="comment-time">{{ new Date(c.createdAt).toLocaleString('it-IT') }}</span>
          </div>
          <div class="comment-text">{{ c.text }}</div>
        </div>

        <div v-if="comments.length === 0" class="no-comments">
          Nessun commento presente. Sii il primo a commentare!
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.item-detail-container {
  max-width: 800px;
  margin: 1.5rem auto;
  padding: 0 1rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.state-msg {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.state-msg.error {
  color: #ef4444;
}

.post-content-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.main-title {
  font-size: 1.3rem;
  color: #020420;
  text-decoration: none;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  display: block;
}

.main-title:hover {
  color: #00dc82;
}

.post-submeta {
  font-size: 0.85rem;
  color: #64748b;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.author-link {
  color: #020420;
  font-weight: 600;
  text-decoration: none;
}

.author-link:hover {
  color: #00dc82;
  text-decoration: underline;
}

.post-body-text {
  margin-top: 1rem;
  color: #334155;
  font-size: 0.95rem;
  line-height: 1.5;
}

.comments-section h3 {
  font-size: 1.2rem;
  color: #020420;
  margin-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.4rem;
}

.comment-form-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.logged-as {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.highlight {
  color: #00dc82;
  background: #020420;
  padding: 0.05rem 0.3rem;
  border-radius: 3px;
}

.comment-textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.6rem;
  font-size: 0.95rem;
  color: #020420;
  resize: vertical;
}

.comment-textarea:focus {
  outline: none;
  border-color: #00dc82;
}

.comment-submit-btn {
  margin-top: 0.5rem;
  background: #00dc82;
  color: #020420;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
}

.login-prompt {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.login-link {
  color: #00dc82;
  font-weight: 600;
  text-decoration: underline;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  border-radius: 6px;
}

.comment-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 0.4rem;
}

.comment-author {
  font-weight: 600;
  color: #020420;
  text-decoration: none;
}

.comment-author:hover {
  color: #00dc82;
  text-decoration: underline;
}

.comment-text {
  color: #334155;
  font-size: 0.9rem;
  line-height: 1.4;
  white-space: pre-wrap;
}

.no-comments {
  color: #64748b;
  font-size: 0.9rem;
  font-style: italic;
  text-align: center;
  padding: 1.5rem 0;
}
</style>