<!-- app/pages/item/[id].vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

interface Comment {
  id: number
  author?: string
  text: string
  createdAt: string | Date
}

interface Item {
  id: number
  title: string
  url?: string | null
  domain?: string | null
  points?: number
  author?: string
  createdAt: string | Date
  description?: string | null
  text?: string | null
}

const route = useRoute()
const router = useRouter()
const itemId = Number(route.params.id)

// 1. Recupero dati post
const { data, pending, error, refresh } = await useFetch<any>(`/api/item/${itemId}`)
const item = computed<Item | null>(() => {
  if (!data.value) return null
  return data.value.data || data.value.post || data.value
})

// 2. Recupero commenti locali
const { data: commentsData, refresh: refreshComments } = await useFetch(`/api/comments?postId=${itemId}`)
const comments = computed<Comment[]>(() => commentsData.value?.comments || [])

// 3. Stato utente corrente (Auth)
const { data: authData } = await useFetch('/api/auth/me')
const currentUser = computed(() => authData.value?.username || null)
const isAdmin = computed(() => currentUser.value === 'alexdpl')

// Form inserimento commento
const commentText = ref('')
const isSubmitting = ref(false)
const submitError = ref('')
const submitSuccess = ref('')

async function handleCommentSubmit() {
  if (!commentText.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  submitError.value = ''
  submitSuccess.value = ''

  try {
    const res: any = await $fetch('/api/comments', {
      method: 'POST',
      body: {
        postId: itemId,
        text: commentText.value.trim()
      }
    })

    if (res.success) {
      submitSuccess.value = 'Commento inviato con successo!'
      commentText.value = ''
      await refreshComments()
    } else {
      submitError.value = res.error || 'Impossibile pubblicare il commento.'
    }
  } catch (err: any) {
    console.error('Errore invio commento:', err)
    submitError.value = 'Impossibile pubblicare il commento.'
  } finally {
    isSubmitting.value = false
  }
}

// Funzioni di moderazione Admin
async function deletePost() {
  if (!confirm('Sei sicuro di voler eliminare questo post e tutti i suoi commenti?')) return
  try {
    const res: any = await $fetch('/api/admin/delete-item', {
      method: 'POST',
      body: { id: itemId, type: 'post' }
    })
    if (res.success) {
      router.push('/')
    } else {
      alert(res.error || 'Errore durante eliminazione')
    }
  } catch (err) {
    console.error(err)
    alert('Errore di connessione')
  }
}

async function deleteComment(commentId: number) {
  if (!confirm('Vuoi eliminare questo commento?')) return
  try {
    const res: any = await $fetch('/api/admin/delete-item', {
      method: 'POST',
      body: { id: commentId, type: 'comment' }
    })
    if (res.success) {
      await refreshComments()
    } else {
      alert(res.error || 'Errore eliminazione commento')
    }
  } catch (err) {
    console.error(err)
    alert('Errore di connessione')
  }
}
</script>

<template>
  <div class="item-page-container">
    <div v-if="pending" class="loading-state">
      <p>Caricamento discussione in corso...</p>
    </div>

    <div v-else-if="error || !item" class="error-state">
      <h2>Post non trovato o errore di connessione.</h2>
      <NuxtLink to="/" class="back-link">← Torna alla Home</NuxtLink>
    </div>

    <div v-else class="item-content">
      <!-- 1. Header Post & Moderazione Admin -->
      <section class="item-header">
        <div class="title-row">
          <h1 class="item-title">
            <a v-if="item.url" :href="item.url" target="_blank" rel="noopener noreferrer" class="title-link">
              {{ item.title }} ↗
            </a>
            <span v-else>{{ item.title }}</span>
            <span v-if="item.domain" class="item-domain">({{ item.domain }})</span>
          </h1>
          
          <!-- Pulsante Elimina Post (Visibile solo per alexdpl) -->
          <button v-if="isAdmin" @click="deletePost" class="admin-delete-btn" title="Elimina post">
            🗑️ Elimina Post
          </button>
        </div>

        <div class="item-meta">
          <span>{{ item.points || 0 }} punti</span>
          <span class="dot">•</span>
          <span>pubblicato il {{ new Date(item.createdAt).toLocaleDateString('it-IT') }}</span>
          <span v-if="item.author"> da <NuxtLink :to="`/user/${item.author}`" class="author-link"><strong>{{ item.author }}</strong></NuxtLink></span>
        </div>

        <p v-if="item.description || item.text" class="item-description">
          {{ item.description || item.text }}
        </p>
      </section>

      <hr class="divider" />

      <!-- 2. Form per inviare un nuovo commento -->
      <section class="comment-box-section">
        <h3>Aggiungi un Commento</h3>

        <div v-if="submitSuccess" class="banner success-banner">{{ submitSuccess }}</div>
        <div v-if="submitError" class="banner error-banner">{{ submitError }}</div>

        <div v-if="currentUser" class="comment-form-box">
          <p class="logged-as">Commenta come <span class="highlight">{{ currentUser }}</span>:</p>
          <textarea
            v-model="commentText"
            rows="3"
            required
            placeholder="Scrivi qui il tuo commento tecnico..."
            class="comment-textarea"
          ></textarea>
          <button
            type="button"
            @click="handleCommentSubmit"
            class="submit-btn"
            :disabled="isSubmitting || !commentText.trim()"
          >
            {{ isSubmitting ? 'Invio in corso...' : 'Invia Commento' }}
          </button>
        </div>

        <div v-else class="login-prompt">
          Devi effettuare il <NuxtLink to="/login" class="login-link">Login</NuxtLink> per partecipare alla discussione.
        </div>
      </section>

      <hr class="divider" />

      <!-- 3. Lista dei commenti ricevuti con pulsante eliminazione admin -->
      <section class="comments-list-section">
        <h3>Discussione ({{ comments.length }})</h3>

        <div v-if="comments.length === 0" class="no-comments">
          Nessun commento ancora presente. Sii il primo a commentare!
        </div>

        <div v-else class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-card">
            <div class="comment-meta-row">
              <div class="comment-meta">
                <NuxtLink :to="`/user/${comment.author}`" class="comment-author"><strong>{{ comment.author || 'Anonimo' }}</strong></NuxtLink>
                <span class="comment-date">• {{ new Date(comment.createdAt).toLocaleDateString('it-IT') }}</span>
              </div>
              
              <!-- Pulsante Elimina Commento (Visibile solo per alexdpl) -->
              <button v-if="isAdmin" @click="deleteComment(comment.id)" class="comment-delete-btn" title="Elimina commento">
                🗑️ Rimuovi
              </button>
            </div>
            
            <div class="comment-body">
              {{ comment.text }}
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.item-page-container {
  max-width: 850px;
  margin: 1.5rem auto;
  padding: 1.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.item-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #020420;
  line-height: 1.3;
  margin: 0;
}

.title-link {
  color: #020420;
  text-decoration: none;
}

.title-link:hover {
  color: #00dc82;
  text-decoration: underline;
}

.item-domain {
  font-size: 0.85rem;
  font-weight: normal;
  color: #64748b;
  margin-left: 0.5rem;
}

.admin-delete-btn {
  background: #ffeeef;
  color: #ef4444;
  border: 1px solid #fecaca;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.admin-delete-btn:hover {
  background: #ef4444;
  color: #ffffff;
}

.item-meta {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.author-link {
  color: #020420;
  text-decoration: none;
}
.author-link:hover {
  color: #00dc82;
  text-decoration: underline;
}

.item-description {
  margin-top: 1rem;
  padding: 0.8rem 1rem;
  background: #f8fafc;
  border-left: 4px solid #00dc82;
  font-size: 0.95rem;
  color: #334155;
}

.divider {
  border: 0;
  height: 1px;
  background: #e2e8f0;
  margin: 1.5rem 0;
}

.comment-box-section h3, .comments-list-section h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #020420;
  margin-bottom: 0.8rem;
}

.comment-form-box {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
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
  padding: 0.7rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.9rem;
  box-sizing: border-box;
  color: #020420;
}

.comment-textarea:focus {
  outline: 2px solid #00dc82;
  border-color: transparent;
}

.submit-btn {
  margin-top: 0.6rem;
  background-color: #020420;
  color: #00dc82;
  border: none;
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  font-size: 0.9rem;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-prompt {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  color: #64748b;
  font-size: 0.9rem;
}

.login-link {
  color: #00dc82;
  font-weight: 600;
  text-decoration: underline;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.comment-card {
  padding: 0.9rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.comment-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}

.comment-meta {
  font-size: 0.8rem;
  color: #475569;
}

.comment-author {
  color: #020420;
  text-decoration: none;
}
.comment-author:hover {
  color: #00dc82;
  text-decoration: underline;
}

.comment-date {
  color: #94a3b8;
  margin-left: 0.3rem;
}

.comment-delete-btn {
  background: transparent;
  color: #ef4444;
  border: none;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
}

.comment-delete-btn:hover {
  background: #fee2e2;
}

.comment-body {
  font-size: 0.9rem;
  color: #1e293b;
  white-space: pre-wrap;
}

.banner {
  padding: 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
  margin-bottom: 0.8rem;
}
.success-banner { background: #d1fae5; color: #065f46; }
.error-banner { background: #fee2e2; color: #991b1b; }
.no-comments { color: #64748b; font-size: 0.9rem; font-style: italic; }
.loading-state, .error-state { text-align: center; padding: 2rem; color: #64748b; }
.back-link { color: #2563eb; text-decoration: underline; font-size: 0.9rem; }
</style>