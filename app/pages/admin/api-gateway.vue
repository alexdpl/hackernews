<!-- pages/admin/api-gateway.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

useHead({
  title: 'API Gateway Management — DKP Admin v2.4-GOLD',
  meta: [
    { name: 'description', content: 'Pannello Admin per la gestione dei Rate Limit, allocazione quote e controllo licenze API DKP.' }
  ]
})

interface LicenseItem {
  id: string
  userId: number | null
  customerEmail: string
  productName: string
  licenseKey: string
  status: 'active' | 'suspended' | 'revoked' | 'expired'
  downloadsCount: number
  maxDownloads: number
  createdAt: string
}

const licenses = ref<LicenseItem[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedStatusFilter = ref('all')

// Modal Stato ed Editing Quota
const isEditModalOpen = ref(false)
const editingLicense = ref<LicenseItem | null>(null)
const newMaxDownloads = ref<number>(1000)
const newStatus = ref<'active' | 'suspended' | 'revoked' | 'expired'>('active')

// Carica la lista licenze dal backend Admin
async function fetchGatewayData() {
  isLoading.value = true
  try {
    const res = await $fetch<{ success: boolean; data: LicenseItem[] }>('/api/admin/api-gateway')
    if (res.success) {
      licenses.value = res.data
    }
  } catch (err) {
    console.error('Errore durante il caricamento licenze:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchGatewayData()
})

// Filtraggio real-time
const filteredLicenses = computed(() => {
  return licenses.value.filter(item => {
    const matchQuery = item.customerEmail.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                       item.licenseKey.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchStatus = selectedStatusFilter.value === 'all' || item.status === selectedStatusFilter.value
    return matchQuery && matchStatus
  })
})

// Modale Dettaglio
function openEditModal(license: LicenseItem) {
  editingLicense.value = { ...license }
  newMaxDownloads.value = license.maxDownloads
  newStatus.value = license.status
  isEditModalOpen.value = true
}

// Salvataggio modifiche quota/stato
async function saveLicenseChanges() {
  if (!editingLicense.value) return

  try {
    await $fetch('/api/admin/api-gateway', {
      method: 'POST',
      body: {
        id: editingLicense.value.id,
        maxDownloads: Number(newMaxDownloads.value),
        status: newStatus.value
      }
    })
    
    isEditModalOpen.value = false
    await fetchGatewayData()
  } catch (err: any) {
    alert(`Errore durante l'aggiornamento: ${err.message}`)
  }
}

// Reset Istantaneo Quota Consumata
async function resetQuotaUsage(id: string) {
  if (!confirm('Vuoi davvero azzerare le chiamate effettuate da questo utente per il mese corrente?')) return

  try {
    await $fetch('/api/admin/api-gateway', {
      method: 'POST',
      body: { id, resetUsage: true }
    })
    await fetchGatewayData()
  } catch (err: any) {
    alert(`Errore durante il reset: ${err.message}`)
  }
}
</script>

<template>
  <div class="gateway-admin-page">
    <div class="admin-container">
      
      <!-- BREADCRUMB & HEADER -->
      <header class="page-header">
        <div class="header-main">
          <NuxtLink to="/api-console" class="back-link"> 🔌 Torna alla API Console</NuxtLink>
		  <span class="separator" style="color: #50c878; font-weight: bold;"> | </span>
		   <NuxtLink to="/admin" class="back-link"> 📊 Torna alla Dashboard</NuxtLink>
          <div class="title-row">
            <h1>⚙️ API Gateway & Rate Limit Management</h1>
            <span class="badge-gold">v2.4-GOLD ADMIN</span>
          </div>
          <p class="subtitle">
            Gestisci le allocazioni di traffico, assegna quote personalizzate e controlla lo stato operativo delle API Key utenti.
          </p>
        </div>
      </header>

      <!-- BARRA FILTRI & SEARCH -->
      <section class="controls-bar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cerca per Email cliente o API Key..." 
          />
        </div>

        <div class="filter-group">
          <label>Filtra Stato:</label>
          <select v-model="selectedStatusFilter">
            <option value="all">Tutti gli Stati</option>
            <option value="active">Attive (Active)</option>
            <option value="suspended">Sospese (Suspended)</option>
            <option value="revoked">Revocate (Revoked)</option>
          </select>
        </div>
      </section>

      <!-- TABELLA LICENZE & RATE LIMITS -->
      <section class="table-section">
        <div v-if="isLoading" class="loading-state">
          <span>⚡ Caricamento licenze dal database Neon...</span>
        </div>

        <table v-else-if="filteredLicenses.length" class="gateway-table">
          <thead>
            <tr>
              <th>Utente / Email</th>
              <th>Prodotto / Tier</th>
              <th>API Key (Hash)</th>
              <th>Consumo Quota</th>
              <th>Stato</th>
              <th>Azioni Admin</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredLicenses" :key="item.id">
              <td>
                <div class="user-cell">
                  <strong>{{ item.customerEmail }}</strong>
                  <span class="sub-text">ID: {{ item.id.substring(0, 8) }}...</span>
                </div>
              </td>
              <td><span class="product-tag">{{ item.productName }}</span></td>
              <td><code class="key-preview">{{ item.licenseKey.substring(0, 16) }}...</code></td>
              <td>
                <div class="usage-cell">
                  <div class="usage-text">
                    <strong>{{ item.downloadsCount.toLocaleString() }}</strong> / {{ item.maxDownloads.toLocaleString() }}
                  </div>
                  <div class="mini-progress-bar">
                    <div 
                      class="mini-fill" 
                      :style="{ width: `${Math.min(100, (item.downloadsCount / item.maxDownloads) * 100)}%` }"
                      :class="{ warning: (item.downloadsCount / item.maxDownloads) >= 0.8 }"
                    ></div>
                  </div>
                </div>
              </td>
              <td>
                <span class="status-pill" :class="item.status">{{ item.status.toUpperCase() }}</span>
              </td>
              <td>
                <div class="actions-cell">
                  <button @click="openEditModal(item)" class="btn-edit" title="Modifica Limiti">
                    ✏️ Limiti
                  </button>
                  <button @click="resetQuotaUsage(item.id)" class="btn-reset" title="Azzera Consumo">
                    🔄 Reset Quota
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else class="empty-state">
          Nessuna licenza trovata con i filtri correnti.
        </div>
      </section>

      <!-- MODALE MODIFICA LIMITI -->
      <div v-if="isEditModalOpen" class="modal-backdrop" @click.self="isEditModalOpen = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3>⚙️ Modifica Limiti Quota</h3>
            <button @click="isEditModalOpen = false" class="close-btn">✕</button>
          </div>

          <div class="modal-body" v-if="editingLicense">
            <p>Cliente: <strong>{{ editingLicense.customerEmail }}</strong></p>

            <div class="form-group">
              <label>Quota Max Richieste (Rate Limit Mensile):</label>
              <input v-model.number="newMaxDownloads" type="number" min="100" step="500" />
              <small>Esempi: 1.000 (Free), 100.000 (Pro), 1.000.000 (Enterprise)</small>
            </div>

            <div class="form-group">
              <label>Stato Licenza API:</label>
              <select v-model="newStatus">
                <option value="active">Active (Funzionante)</option>
                <option value="suspended">Suspended (Sospesa temporaneamente)</option>
                <option value="revoked">Revoked (Bloccata definitivamente)</option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="isEditModalOpen = false" class="btn-cancel">Annulla</button>
            <button @click="saveLicenseChanges" class="btn-save">Salva Modifiche</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.gateway-admin-page {
  background: #020420;
  color: #cbd5e1;
  min-height: 100vh;
  padding: 2.5rem 1.5rem 5rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.admin-container {
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.back-link {
  color: #38bdf8;
  font-size: 0.85rem;
  text-decoration: none;
  font-weight: 700;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 0.4rem;
}

.title-row h1 {
  font-size: 1.8rem;
  color: #ffffff;
  margin: 0;
  font-weight: 900;
}

.badge-gold {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.subtitle {
  color: #94a3b8;
  margin: 0.4rem 0 0;
  font-size: 0.92rem;
}

/* CONTROLS BAR */
.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  background: #090d16;
  border: 1px solid #1e293b;
  padding: 1rem 1.25rem;
  border-radius: 10px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #020420;
  border: 1px solid #1e293b;
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  flex: 1;
}

.search-box input {
  background: transparent;
  border: none;
  color: #fff;
  width: 100%;
  outline: none;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
}

.filter-group select {
  background: #020420;
  border: 1px solid #1e293b;
  color: #00dc82;
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  font-weight: 700;
}

/* TABELLA */
.table-section {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  overflow: hidden;
}

.gateway-table {
  width: 100%;
  border-collapse: collapse;
}

.gateway-table th, .gateway-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #1e293b;
  font-size: 0.88rem;
}

.gateway-table th {
  background: #020420;
  color: #64748b;
  font-size: 0.8rem;
}

.user-cell {
  display: flex;
  flex-direction: column;
}

.user-cell strong { color: #fff; }
.sub-text { font-size: 0.75rem; color: #64748b; }

.product-tag {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 700;
}

.key-preview {
  background: rgba(255, 255, 255, 0.05);
  color: #00dc82;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
}

/* PROGRESS BAR MINI */
.usage-cell {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.mini-progress-bar {
  height: 6px;
  background: #020420;
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid #1e293b;
  width: 120px;
}

.mini-fill {
  height: 100%;
  background: #00dc82;
}

.mini-fill.warning { background: #f59e0b; }

.status-pill {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 800;
}

.status-pill.active { background: rgba(0, 220, 130, 0.15); color: #00dc82; }
.status-pill.suspended { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.status-pill.revoked { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.btn-edit {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-reset {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

/* MODALE */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(2, 4, 32, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  width: 100%;
  max-width: 460px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 { color: #fff; margin: 0; }
.close-btn { background: transparent; border: none; color: #64748b; font-size: 1.2rem; cursor: pointer; }

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 1rem;
}

.form-group label { font-size: 0.82rem; color: #94a3b8; font-weight: 700; }
.form-group input, .form-group select {
  background: #020420;
  border: 1px solid #1e293b;
  color: #fff;
  padding: 0.6rem;
  border-radius: 6px;
}

.form-group small { color: #64748b; font-size: 0.72rem; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
  border-top: 1px solid #1e293b;
  padding-top: 1rem;
}

.btn-cancel { background: transparent; border: 1px solid #1e293b; color: #94a3b8; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
.btn-save { background: #00dc82; color: #020420; border: none; font-weight: 800; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }

.loading-state, .empty-state {
  padding: 3rem;
  text-align: center;
  color: #64748b;
}
</style>