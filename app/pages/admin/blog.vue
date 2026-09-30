<!-- app/pages/admin/blog.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({ middleware: 'admin-only' })

// Active Tab ('categories' | 'articles')
const activeTab = ref<'categories' | 'articles'>('categories')

// --- STATI CATEGORIE & SOTTOCATEGORIE (REAL DB) ---
interface Subcategory {
  id: number
  categoryId: number
  name: string
  slug: string
}

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  subcategories?: Subcategory[]
}

const categories = ref<Category[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Modal Categoria
const isCatModalOpen = ref(false)
const catForm = ref({
  id: null as number | null,
  name: '',
  slug: '',
  description: '',
  icon: 'i-heroicons-folder',
  color: '#10B981',
})

// Modal Sottocategoria
const isSubModalOpen = ref(false)
const subForm = ref({
  id: null as number | null,
  categoryId: null as number | null,
  name: '',
  slug: '',
})

const presetColors = ['#10B981', '#F59E0B', '#06B6D4', '#8B5CF6', '#EC4899', '#EF4444', '#3B82F6']

const autoSlug = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const handleCatNameInput = () => {
  if (!catForm.value.id) catForm.value.slug = autoSlug(catForm.value.name)
}

const handleSubNameInput = () => {
  if (!subForm.value.id) subForm.value.slug = autoSlug(subForm.value.name)
}

// Fetch Categorie dal DB
const fetchCategories = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res: any = await $fetch('/api/blog/categories')
    if (res.success) {
      categories.value = res.data
    }
  } catch (err: any) {
    errorMessage.value = err.statusMessage || 'Errore caricamento categorie'
  } finally {
    isLoading.value = false
  }
}

// Salva Categoria
const saveCategory = async () => {
  if (!catForm.value.name || !catForm.value.slug) return
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/blog/categories', {
      method: 'POST',
      body: { type: 'category', ...catForm.value },
    })
    if (res.success) {
      successMessage.value = catForm.value.id ? 'Categoria aggiornata!' : 'Categoria creata!'
      isCatModalOpen.value = false
      await fetchCategories()
      setTimeout(() => (successMessage.value = ''), 3000)
    }
  } catch (err: any) {
    errorMessage.value = err.statusMessage || 'Errore salvataggio categoria'
  } finally {
    isLoading.value = false
  }
}

// Salva Sottocategoria
const saveSubcategory = async () => {
  if (!subForm.value.name || !subForm.value.slug || !subForm.value.categoryId) return
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/blog/categories', {
      method: 'POST',
      body: { type: 'subcategory', ...subForm.value },
    })
    if (res.success) {
      successMessage.value = subForm.value.id ? 'Sottocategoria aggiornata!' : 'Sottocategoria creata!'
      isSubModalOpen.value = false
      await fetchCategories()
      setTimeout(() => (successMessage.value = ''), 3000)
    }
  } catch (err: any) {
    errorMessage.value = err.statusMessage || 'Errore salvataggio sottocategoria'
  } finally {
    isLoading.value = false
  }
}

// Eliminazione Categoria/Sottocategoria
const deleteItem = async (id: number, type: 'category' | 'subcategory') => {
  if (!confirm(`Sei sicuro di voler eliminare questo elemento?`)) return
  isLoading.value = true
  try {
    const res: any = await $fetch(`/api/admin/blog/categories?id=${id}&type=${type}`, {
      method: 'DELETE',
    })
    if (res.success) {
      successMessage.value = 'Eliminato con successo!'
      await fetchCategories()
      setTimeout(() => (successMessage.value = ''), 3000)
    }
  } catch (err: any) {
    errorMessage.value = err.statusMessage || "Errore eliminazione"
  } finally {
    isLoading.value = false
  }
}

const openCatModal = (cat: Category | null = null) => {
  if (cat) {
    catForm.value = {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon || 'i-heroicons-folder',
      color: cat.color || '#10B981',
    }
  } else {
    catForm.value = { id: null, name: '', slug: '', description: '', icon: 'i-heroicons-folder', color: '#10B981' }
  }
  isCatModalOpen.value = true
}

