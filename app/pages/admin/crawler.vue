<!-- app/pages/admin/crawler.vue -->
<script setup lang="ts">
definePageMeta({ middleware: 'admin-only' })

useDkpSeo({
  title: 'DKP Crawler Engine - Control Center',
  description: 'Gestione ed esecuzione del motore di ingestione notizie e progetti di DevKernelPulse.'
})

const targetCategory = ref<'news' | 'ask' | 'show' | 'job'>('news')
const storyLimit = ref<number>(10)
const isLoading = ref(false)
const isResetting = ref(false)
const statusMessage = ref('')
const logs = ref<string[]>([])

function addLog(msg: string) {
  logs.value.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`)
}

async function runCrawler() {
  isLoading.value = true
  statusMessage.value = ''
  addLog(`🤖 Avvio Crawler Engine [Target: ${targetCategory.value.toUpperCase()} | Max: ${storyLimit.value}]...`)

  try {
    const res = await $fetch<{ success: boolean; count: number; message: string }>('/api/admin/crawler/run', {
      method: 'POST',
      body: { 
        category: targetCategory.value,
        limit: storyLimit.value 
      }
    })

    if (res.success) {
      statusMessage.value = res.message
      addLog(`✅ Completato! Ingeriti ${res.count} contenuti unici in ${targetCategory.value.toUpperCase()}.`)
    }
  } catch (e: any) {
    addLog(`❌ Errore Crawler: ${e.statusMessage || e.message}`)
  } finally {
    isLoading.value = false
  }
}

async function resetDatabase() {
  if (import.meta.client) {
    const confirmed = window.confirm("Sei sicuro di voler SVUOTARE l'intero database delle notizie e dei job? L'operazione è irreversibile.")
    if (!confirmed) return
  }

  isResetting.value = true
  addLog('🧹 Pulizia totale database Neon in corso...')

  try {
    const res = await $fetch<{ success: boolean; message: string }>('/api/admin/db-reset', {
      method: 'POST'
    })

    if (res.success) {
      addLog(`✅ DB Resettato: ${res.message}`)
    }
  } catch (e: any) {
    addLog(`❌ Errore Reset: ${e.statusMessage || e.message}`)
  } finally {
    isResetting.value = false
  }
}
</script>

<template>
  <div class="admin-page-container">
    <div class="header-section">
      <div class="badge">DKP KERNEL CRAWLER ENGINE v2.3</div>
      <h1>Control Center <span class="highlight">Ingestione Notizie</span></h1>
      <p class="subtitle">Interroga i provider tech globali (HN, Dev.to, RemoteOK), filtra i doppioni e popola Neon DB in tempo reale.</p>
    </div>

    <div class="admin-grid">
      <!-- Pannello Controlli -->
      <div class="card control-card">
        <h3>⚡ Azioni Kernel Istantanee</h3>
        
        <!-- Selezione Categoria -->
        <div class="form-group">
          <label>Sezione Destinazione</label>
          <select v-model="targetCategory" :disabled="isLoading">
            <option value="news">📰 Tech Feed (News & General)</option>
            <option value="ask">💬 Ask DKP (Q&A e Discussioni)</option>
            <option value="show">🚀 Show DKP (Showcase & Progetti)</option>
            <option value="job">💼 Job Board (Offerte di Lavoro)</option>
          </select>
        </div>

        <!-- Selezione Limite Ridotto -->
        <div class="form-group">
          <label>Numero Max Elementi Unici</label>
          <select v-model="storyLimit" :disabled="isLoading">
            <option :value="5">5 Contenuti Unici</option>
            <option :value="10">10 Contenuti Unici (Consigliato)</option>
          </select>
        </div>

        <div class="btn-stack">
          <button type="button" @click="runCrawler" class="btn-run" :disabled="isLoading || isResetting">
            <span v-if="isLoading">🤖 Ingestione in corso...</span>
            <span v-else>🚀 Avvia Crawler {{ targetCategory.toUpperCase() }}</span>
          </button>

          <button type="button" @click="resetDatabase" class="btn-reset" :disabled="isLoading || isResetting">
            <span v-if="isResetting">🧹 Pulizia DB...</span>
            <span v-else>🗑️ Reset Totale Database Neon</span>
          </button>
        </div>

        <div v-if="statusMessage" class="success-banner">
          ✨ {{ statusMessage }}
        </div>
      </div>

      <!-- Console Log Ingestione -->
      <div class="card log-card">
        <h3>💻 Log Console DKP Kernel Engine</h3>
        <div class="log-terminal">
          <div v-if="logs.length === 0" class="log-empty">
            Kernel v2.3 in attesa di comandi...
          </div>
          <div v-for="(log, i) in logs" :key="i" class="log-line">
            {{ log }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page-container { padding: 2rem; background: #020420; min-height: 90vh; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
.header-section { margin-bottom: 2rem; }
.badge { display: inline-block; background: rgba(0, 220, 130, 0.15); color: #00dc82; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 4px; border: 1px solid rgba(0, 220, 130, 0.3); margin-bottom: 0.5rem; }
.highlight { color: #00dc82; }
.subtitle { color: #94a3b8; font-size: 0.9rem; }

.admin-grid { display: grid; grid-template-columns: 380px 1fr; gap: 1.5rem; }
.card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; }

.form-group label { display: block; font-size: 0.8rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.4rem; }
.form-group select { width: 100%; background: #020420; border: 1px solid #1e293b; color: #fff; padding: 0.65rem; border-radius: 6px; margin-bottom: 1.25rem; font-size: 0.9rem; }

.btn-stack { display: flex; flex-direction: column; gap: 0.75rem; }
.btn-run { background: #00dc82; color: #020420; font-weight: 800; padding: 0.85rem; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; transition: background 0.2s; }
.btn-run:hover { background: #00bf71; }

.btn-reset { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); font-weight: 800; padding: 0.75rem; border-radius: 8px; cursor: pointer; font-size: 0.88rem; transition: background 0.2s; }
.btn-reset:hover { background: rgba(239, 68, 68, 0.3); }

.success-banner { background: rgba(0, 220, 130, 0.15); border: 1px solid #00dc82; color: #00dc82; padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; margin-top: 1rem; }

.log-terminal { background: #020420; border: 1px solid #1e293b; border-radius: 8px; padding: 1rem; font-family: monospace; font-size: 0.82rem; height: 320px; overflow-y: auto; }
.log-empty { color: #64748b; font-style: italic; }
.log-line { color: #38bdf8; margin-bottom: 0.4rem; border-bottom: 1px solid rgba(30, 41, 59, 0.5); padding-bottom: 0.2rem; }

@media (max-width: 900px) {
  .admin-grid { grid-template-columns: 1fr; }
}
</style>