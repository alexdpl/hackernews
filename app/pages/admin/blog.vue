<!-- app/pages/admin/blog.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({ middleware: 'admin-only' })

// --- STRUTTURA DATI TAXONOMY & DB ---
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

// Presets Emojis & Colori v2.4-GOLD
const presetEmojis = [
  '💻', '⚙️', '⚡', '🧠', '🛡️', '🔒',
  // Infrastructure & AI
  '🤖', '☁️', '🐳', '🌐', '📦', '🚀',
  // Low-Level, Security & Data
  '🖲️', '🔑', '📊', '🧬', '🎯', '🛠️',
  // News & Highlights
  '🔥', '✨', '💡', '📌', '🏆', '📰'
]

const presetColors = ['#00dc82', '#38bdf8', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4']

// Modal Form Categoria
const isCatModalOpen = ref(false)
const catForm = ref({
  id: null as number | null,
  name: '',
  slug: '',
  description: '',
  icon: '🔥',
  color: '#00dc82'
})

// Modal Form Sottocategoria
const isSubModalOpen = ref(false)
const subForm = ref({
  id: null as number | null,
  categoryId: null as number | null,
  categoryName: '',
  name: '',
  slug: ''
})

// Generatore Automatico Slug
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

// Fetch Categorie dal DB Neon
const fetchCategories = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res: any = await $fetch('/api/blog/categories')
    if (res.success) {
      categories.value = res.data || []
    }
  } catch (err: any) {
    errorMessage.value = err.statusMessage || 'Errore durante il caricamento delle categorie'
  } finally {
    isLoading.value = false
  }
}

// Salva Categoria (Creazione o Modifica)
const saveCategory = async () => {
  if (!catForm.value.name || !catForm.value.slug) return
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/blog/categories', {
      method: 'POST',
      body: { type: 'category', ...catForm.value }
    })
    if (res.success) {
      showSuccess(catForm.value.id ? 'Categoria aggiornata con successo!' : 'Nuova categoria creata!')
      isCatModalOpen.value = false
      await fetchCategories()
    }
  } catch (err: any) {
    errorMessage.value = err.statusMessage || 'Errore salvataggio categoria'
  } finally {
    isLoading.value = false
  }
}

// Salva Sottocategoria (Creazione o Modifica)
const saveSubcategory = async () => {
  if (!subForm.value.name || !subForm.value.slug || !subForm.value.categoryId) return
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/blog/categories', {
      method: 'POST',
      body: { type: 'subcategory', ...subForm.value }
    })
    if (res.success) {
      showSuccess(subForm.value.id ? 'Sottocategoria aggiornata!' : 'Sottocategoria aggiunta!')
      isSubModalOpen.value = false
      await fetchCategories()
    }
  } catch (err: any) {
    errorMessage.value = err.statusMessage || 'Errore salvataggio sottocategoria'
  } finally {
    isLoading.value = false
  }
}

// Eliminazione Categoria / Sottocategoria
const deleteItem = async (id: number, type: 'category' | 'subcategory') => {
  const targetLabel = type === 'category' ? 'questa categoria (e relative sottocategorie)' : 'questa sottocategoria'
  if (!confirm(`Sei sicuro di voler eliminare ${targetLabel}?`)) return
  isLoading.value = true
  try {
    const res: any = await $fetch(`/api/admin/blog/categories?id=${id}&type=${type}`, {
      method: 'DELETE'
    })
    if (res.success) {
      showSuccess('Elemento eliminato con successo!')
      await fetchCategories()
    }
  } catch (err: any) {
    errorMessage.value = err.statusMessage || 'Errore durante l\'eliminazione'
  } finally {
    isLoading.value = false
  }
}

// Gestione Modali
const openCatModal = (cat: Category | null = null) => {
  if (cat) {
    catForm.value = {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon || '🏷️',
      color: cat.color || '#00dc82'
    }
  } else {
    catForm.value = { id: null, name: '', slug: '', description: '', icon: '🔥', color: '#00dc82' }
  }
  isCatModalOpen.value = true
}

