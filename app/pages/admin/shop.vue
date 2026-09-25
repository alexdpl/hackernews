<!-- app/pages/admin/shop.vue -->
<script setup lang="ts">
definePageMeta({ middleware: 'admin-only' })

const products = ref([
  { id: 1, name: 'DKP Automated Crawler SaaS Engine', price: 109, version: 'v1.0.0', zip: 'dkp-automated-crawler-pro-v1.0.zip', sales: 0 },
  { id: 2, name: 'DKP Native Blog & Admin Pro', price: 99, version: 'v2.1.0', zip: 'dkp-native-blog-v2.1.0.zip', sales: 16 },
  { id: 3, name: 'DKP Neural Code Playground Suite', price: 79, version: 'v1.5.0', zip: 'dkp-neural-playground-v1.5.0.zip', sales: 11 }
])

const newProduct = ref({
  name: '',
  price: 29,
  version: 'v1.0.0',
  zipName: ''
})

function addProduct() {
  if (!newProduct.value.name) return
  products.value.push({
    id: Date.now(),
    name: newProduct.value.name,
    price: newProduct.value.price,
    version: newProduct.value.version,
    zip: newProduct.value.zipName || `${newProduct.value.name.toLowerCase().replace(/\s+/g, '-')}.zip`,
    sales: 0
  })
  newProduct.value = { name: '', price: 29, version: 'v1.0.0', zipName: '' }
}

function removeProduct(id: number) {
  products.value = products.value.filter(p => p.id !== id)
}
</script>

<template>
  <div class="admin-page-container">
    <div class="header-section">
      <div class="badge">DKP SHOP MANAGEMENT</div>
      <h1>Gestione <span class="highlight">DKP Shop Proprietario</span></h1>
      <p class="subtitle">Gestisci moduli .ZIP, licenze software e prezzi d'accesso esclusivi.</p>
    </div>

    <div class="admin-grid">
      <!-- Form Aggiunta Prodotto -->
      <div class="card">
        <h3>📦 Aggiungi Nuovo Plugin .ZIP</h3>
        <form @submit.prevent="addProduct" class="form-stack">
          <div class="form-group">
            <label>Nome Plugin / Prodotto *</label>
            <input v-model="newProduct.name" type="text" placeholder="Es. DKP AI Code Scanner Pro" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Prezzo (€)</label>
              <input v-model.number="newProduct.price" type="number" min="0" required />
            </div>
            <div class="form-group">
              <label>Versione</label>
              <input v-model="newProduct.version" type="text" required />
            </div>
          </div>

          <div class="form-group">
            <label>Nome File .ZIP Associato</label>
            <input v-model="newProduct.zipName" type="text" placeholder="dkp-plugin-v1.0.zip" />
          </div>

          <button type="submit" class="btn-submit">➕ Inserisci nel Catalogo Shop</button>
        </form>
      </div>

      <!-- Catalogo Prodotti -->
      <div class="card table-card">
        <h3>📄 Catalogo Prodotti Attivi ({{ products.length }})</h3>
        <table class="dkp-table">
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
              <td class="font-bold">{{ p.name }}</td>
              <td class="price-text">€{{ p.price }}</td>
              <td><span class="ver-badge">{{ p.version }}</span></td>
              <td class="zip-text"><code>{{ p.zip }}</code></td>
              <td>🛒 {{ p.sales }}</td>
              <td>
                <button @click="removeProduct(p.id)" class="btn-delete">Rimuovi</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page-container { padding: 2rem; background: #020420; min-height: 90vh; color: #f8fafc; }
.header-section { margin-bottom: 2rem; }
.badge { display: inline-block; background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.3); margin-bottom: 0.5rem; }
.highlight { color: #00dc82; }
.subtitle { color: #94a3b8; font-size: 0.9rem; }
.admin-grid { display: grid; grid-template-columns: 360px 1fr; gap: 1.5rem; }
.card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; }
.form-stack { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group label { display: block; font-size: 0.8rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.3rem; }
.form-group input { width: 100%; background: #020420; border: 1px solid #1e293b; color: #fff; padding: 0.65rem; border-radius: 6px; outline: none; }
.btn-submit { background: #00dc82; color: #020420; font-weight: 800; padding: 0.8rem; border: none; border-radius: 8px; cursor: pointer; }
.dkp-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem; margin-top: 1rem; }
.dkp-table th, .dkp-table td { padding: 0.75rem; border-bottom: 1px solid #1e293b; }
.dkp-table th { color: #64748b; font-size: 0.75rem; text-transform: uppercase; }
.price-text { color: #00dc82; font-weight: 800; }
.ver-badge { background: rgba(0, 220, 130, 0.15); color: #00dc82; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.75rem; }
.zip-text code { font-family: monospace; color: #94a3b8; font-size: 0.8rem; }
.btn-delete { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); padding: 0.3rem 0.6rem; border-radius: 6px; cursor: pointer; font-size: 0.78rem; }
.btn-delete:hover { background: rgba(239, 68, 68, 0.4); }
</style>
