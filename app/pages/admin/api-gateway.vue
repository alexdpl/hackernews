<!-- app/pages/admin/api-gateway.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

useHead({
  title: 'API Gateway Management — DKP Admin v2.6 PURE-SQL',
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

// Toast System
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning'>('success')
const copiedKeyId = ref<string | number | null>(null)

function triggerToast(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3500)
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

// Carica la lista licenze/chiavi dal backend API Gateway (NeonDB Pure SQL)
async function fetchGatewayData() {
  isLoading.value = true
  fetchError.value = null
  try {
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
    triggerToast('❌ Errore durante il caricamento dati.', 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchGatewayData()
})

// Metriche sintetiche calcolate al volo
const totalKeys = computed(() => licenses.value.length)
const activeKeys = computed(() => licenses.value.filter(l => normalizeStatus(l.status) === 'active').length)
const suspendedKeys = computed(() => licenses.value.filter(l => ['suspended', 'revoked'].includes(normalizeStatus(l.status))).length)
const totalUsageMonth = computed(() => licenses.value.reduce((acc, curr) => acc + (curr.downloadsCount || 0), 0))

// Filtraggio real-time per Email, API Key e Stato
const filteredLicenses = computed(() => {
  return licenses.value.filter(item => {
    const q = searchQuery.value.toLowerCase()
    const emailMatch = (item.customerEmail || '').toLowerCase().includes(q)
    const keyMatch = (item.licenseKey || '').toLowerCase().includes(q)
    const productMatch = (item.productName || '').toLowerCase().includes(q)
    const matchQuery = emailMatch || keyMatch || productMatch
    
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

// Preset rapidi per la quota nel modale
function setQuotaPreset(amount: number) {
  newMaxDownloads.value = amount
}

// Salvataggio modifiche quota e stato sul DB Neon via Pure SQL
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
      triggerToast('✅ Limiti e stato aggiornati con successo!', 'success')
      isEditModalOpen.value = false
      await fetchGatewayData()
    } else {
      triggerToast('❌ Impossibile aggiornare i limiti.', 'error')
    }
  } catch (err: any) {
    triggerToast(`❌ Errore aggiornamento: ${err.data?.statusMessage || err.message}`, 'error')
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
      triggerToast('🔄 Quota azzerata con successo!', 'success')
      await fetchGatewayData()
    }
  } catch (err: any) {
    triggerToast(`❌ Errore durante il reset: ${err.data?.statusMessage || err.message}`, 'error')
  }
}

// Copia hash della chiave
function copyKey(id: string | number, text: string) {
  if (import.meta.server) return
  navigator.clipboard.writeText(text)
  copiedKeyId.value = id
  setTimeout(() => { copiedKeyId.value = null }, 2000)
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-300 py-10 px-4 sm:px-6 font-sans">
    
    <!-- TOAST NOTIFICATION -->
    <Transition name="toast-fade">
      <div 
        v-if="showToast" 
        :class="[
          'fixed top-6 right-6 z-50 p-4 rounded-xl backdrop-blur-md border shadow-2xl max-w-md flex items-center gap-3 font-mono text-xs sm:text-sm font-semibold transition-all',
          toastType === 'success' ? 'bg-[#041a13]/90 border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(0,220,130,0.2)]' :
          toastType === 'error' ? 'bg-[#1e070a]/90 border-rose-500/50 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.2)]' :
          'bg-[#1a1403]/90 border-amber-500/50 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
        ]"
      >
        <span class="text-xl font-bold">
          {{ toastType === 'success' ? '⚡' : toastType === 'error' ? '🚫' : '⚠️' }}
        </span>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <div class="max-w-7xl mx-auto flex flex-col gap-6">
      
      <!-- BREADCRUMB & HEADER CONTAINER -->
      <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-[#080d1a] via-[#091124] to-[#040711] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl gap-6 relative overflow-hidden">
        <!-- Glow Sfondo Cosmico -->
        <div class="absolute -right-20 -top-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col gap-2">
          <!-- BREADCRUMB -->
          <div class="flex items-center gap-3 font-mono text-xs">
            <NuxtLink :to="getApiUrl('/api-console')" external class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all">
              🔌 API Console
            </NuxtLink>
            <span class="text-slate-600 font-bold">/</span>
            <NuxtLink :to="getMainUrl('/admin')" external class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all">
              📊 Admin Dashboard
            </NuxtLink>
          </div>

          <div class="flex items-center gap-3 mt-1 flex-wrap">
            <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2">
              ⚙️ API Gateway &amp; Rate Limits
            </h1>
            <span class="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/40 px-3 py-0.5 rounded-full text-xs font-black uppercase font-mono shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              v2.6 PURE-SQL
            </span>
          </div>

          <p class="text-slate-400 text-xs sm:text-sm max-w-2xl">
            Gestisci allocazioni di traffico, assegna quote personalizzate (Rate Limit) e controlla lo stato operativo delle API Key utenti nel DB Neon.
          </p>
        </div>

        <button 
          @click="fetchGatewayData" 
          :disabled="isLoading"
          class="relative z-10 px-4 py-2.5 rounded-xl font-black text-xs font-mono bg-[#040814] border border-slate-800 hover:border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span :class="{'animate-spin': isLoading}">🔄</span>
          {{ isLoading ? 'Sincronizzazione...' : 'Aggiorna Dati Gateway' }}
        </button>
      </header>

      <!-- METRICHE TOP TELEMETRIA GATEWAY -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-cyan-500/50 transition-all group shadow-lg">
          <span class="text-xs font-bold text-slate-400 font-mono uppercase">Totale Chiavi Gateway</span>
          <div class="text-3xl font-black text-white my-2 font-mono group-hover:scale-105 transition-transform">
            {{ totalKeys }}
          </div>
          <span class="text-xs text-slate-500 font-mono">Registrate su NeonDB</span>
        </div>

        <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/50 transition-all group shadow-lg">
          <span class="text-xs font-bold text-slate-400 font-mono uppercase">Chiavi Attive (ACTIVE)</span>
          <div class="text-3xl font-black text-emerald-400 my-2 font-mono group-hover:scale-105 transition-transform">
            {{ activeKeys }}
          </div>
          <span class="text-xs text-emerald-400/80 font-mono">🟢 Accesso Consolidato</span>
        </div>

        <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-rose-500/50 transition-all group shadow-lg">
          <span class="text-xs font-bold text-slate-400 font-mono uppercase">Sospese / Revocate</span>
          <div class="text-3xl font-black text-rose-400 my-2 font-mono group-hover:scale-105 transition-transform">
            {{ suspendedKeys }}
          </div>
          <span class="text-xs text-rose-400/80 font-mono">🚫 Rate Limit o Block</span>
        </div>

        <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-purple-500/50 transition-all group shadow-lg">
          <span class="text-xs font-bold text-slate-400 font-mono uppercase">Consumo Mensile Globale</span>
          <div class="text-3xl font-black text-purple-400 my-2 font-mono group-hover:scale-105 transition-transform">
            {{ totalUsageMonth.toLocaleString() }}
          </div>
          <span class="text-xs text-purple-300 font-mono">Richieste totali erogate</span>
        </div>
      </section>

      <!-- BARRA FILTRI & SEARCH -->
      <section class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div class="relative flex-1">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cerca per Email cliente, API Key o Prodotto..." 
            class="w-full bg-[#040814] border border-slate-800 pl-11 pr-4 py-3 rounded-xl text-slate-100 text-xs sm:text-sm outline-none focus:border-cyan-500 transition-all font-mono"
          />
        </div>

        <div class="flex items-center gap-3 font-mono text-xs">
          <label class="text-slate-400 font-bold whitespace-nowrap">Stato:</label>
          <select 
            v-model="selectedStatusFilter"
            class="bg-[#040814] border border-slate-800 text-cyan-400 px-3.5 py-3 rounded-xl font-bold outline-none focus:border-cyan-500 transition-all cursor-pointer"
          >
            <option value="all">Tutti gli Stati</option>
            <option value="active">Attive (Active)</option>
            <option value="suspended">Sospese (Suspended)</option>
            <option value="revoked">Revocate (Revoked)</option>
          </select>
        </div>
      </section>

      <!-- TABELLA LICENZE & RATE LIMITS -->
      <section class="bg-[#080d1a] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        
        <!-- STATO CARICAMENTO -->
        <div v-if="isLoading" class="p-12 text-center text-slate-400 font-mono text-sm flex flex-col items-center gap-3">
          <span class="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
          <span>Sincronizzazione tabelle API Gateway con NeonDB Pure SQL...</span>
        </div>

        <!-- STATO ERRORE DATABASE -->
        <div v-else-if="fetchError" class="p-12 text-center flex flex-col items-center gap-3">
          <span class="text-4xl">⚠️</span>
          <h3 class="text-amber-400 font-bold text-lg">Errore Connessione Tabella Licenze</h3>
          <p class="text-slate-400 text-xs sm:text-sm max-w-md font-mono">{{ fetchError }}</p>
          <button @click="fetchGatewayData" class="mt-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-mono font-bold hover:bg-amber-500 hover:text-slate-950 transition-all cursor-pointer">
            🔄 Riprova Connessione
          </button>
        </div>

        <!-- TABELLA DATI -->
        <div v-else-if="filteredLicenses.length" class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr class="bg-[#040814] text-slate-400 font-extrabold text-[11px] uppercase border-b border-slate-800 font-mono">
                <th class="p-4">Utente / Email</th>
                <th class="p-4">Prodotto / Tier</th>
                <th class="p-4">API Key Token</th>
                <th class="p-4">Consumo Quota Mensile</th>
                <th class="p-4">Stato</th>
                <th class="p-4 text-right">Azioni Admin</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredLicenses" :key="item.id" class="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                <td class="p-4">
                  <div class="flex flex-col">
                    <strong class="text-white font-bold">{{ item.customerEmail || 'utente@devkernelpulse.com' }}</strong>
                    <span class="text-[10px] text-slate-500 font-mono">ID: {{ String(item.id).substring(0, 8) }}...</span>
                  </div>
                </td>
                <td class="p-4">
                  <span class="bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded text-[10px] font-black font-mono">
                    {{ item.productName || 'DKP Core Suite' }}
                  </span>
                </td>
                <td class="p-4">
                  <code 
                    class="bg-slate-900 text-emerald-400 border border-slate-800 px-2.5 py-1 rounded font-mono text-xs cursor-pointer hover:border-emerald-500/50 transition-all inline-block"
                    @click="copyKey(item.id, item.licenseKey)"
                    :title="'Clicca per copiare'"
                  >
                    {{ copiedKeyId === item.id ? 'Copiata! ✓' : (item.licenseKey || '').substring(0, 16) + '...' }}
                  </code>
                </td>
                <td class="p-4 font-mono">
                  <div class="flex flex-col gap-1.5 w-44">
                    <div class="flex justify-between text-xs">
                      <strong class="text-white">{{ (item.downloadsCount || 0).toLocaleString() }}</strong>
                      <span class="text-slate-400">/ {{ (item.maxDownloads || 0).toLocaleString() }}</span>
                    </div>
                    <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        :class="[
                          'h-full transition-all duration-300',
                          (item.maxDownloads > 0 && (item.downloadsCount / item.maxDownloads) >= 0.8) 
                            ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' 
                            : 'bg-emerald-400 shadow-[0_0_8px_#00dc82]'
                        ]" 
                        :style="{ width: `${Math.min(100, item.maxDownloads > 0 ? (item.downloadsCount / item.maxDownloads) * 100 : 0)}%` }"
                      ></div>
                    </div>
                  </div>
                </td>
                <td class="p-4">
                  <span 
                    :class="[
                      'px-2.5 py-1 rounded text-[10px] font-black uppercase font-mono',
                      normalizeStatus(item.status) === 'active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      normalizeStatus(item.status) === 'suspended' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                      'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    ]"
                  >
                    {{ normalizeStatus(item.status).toUpperCase() }}
                  </span>
                </td>
                <td class="p-4 text-right">
                  <div class="flex justify-end items-center gap-2 font-mono">
                    <button 
                      @click="openEditModal(item)" 
                      class="px-2.5 py-1.5 bg-cyan-500/15 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 rounded-lg text-xs font-bold transition-all cursor-pointer" 
                      title="Modifica Limiti Quota"
                    >
                      ✏️ Limiti
                    </button>
                    <button 
                      @click="resetQuotaUsage(item.id)" 
                      class="px-2.5 py-1.5 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 text-amber-400 rounded-lg text-xs font-bold transition-all cursor-pointer" 
                      title="Azzera Consumo Mese"
                    >
                      🔄 Reset
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- STATO VUOTO -->
        <div v-else class="p-12 text-center text-slate-500 font-mono text-sm">
          Nessuna licenza o API Key trovata corrispondente ai criteri di ricerca.
        </div>
      </section>

      <!-- MODALE MODIFICA LIMITI E STATO -->
      <Transition name="fade">
        <div v-if="isEditModalOpen" class="fixed inset-0 z-50 bg-[#020420]/80 backdrop-blur-sm flex items-center justify-center p-4" @click.self="isEditModalOpen = false">
          <div class="bg-[#080d1a] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-6 relative">
            
            <div class="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 class="text-white font-bold text-lg flex items-center gap-2">
                <span>⚙️ Modifica Limiti Quota &amp; Stato</span>
              </h3>
              <button @click="isEditModalOpen = false" class="text-slate-500 hover:text-white text-xl font-bold transition-colors cursor-pointer">
                ✕
              </button>
            </div>

            <div class="flex flex-col gap-5 text-xs sm:text-sm" v-if="editingLicense">
              <div class="bg-[#040814] border border-slate-800/80 p-3.5 rounded-xl font-mono">
                <span class="text-slate-400 block text-[11px]">CLIENTE SELEZIONATO:</span>
                <strong class="text-white font-bold">{{ editingLicense.customerEmail }}</strong>
              </div>

              <!-- IMPOSTAZIONE QUOTA MAX -->
              <div class="flex flex-col gap-2 font-mono">
                <label class="text-slate-300 font-bold">Quota Max Richieste (Rate Limit Mensile):</label>
                <input 
                  v-model.number="newMaxDownloads" 
                  type="number" 
                  min="100" 
                  step="500" 
                  class="bg-[#040814] border border-slate-800 px-4 py-3 rounded-xl text-emerald-400 font-bold outline-none focus:border-emerald-500 transition-all"
                />
                
                <!-- PRESET RAPIDI -->
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                  <span class="text-[10px] text-slate-500">Preset:</span>
                  <button @click="setQuotaPreset(1000)" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer">1k (Free)</button>
                  <button @click="setQuotaPreset(10000)" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer">10k (Starter)</button>
                  <button @click="setQuotaPreset(100000)" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer">100k (Pro)</button>
                  <button @click="setQuotaPreset(1000000)" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer">1M (Enterprise)</button>
                </div>
              </div>

              <!-- IMPOSTAZIONE STATO -->
              <div class="flex flex-col gap-2 font-mono">
                <label class="text-slate-300 font-bold">Stato Operativo Licenza API:</label>
                <select 
                  v-model="newStatus"
                  class="bg-[#040814] border border-slate-800 text-white px-4 py-3 rounded-xl font-bold outline-none focus:border-cyan-500 transition-all cursor-pointer"
                >
                  <option value="active">Active (Funzionante 🟢)</option>
                  <option value="suspended">Suspended (Sospesa temporaneamente ⚠️)</option>
                  <option value="revoked">Revoked (Bloccata definitivamente 🔴)</option>
                </select>
              </div>
            </div>

            <div class="flex justify-end items-center gap-3 border-t border-slate-800 pt-4 font-mono">
              <button @click="isEditModalOpen = false" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer">
                Annulla
              </button>
              <button @click="saveLicenseChanges" class="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer">
                Salva Modifiche
              </button>
            </div>
          </div>
        </div>
      </Transition>

    </div>
  </div>
</template>

<style scoped>
.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(-15px) scale(0.95); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>