const openSubModal = (category: Category, sub: Subcategory | null = null) => {
  subForm.value.categoryId = category.id
  subForm.value.categoryName = category.name
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

const showSuccess = (msg: string) => {
  successMessage.value = msg
  setTimeout(() => (successMessage.value = ''), 3500)
}

// --- STATI ARTICOLI & MODERAZIONE ---
const posts = ref([
  { id: 1, title: 'Lancio Ufficiale DevKernelPulse v2.4-GOLD', categoryId: 1, views: 1420, date: '2026-09-28', status: 'published' },
  { id: 2, title: 'Guida completa a Vault & Hashing Avanzato', categoryId: 2, views: 890, date: '2026-09-25', status: 'published' },
  { id: 3, title: 'Analisi Vulnerabilità AI Model Injection', categoryId: null, views: 0, date: '2026-10-01', status: 'pending_vault' }
])

const newArticle = ref({
  title: '',
  categoryId: '',
  author: 'Alessandro De Paola',
  excerpt: '',
  content: ''
})

function publishArticle() {
  if (!newArticle.value.title || !newArticle.value.categoryId) return
  posts.value.unshift({
    id: Date.now(),
    title: newArticle.value.title,
    categoryId: Number(newArticle.value.categoryId),
    views: 0,
    date: new Date().toISOString().split('T')[0],
    status: 'published'
  })
  newArticle.value.title = ''
  newArticle.value.excerpt = ''
  newArticle.value.content = ''
  newArticle.value.categoryId = ''
  showSuccess('Articolo pubblicato con successo!')
}

const getCategoryName = (id: number | null) => {
  if (!id) return 'Non Assegnata'
  const cat = categories.value.find(c => c.id === id)
  return cat ? cat.name : 'Non Assegnata'
}

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div class="admin-page-container">
  <!-- 1. BARRA DEDICATA TORNA ALLA DASHBOARD -->
    <div class="admin-top-bar">
      <div class="admin-breadcrumb">
        <span class="status-dot green"></span>
        <span class="breadcrumb-text">ADMIN CONTROL CENTER</span>
      </div>
      <NuxtLink to="/admin" class="btn-back-dashboard">
        📊 Torna alla Dashboard
      </NuxtLink>
    </div>
    <!-- Header Admin Control Center -->
    <div class="header-section">
      <div class="badge">
        <span class="badge-dot"></span>
        DKP v2.4-GOLD TAXONOMY & BLOG SYSTEM
      </div>
	 
      <h1>Gestione <span class="highlight">DKP Blog & Taxonomy</span></h1>
      <p class="subtitle">Amministra le categorie sul Database Neon, assegna icone/badge e pubblica gli articoli dell'ecosistema.</p>
    </div>
    <!-- Feedback Alerts -->
    <div v-if="successMessage" class="alert success">✅ {{ successMessage }}</div>
    <div v-if="errorMessage" class="alert error">⚠️ {{ errorMessage }}</div>

    <!-- MAIN HYBRID GRID (30% / 70%) -->
    <div class="hybrid-grid">
      
      <!-- ================= COLONNA SINISTRA (30%): CATEGORIE ================= -->
      <div class="sidebar-panel">
        <div class="sidebar-header">
          <h3 class="flex items-center gap-2">
            <UIcon name="i-heroicons-folder-open" class="text-xl text-[#00dc82]" />
            Categorie ({{ categories.length }})
          </h3>
          <button @click="openCatModal()" class="btn-primary btn-sm">+ Nuova</button>
        </div>

        <div v-if="isLoading && !categories.length" class="loading-state">
          Caricamento...
        </div>
        <div v-else-if="!categories.length" class="empty-state">
          Nessuna categoria.
        </div>
        
        <div v-else class="compact-cat-list">
          <div v-for="cat in categories" :key="cat.id" class="compact-cat-item">
            <div class="cat-item-top">
              <div class="cat-info-head">
                <div 
                  class="cat-icon-badge mini" 
                  :style="{ backgroundColor: `${cat.color || '#00dc82'}20`, color: cat.color || '#00dc82', borderColor: `${cat.color || '#00dc82'}40` }"
                >
                  <span class="text-base">{{ cat.icon || '🏷️' }}</span>
                </div>
                <div>
                  <h4 class="cat-title-sm">{{ cat.name }}</h4>
                  <span class="cat-slug-sm">/{{ cat.slug }}</span>
                </div>
              </div>
              <div class="actions">
                <button @click="openCatModal(cat)" class="btn-icon" title="Modifica">✏</button>
                <button @click="deleteItem(cat.id, 'category')" class="btn-icon danger" title="Elimina">🗑️</button>
              </div>
            </div>
            
            <!-- Sottocategorie Compatte -->
            <div class="subcategories-mini">
              <div class="sub-header-mini">
                <span>Sub ({{ cat.subcategories?.length || 0 }})</span>
                <button @click="openSubModal(cat)" class="btn-link">+ Aggiungi</button>
              </div>
              <div class="sub-badges">
                <span v-for="sub in cat.subcategories" :key="sub.id" class="sub-badge mini-badge">
                  {{ sub.name }}
                  <button @click="deleteItem(sub.id, 'subcategory')" class="sub-del-mini" title="Elimina">×</button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= COLONNA DESTRA (70%): ARTICOLI & MODERAZIONE ================= -->
      <div class="main-panel">
        
        <!-- Form Pubblicazione -->
        <div class="card mb-6">
          <h3 class="card-title"><span class="text-xl">✍️</span> Pubblica Nuovo Articolo</h3>
          <form @submit.prevent="publishArticle" class="form-stack">
            <div class="form-group">
              <label>Titolo Articolo *</label>
              <input v-model="newArticle.title" type="text" placeholder="Es. Guida ad Architettura Micro-Kernel Nuxt 4" required />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Categoria *</label>
                <select v-model="newArticle.categoryId" required>
                  <option value="" disabled>Seleziona una categoria</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                    {{ cat.icon || '🏷️' }} {{ cat.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Autore</label>
                <input v-model="newArticle.author" type="text" readonly />
              </div>
            </div>

            <div class="form-group">
              <label>Estratto Breve</label>
              <textarea v-model="newArticle.excerpt" rows="2" placeholder="Sintesi per le anteprime nel blog..."></textarea>
            </div>

            <button type="submit" class="btn-submit">🚀 Pubblica nel Blog DKP</button>
          </form>
        </div>

        <!-- Coda di Moderazione & Tabella Articoli -->
        <div class="card table-card">
          <h3 class="card-title">📚 Gestione Pubblicazioni ({{ posts.length }})</h3>
          <table class="dkp-table">
            <thead>
              <tr>
                <th>Titolo</th>
                <th>Categoria</th>
                <th>Status</th>
                <th>Data</th>
                <th>Views</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="post in posts" :key="post.id" :class="{'bg-yellow-500/5': post.status === 'pending_vault'}">
                <td class="font-bold">{{ post.title }}</td>
                <td><span class="cat-badge">{{ getCategoryName(post.categoryId) }}</span></td>
                <td>
                  <span v-if="post.status === 'published'" class="status-badge success">Online</span>
                  <span v-if="post.status === 'pending_vault'" class="status-badge warning">DKP Vault (In Analisi)</span>
                </td>
                <td>{{ post.date }}</td>
                <td>👁️ {{ post.views }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ================= MODALE CATEGORIA ================= -->
    <div v-if="isCatModalOpen" class="modal-backdrop">
      <div class="modal-box">
        <h3>{{ catForm.id ? '✏️ Modifica Categoria' : '➕ Nuova Categoria' }}</h3>
        
        <div class="form-stack mt-4">
          <div class="form-group">
            <label>Nome Categoria *</label>
            <input v-model="catForm.name" @input="handleCatNameInput" type="text" placeholder="Es. Cybersecurity & Vault" required />
          </div>

          <div class="form-group">
            <label>URL Slug *</label>
            <input v-model="catForm.slug" type="text" placeholder="cybersecurity-vault" required />
          </div>

          <div class="form-group">
            <label>Descrizione</label>
            <textarea v-model="catForm.description" rows="2" placeholder="Breve panoramica della categoria..."></textarea>
          </div>

          <!-- Selettore Icona Emoji -->
          <div class="form-group">
            <label>Seleziona Icona Emoji</label>
            <div class="icons-grid">
              <button 
                v-for="emoji in presetEmojis" 
                :key="emoji"
                type="button"
                @click="catForm.icon = emoji"
                :class="['icon-btn text-xl', { active: catForm.icon === emoji }]"
              >
                {{ emoji }}
              </button>
            </div>
          </div>

          <!-- Selettore Colore Accent -->
          <div class="form-group">
            <label>Colore Badge & Accent</label>
            <div class="color-picker">
              <span 
                v-for="color in presetColors" 
                :key="color" 
                @click="catForm.color = color"
                :style="{ backgroundColor: color }"
                :class="['color-dot', { active: catForm.color === color }]"
              ></span>
              <input v-model="catForm.color" type="color" class="color-input" />
            </div>
          </div>

          <!-- Anteprima Badge Live -->
          <div class="badge-preview-box">
            <span class="preview-label">Anteprima Badge:</span>
            <span 
              class="preview-badge"
              :style="{ backgroundColor: `${catForm.color}20`, color: catForm.color, borderColor: `${catForm.color}40` }"
            >
              <span>{{ catForm.icon }}</span>
              {{ catForm.name || 'Nome Categoria' }}
            </span>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="isCatModalOpen = false" class="btn-cancel">Annulla</button>
          <button @click="saveCategory" class="btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Salvataggio...' : 'Salva Categoria' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ================= MODALE SOTTOCATEGORIA ================= -->
    <div v-if="isSubModalOpen" class="modal-backdrop">
      <div class="modal-box">
        <h3>{{ subForm.id ? '✏ Modifica Sottocategoria' : '➕ Nuova Sottocategoria' }}</h3>
        <p class="modal-sub-info">Categoria Padre: <strong class="highlight">{{ subForm.categoryName }}</strong></p>

        <div class="form-stack">
          <div class="form-group">
            <label>Nome Sottocategoria *</label>
            <input v-model="subForm.name" @input="handleSubNameInput" type="text" placeholder="Es. Penetration Testing" required />
          </div>

          <div class="form-group">
            <label>URL Slug *</label>
            <input v-model="subForm.slug" type="text" placeholder="penetration-testing" required />
          </div>
        </div>

        <div class="modal-footer">
          <button @click="isSubModalOpen = false" class="btn-cancel">Annulla</button>
          <button @click="saveSubcategory" class="btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Salvataggio...' : 'Salva Sottocategoria' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>

/* ==========================================================================
   TOP BAR NAVIGAZIONE ADMIN (TORNA ALLA DASHBOARD)
   ========================================================================== */
.admin-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 0.6rem 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.admin-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.25);
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
}

.breadcrumb-text {
  font-size: 0.75rem;
  font-weight: 800;
  color: #38bdf8;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.status-dot.green {
  background: #00dc82;
  box-shadow: 0 0 8px #00dc82;
}

/* BOTTONE NEON TORNA ALLA DASHBOARD */
.btn-back-dashboard {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #020420;
  border: 1px solid #1e293b;
  color: #cbd5e1;
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-back-dashboard:hover {
  border-color: #00dc82;
  color: #00dc82;
  background: rgba(0, 220, 130, 0.08);
  box-shadow: 0 0 12px rgba(0, 220, 130, 0.2);
  transform: translateY(-1px);
}

.admin-page-container {
  padding: 2rem;
  background-color: #020420;
  min-height: 100vh;
  color: #f8fafc;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header-section { margin-bottom: 2rem; }
.badge {
  display: inline-flex; align-items: center; gap: 0.5rem;
  background: rgba(0, 220, 130, 0.12); color: #00dc82; font-size: 0.75rem;
  font-weight: 800; padding: 0.3rem 0.75rem; border-radius: 9999px;
  border: 1px solid rgba(0, 220, 130, 0.3); margin-bottom: 0.75rem; letter-spacing: 0.05em;
}
.badge-dot { width: 6px; height: 6px; border-radius: 50%; background-color: #00dc82; box-shadow: 0 0 8px #00dc82; }
.header-section h1 { font-size: 2rem; font-weight: 800; margin: 0 0 0.5rem 0; letter-spacing: -0.02em; }
.highlight { color: #00dc82; }
.subtitle { color: #94a3b8; font-size: 0.9rem; margin: 0; }

.hybrid-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 1.5rem;
  align-items: flex-start;
}
@media (max-width: 1024px) {
  .hybrid-grid { grid-template-columns: 1fr; }
}

.sidebar-panel {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.25rem;
}
.sidebar-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 1.25rem; border-bottom: 1px solid #1e293b; padding-bottom: 1rem;
}
.sidebar-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #fff; }

.compact-cat-list { display: flex; flex-direction: column; gap: 0.75rem; }
.compact-cat-item {
  background: #020420; border: 1px solid #1e293b; border-radius: 10px; padding: 0.85rem;
  transition: border-color 0.2s;
}
.compact-cat-item:hover { border-color: #334155; }
.cat-item-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
.cat-info-head { display: flex; align-items: center; gap: 0.6rem; }
.cat-title-sm { margin: 0; font-size: 0.95rem; color: #fff; font-weight: 600; }
.cat-slug-sm { font-size: 0.7rem; color: #64748b; font-family: monospace; }
.cat-icon-badge.mini { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid transparent; }

.subcategories-mini { border-top: 1px solid #1e293b; padding-top: 0.5rem; }
.sub-header-mini { display: flex; justify-content: space-between; font-size: 0.7rem; color: #64748b; margin-bottom: 0.4rem; font-weight: 700; }
.mini-badge { padding: 0.15rem 0.4rem; font-size: 0.65rem; }
.sub-del-mini { background: none; border: none; color: #ef4444; margin-left: 0.2rem; cursor: pointer; padding: 0; }

.alert { padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.85rem; font-weight: 600; }
.alert.success { background: rgba(0, 220, 130, 0.12); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); }
.alert.error { background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

.card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; }
.card-title { margin: 0 0 1.25rem 0; font-size: 1.25rem; font-weight: 700; color: #fff; }

.form-stack { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.form-group input, .form-group select, .form-group textarea {
  width: 100%; background: #020420; border: 1px solid #1e293b; color: #fff; padding: 0.65rem;
  border-radius: 8px; outline: none; font-size: 0.875rem; box-sizing: border-box;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #00dc82; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.btn-primary, .btn-submit {
  background: #00dc82; color: #020420; font-weight: 800; border: none;
  padding: 0.65rem 1.25rem; border-radius: 8px; cursor: pointer; transition: opacity 0.2s;
}
.btn-primary:hover, .btn-submit:hover { opacity: 0.9; }
.btn-sm { padding: 0.4rem 0.8rem; font-size: 0.75rem; }
.btn-link { background: none; border: none; color: #00dc82; cursor: pointer; font-size: 0.75rem; font-weight: 700; }
.btn-link:hover { text-decoration: underline; }
.actions { display: flex; gap: 0.3rem; }
.btn-icon { background: #1e293b; border: none; padding: 0.3rem 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }
.btn-icon.danger:hover { background: rgba(239, 68, 68, 0.3); }
.btn-cancel { background: transparent; border: none; color: #94a3b8; cursor: pointer; font-weight: 600; }

.dkp-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem; }
.dkp-table th, .dkp-table td { padding: 0.85rem; border-bottom: 1px solid #1e293b; }
.dkp-table th { color: #64748b; font-size: 0.75rem; text-transform: uppercase; }
.cat-badge { background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
.status-badge { padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
.status-badge.success { background: rgba(0, 220, 130, 0.15); color: #00dc82; }
.status-badge.warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }

.icons-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.4rem; background: #020420; padding: 0.5rem; border-radius: 8px; border: 1px solid #1e293b; }
.icon-btn { background: transparent; border: 1px solid transparent; color: #64748b; padding: 0.4rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.icon-btn:hover { background: #0d1322; }
.icon-btn.active { background: rgba(0, 220, 130, 0.15); border-color: #00dc82; }

.color-picker { display: flex; align-items: center; gap: 0.5rem; }
.color-dot { width: 24px; height: 24px; border-radius: 50%; cursor: pointer; opacity: 0.5; border: 2px solid transparent; transition: all 0.2s; }
.color-dot.active { opacity: 1; border-color: #fff; transform: scale(1.15); }
.color-input { width: 28px !important; height: 28px !important; padding: 0 !important; border: none !important; background: transparent !important; cursor: pointer; }

.sub-badges { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.sub-badge { background: #020420; border: 1px solid #1e293b; color: #cbd5e1; font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 6px; display: inline-flex; align-items: center; gap: 0.35rem; }

.modal-backdrop { position: fixed; inset: 0; background: rgba(2, 4, 32, 0.85); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 1rem; }
.modal-box { background: #090d16; border: 1px solid #1e293b; width: 100%; max-width: 480px; border-radius: 14px; padding: 1.5rem; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6); }
.modal-box h3 { margin: 0 0 0.5rem 0; color: #fff; font-size: 1.2rem; }
.modal-sub-info { font-size: 0.8rem; color: #94a3b8; margin-bottom: 1.25rem; }
.badge-preview-box { background: #020420; padding: 0.75rem; border-radius: 8px; border: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; }
.preview-label { font-size: 0.75rem; color: #64748b; font-family: monospace; }
.preview-badge { padding: 0.3rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem; border: 1px solid transparent; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
</style>