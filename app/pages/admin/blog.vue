<!-- app/pages/admin/blog.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useBlog, type BlogPost } from '~/composables/useBlog'

const { categories, posts, addCategory, addPost, updatePost, deletePost } = useBlog()

const newCategoryName = ref('')
const title = ref('')
const category = ref(categories.value[0]?.name || '')
const excerpt = ref('')
const content = ref('')
const author = ref('Alessandro De Paola')

const isEditing = ref(false)
const editingId = ref<string | null>(null)
const activeTab = ref<'write' | 'preview'>('write')
const successMessage = ref('')

function handleCreateCategory() {
  if (!newCategoryName.value.trim()) return
  addCategory(newCategoryName.value.trim())
  successMessage.value = `Categoria "${newCategoryName.value}" creata con successo!`
  newCategoryName.value = ''
  setTimeout(() => successMessage.value = '', 3000)
}

function handleSavePost() {
  if (!title.value || !excerpt.value || !content.value) {
    alert('Compila tutti i campi obbligatori.')
    return
  }

  if (isEditing.value && editingId.value) {
    updatePost(editingId.value, {
      title: title.value,
      category: category.value,
      excerpt: excerpt.value,
      content: content.value,
      author: author.value
    })
    successMessage.value = '✏️ Articolo aggiornato con successo!'
    cancelEdit()
  } else {
    addPost({
      title: title.value,
      category: category.value,
      excerpt: excerpt.value,
      content: content.value,
      author: author.value
    })
    successMessage.value = '🚀 Articolo pubblicato con successo sul DKP Blog!'
    resetForm()
  }

  setTimeout(() => successMessage.value = '', 4000)
}

function startEdit(post: BlogPost) {
  isEditing.value = true
  editingId.value = post.id
  title.value = post.title
  category.value = post.category
  excerpt.value = post.excerpt
  content.value = post.content
  author.value = post.author
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  isEditing.value = false
  editingId.value = null
  resetForm()
}

function resetForm() {
  title.value = ''
  excerpt.value = ''
  content.value = ''
}

function handleDelete(id: string) {
  if (confirm('Sei sicuro di voler eliminare definitivamente questo articolo?')) {
    deletePost(id)
    successMessage.value = '🗑️ Articolo eliminato dal sistema.'
    setTimeout(() => successMessage.value = '', 3000)
  }
}
</script>

<template>
  <div class="admin-container">
    <div class="admin-header">
      <span class="badge-tag">DKP Secure Admin</span>
      <h1>Admin Panel • Blog & News Management</h1>
      <p>Gestione totale dei contenuti, categorie e anteprime in tempo reale.</p>
    </div>

    <div v-if="successMessage" class="success-banner">
      {{ successMessage }}
    </div>

    <div class="admin-grid">
      <!-- Gestione Categorie -->
      <div class="admin-card">
        <h2>📁 Gestione Categorie</h2>
        <p class="card-desc">Crea nuove categorie di classificazione.</p>
        
        <div class="form-group">
          <label>Nome Nuova Categoria</label>
          <input v-model="newCategoryName" type="text" placeholder="Es. Cloud, Web3..." />
        </div>
        <button @click="handleCreateCategory" class="action-btn secondary-btn">Crea Categoria</button>

        <div class="cat-list-preview">
          <strong>Categorie Attive:</strong>
          <ul>
            <li v-for="cat in categories" :key="cat.id">{{ cat.name }}</li>
          </ul>
        </div>
      </div>

      <!-- Scrittura / Modifica Articolo con Tab Live Preview -->
      <div class="admin-card span-2">
        <div class="form-header-row">
          <div>
            <h2>{{ isEditing ? '✏️ Modifica Articolo' : '✍️ Pubblica Nuovo Articolo' }}</h2>
            <p class="card-desc">Usa il form con anteprima live integrata.</p>
          </div>
          <div class="tabs-switcher">
            <button @click="activeTab = 'write'" :class="{ active: activeTab === 'write' }">Scrivi</button>
            <button @click="activeTab = 'preview'" :class="{ active: activeTab === 'preview' }">👁️ Anteprima Live</button>
          </div>
        </div>

        <div v-if="activeTab === 'write'">
          <div class="form-row">
            <div class="form-group flex-2">
              <label>Titolo Articolo *</label>
              <input v-model="title" type="text" placeholder="Titolo dell'annuncio..." />
            </div>
            <div class="form-group flex-1">
              <label>Categoria *</label>
              <select v-model="category">
                <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Autore *</label>
            <input v-model="author" type="text" />
          </div>

          <div class="form-group">
            <label>Estratto Breve *</label>
            <textarea v-model="excerpt" rows="2" placeholder="Riassunto di anteprima..."></textarea>
          </div>

          <div class="form-group">
            <label>Contenuto Completo *</label>
            <textarea v-model="content" rows="6" placeholder="Corpo dell'articolo..."></textarea>
          </div>

          <div class="btn-flex">
            <button @click="handleSavePost" class="action-btn primary-btn">
              {{ isEditing ? '💾 Salva Modifiche' : '🚀 Pubblica Articolo Ufficiale' }}
            </button>
            <button v-if="isEditing" @click="cancelEdit" class="action-btn cancel-btn">Annulla</button>
          </div>
        </div>

        <!-- LIVE PREVIEW TAB -->
        <div v-else class="preview-box">
          <span class="preview-tag">Modalità Anteprima in Tempo Reale</span>
          <div class="preview-content">
            <span class="post-cat">{{ category }}</span>
            <h3>{{ title || 'Titolo dell\'articolo in tempo reale...' }}</h3>
            <p class="preview-excerpt"><strong>{{ excerpt || 'Inserisci un estratto...' }}</strong></p>
            <div class="preview-body">{{ content || 'Il contenuto dell\'articolo apparirà qui...' }}</div>
            <div class="preview-author">👤 Scritto da <strong>{{ author }}</strong></div>
          </div>
        </div>
      </div>
    </div>

    <!-- TABELLA GESTIONE ARTICOLI ESISTENTI (CRUD) -->
    <div class="admin-card full-width-card">
      <h2>📋 Gestione Articoli Esistenti ({{ posts.length }})</h2>
      <p class="card-desc">Elenco completo di tutti i post pubblicati nel kernel del blog.</p>

      <div class="table-responsive">
        <table class="posts-table">
          <thead>
            <tr>
              <th>Titolo</th>
              <th>Categoria</th>
              <th>Autore</th>
              <th>Data</th>
              <th>Statistiche</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in posts" :key="p.id">
              <td class="td-title">{{ p.title }}</td>
              <td><span class="table-cat">{{ p.category }}</span></td>
              <td>{{ p.author }}</td>
              <td>{{ p.date }}</td>
              <td class="stats-cell">🔥 {{ p.likes }} | 👁️ {{ p.views }}</td>
              <td class="actions-cell">
                <button @click="startEdit(p)" class="edit-btn">Modifica</button>
                <button @click="handleDelete(p.id)" class="delete-btn">Elimina</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container { max-width: 1100px; margin: 2.5rem auto; padding: 0 1.5rem; }
