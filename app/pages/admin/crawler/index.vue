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
    <!-- BARRA SEMPLICE "TORNA ALLA DASHBOARD" (TOP BAR STANDARD) -->
    <div class="admin-top-bar">
      <div class="admin-breadcrumb">
        <span class="status-dot green"></span>
        <span class="breadcrumb-text">ADMIN CONTROL CENTER</span>
      </div>

      <NuxtLink to="/admin" class="btn-back-dashboard">
        📊 Torna alla Dashboard
      </NuxtLink>
    </div>

    <!-- HEADER HERO CRAWLER ENGINE v2.4-GOLD -->
    <header class="panel-header">
      <div class="header-title">
        <div class="hero-badge">
          <span class="badge-status green">DKP KERNEL CRAWLER ENGINE v2.4-GOLD</span>
        </div>
        <h2>Control Center <span class="brand-highlight">Ingestione Notizie</span></h2>
        <p class="sub-lead">
          Interroga i provider tech globali (HN, Dev.to, RemoteOK), filtra i doppioni e popola Neon DB in tempo reale.
        </p>
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

/* ==========================================================================
   PANNELLO CRAWLER & HEADER GRAPHICS
   ========================================================================== */
.crawler-admin-panel {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 2rem;
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 12px;
  color: #f8fafc;
  font-family: inherit;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.hero-badge {
  margin-bottom: 0.5rem;
}

.badge-status.green {
  font-size: 0.72rem;
  font-weight: 800;
  color: #00dc82;
  background: rgba(0, 220, 130, 0.1);
  border: 1px solid rgba(0, 220, 130, 0.3);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  letter-spacing: 0.04em;
}

.panel-header h2 {
  font-size: 2rem;
  font-weight: 900;
  margin: 0 0 0.5rem 0;
  color: #ffffff;
}

.brand-highlight {
  color: #00dc82;
}

.sub-lead {
  color: #94a3b8;
  font-size: 0.92rem;
  margin: 0;
}

/* CRAWLER GRID & CARDS */
.crawler-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .crawler-grid {
    grid-template-columns: 1fr;
  }
}

.config-card, .results-card {
  background: #060a12;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #1e293b;
}

.config-card h3, .results-card h3 {
  color: #00dc82;
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.input-group {
  margin-bottom: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.input-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #94a3b8;
}

.dark-input {
  background: #090d16;
  border: 1px solid #334155;
  color: #fff;
  padding: 0.75rem;
  border-radius: 6px;
  font-family: monospace;
}

.dark-input:focus {
  outline: none;
  border-color: #00dc82;
}

.btn-primary {
  background: #00dc82;
  color: #020420;
  font-weight: 800;
  border: none;
  padding: 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
}

.btn-primary:disabled, .btn-secondary:disabled {
  background: #334155;
  cursor: not-allowed;
  color: #94a3b8;
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.4);
}

.btn-secondary {
  background: #1e293b;
  color: #f8fafc;
  font-weight: 600;
  border: 1px solid #334155;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: #334155;
  border-color: #00dc82;
}

.console-box {
  background: #000;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 1rem;
  min-height: 180px;
  font-family: monospace;
  font-size: 0.9rem;
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.log-line.status { color: #38bdf8; }
.log-line.error { color: #ef4444; }
.log-line strong { color: #00dc82; }
.highlight { color: #f59e0b; font-weight: bold; }
</style>