<!-- app/pages/admin/shop.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const { products, addProduct, removeProduct } = useShop()

const title = ref('')
const description = ref('')
const price = ref(49)
const version = ref('v1.0.0')
const stack = ref('Nuxt 3 / TypeScript')
const zipFilename = ref('')
const successMessage = ref('')

function handleAddProduct() {
  if (!title.value || !zipFilename.value) {
    alert('Inserisci titolo e nome del file .zip')
    return
  }

  addProduct({
    title: title.value,
    description: description.value,
    price: Number(price.value),
    version: version.value,
    stack: stack.value,
    zipFilename: zipFilename.value
  })

  successMessage.value = '🛒 Prodotto/Plugin aggiunto con successo al DKP Shop!'
  title.value = ''
  description.value = ''
  zipFilename.value = ''
  setTimeout(() => successMessage.value = '', 3000)
}

function handleDelete(id: string) {
  if (confirm('Rimuovere questo plugin dallo store?')) {
    removeProduct(id)
  }
}
</script>

<template>
  <div class="admin-container">
    <div class="admin-header">
      <div class="header-top-row">
        <span class="badge-tag">DKP Shop Management</span>
        <NuxtLink to="/admin" class="back-dashboard-btn">← Torna al Command Center</NuxtLink>
      </div>
      <h1>Shop & Plugin Inventory</h1>
      <p>Gestisci i pacchetti .zip proprietari, prezzi e licenze in vendita.</p>
    </div>

    <div v-if="successMessage" class="success-banner">
      {{ successMessage }}
    </div>

    <div class="admin-grid">
      <!-- Form Aggiunta Prodotto -->
      <div class="admin-card">
        <h2>📦 Aggiungi Nuovo Plugin .ZIP</h2>
        <p class="card-desc">Crea un nuovo pacchetto digitale da mettere in vendita.</p>

        <div class="form-group">
          <label>Nome Plugin / Prodotto *</label>
          <input v-model="title" type="text" placeholder="Es. DKP AI Scanner Pro" />
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>Prezzo (€) *</label>
            <input v-model.number="price" type="number" />
          </div>
          <div class="form-group flex-1">
            <label>Versione</label>
            <input v-model="version" type="text" placeholder="v1.0.0" />
          </div>
        </div>

        <div class="form-group">
          <label>Stack Tecnologico</label>
          <input v-model="stack" type="text" placeholder="Nuxt 3 / Rust / TS" />
        </div>

        <div class="form-group">
          <label>Nome File .ZIP *</label>
          <input v-model="zipFilename" type="text" placeholder="dkp-plugin-v1.0.0.zip" />
        </div>

        <div class="form-group">
          <label>Descrizione</label>
          <textarea v-model="description" rows="3" placeholder="Descrizione delle funzionalità..."></textarea>
        </div>

        <button @click="handleAddProduct" class="action-btn primary-btn">Metti in Vendita</button>
      </div>

      <!-- Tabella Prodotti -->
      <div class="admin-card span-2">
        <h2>📋 Catalogo Prodotti Attivi ({{ products.length }})</h2>
        <p class="card-desc">Elenco di tutti i moduli in vendita nello store.</p>

        <div class="table-responsive">
          <table class="posts-table">
            <thead>
              <tr>
                <th>Prodotto</th>
                <th>Prezzo</th>
                <th>Versione</th>
                <th>File .ZIP</th>
                <th>Vendite</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in products" :key="p.id">
                <td class="td-title">{{ p.title }}</td>
                <td class="price-cell">€{{ p.price }}</td>
                <td><span class="version-badge">{{ p.version }}</span></td>
                <td><code>{{ p.zipFilename }}</code></td>
                <td class="sales-cell">🛒 {{ p.salesCount }}</td>
                <td class="actions-cell">
                  <button @click="handleDelete(p.id)" class="delete-btn">Rimuovi</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container { max-width: 1100px; margin: 2.5rem auto; padding: 0 1.5rem; }
.admin-header { margin-bottom: 2rem; }
.header-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.back-dashboard-btn { color: #00dc82; text-decoration: none; font-weight: 600; font-size: 0.9rem; }
.back-dashboard-btn:hover { text-decoration: underline; }
.badge-tag { background: rgba(0, 220, 130, 0.15); color: #00a862; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; border: 1px solid rgba(0, 220, 130, 0.3); }
.admin-header h1 { font-size: 2rem; color: #020420; font-weight: 800; margin-top: 0.5rem; }
.admin-header p { color: #64748b; font-size: 0.95rem; }
.success-banner { background: rgba(0, 220, 130, 0.15); border: 1px solid #00dc82; color: #006636; padding: 1rem; border-radius: 8px; font-weight: 600; margin-bottom: 1.5rem; }
.admin-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; }
@media (max-width: 768px) { .admin-grid { grid-template-columns: 1fr; } }
.admin-card { background: #020420; border: 1px solid #1e293b; border-radius: 10px; padding: 2rem; color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
.admin-card h2 { font-size: 1.2rem; font-weight: 700; color: #00dc82; margin-bottom: 0.5rem; }
.card-desc { color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.5rem; }
.form-group { margin-bottom: 1.25rem; }
.form-row { display: flex; gap: 1rem; }
.flex-1 { flex: 1; }
label { display: block; font-size: 0.85rem; font-weight: 600; color: #cbd5e1; margin-bottom: 0.4rem; }
input, select, textarea { width: 100%; background: #090d16; border: 1px solid #1e293b; color: #ffffff; padding: 0.6rem 0.8rem; border-radius: 6px; font-size: 0.9rem; outline: none; }
input:focus, select:focus, textarea:focus { border-color: #00dc82; }
.action-btn { width: 100%; padding: 0.75rem; border-radius: 6px; font-weight: 700; font-size: 0.9rem; cursor: pointer; border: none; transition: opacity 0.2s; margin-top: 0.5rem; }
.primary-btn { background: #00dc82; color: #020420; }
.action-btn:hover { opacity: 0.9; }

/* Table */
.table-responsive { overflow-x: auto; }
.posts-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
.posts-table th { background: #090d16; color: #94a3b8; padding: 0.75rem 1rem; border-bottom: 1px solid #1e293b; }
.posts-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
.td-title { font-weight: 600; color: #ffffff; }
.price-cell { font-weight: 800; color: #00dc82; }
.version-badge { background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 700; }
.sales-cell { font-weight: 700; color: #f59e0b; }
.delete-btn { background: #ef4444; color: #ffffff; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; font-weight: 700; font-size: 0.8rem; cursor: pointer; }
.delete-btn:hover { opacity: 0.85; }
</style>