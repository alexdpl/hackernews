<!-- pages/admin/index.vue -->
<script setup lang="ts">
import { ref } from 'vue'

// Collegamento al layout unificato dell'area riservata
definePageMeta({
  layout: 'admin'
})

interface Post {
  id: string | number
  title: string
  url?: string
  createdAt?: string | Date
}

interface PaginationInfo {
  hasMore: boolean
}

interface ApiResponse {
  posts?: Post[]
  data?: Post[]
  pagination?: PaginationInfo
}

// Stato reattivo
const adminSecret = ref('')
const posts = ref<Post[]>([])
const isFetching = ref(false)
const isActioning = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Paginazione
const adminPage = ref(1)
const adminHasMore = ref(false)

// Caricamento dei post con $fetch di Nuxt
async function fetchPostsForMaintenance(isLoadMore = false) {
  if (!adminSecret.value.trim()) {
    errorMessage.value = 'Inserisci la chiave segreta per caricare i dati.'
    return
  }

  isFetching.value = true
  errorMessage.value = ''
  successMessage.value = ''

  if (isLoadMore) {
    adminPage.value++
  } else {
    adminPage.value = 1
  }

  try {
    const resData = await $fetch<ApiResponse | Post[]>('/api/admin/posts', {
      query: {
        page: adminPage.value,
        limit: 30
      },
      headers: {
        Authorization: `Bearer ${adminSecret.value}`
      }
    })

    let newItems: Post[] = []
    let paginationInfo: PaginationInfo | undefined

    if (Array.isArray(resData)) {
      newItems = resData
    } else if (resData) {
      newItems = resData.posts || resData.data || []
      paginationInfo = resData.pagination
    }

    if (isLoadMore) {
      posts.value = [...posts.value, ...newItems]
    } else {
      posts.value = newItems
    }

    if (paginationInfo) {
      adminHasMore.value = paginationInfo.hasMore
    } else {
      adminHasMore.value = newItems.length === 30
    }

    if (posts.value.length === 0) {
      successMessage.value = 'Nessun link rilevato. Il database è pulito!'
    }
  } catch (error: any) {
    console.error('Errore nel recupero dei post:', error)
    errorMessage.value = error?.data?.message || 'Chiave segreta errata o errore di rete.'
    adminHasMore.value = false
  } finally {
    isFetching.value = false
  }
}

// Eliminazione post
async function deletePost(postId: string | number) {
  if (!confirm('Sei sicuro di voler eliminare definitivamente questo post?')) return

  isActioning.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await $fetch(`/api/admin/posts/${postId}`, {
      method: 'DELETE',
      body: { secret: adminSecret.value }
    })

    posts.value = posts.value.filter(p => p.id !== postId)
    successMessage.value = 'Post eliminato con successo dal database.'
  } catch (error: any) {
    console.error('Errore durante l\'eliminazione:', error)
    errorMessage.value = error?.data?.message || 'Impossibile eliminare il post.'
  } finally {
    isActioning.value = false
  }
}
</script>

<template>
  <div class="admin-links-container">
    <h1 class="admin-title">Pannello Manutenzione Link & Commenti</h1>

    <div class="admin-form">
      <!-- Banner Informativi -->
      <div v-if="successMessage" class="success-banner">{{ successMessage }}</div>
      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

      <!-- Autenticazione Chiave Segreta -->
      <div class="form-group">
        <label for="secret">Chiave Segreta Admin (NUXT_ADMIN_SECRET)</label>
        <div class="input-action-group">
          <input
            id="secret"
            v-model="adminSecret"
            type="password"
            required
            placeholder="Inserisci la password di amministrazione..."
            :disabled="isFetching || isActioning"
            @keyup.enter="fetchPostsForMaintenance(false)"
          />
          <button
            type="button"
            class="action-load-btn"
            :disabled="isFetching || !adminSecret.trim()"
            @click="fetchPostsForMaintenance(false)"
          >
            {{ isFetching && adminPage === 1 ? 'Caricamento...' : 'Carica Link' }}
          </button>
        </div>
      </div>

      <!-- Elenco Link -->
      <div v-if="posts && posts.length > 0" class="maintenance-section">
        <h2 class="section-subtitle">Link Rilevati nel Database ({{ posts.length }})</h2>
        <div class="links-list">
          <div v-for="post in posts" :key="post.id" class="link-item">
            <div class="link-details">
              <span class="link-item-title">{{ post.title }}</span>
              <a v-if="post.url" :href="post.url" target="_blank" rel="noopener noreferrer" class="link-item-url">
                {{ post.url }}
              </a>
              <span v-if="post.createdAt" class="link-item-date">
                Inserito il: {{ new Date(post.createdAt).toLocaleDateString('it-IT') }}
              </span>
            </div>
            <button
              type="button"
              class="delete-btn"
              :disabled="isActioning"
              @click="deletePost(post.id)"
            >
              Elimina
            </button>
          </div>
        </div>

        <!-- Paginazione -->
        <div v-if="adminHasMore" class="admin-pagination-box">
          <button
            type="button"
            class="admin-more-btn"
            :disabled="isFetching"
            @click="fetchPostsForMaintenance(true)"
          >
            {{ isFetching ? 'Caricamento in corso...' : 'Carica Altri Record ▾' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.admin-links-container {
  max-width: 800px;
  margin: 1rem auto;
  padding: 1.5rem;
  background-color: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.admin-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 1.2rem;
  color: #020420;
}

.section-subtitle {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 1.2rem 0 0.8rem;
  color: #334155;
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.input-action-group {
  display: flex;
  gap: 8px;

  input {
    flex: 1;
    padding: 0.6rem 0.8rem;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    font-size: 0.9rem;
    color: #020420;

    &:focus {
      outline: 2px solid #00dc82;
      border-color: transparent;
    }
  }
}

.success-banner {
  background-color: #d1fae5;
  border: 1px solid #34d399;
  color: #065f46;
  padding: 0.8rem;
  font-size: 0.85rem;
  border-radius: 4px;
}

.error-banner {
  background-color: #fee2e2;
  border: 1px solid #f87171;
  color: #991b1b;
  padding: 0.8rem;
  font-size: 0.85rem;
  border-radius: 4px;
}

.action-load-btn {
  background-color: #020420;
  color: #00dc82;
  border: 1px solid #020420;
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #00dc82;
    color: #020420;
  }

  &:disabled {
    background-color: #cbd5e1;
    border-color: #cbd5e1;
    color: #94a3b8;
    cursor: not-allowed;
  }
}

.maintenance-section {
  margin-top: 1rem;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8fafc;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;

  &:hover {
    border-color: #cbd5e1;
  }
}

.link-details {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-width: 80%;
}

.link-item-title {
  font-size: 14px;
  font-weight: 600;
  color: #020420;
}

.link-item-url {
  font-size: 12px;
  color: #2563eb;
  text-decoration: none;
  word-break: break-all;

  &:hover {
    text-decoration: underline;
  }
}

.link-item-date {
  font-size: 11px;
  color: #64748b;
}

.delete-btn {
  background-color: #ef4444;
  color: #ffffff;
  border: none;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background-color: #dc2626;
  }

  &:disabled {
    background-color: #fca5a5;
    cursor: not-allowed;
  }
}

.admin-pagination-box {
  width: 100%;
  text-align: center;
  margin-top: 1.5rem;
}

.admin-more-btn {
  background-color: #020420;
  color: #ffffff;
  border: none;
  padding: 0.6rem 1.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    color: #00dc82;
  }

  &:disabled {
    background-color: #cbd5e1;
    color: #94a3b8;
    cursor: not-allowed;
  }
}
</style>