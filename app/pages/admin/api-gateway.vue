<!-- pages/admin/api-gateway.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

useHead({
  title: 'API Gateway Management — DKP Admin v2.5-GOLD',
  meta: [
    { name: 'description', content: 'Pannello Admin per la gestione dei Rate Limit, allocazione quote e controllo licenze API DKP.' }
  ]
})

const { getMainUrl, getApiUrl } = useDomain()

export interface LicenseItem {
  id: string | number
  userId?: number | null
  customerEmail: string
  productName: string
  licenseKey: string
  status: 'active' | 'suspended' | 'revoked' | 'expired' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'EXPIRED'
  downloadsCount: number
  maxDownloads: number
  createdAt: string
}

const licenses = ref<LicenseItem[]>([])
const isLoading = ref(true)
const fetchError = ref<string | null>(null)
const searchQuery = ref('')
const selectedStatusFilter = ref('all')

// Toast System per feedback istantaneo
const showToast = ref(false)
const toastMessage = ref('')
function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => showToast.value = false, 3500)
}

// Modal Stato ed Editing Quota
const isEditModalOpen = ref(false)
const editingLicense = ref<LicenseItem | null>(null)
const newMaxDownloads = ref<number>(1000)
const newStatus = ref<'active' | 'suspended' | 'revoked'>('active')

// Normalizza lo stato per confronti omogenei
function normalizeStatus(status: string | undefined | null): string {
  return (status || '').toLowerCase()
}

// Carica la lista licenze/chiavi dal backend API Gateway
async function fetchGatewayData() {
  isLoading.value = true
  fetchError.value = null
  try {
    // 🟢 CORRETTO: Aggiunto lo slash iniziale '/' per puntare correttamente alla rotta assoluta di Nitro
    const res = await $fetch<{ success: boolean; data: LicenseItem[]; error?: string }>('/api/admin/api-gateway')
    
    if (res && res.success) {
      licenses.value = (res.data || []).map(item => ({
        ...item,
        downloadsCount: item.downloadsCount || 0,
        maxDownloads: item.maxDownloads || 1000,
        status: item.status || 'active'
      }))
    } else {
      fetchError.value = res.error || 'Impossibile recuperare i dati dal server.'
    }
  } catch (err: any) {
    console.error('Errore durante il caricamento licenze dal Gateway:', err)
    fetchError.value = `Errore di connessione: ${err.message || 'Impossibile raggiungere il server.'}`
    triggerToast('❌ Errore durante il caricamento dati.')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchGatewayData()
})

