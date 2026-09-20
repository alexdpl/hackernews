<script setup>
import { ref } from 'vue'

const adminSecret = ref('')
const posts = ref([])
const isFetching = ref(false)
const isActioning = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Funzione per caricare i post duplicati usando la fetch standard del browser
async function fetchPostsForMaintenance() {
  if (!adminSecret.value.trim()) {
    errorMessage.value = 'Inserisci la chiave segreta per caricare i dati.'
    return
  }
  
  isFetching.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    // Usiamo window.fetch per eliminare il simbolo $ che corrompe la build
    const response = await window.fetch('/api/admin/posts', {
      headers: {
        'Authorization': 'Bearer ' + adminSecret.value
      }
    })
    
    if (!response.ok) throw new Error('Risposta del server non valida')
    
    const data = await response.json()
    posts.value = data.posts || data
    
    if (posts.value.length === 0) {
      successMessage.value = 'Nessun link duplicato rilevato. Il database è pulito!'
    }
  } catch (error) {
    console.error('Errore nel recupero dei post:', error)
    errorMessage.value = 'Chiave segreta errata o errore di rete.'
  } finally {
    isFetching.value = false
  }
}

// Funzione per eliminare un duplicato usando la fetch standard del browser
async function deletePost(postId) {
  if (!confirm('Sei sicuro di voler eliminare definitivamente questo post?')) return
  
  isActioning.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const response = await window.fetch('/api/admin/posts/' + postId, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ secret: adminSecret.value })
    })
    
    if (!response.ok) throw new Error('Impossibile eliminare')
    
    posts.value = posts.value.filter(p => p.id !== postId)
    successMessage.value = 'Post eliminato con successo dal database.'
  } catch (error) {
    console.error('Errore durante l\'eliminazione:', error)
    errorMessage.value = 'Impossibile eliminare il post.'
  } finally {
    isActioning.value = false
  }
}
</script>

<template>
  <div class="admin-links-container">
    <h1 class="admin-title">Pannello Manutenzione Link & Duplicati</h1>
    
    <div class="admin-form">
      <!-- Banner Informativi Uniformati -->
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
          />
          <button 
            type="button" 
            class="action-load-btn" 
            @click="fetchPostsForMaintenance"
            :disabled="isFetching || !adminSecret.trim()"
          >
            {{ isFetching ? 'Caricamento...' : 'Carica Link' }}
          </button>
        </div>
      </div>

      <!-- Elenco dei Link per la Modulazione -->
      <div v-if="posts && posts.length > 0" class="maintenance-section">
        <h2 class="section-subtitle">Link Rilevati nel Database</h2>
        <div class="links-list">
          <div v-for="post in posts" :key="post.id" class="link-item">
            <div class="link-details">
              <span class="link-item-title">{{ post.title }}</span>
              <a v-if="post.url" :href="post.url" target="_blank" class="link-item-url">{{ post.url }}</a>
              <span class="link-item-date" v-if="post.createdAt">Inserito il: {{ new Date(post.createdAt).toLocaleDateString() }}</span>
            </div>
            <button 
              type="button" 
              class="delete-btn" 
              @click="deletePost(post.id)"
              :disabled="isActioning"
            >
              Elimina
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-links-container { 
  max-width: 600px; 
  margin: 2rem auto; 
  padding: 1.5rem; 
  background-color: #f8fafc; 
  border: 1px solid #e2e8f0; 
  border-radius: 4px; 
  font-family: ui-sans-serif, system-ui, sans-serif; 
}

.admin-title { font-size: 1.3rem; font-weight: bold; margin-bottom: 1.5rem; color: #0f172a; }
.section-subtitle { font-size: 1rem; font-weight: 600; margin: 1rem 0; color: #334155; }
.admin-form { display: flex; flex-direction: column; gap: 1.2rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
label { font-size: 0.85rem; font-weight: 600; color: #475569; }

.input-action-group {
  display: flex;
  gap: 8px;
}

.input-action-group input {
  flex: 1;
}

input { padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem; background-color: #ffffff; color: #000; }
input:focus { outline: 2px solid #047857; }

.success-banner { background-color: #d1fae5; border: 1px solid #34d399; color: #065f46; padding: 0.8rem; font-size: 0.85rem; border-radius: 4px; }
.error-banner { background-color: #fee2e2; border: 1px solid #f87171; color: #991b1b; padding: 0.8rem; font-size: 0.85rem; border-radius: 4px; }

.action-load-btn { 
  background-color: #047857; 
  color: white; 
  border: none; 
  padding: 0.6rem 1.2rem; 
  font-weight: bold; 
  cursor: pointer; 
  border-radius: 4px; 
  transition: background 0.2s; 
}
.action-load-btn:disabled { background-color: #cbd5e1; cursor: not-allowed; }
.action-load-btn:hover:not(:disabled) { background-color: #065f46; }

.maintenance-section {
  margin-top: 0.5rem;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.link-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.link-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 80%;
}

.link-item-title {
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
}

.link-item-url {
  font-size: 12px;
  color: #2563eb;
  text-decoration: none;
  word-break: break-all;
}

.link-item-date {
  font-size: 11px;
  color: #64748b;
}

.delete-btn {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.delete-btn:hover:not(:disabled) {
  background-color: #b91c1c;
}

.delete-btn:disabled {
  background-color: #fca5a5;
  cursor: not-allowed;
}
</style>