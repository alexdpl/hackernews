<!-- pages/item/[id].vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

interface Comment {
  id: string | number
  author?: string
  text: string
  createdAt: string | Date
}

interface Item {
  id: string | number
  title: string
  url?: string | null
  domain?: string | null
  points: number
  author?: string
  createdAt: string | Date
  description?: string | null
  comments?: Comment[]
}

const route = useRoute()
const itemId = route.params.id

// Recupero dati dall'API
const { data, pending, error, refresh } = await useFetch<any>(`/api/items/${itemId}`)

// Normalizzazione dell'oggetto Item (gestisce sia risposta diretta che wrapper { item: ... })
const item = computed<Item | null>(() => {
  if (!data.value) return null
  if (data.value.item) return data.value.item
  if (data.value.data) return data.value.data
  return data.value
})

// Stato per l'inserimento del nuovo commento
const commentText = ref('')
const authorName = ref('')
const isSubmitting = ref(false)
const submitError = ref('')
const submitSuccess = ref('')

async function handleCommentSubmit() {
  if (!commentText.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  submitError.value = ''
  submitSuccess.value = ''

  try {
    await $fetch(`/api/items/${itemId}/comments`, {
      method: 'POST',
      body: {
        text: commentText.value.trim(),
        author: authorName.value.trim() || 'Anonimo'
      }
    })

    submitSuccess.value = 'Commento inviato con successo!'
    commentText.value = ''
    
    // Ricarica i dati per mostrare subito il nuovo commento
    await refresh()
  } catch (err: any) {
    console.error('Errore invio commento:', err)
    submitError.value = err?.data?.statusMessage || err?.data?.message || 'Impossibile pubblicare il commento.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="item-page-container">
    <!-- Stato di caricamento -->
    <div v-if="pending" class="loading-state">
      <p>Caricamento discussione in corso...</p>
    </div>

    <!-- Errore o Item non trovato -->
    <div v-else-if="error || !item" class="error-state">
      <h2>Post non trovato o errore di connessione.</h2>
      <NuxtLink to="/" class="back-link">← Torna alla Home</NuxtLink>
    </div>

    <!-- Dettaglio Storia + Form + Commenti -->
    <div v-else class="item-content">
      <!-- 1. Header con Link e Dettagli Post -->
      <section class="item-header">
        <h1 class="item-title">
          <a v-if="item.url" :href="item.url" target="_blank" rel="noopener noreferrer" class="title-link">
            {{ item.title }} ↗
          </a>
          <span v-else>{{ item.title }}</span>
          <span v-if="item.domain" class="item-domain">({{ item.domain }})</span>
        </h1>

        <div class="item-meta">
          <span>{{ item.points || 0 }} punti</span>
          <span class="dot">•</span>
          <span>pubblicato il {{ new Date(item.createdAt).toLocaleDateString('it-IT') }}</span>
          <span v-if="item.author"> da <strong>{{ item.author }}</strong></span>
        </div>

        <p v-if="item.description" class="item-description">
          {{ item.description }}
        </p>
      </section>

      <hr class="divider" />

      <!-- 2. Form per inviare un nuovo commento -->
      <section class="comment-box-section">
        <h3>Aggiungi un Commento</h3>

        <div v-if="submitSuccess" class="banner success-banner">{{ submitSuccess }}</div>
        <div v-if="submitError" class="banner error-banner">{{ submitError }}</div>

        <form class="comment-form" @submit.prevent="handleCommentSubmit">
          <div class="form-group">
            <input 
              v-model="authorName" 
              type="text" 
              placeholder="Il tuo nome / nickname (opzionale)"
              class="author-input"
            />
          </div>

          <div class="form-group">
            <textarea
              v-model="commentText"
              rows="4"
              required
              placeholder="Scrivi qui il tuo commento..."
              class="comment-textarea"
            ></textarea>
          </div>

          <button 
            type="submit" 
            class="submit-btn"
            :disabled="isSubmitting || !commentText.trim()"
          >
            {{ isSubmitting ? 'Invio in corso...' : 'Invia Commento' }}
          </button>
        </form>
      </section>

      <hr class="divider" />

      <!-- 3. Lista dei commenti ricevuti -->
      <section class="comments-list-section">
        <h3>Discussione ({{ item.comments?.length || 0 }})</h3>

        <div v-if="!item.comments || item.comments.length === 0" class="no-comments">
          Nessun commento ancora presente. Sii il primo a commentare!
        </div>

        <div v-else class="comments-list">
          <div v-for="comment in item.comments" :key="comment.id" class="comment-card">
            <div class="comment-meta">
              <strong>{{ comment.author || 'Anonimo' }}</strong>
              <span class="comment-date">• {{ new Date(comment.createdAt).toLocaleDateString('it-IT') }}</span>
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
}

.item-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #020420;
  line-height: 1.3;
}

.title-link {
  color: #020420;
  text-decoration: none;
}

.title-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

.item-domain {
  font-size: 0.85rem;
  font-weight: normal;
  color: #64748b;
  margin-left: 0.5rem;
}

.item-meta {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
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

.comment-form {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.author-input, .comment-textarea {
  width: 100%;
  padding: 0.7rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.9rem;
  box-sizing: border-box;
}

.comment-textarea:focus, .author-input:focus {
  outline: 2px solid #00dc82;
  border-color: transparent;
}

.submit-btn {
  align-self: flex-start;
  background-color: #020420;
  color: #00dc82;
  border: none;
  padding: 0.65rem 1.3rem;
  font-weight: 600;
  font-size: 0.9rem;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.comment-meta {
  font-size: 0.8rem;
  color: #475569;
  margin-bottom: 0.4rem;
}

.comment-date {
  color: #94a3b8;
  margin-left: 0.3rem;
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