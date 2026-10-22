<!-- app/pages/item/[id].vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

interface Comment {
  id: number
  author?: string | any
  text: string
  createdAt?: string | Date
  created_at?: string | Date
}

interface Item {
  id: number
  title: string
  url?: string | null
  domain?: string | null
  points?: number
  author?: string | any
  createdAt?: string | Date
  created_at?: string | Date
  description?: string | null
  text?: string | null
  content?: string | null
}

const route = useRoute()
const router = useRouter()
const itemId = Number(route.params.id) || 1

// 1. Fetch Dettaglio Post dal DB / API unificata
const { data: itemResponse, pending, error } = await useFetch<any>(`/api/news/${itemId}`)

const item = computed<Item | null>(() => {
  if (!itemResponse.value) return null
  const raw = itemResponse.value.data || itemResponse.value.post || itemResponse.value.story || itemResponse.value
  if (!raw || !raw.title) return null
  
  return {
    ...raw,
    author: typeof raw.author === 'object' ? raw.author?.username : (raw.author || raw.user || 'community'),
    domain: raw.domain || (raw.url && !raw.url.startsWith('/') ? new URL(raw.url).hostname.replace('www.', '') : 'devkernelpulse.org')
  }
})

// 2. Fetch Commenti (con fallback sicuro a lista vuota)
const { data: commentsData, refresh: refreshComments } = await useFetch<any>(`/api/comments`, {
  query: { postId: itemId },
  lazy: true
})

const comments = computed<Comment[]>(() => {
  const list = commentsData.value?.comments || commentsData.value?.data || item.value?.comments || []
  return list.map((c: any) => ({
    ...c,
    author: typeof c.author === 'object' ? c.author?.username : (c.author || c.user || 'Anonimo')
  }))
})

// 3. Stato Auth Utente
const { data: authData } = await useFetch('/api/auth/me')
const currentUser = computed(() => authData.value?.username || null)
const isAdmin = computed(() => currentUser.value === 'alexdpl')

// Form Inserimento Commento
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

    if (res?.success) {
      submitSuccess.value = 'Commento inviato con successo! (+5 XP)'
      commentText.value = ''
      await refreshComments()
    } else {
      submitError.value = res?.error || 'Impossibile pubblicare il commento.'
    }
  } catch (err: any) {
    console.error('Errore invio commento:', err)
    submitError.value = 'Errore di connessione o server non disponibile.'
  } finally {
    isSubmitting.value = false
  }
}

// Moderazione Admin
async function deletePost() {
  if (!confirm('Sei sicuro di voler eliminare questo post e tutti i suoi commenti?')) return
  try {
    const res: any = await $fetch('/api/admin/delete-item', {
      method: 'POST',
      body: { id: itemId, type: 'post' }
    })
    if (res?.success) {
      router.push('/')
    } else {
      alert(res?.error || 'Errore durante eliminazione')
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
    if (res?.success) {
      await refreshComments()
    } else {
      alert(res?.error || 'Errore eliminazione commento')
    }
  } catch (err) {
    console.error(err)
    alert('Errore di connessione')
  }
}

function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return 'di recente'
  try {
    return new Date(dateStr).toLocaleDateString('it-IT')
  } catch {
    return 'di recente'
  }
}

useHead({
  title: computed(() => item.value ? `${item.value.title} - DevKernelPulse` : 'Discussione - DevKernelPulse')
})
</script>