.admin-header { margin-bottom: 2rem; }
.badge-tag { background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; border: 1px solid rgba(239, 68, 68, 0.3); }
.admin-header h1 { font-size: 2rem; color: #020420; font-weight: 800; margin-top: 0.75rem; }
.admin-header p { color: #64748b; font-size: 0.95rem; }
.success-banner { background: rgba(0, 220, 130, 0.15); border: 1px solid #00dc82; color: #006636; padding: 1rem; border-radius: 8px; font-weight: 600; margin-bottom: 1.5rem; }
.admin-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; margin-bottom: 1.5rem; }
@media (max-width: 768px) { .admin-grid { grid-template-columns: 1fr; } }
.admin-card { background: #020420; border: 1px solid #1e293b; border-radius: 10px; padding: 2rem; color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
.full-width-card { margin-top: 1.5rem; }
.admin-card h2 { font-size: 1.2rem; font-weight: 700; color: #00dc82; margin-bottom: 0.5rem; }
.card-desc { color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.5rem; }
.form-header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
.tabs-switcher { display: flex; gap: 0.4rem; background: #090d16; padding: 0.3rem; border-radius: 6px; border: 1px solid #1e293b; }
.tabs-switcher button { background: transparent; border: none; color: #94a3b8; padding: 0.4rem 0.8rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
.tabs-switcher button.active { background: #00dc82; color: #020420; }
.form-group { margin-bottom: 1.25rem; }
.form-row { display: flex; gap: 1rem; }
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
label { display: block; font-size: 0.85rem; font-weight: 600; color: #cbd5e1; margin-bottom: 0.4rem; }
input, select, textarea { width: 100%; background: #090d16; border: 1px solid #1e293b; color: #ffffff; padding: 0.6rem 0.8rem; border-radius: 6px; font-size: 0.9rem; outline: none; }
input:focus, select:focus, textarea:focus { border-color: #00dc82; }
.action-btn { width: 100%; padding: 0.7rem; border-radius: 6px; font-weight: 700; font-size: 0.9rem; cursor: pointer; border: none; transition: opacity 0.2s; }
.primary-btn { background: #00dc82; color: #020420; }
.secondary-btn { background: #38bdf8; color: #020420; }
.cancel-btn { background: #64748b; color: #ffffff; margin-top: 0.5rem; }
.btn-flex { display: flex; flex-direction: column; }
.action-btn:hover { opacity: 0.9; }
.cat-list-preview { margin-top: 1.5rem; border-top: 1px solid #1e293b; padding-top: 1rem; font-size: 0.85rem; color: #94a3b8; }
.cat-list-preview ul { margin-top: 0.5rem; padding-left: 1.2rem; color: #cbd5e1; }
/* Preview Tab Styles */
.preview-box { background: #090d16; border: 1px dashed #00dc82; border-radius: 8px; padding: 1.5rem; }
.preview-tag { font-size: 0.75rem; text-transform: uppercase; color: #00dc82; font-weight: 700; display: block; margin-bottom: 1rem; }
.preview-content h3 { font-size: 1.4rem; color: #ffffff; margin: 0.5rem 0; }
.preview-excerpt { color: #38bdf8; font-size: 0.95rem; margin-bottom: 1rem; }
.preview-body { color: #cbd5e1; font-size: 1rem; line-height: 1.6; white-space: pre-line; margin-bottom: 1.5rem; }
.preview-author { color: #94a3b8; font-size: 0.85rem; border-top: 1px solid #1e293b; padding-top: 0.75rem; }
/* Table Styles */
.table-responsive { overflow-x: auto; }
.posts-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
.posts-table th { background: #090d16; color: #94a3b8; padding: 0.75rem 1rem; border-bottom: 1px solid #1e293b; }
.posts-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
.td-title { font-weight: 600; color: #ffffff; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.table-cat { background: rgba(56, 189, 248, 0.1); color: #38bdf8; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 700; }
.stats-cell { font-weight: 700; color: #f59e0b; }
.actions-cell { display: flex; gap: 0.5rem; }
.edit-btn { background: #38bdf8; color: #020420; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; font-weight: 700; font-size: 0.8rem; cursor: pointer; }
.delete-btn { background: #ef4444; color: #ffffff; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; font-weight: 700; font-size: 0.8rem; cursor: pointer; }
.edit-btn:hover, .delete-btn:hover { opacity: 0.85; }
</style>