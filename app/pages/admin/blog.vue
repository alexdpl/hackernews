<!-- app/pages/admin/blog.vue -->
<script setup lang="ts">
definePageMeta({ middleware: 'admin-only' })

const posts = ref([
  { id: 1, title: 'Lancio Ufficiale DevKernelPulse v1.0', category: 'Release Ufficiali', views: 1420, date: '2026-09-20' },
  { id: 2, title: 'Proof of Code: Il futuro della meritocrazia dev', category: 'Tech & Kernel', views: 890, date: '2026-09-22' }
])

const categories = ref(['Tech & Kernel', 'AI & Neural', 'Release Ufficiali', 'Community & Karma'])
const newCategory = ref('')

const newArticle = ref({
  title: '',
  category: 'Tech & Kernel',
  author: 'Alessandro De Paola',
  excerpt: '',
  content: ''
})

function addCategory() {
  if (newCategory.value.trim()) {
    categories.value.push(newCategory.value.trim())
    newCategory.value = ''
  }
}

function publishArticle() {
  if (!newArticle.value.title) return
  posts.value.unshift({
    id: Date.now(),
    title: newArticle.value.title,
    category: newArticle.value.category,
    views: 0,
    date: new Date().toISOString().split('T')[0]
  })
  newArticle.value.title = ''
  newArticle.value.excerpt = ''
  newArticle.value.content = ''
}
</script>

<template>
  <div class="admin-page-container">
    <div class="header-section">
      <div class="badge">DKP SECURE BLOG ADMIN</div>
      <h1>Gestione <span class="highlight">DKP Blog Proprietario</span></h1>
      <p class="subtitle">Pubblica articoli tecnici, gestisci categorie ed evidenzia le release dell'ecosistema.</p>
    </div>

    <div class="admin-grid">
      <!-- Colonna Sinistra: Categorie & Statistiche -->
      <div class="side-panel">
        <div class="card">
          <h3>📁 Gestione Categorie</h3>
          <div class="input-inline">
            <input v-model="newCategory" type="text" placeholder="Nuova categoria..." />
            <button @click="addCategory" class="btn-primary">+</button>
          </div>
          <ul class="category-list">
            <li v-for="cat in categories" :key="cat">
              <span>🏷️ {{ cat }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Colonna Destra: Form Pubblicazione & Lista Artikoli -->
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
                  <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
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
</template>

<style scoped>
.admin-page-container { padding: 2rem; background: #020420; min-height: 90vh; color: #f8fafc; }
.header-section { margin-bottom: 2rem; }
.badge { display: inline-block; background: rgba(0, 220, 130, 0.15); color: #00dc82; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 4px; border: 1px solid rgba(0, 220, 130, 0.3); margin-bottom: 0.5rem; }
.highlight { color: #00dc82; }
.subtitle { color: #94a3b8; font-size: 0.9rem; }
.admin-grid { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; }
.card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
.input-inline { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.input-inline input, .form-group input, .form-group select, .form-group textarea { width: 100%; background: #020420; border: 1px solid #1e293b; color: #fff; padding: 0.65rem; border-radius: 6px; outline: none; }
.input-inline input:focus, .form-group input:focus { border-color: #00dc82; }
.btn-primary { background: #00dc82; color: #020420; font-weight: 800; border: none; padding: 0 1rem; border-radius: 6px; cursor: pointer; }
.category-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.category-list li { background: #020420; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.85rem; border: 1px solid #1e293b; }
.form-stack { display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.btn-submit { background: #00dc82; color: #020420; font-weight: 800; padding: 0.85rem; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; }
.dkp-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
.dkp-table th, .dkp-table td { padding: 0.75rem; border-bottom: 1px solid #1e293b; }
.dkp-table th { color: #64748b; font-size: 0.75rem; text-transform: uppercase; }
.cat-badge { background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; }
</style>
