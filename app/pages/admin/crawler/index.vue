<!-- pages/admin/crawler/index.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const licenseKey = ref('DKP-CRW-V24-GOLD-DEMO')
const targetUrl = ref('https://news.ycombinator.com/')
const selectedSection = ref('news') // Valore dinamico collegato alla select
const selectedLimit = ref(5)
const statusMessage = ref('Pannello Crawler SaaS pronto all\'uso.')
const isRunning = ref(false)
const latestResult = ref<any>(null)

// Esecuzione Sub-Engine basata sulla select attiva
async function runSelectedEngine() {
  isRunning.value = true
  statusMessage.value = `Avvio Crawler Engine per sezione: '${selectedSection.value.toUpperCase()}' (Limit: ${selectedLimit.value})...`
  latestResult.value = null

  try {
    const res: any = await $fetch('/api/admin/crawler/run', {
      method: 'POST',
      body: { 
        section: selectedSection.value, 
        limit: selectedLimit.value 
      }
    })
    statusMessage.value = res.message
    latestResult.value = { itemsFound: res.addedCount, section: res.section }
  } catch (err: any) {
    statusMessage.value = err.statusMessage || err.message || 'Errore durante l\'esecuzione dell\'Engine'
  } finally {
    isRunning.value = false
  }
}

async function purgeDatabase() {
  isRunning.value = true
  statusMessage.value = 'Rimozione elementi duplicati dal DB...'
  try {
    const res: any = await $fetch('/api/admin/crawler/purge', { method: 'POST' })
    statusMessage.value = res.message
  } catch (err: any) {
    statusMessage.value = 'Errore durante la pulizia.'
  } finally {
    isRunning.value = false
  }
}
</script>

<template>
  <div class="crawler-admin-panel">
    <header class="panel-header">
      <div class="header-title">
        <h2>🤖 DKP Crawler Engine <span class="badge-saas">SaaS Plugin v2.4</span></h2>
        <p>Interroga i provider tech globali, filtra i doppioni e popola Neon DB per categoria.</p>
      </div>
      <button @click="purgeDatabase" :disabled="isRunning" class="btn-secondary">
        🧹 Purge Duplicati DB
      </button>
    </header>

    <div class="crawler-grid">
      <!-- Sezione Azioni Istantanee con Select dinamica -->
      <section class="config-card">
        <h3>⚡ Azioni Kernel Istantanee</h3>
        
        <div class="input-group">
          <label>Sezione Destinazione</label>
          <select v-model="selectedSection" class="dark-input">
            <option value="news">📰 Tech News (Dev.to + HN)</option>
            <option value="ask">💬 Ask Community (Discussioni & Q&A)</option>
            <option value="show">🚀 Show DKP (GitHub Trending)</option>
            <option value="jobs">💼 Tech Jobs Hub (RemoteOK)</option>
          </select>
        </div>

        <div class="input-group">
          <label>Numero Max Elementi Unici</label>
          <select v-model.number="selectedLimit" class="dark-input">
            <option :value="5">5 Contenuti</option>
            <option :value="10">10 Contenuti</option>
            <option :value="20">20 Contenuti</option>
          </select>
        </div>

        <button @click="runSelectedEngine" :disabled="isRunning" class="btn-primary">
          <span v-if="!isRunning">🚀 Avvia Crawler {{ selectedSection.toUpperCase() }}</span>
          <span v-else>⏳ Sincronizzazione in corso...</span>
        </button>
      </section>

      <!-- Console di Monitoraggio -->
      <section class="results-card">
        <h3>📊 Log Console DKP Kernel Engine</h3>
        
        <div class="console-box">
          <div class="log-line status" :class="{ 'error': statusMessage.includes('Errore') }">
            > {{ statusMessage }}
          </div>
          
          <template v-if="latestResult">
            <div class="log-line">> Elementi acquisiti: <strong>{{ latestResult.itemsFound }}</strong></div>
            <div class="log-line">> Categoria di destinazione: <span class="highlight">{{ latestResult.section?.toUpperCase() }}</span></div>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.crawler-admin-panel { max-width: 1200px; margin: 2rem auto; padding: 2rem; background: #020420; border: 1px solid #1e293b; border-radius: 12px; color: #f8fafc; font-family: inherit; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid #1e293b; padding-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
.panel-header h2 { font-size: 1.8rem; font-weight: 900; display: flex; align-items: center; gap: 1rem; margin: 0; }
.badge-saas { font-size: 0.7rem; background: #38bdf8; color: #020420; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 800; }

.crawler-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
@media (max-width: 768px) { .crawler-grid { grid-template-columns: 1fr; } }

.config-card, .results-card { background: #060a12; padding: 1.5rem; border-radius: 8px; border: 1px solid #1e293b; }
.config-card h3, .results-card h3 { color: #00dc82; margin-top: 0; margin-bottom: 1rem; font-size: 1.2rem; }

.input-group { margin-bottom: 1.2rem; display: flex; flex-direction: column; gap: 0.4rem; }
.input-group label { font-size: 0.85rem; font-weight: 600; color: #94a3b8; }
.dark-input { background: #090d16; border: 1px solid #334155; color: #fff; padding: 0.75rem; border-radius: 6px; font-family: monospace; }
.dark-input:focus { outline: none; border-color: #00dc82; }

.btn-primary { background: #00dc82; color: #020420; font-weight: 800; border: none; padding: 0.8rem; border-radius: 6px; cursor: pointer; width: 100%; transition: all 0.2s; }
.btn-primary:disabled, .btn-secondary:disabled { background: #334155; cursor: not-allowed; color: #94a3b8; }
.btn-primary:hover:not(:disabled) { box-shadow: 0 0 15px rgba(0, 220, 130, 0.4); }

.btn-secondary { background: #1e293b; color: #f8fafc; font-weight: 600; border: 1px solid #334155; padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.btn-secondary:hover:not(:disabled) { background: #334155; border-color: #00dc82; }

.console-box { background: #000; border: 1px solid #334155; border-radius: 6px; padding: 1rem; min-height: 180px; font-family: monospace; font-size: 0.9rem; color: #cbd5e1; display: flex; flex-direction: column; gap: 0.5rem; }
.log-line.status { color: #38bdf8; }
.log-line.error { color: #ef4444; }
.log-line strong { color: #00dc82; }
.highlight { color: #f59e0b; font-weight: bold; }
</style>