<template>
  <div class="item-page-container">
    
    <!-- STATE: CARICAMENTO -->
    <div v-if="pending" class="loading-state">
      <span class="spinner">⚡</span> Caricamento articolo e discussione dal Kernel DB...
    </div>

    <!-- STATE: ERRORE / NON TROVATO -->
    <div v-else-if="error || !item" class="error-state">
      <h2>📭 Elemento non trovato o errore di sincronizzazione.</h2>
      <p>La notizia potrebbe essere stata rimossa o non è ancora presente nel database Neon.</p>
      <NuxtLink to="/" class="back-btn">← Torna alla Home Feed</NuxtLink>
    </div>

    <!-- CONTENT: DETTAGLIO POST & DISCUSSIONI -->
    <div v-else class="item-content">
      
      <!-- 1. Header Post & Moderazione Admin -->
      <section class="item-header-card">
        <div class="title-row">
          <h1 class="item-title">
            <a v-if="item.url" :href="item.url" target="_blank" rel="noopener noreferrer" class="title-link">
              {{ item.title }} ↗
            </a>
            <span v-else>{{ item.title }}</span>
            <span v-if="item.domain" class="item-domain">({{ item.domain }})</span>
          </h1>
          
          <button v-if="isAdmin" @click="deletePost" class="admin-delete-btn" title="Elimina post">
            🗑️ Elimina Post
          </button>
        </div>

        <div class="item-meta">
          <span class="points-tag">▲ {{ item.points || 1 }} punti</span>
          <span class="meta-dot">•</span>
          <span>Pubblicato il <strong>{{ formatDate(item.createdAt || item.created_at) }}</strong></span>
          <span class="meta-dot">•</span>
          <span>Autore: <strong class="author-tag">@{{ item.author }}</strong></span>
          <span class="meta-dot">•</span>
          <span class="verify-tag">Verified da <strong>DKP Crawler</strong></span>
        </div>

        <div v-if="item.description || item.text || item.content" class="item-description">
          <p>{{ item.description || item.text || item.content }}</p>
        </div>
      </section>

      <!-- 2. Form Inserimento Commento -->
      <section class="comment-box-section">
        <h3 class="section-title">💬 Partecipa alla Discussione</h3>

        <div v-if="submitSuccess" class="banner success-banner">{{ submitSuccess }}</div>
        <div v-if="submitError" class="banner error-banner">{{ submitError }}</div>

        <div v-if="currentUser" class="comment-form-box">
          <p class="logged-as">Stai commentando come <strong class="highlight">@{{ currentUser }}</strong>:</p>
          <textarea
            v-model="commentText"
            rows="3"
            required
            placeholder="Scrivi qui il tuo contributo o la tua analisi tecnica..."
            class="comment-textarea"
          ></textarea>
          <div class="form-actions">
            <button
              type="button"
              @click="handleCommentSubmit"
              class="submit-btn"
              :disabled="isSubmitting || !commentText.trim()"
            >
              {{ isSubmitting ? 'Invio in corso...' : 'Invia Commento (+5 XP)' }}
            </button>
          </div>
        </div>

        <div v-else class="login-prompt">
          🔒 Per commentare o votare devi effettuare il <NuxtLink to="/login" class="login-link">Login</NuxtLink> nel DKP Hub.
        </div>
      </section>

      <!-- 3. Lista dei Commenti -->
      <section class="comments-list-section">
        <h3 class="section-title">Commenti ({{ comments.length }})</h3>

        <!-- FALLBACK QUANDO NON CI SONO COMMENTI -->
        <div v-if="comments.length === 0" class="no-comments-box">
          <p class="no-comments-icon">💬</p>
          <p class="no-comments-title">Nessun commento ancora presente.</p>
          <span>Sii il primo sviluppatore a lasciare un parere su questa notizia!</span>
        </div>

        <div v-else class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-card">
            <div class="comment-meta-row">
              <div class="comment-meta">
                <strong class="comment-author">@{{ comment.author }}</strong>
                <span class="meta-dot">•</span>
                <span class="comment-date">{{ formatDate(comment.createdAt || comment.created_at) }}</span>
              </div>
              
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

      <!-- BANNER DKP ADS CONTESTUALE -->
      <DkpAdStrip categoryTag="DKP ITEM DISCUSSION" />
    </div>

  </div>
</template>

<style scoped>
.item-page-container {
  max-width: 950px;
  margin: 1.5rem auto;
  padding: 0 1rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #f8fafc;
}

