<!-- app/pages/admin/crawler.vue -->
<script setup lang="ts">
definePageMeta({ middleware: 'admin-only' })

useDkpSeo({
  title: 'DKP Crawler Engine - Control Center',
  description: 'Gestione ed esecuzione del motore di ingestione notizie automatico di DevKernelPulse.'
})

const storyLimit = ref(12)
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
  addLog(`🤖 Avvio DKP Crawler Engine (Limite: ${storyLimit.value} notizie)...`)

  try {
    const res = await $fetch<{ success: boolean; count: number; message: string }>('/api/admin/crawler/run', {
      method: 'POST',
      body: { limit: storyLimit.value }
    })

    if (res.success) {
      statusMessage.value = res.message
      addLog(`✅ Completato! Ingeriti ${res.count} articoli nel database Neon.`)
    }
  } catch (e: any) {
    addLog(`❌ Errore Crawler: ${e.statusMessage || e.message}`)
  } finally {
    isLoading.value = false
  }
}

async function resetDatabase() {
  if (import.meta.client) {
    const confirmed = window.confirm("Sei sicuro di voler SVUOTARE l'intero database delle notizie? L'operazione e' irreversibile.")
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
      <div class="badge">DKP KERNEL CRAWLER ENGINE v2.0</div>
      <h1>Control Center <span class="highlight">Ingestione Notizie</span></h1>
      <p class="subtitle">Interroga i provider tech globali, filtra le storie e popola in tempo reale il database Neon.</p>
    </div>

    <div class="admin-grid">
      <!-- Pannello Controlli -->
      <div class="card control-card">
        <h3>⚡ Azioni Kernel Istantanee</h3>
        
        <div class="form-group">
          <label>Numero di Notizie da Ingerire</label>
          <select v-model="storyLimit" :disabled="isLoading">
            <option :value="5">5 Notizie Tech</option>
            <option :value="10">10 Notizie Tech</option>
            <option :value="15">15 Notizie Tech</option>
            <option :value="25">25 Notizie Tech (Full Feed)</option>
          </select>
        </div>

        <div class="btn-stack">
          <button type="button" @click="runCrawler" class="btn-run" :disabled="isLoading || isResetting">
            <span v-if="isLoading">🤖 Crawling in corso...</span>
            <span v-else>🚀 Avvia Crawler Istantaneo</span>
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
            Kernel in attesa di comandi...
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
.admin-page-container { padding: 2rem; background: #020420; min-height: 90vh; color: #f8fafc; }
.header-section { margin-bottom: 2rem; }
.badge { display: inline-block; background: rgba(0, 220, 130, 0.15); color: #00dc82; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 4px; border: 1px solid rgba(0, 220, 130, 0.3); margin-bottom: 0.5rem; }
.highlight { color: #00dc82; }
.subtitle { color: #94a3b8; font-size: 0.9rem; }

.admin-grid { display: grid; grid-template-columns: 380px 1fr; gap: 1.5rem; }
.card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; }

.form-group label { display: block; font-size: 0.8rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.4rem; }
.form-group select { width: 100%; background: #020420; border: 1px solid #1e293b; color: #fff; padding: 0.65rem; border-radius: 6px; margin-bottom: 1.25rem; font-size: 0.9rem; }

.btn-stack { display: flex; flex-direction: column; gap: 0.75rem; }
.btn-run { background: #00dc82; color: #020420; font-weight: 800; padding: 0.85rem; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; }
.btn-run:hover { background: #00bf71; }

.btn-reset { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); font-weight: 800; padding: 0.75rem; border-radius: 8px; cursor: pointer; font-size: 0.88rem; }
.btn-reset:hover { background: rgba(239, 68, 68, 0.3); }

.success-banner { background: rgba(0, 220, 130, 0.15); border: 1px solid #00dc82; color: #00dc82; padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; margin-top: 1rem; }

.log-terminal { background: #020420; border: 1px solid #1e293b; border-radius: 8px; padding: 1rem; font-family: monospace; font-size: 0.82rem; height: 320px; overflow-y: auto; }
.log-empty { color: #64748b; font-style: italic; }
.log-line { color: #38bdf8; margin-bottom: 0.4rem; border-bottom: 1px solid rgba(30, 41, 59, 0.5); padding-bottom: 0.2rem; }
</style>