const openSubModal = (categoryId: number, sub: Subcategory | null = null) => {
  subForm.value.categoryId = categoryId
  if (sub) {
    subForm.value.id = sub.id
    subForm.value.name = sub.name
    subForm.value.slug = sub.slug
  } else {
    subForm.value.id = null
    subForm.value.name = ''
    subForm.value.slug = ''
  }
  isSubModalOpen.value = true
}

// --- STATI MOCK ARTICOLI ---
const posts = ref([
  { id: 1, title: 'Lancio Ufficiale DevKernelPulse v1.0', category: 'Release Ufficiali', views: 1420, date: '2026-09-20' },
  { id: 2, title: 'Proof of Code: Il futuro della meritocrazia dev', category: 'Tech & Kernel', views: 890, date: '2026-09-22' }
])

const newArticle = ref({
  title: '',
  category: '',
  author: 'Alessandro De Paola',
  excerpt: '',
  content: ''
})

function publishArticle() {
  if (!newArticle.value.title) return
  posts.value.unshift({
    id: Date.now(),
    title: newArticle.value.title,
    category: newArticle.value.category || 'Generale',
    views: 0,
    date: new Date().toISOString().split('T')[0]
  })
  newArticle.value.title = ''
  newArticle.value.excerpt = ''
  newArticle.value.content = ''
}

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div class="admin-page-container">
    <!-- Header Section -->
    <div class="header-section">
      <div class="badge">DKP v2.4-GOLD ADMIN CONTROL CENTER</div>
      <h1>Gestione <span class="highlight">DKP Blog & Taxonomy</span></h1>
      <p class="subtitle">Amministra le categorie sul Database Neon e pubblica gli articoli dell'ecosistema.</p>
    </div>

    <!-- Navigation Tabs -->
    <div class="tab-nav">
      <button 
        @click="activeTab = 'categories'" 
        :class="['tab-btn', { active: activeTab === 'categories' }]"
      >
        📂 Gestione Categorie & Taxonomy
      </button>
      <button 
        @click="activeTab = 'articles'" 
        :class="['tab-btn', { active: activeTab === 'articles' }]"
      >
        ✍️ Articoli & Moderazione
      </button>
    </div>

    <!-- Alerts Feedback -->
    <div v-if="successMessage" class="alert success">✅ {{ successMessage }}</div>
    <div v-if="errorMessage" class="alert error">⚠️ {{ errorMessage }}</div>

    <!-- ================= TAB 1: CATEGORIE REAL DB ================= -->
    <div v-if="activeTab === 'categories'" class="tab-content">
      <div class="top-bar">
        <h3>Categorie attive sul DB Neon ({{ categories.length }})</h3>
        <button @click="openCatModal()" class="btn-primary">+ Nuova Categoria</button>
      </div>

      <div v-if="isLoading && !categories.length" class="loading-state">
        Caricamento taxonomy dal database in corso...
      </div>

      <div v-else class="categories-grid">
        <div v-for="cat in categories" :key="cat.id" class="cat-card">
          <div class="cat-card-header" :style="{ borderLeftColor: cat.color || '#10B981' }">
            <div>
              <h4 class="cat-title">{{ cat.name }}</h4>
              <span class="cat-slug">/{{ cat.slug }}</span>
            </div>
            <div class="actions">
              <button @click="openCatModal(cat)" class="btn-icon" title="Modifica">✏️</button>
              <button @click="deleteItem(cat.id, 'category')" class="btn-icon danger" title="Elimina">🗑️</button>
            </div>
          </div>

          <p class="cat-desc">{{ cat.description || 'Nessuna descrizione presente.' }}</p>

          <!-- Sottocategorie Section -->
          <div class="subcategories-box">
            <div class="sub-header">
              <span>Sottocategorie ({{ cat.subcategories?.length || 0 }})</span>
              <button @click="openSubModal(cat.id)" class="btn-link">+ Aggiungi</button>
            </div>
            <div class="sub-badges">
              <span v-for="sub in cat.subcategories" :key="sub.id" class="sub-badge">
                {{ sub.name }}
                <button @click="openSubModal(cat.id, sub)" class="sub-edit">✏️</button>
                <button @click="deleteItem(sub.id, 'subcategory')" class="sub-del">×</button>
              </span>
              <span v-if="!cat.subcategories?.length" class="empty-sub">Nessuna sottocategoria.</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= TAB 2: ARTICOLI & MODERAZIONE ================= -->
    <div v-if="activeTab === 'articles'" class="tab-content">
      <div class="admin-grid">
        <!-- Form Pubblicazione -->
        <div class="main-panel">
          <div class="card">
            <h3>✍️ Pubblica Nuovo Articolo</h3>
            <form @submit.prevent="publishArticle" class="form-stack">
              <div class="form-group">
                <label>Titolo Articolo *</label>
                <input v-model="newArticle.title" type="text" placeholder="Es. Guida ad Architettura Micro-Kernel Nuxt 4" required />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Categoria</label>
                  <select v-model="newArticle.category">
                    <option value="" disabled>Seleziona una categoria</option>
                    <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Autore</label>
                  <input v-model="newArticle.author" type="text" readonly />
                </div>
              </div>

              <div class="form-group">
                <label>Estratto Breve</label>
                <textarea v-model="newArticle.excerpt" rows="2" placeholder="Sintesi per le anteprime..."></textarea>
              </div>

              <button type="submit" class="btn-submit">🚀 Pubblica nel Blog DKP</button>
            </form>
          </div>

          <!-- Tabella Articoli Pubblicati -->
          <div class="card table-card">
            <h3>📚 Articoli Pubblicati ({{ posts.length }})</h3>
            <table class="dkp-table">
              <thead>
                <tr>
                  <th>Titolo</th>
                  <th>Categoria</th>
                  <th>Data</th>
                  <th>Visualizzazioni</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="post in posts" :key="post.id">
                  <td class="font-bold">{{ post.title }}</td>
                  <td><span class="cat-badge">{{ post.category }}</span></td>
                  <td>{{ post.date }}</td>
                  <td>👁️ {{ post.views }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL CATEGORIA -->
    <div v-if="isCatModalOpen" class="modal-backdrop">
      <div class="modal-box">
        <h3>{{ catForm.id ? '✏️ Modifica Categoria' : '➕ Nuova Categoria' }}</h3>
        <div class="form-stack">
          <div class="form-group">
            <label>Nome Categoria</label>
            <input v-model="catForm.name" @input="handleCatNameInput" type="text" placeholder="es. Cybersecurity" />
          </div>
          <div class="form-group">
            <label>URL Slug</label>
            <input v-model="catForm.slug" type="text" placeholder="es. cybersecurity" />
          </div>
          <div class="form-group">
            <label>Descrizione</label>
            <textarea v-model="catForm.description" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label>Colore Badge</label>
            <div class="color-picker">
              <span 
                v-for="color in presetColors" 
                :key="color" 
                @click="catForm.color = color"
                :style="{ backgroundColor: color }"
                :class="['color-dot', { active: catForm.color === color }]"
              ></span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="isCatModalOpen = false" class="btn-cancel">Annulla</button>
          <button @click="saveCategory" class="btn-primary">Salva Categoria</button>
        </div>
      </div>
    </div>

    <!-- MODAL SOTTOCATEGORIA -->
    <div v-if="isSubModalOpen" class="modal-backdrop">
      <div class="modal-box">
        <h3>{{ subForm.id ? '✏️ Modifica Sottocategoria' : '➕ Nuova Sottocategoria' }}</h3>
        <div class="form-stack">
          <div class="form-group">
            <label>Nome Sottocategoria</label>
            <input v-model="subForm.name" @input="handleSubNameInput" type="text" placeholder="es. PenTesting" />
          </div>
          <div class="form-group">
            <label>URL Slug</label>
            <input v-model="subForm.slug" type="text" placeholder="es. pentesting" />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="isSubModalOpen = false" class="btn-cancel">Annulla</button>
          <button @click="saveSubcategory" class="btn-primary">Salva Sottocategoria</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page-container { padding: 2rem; background: #020420; min-height: 90vh; color: #f8fafc; font-family: sans-serif; }
.header-section { margin-bottom: 1.5rem; }
.badge { display: inline-block; background: rgba(0, 220, 130, 0.15); color: #00dc82; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 4px; border: 1px solid rgba(0, 220, 130, 0.3); margin-bottom: 0.5rem; }
.highlight { color: #00dc82; }
.subtitle { color: #94a3b8; font-size: 0.9rem; }

/* Tabs */
.tab-nav { display: flex; gap: 0.5rem; border-bottom: 1px solid #1e293b; margin-bottom: 1.5rem; }
.tab-btn { background: transparent; border: none; color: #94a3b8; padding: 0.75rem 1.25rem; font-weight: 700; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
.tab-btn.active { color: #00dc82; border-bottom-color: #00dc82; background: rgba(0, 220, 130, 0.05); }

/* Alerts */
.alert { padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem; }
.alert.success { background: rgba(0, 220, 130, 0.15); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); }
.alert.error { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

/* Top bar & Grid */
.top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.categories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
.cat-card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.25rem; }
.cat-card-header { display: flex; justify-content: space-between; align-items: flex-start; border-left: 4px solid #00dc82; padding-left: 0.75rem; margin-bottom: 0.75rem; }
.cat-title { margin: 0; font-size: 1.1rem; color: #fff; }
.cat-slug { font-size: 0.75rem; color: #64748b; font-family: monospace; }
.cat-desc { font-size: 0.85rem; color: #94a3b8; margin-bottom: 1rem; min-height: 2.5rem; }

/* Actions & Subcategories */
.actions { display: flex; gap: 0.25rem; }
.btn-icon { background: #1e293b; border: none; padding: 0.25rem 0.4rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem; }
.btn-icon.danger:hover { background: rgba(239, 68, 68, 0.3); }
.subcategories-box { border-top: 1px solid #1e293b; padding-top: 0.75rem; margin-top: 0.5rem; }
.sub-header { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 0.5rem; }
.btn-link { background: none; border: none; color: #00dc82; cursor: pointer; font-size: 0.75rem; font-weight: 700; }
.sub-badges { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.sub-badge { background: #020420; border: 1px solid #1e293b; color: #cbd5e1; font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 6px; display: inline-flex; align-items: center; gap: 0.3rem; }
.sub-edit, .sub-del { background: none; border: none; color: #64748b; cursor: pointer; font-size: 0.65rem; padding: 0; }
.sub-del:hover { color: #ef4444; }
.empty-sub { font-size: 0.75rem; color: #475569; font-style: italic; }

/* Form & Tables */
.card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
.form-stack { display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group input, .form-group select, .form-group textarea { width: 100%; background: #020420; border: 1px solid #1e293b; color: #fff; padding: 0.65rem; border-radius: 6px; outline: none; }
.form-group input:focus { border-color: #00dc82; }
.btn-primary, .btn-submit { background: #00dc82; color: #020420; font-weight: 800; border: none; padding: 0.65rem 1.2rem; border-radius: 8px; cursor: pointer; }
.dkp-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
.dkp-table th, .dkp-table td { padding: 0.75rem; border-bottom: 1px solid #1e293b; }
.dkp-table th { color: #64748b; font-size: 0.75rem; text-transform: uppercase; }
.cat-badge { background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; }

/* Modal */
.modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(2, 4, 32, 0.85); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal-box { background: #090d16; border: 1px solid #1e293b; width: 100%; max-width: 480px; border-radius: 12px; padding: 1.5rem; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; }
.btn-cancel { background: transparent; border: none; color: #94a3b8; cursor: pointer; }
.color-picker { display: flex; gap: 0.5rem; }
.color-dot { width: 22px; height: 22px; border-radius: 50%; cursor: pointer; opacity: 0.6; border: 2px solid transparent; }
.color-dot.active { opacity: 1; border-color: #fff; transform: scale(1.1); }
</style>