// Filtraggio real-time per Email, API Key e Stato
const filteredLicenses = computed(() => {
  return licenses.value.filter(item => {
    const emailMatch = (item.customerEmail || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    const keyMatch = (item.licenseKey || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchQuery = emailMatch || keyMatch
    
    const currentNormStatus = normalizeStatus(item.status)
    const filterNormStatus = normalizeStatus(selectedStatusFilter.value)
    
    const matchStatus = selectedStatusFilter.value === 'all' || currentNormStatus === filterNormStatus
    return matchQuery && matchStatus
  })
})

// Modale Dettaglio
function openEditModal(license: LicenseItem) {
  editingLicense.value = { ...license }
  newMaxDownloads.value = license.maxDownloads || 1000
  const norm = normalizeStatus(license.status)
  newStatus.value = (norm === 'suspended' || norm === 'revoked') ? norm : 'active'
  isEditModalOpen.value = true
}

// Salvataggio modifiche quota e stato sul DB Neon
async function saveLicenseChanges() {
  if (!editingLicense.value) return

  try {
    const res = await $fetch<{ success: boolean; message?: string }>('/api/admin/api-gateway', {
      method: 'POST',
      body: {
        id: editingLicense.value.id,
        maxDownloads: Number(newMaxDownloads.value),
        status: newStatus.value
      }
    })
    
    if (res?.success) {
      triggerToast('✅ Limiti e stato aggiornati con successo!')
      isEditModalOpen.value = false
      await fetchGatewayData()
    } else {
      triggerToast('❌ Impossibile aggiornare i limiti.')
    }
  } catch (err: any) {
    triggerToast(`❌ Errore aggiornamento: ${err.data?.statusMessage || err.message}`)
  }
}

// Reset Istantaneo Quota Consumata
async function resetQuotaUsage(id: string | number) {
  if (!confirm('Vuoi davvero azzerare le chiamate effettuate da questo utente per il mese corrente?')) return

  try {
    const res = await $fetch<{ success: boolean }>('/api/admin/api-gateway', {
      method: 'POST',
      body: { id, resetUsage: true }
    })

    if (res?.success) {
      triggerToast('🔄 Quota azzerata con successo!')
      await fetchGatewayData()
    }
  } catch (err: any) {
    triggerToast(`❌ Errore durante il reset: ${err.data?.statusMessage || err.message}`)
  }
}
</script>

<template>
  <div class="gateway-admin-page">
    <!-- TOAST NOTIFICATION -->
    <Transition name="toast-fade">
      <div v-if="showToast" class="dkp-toast-success">
        <div class="toast-content">
          <span class="toast-text">{{ toastMessage }}</span>
        </div>
      </div>
    </Transition>

    <div class="admin-container">
      
      <!-- BREADCRUMB & HEADER -->
      <header class="page-header">
        <div class="header-main">
          <div class="breadcrumb-nav">
            <NuxtLink :to="getApiUrl('/api-console')" external class="btn-breadcrumb api">
              🔌 Torna alla API Console
            </NuxtLink>
            
            <span class="breadcrumb-separator">|</span>
            
            <NuxtLink :to="getMainUrl('/admin')" external class="btn-breadcrumb admin">
              📊 Torna alla Dashboard
            </NuxtLink>
          </div>

          <div class="title-row">
            <h1>⚙️ API Gateway &amp; Rate Limit Management</h1>
            <span class="badge-gold">v2.5-GOLD ADMIN</span>
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
        
        <!-- STATO CARICAMENTO -->
        <div v-if="isLoading" class="loading-state">
          <span>⚡ Sincronizzazione API Gateway in corso...</span>
        </div>

        <!-- STATO ERRORE DATABASE -->
        <div v-else-if="fetchError" class="error-state">
          <span class="text-3xl mb-4 inline-block">⚠️</span>
          <h3 class="text-amber-400 font-bold mb-2">Errore Connessione Tabella Licenze</h3>
          <p class="text-slate-400 text-sm mb-4">{{ fetchError }}</p>
          <button @click="fetchGatewayData" class="btn-edit" style="margin: 0 auto">🔄 Riprova</button>
        </div>

        <!-- TABELLA DATI -->
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
                  <strong>{{ item.customerEmail || 'utente@devkernelpulse.com' }}</strong>
                  <span class="sub-text">ID: {{ String(item.id).substring(0, 8) }}...</span>
                </div>
              </td>
              <td><span class="product-tag">{{ item.productName || 'DKP Core Suite' }}</span></td>
              <td><code class="key-preview">{{ (item.licenseKey || '').substring(0, 16) }}...</code></td>
              <td>
                <div class="usage-cell">
                  <div class="usage-text">
                    <strong>{{ (item.downloadsCount || 0).toLocaleString() }}</strong> / {{ (item.maxDownloads || 0).toLocaleString() }}
                  </div>
                  <div class="mini-progress-bar">
                    <div 
                      class="mini-fill" 
                      :style="{ width: `${Math.min(100, item.maxDownloads > 0 ? (item.downloadsCount / item.maxDownloads) * 100 : 0)}%` }"
                      :class="{ warning: item.maxDownloads > 0 && (item.downloadsCount / item.maxDownloads) >= 0.8 }"
                    ></div>
                  </div>
                </div>
              </td>
              <td>
                <span class="status-pill" :class="normalizeStatus(item.status)">
                  {{ normalizeStatus(item.status).toUpperCase() }}
                </span>
              </td>
              <td>
                <div class="actions-cell">
                  <button @click="openEditModal(item)" class="btn-edit" title="Modifica Limiti">
                    ✏️ Limiti
                  </button>
                  <button @click="resetQuotaUsage(item.id)" class="btn-reset" title="Azzera Consumo">
                    🔄 Reset
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- STATO VUOTO -->
        <div v-else class="empty-state">
          Nessuna licenza API trovata con i filtri correnti.
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
/* TOAST NOTIFICATION */
.dkp-toast-success {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 999999;
  background: #061811;
  border: 1px solid #00dc82;
  box-shadow: 0 10px 30px rgba(0, 220, 130, 0.35);
  padding: 0.8rem 1.2rem;
  border-radius: 10px;
  backdrop-filter: blur(16px);
  max-width: 420px;
}
.toast-content { display: flex; align-items: center; gap: 0.65rem; color: #f8fafc; font-family: monospace; font-size: 0.85rem; font-weight: 600; }
.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(-15px) scale(0.95); }

/* HEADER & BREADCRUMB */
.page-header {
  margin-bottom: 8px;
  padding: 16px 20px;
  background: #090d16;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}

.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.breadcrumb-separator {
  color: rgba(255, 255, 255, 0.2);
  font-weight: 700;
}

.btn-breadcrumb {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-breadcrumb.api {
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.08);
  border: 1px solid rgba(0, 240, 255, 0.3);
}

.btn-breadcrumb.api:hover {
  background: rgba(0, 240, 255, 0.2);
  border-color: #00f0ff;
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
}

.btn-breadcrumb.admin {
  color: #00ff87;
  background: rgba(0, 255, 135, 0.08);
  border: 1px solid rgba(0, 255, 135, 0.3);
}

.btn-breadcrumb.admin:hover {
  background: rgba(0, 255, 135, 0.2);
  border-color: #00ff87;
  box-shadow: 0 0 10px rgba(0, 255, 135, 0.3);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.title-row h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0;
}

.badge-gold {
  background: linear-gradient(135deg, #ffb703, #fb8500);
  color: #000;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.subtitle {
  color: #8a99ad;
  font-size: 0.9rem;
  margin: 0;
}

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
  gap: 1.5rem;
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
  overflow-x: auto;
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
  transition: width 0.3s ease;
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

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
  text-align: center;
}
</style>