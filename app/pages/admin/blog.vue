<!-- app/pages/admin/blog.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useBlog } from '~/composables/useBlog'

const { categories, posts, addCategory, addPost } = useBlog()

const newCategoryName = ref('')
const title = ref('')
const category = ref(categories.value[0]?.name || '')
const excerpt = ref('')
const content = ref('')
const author = ref('Alessandro De Paola')

const successMessage = ref('')

function handleCreateCategory() {
  if (!newCategoryName.value.trim()) return
  addCategory(newCategoryName.value.trim())
  successMessage.value = `Categoria "${newCategoryName.value}" creata con successo!`
  newCategoryName.value = ''
  setTimeout(() => successMessage.value = '', 3000)
}

function handlePublishPost() {
  if (!title.value || !excerpt.value || !content.value) {
    alert('Compila tutti i campi obbligatori per pubblicare l\'articolo.')
    return
  }

  addPost({
    title: title.value,
    category: category.value,
    excerpt: excerpt.value,
    content: content.value,
    author: author.value
  })

  successMessage.value = '🚀 Articolo pubblicato con successo sul DKP Blog!'
  title.value = ''
  excerpt.value = ''
  content.value = ''
  setTimeout(() => successMessage.value = '', 4000)
}
</script>

<template>
  <div class="admin-container">
    <div class="admin-header">
      <span class="badge-tag">DKP Secure Admin</span>
      <h1>Admin Panel • Blog & News Management</h1>
      <p>Gestisci le categorie e pubblica nuovi articoli ufficiali per l'ecosistema.</p>
    </div>

    <div v-if="successMessage" class="success-banner">
      {{ successMessage }}
    </div>

    <div class="admin-grid">
      <!-- Sezione Gestione Categorie -->
      <div class="admin-card">
        <h2>📁 Gestione Categorie</h2>
        <p class="card-desc">Crea nuove categorie di classificazione per gli articoli.</p>
        
        <div class="form-group">
          <label>Nome Nuova Categoria</label>
          <input v-model="newCategoryName" type="text" placeholder="Es. Sicurezza, Aggiornamenti..." />
        </div>
        <button @click="handleCreateCategory" class="action-btn secondary-btn">Crea Categoria</button>

        <div class="cat-list-preview">
          <strong>Categorie Attive:</strong>
          <ul>
            <li v-for="cat in categories" :key="cat.id">{{ cat.name }}</li>
          </ul>
        </div>
      </div>

      <!-- Sezione Creazione Articolo -->
      <div class="admin-card span-2">
        <h2>✍️ Pubblica Nuovo Articolo</h2>
        <p class="card-desc">Compila il form per rilasciare una notizia ufficiale immediata nel blog.</p>

        <div class="form-row">
          <div class="form-group flex-2">
            <label>Titolo Articolo *</label>
            <input v-model="title" type="text" placeholder="Titolo dell'annuncio o della news..." />
          </div>
          <div class="form-group flex-1">
            <label>Categoria *</label>
            <select v-model="category">
              <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>Autore *</label>
            <input v-model="author" type="text" placeholder="Nome autore..." />
          </div>
        </div>

        <div class="form-group">
          <label>Estratto / Riassunto Breve *</label>
          <textarea v-model="excerpt" rows="2" placeholder="Breve descrizione visibile in anteprima..."></textarea>
        </div>

        <div class="form-group">
          <label>Contenuto Completo dell'Articolo *</label>
          <textarea v-model="content" rows="6" placeholder="Scrivi qui il corpo completo dell'articolo..."></textarea>
        </div>

        <button @click="handlePublishPost" class="action-btn primary-btn">🚀 Pubblica Articolo Ufficiale</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  max-width: 1100px;
  margin: 2.5rem auto;
  padding: 0 1.5rem;
}

.admin-header {
  margin-bottom: 2rem;
}

.badge-tag {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.admin-header h1 {
  font-size: 2rem;
  color: #020420;
  font-weight: 800;
  margin-top: 0.75rem;
}

.admin-header p {
  color: #64748b;
  font-size: 0.95rem;
}

.success-banner {
  background: rgba(0, 220, 130, 0.15);
  border: 1px solid #00dc82;
  color: #006636;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.admin-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .admin-grid {
    grid-template-columns: 1fr;
  }
}

.admin-card {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 2rem;
  color: #ffffff;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.admin-card h2 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #00dc82;
  margin-bottom: 0.5rem;
}

.card-desc {
  color: #94a3b8;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 0.4rem;
}

input, select, textarea {
  width: 100%;
  background: #090d16;
  border: 1px solid #1e293b;
  color: #ffffff;
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  font-size: 0.9rem;
  outline: none;
}

input:focus, select:focus, textarea:focus {
  border-color: #00dc82;
}

.action-btn {
  width: 100%;
  padding: 0.7rem;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
}

.primary-btn {
  background: #00dc82;
  color: #020420;
}

.secondary-btn {
  background: #38bdf8;
  color: #020420;
}

.action-btn:hover {
  opacity: 0.9;
}

.cat-list-preview {
  margin-top: 1.5rem;
  border-top: 1px solid #1e293b;
  padding-top: 1rem;
  font-size: 0.85rem;
  color: #94a3b8;
}

.cat-list-preview ul {
  margin-top: 0.5rem;
  padding-left: 1.2rem;
  color: #cbd5e1;
}
</style>