.item-header-card {
  background: rgba(9, 13, 22, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 1.75rem 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.item-title {
  font-size: 1.5rem;
  font-weight: 900;
  color: #ffffff;
  line-height: 1.35;
  margin: 0;
}

.title-link {
  color: #ffffff;
  text-decoration: none;
  transition: color 0.2s;
}

.title-link:hover {
  color: #00dc82;
  text-decoration: underline;
}

.item-domain {
  font-size: 0.9rem;
  font-weight: 600;
  color: #38bdf8;
  margin-left: 0.5rem;
}

.item-meta {
  font-size: 0.82rem;
  color: #94a3b8;
  margin-top: 0.8rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.points-tag { color: #f59e0b; font-weight: 800; }
.author-tag { color: #a78bfa; }
.verify-tag { color: #64748b; }
.meta-dot { color: #334155; }

.item-description {
  margin-top: 1.2rem;
  padding: 1rem 1.25rem;
  background: #090d16;
  border-left: 4px solid #00dc82;
  border-radius: 0 8px 8px 0;
  font-size: 0.95rem;
  color: #cbd5e1;
  line-height: 1.6;
}

.comment-box-section, .comments-list-section {
  background: rgba(9, 13, 22, 0.85);
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 1rem 0;
}

.comment-form-box {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.logged-as {
  font-size: 0.85rem;
  color: #94a3b8;
}

.highlight {
  color: #00dc82;
}

.comment-textarea {
  width: 100%;
  padding: 0.8rem 1rem;
  background: #060a12;
  border: 1px solid #1e293b;
  border-radius: 8px;
  color: #f8fafc;
  font-size: 0.9rem;
  box-sizing: border-box;
  resize: vertical;
}

.comment-textarea:focus {
  outline: 1px solid #00dc82;
  border-color: #00dc82;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.submit-btn {
  background-color: #00dc82;
  color: #020420;
  border: none;
  padding: 0.65rem 1.4rem;
  font-weight: 800;
  font-size: 0.85rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.4);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-prompt {
  background: #090d16;
  border: 1px dashed #334155;
  padding: 1.25rem;
  border-radius: 8px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.88rem;
}

.login-link {
  color: #00dc82;
  font-weight: 800;
  text-decoration: underline;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.comment-card {
  padding: 1rem 1.25rem;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 10px;
}

.comment-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.comment-meta {
  font-size: 0.8rem;
  color: #94a3b8;
}

.comment-author {
  color: #00dc82;
}

.comment-date {
  color: #64748b;
}

.comment-body {
  font-size: 0.92rem;
  color: #e2e8f0;
  white-space: pre-wrap;
  line-height: 1.5;
}

.admin-delete-btn, .comment-delete-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.admin-delete-btn:hover, .comment-delete-btn:hover {
  background: #ef4444;
  color: #ffffff;
}

.no-comments-box {
  text-align: center;
  padding: 2.5rem 1rem;
  background: #090d16;
  border: 1px dashed #1e293b;
  border-radius: 12px;
  color: #94a3b8;
}
.no-comments-icon { font-size: 2rem; margin: 0 0 0.5rem 0; }
.no-comments-title { font-weight: 800; color: #f1f5f9; margin: 0 0 0.25rem 0; }

.banner {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  font-weight: 700;
}
.success-banner { background: rgba(0, 220, 130, 0.15); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); }
.error-banner { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

.loading-state, .error-state {
  text-align: center;
  padding: 4rem 1rem;
  color: #94a3b8;
  background: rgba(9, 13, 22, 0.85);
  border: 1px solid #1e293b;
  border-radius: 16px;
  margin-bottom: 2rem;
}

.error-state h2 { color: #f8fafc; font-size: 1.2rem; margin-bottom: 0.5rem; }
.error-state p { margin-bottom: 1.5rem; font-size: 0.9rem; }

.back-btn {
  background: #00dc82;
  color: #020420;
  font-weight: 800;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  text-decoration: none;
  display: inline-block;
}
</style>