<!-- app/pages/admin/crawler/index.vue -->
<script setup lang="ts">
import { ref } from 'vue'

useDkpSeo({
  title: 'Crawler Engine v2.4-GOLD - DKP Admin Center',
  description: 'Ingestione notizie, scraping euristico multi-provider e sincronizzazione Neon DB in tempo reale.'
})

const { getMainUrl, getMailUrl, getApiUrl } = useDomain()

// Stato reattivo Crawler
const selectedSection = ref<'news' | 'ask' | 'show' | 'jobs'>('news')
const selectedLimit = ref(5)
const statusMessage = ref('Pannello Crawler SaaS v2.4-GOLD pronto all\'uso.')
const isRunning = ref(false)
const latestResult = ref<{ itemsFound: number; section: string; timestamp: string } | null>(null)

// Stato Notifiche Toast
const showToast = ref(false)
const toastMessage = ref('')

function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

// Esecuzione Sub-Engine basata sulla select attiva
async function runSelectedEngine() {
  isRunning.value = true
  statusMessage.value = `[${new Date().toLocaleTimeString()}] Avvio Crawler Engine per sezione: '${selectedSection.value.toUpperCase()}' (Limit: ${selectedLimit.value})...`
  latestResult.value = null

  try {
    const res: any = await $fetch('/api/admin/crawler/run', {
      method: 'POST',
      body: { 
        section: selectedSection.value, 
        limit: selectedLimit.value 
      }
    })
    statusMessage.value = res.message || 'Sincronizzazione completata con successo.'
    latestResult.value = { 
      itemsFound: res.addedCount ?? 0, 
      section: res.section || selectedSection.value,
      timestamp: new Date().toLocaleTimeString()
    }
    triggerToast(`🚀 Ingestione completata: ${res.addedCount ?? 0} nuovi elementi in DB!`)
  } catch (err: any) {
    statusMessage.value = `[ERRORE] ${err.statusMessage || err.message || 'Errore durante l\'esecuzione dell\'Engine'}`
    triggerToast('❌ Errore durante l\'esecuzione del Crawler Engine.')
  } finally {
    isRunning.value = false
  }
}

async function purgeDatabase() {
  isRunning.value = true
  statusMessage.value = `[${new Date().toLocaleTimeString()}] Rimozione elementi duplicati ed ottimizzazione tabelle DB...`
  try {
    const res: any = await $fetch('/api/admin/crawler/purge', { method: 'POST' })
    statusMessage.value = res.message || 'Pulizia duplicati completata.'
    triggerToast('🧹 DB Purge: Duplicati rimossi e indici ottimizzati!')
  } catch (err: any) {
    statusMessage.value = '[ERRORE] Impossibile completare la pulizia del database.'
    triggerToast('❌ Errore durante la rimozione dei duplicati.')
  } finally {
    isRunning.value = false
  }
}
</script>

<template>
  <div class="crawler-admin-panel">
    <!-- FINESTRELLA TOAST NOTIFICATION -->
    <Transition name="toast-fade">
      <div v-if="showToast" class="dkp-toast-success">
        <div class="toast-content">
          <span class="toast-icon">✅</span>
          <span class="toast-text">{{ toastMessage }}</span>
        </div>
      </div>
    </Transition>

    <!-- NAVBAR GRID ADMIN UNIFICATA v2.4-GOLD -->
    <div class="admin-nav-container">
      <div class="admin-nav-top">
        <div class="nav-branding">
          <span class="status-dot green"></span>
          <span class="nav-title">DKP ADMIN CONTROL CENTER</span>
        </div>

        <NuxtLink :to="getMainUrl('/admin')" external class="nav-tab btn-dashboard-main">
          🏠 Dashboard Main
        </NuxtLink>
      </div>

      <!-- GRID MODULI ADMIN -->
      <nav class="admin-grid-nav">
        <NuxtLink :to="getMainUrl('/admin/api-gateway')" external class="nav-tab btn-dashboard">⚙️ API Gateway</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/mail')" external class="nav-tab btn-dashboard">📧 Mail Center</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/newsletter')" external class="nav-tab btn-dashboard">📣 Newsletter</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/autoresponder')" external class="nav-tab btn-dashboard">📡 Autoresponder</NuxtLink>

        <NuxtLink :to="getMainUrl('/admin/crawler')" external class="nav-tab btn-dashboard active">🤖 Crawler Engine</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/blog')" external class="nav-tab btn-dashboard">📝 Gestione Blog</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/shop')" external class="nav-tab btn-dashboard">🛍️ Gestione Shop</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/jobs')" external class="nav-tab btn-dashboard">💼 Gestione Jobs</NuxtLink>
      </nav>
    </div>

    <!-- HEADER HERO CRAWLER ENGINE v2.4-GOLD -->
    <header class="panel-header">
      <div class="header-title">
        <div class="hero-badge">
          <span class="badge-status gold">DKP KERNEL CRAWLER ENGINE v2.4-GOLD</span>
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
      <!-- CONFIGURAZIONE & AZIONI -->
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

      <!-- TERMINAL CONSOLE LOGS -->
      <section class="results-card">
        <h3>📊 Log Console DKP Kernel Engine</h3>
        
        <div class="console-box">
          <div class="log-line status" :class="{ 'error': statusMessage.includes('[ERRORE]') }">
            > {{ statusMessage }}
          </div>
          
          <template v-if="latestResult">
            <div class="log-line">> [{{ latestResult.timestamp }}] Ingestione completata con successo.</div>
            <div class="log-line">> Nuovi elementi acquisiti: <strong>{{ latestResult.itemsFound }}</strong></div>
            <div class="log-line">> Categoria sincronizzata: <span class="highlight">{{ latestResult.section.toUpperCase() }}</span></div>
          </template>

          <div v-if="isRunning" class="log-line loading-line">
            <span class="spinner">⚡</span> Connessione ai provider esterni ed hashing URL in corso...
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* ==========================================================================
   STILI DKP ADMIN NAVBAR v2.4-GOLD
   ========================================================================== */
.admin-nav-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #090d16;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 20px;
}

.admin-nav-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.nav-branding {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot.green {
  width: 8px;
  height: 8px;
  background-color: #00ff87;
  border-radius: 50%;
  box-shadow: 0 0 8px #00ff87;
}

.nav-title {
  color: #00f0ff;
  font-weight: 800;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
}

.admin-grid-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.nav-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.88rem;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

.btn-dashboard {
  color: #00ff87;
  background: rgba(0, 255, 135, 0.04);
  border: 1px solid rgba(0, 255, 135, 0.3);
}

.btn-dashboard:hover,
.btn-dashboard.active {
  background: rgba(0, 255, 135, 0.12);
  border-color: #00ff87;
  box-shadow: 0 0 12px rgba(0, 255, 135, 0.25);
  transform: translateY(-1px);
}

.btn-dashboard-main {
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.06);
  border: 1px solid rgba(0, 240, 255, 0.4);
}

.btn-dashboard-main:hover {
  background: rgba(0, 240, 255, 0.16);
  border-color: #00f0ff;
  box-shadow: 0 0 14px rgba(0, 240, 255, 0.35);
  transform: translateY(-1px);
}

@media (max-width: 1024px) {
  .admin-grid-nav { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 580px) {
  .admin-grid-nav { grid-template-columns: 1fr; }
}

/* ==========================================================================
   TOAST NOTIFICATION
   ========================================================================== */
.dkp-toast-success {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 999999;
  background: #061811;
  border: 1px solid #00dc82;
  box-shadow: 0 10px 30px rgba(0, 220, 130, 0.35);
  padding: 0.9rem 1.3rem;
  border-radius: 10px;
  backdrop-filter: blur(16px);
  max-width: 420px;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: #f8fafc;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85rem;
  font-weight: 600;
}

.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(-15px) scale(0.95); }

/* ==========================================================================
   LAYOUT PANNELLO CRAWLER & HERO
   ========================================================================== */
.crawler-admin-panel {
  max-width: 1240px;
  margin: 0 auto;
  padding-bottom: 4rem;
  color: #f8fafc;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  flex-wrap: wrap;
  gap: 1rem;
}

.hero-badge { margin-bottom: 0.5rem; }

.badge-status.gold {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  border: 1px solid #00dc82;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 800;
  box-shadow: 0 0 10px rgba(0, 220, 130, 0.2);
}

.panel-header h2 {
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0 0 0.4rem 0;
  color: #ffffff;
}

.brand-highlight { color: #00dc82; }
.sub-lead { color: #94a3b8; font-size: 0.92rem; margin: 0; }

.crawler-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 850px) {
  .crawler-grid { grid-template-columns: 1fr; }
}

.config-card, .results-card {
  background: #090d16;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #1e293b;
}

.config-card h3, .results-card h3 {
  color: #00dc82;
  margin-top: 0;
  margin-bottom: 1.25rem;
  font-size: 1.15rem;
  font-weight: 800;
}

.input-group {
  margin-bottom: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.input-group label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.dark-input {
  background: #020420;
  border: 1px solid #1e293b;
  color: #fff;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.88rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.dark-input:focus { border-color: #00dc82; }

.btn-primary {
  background: #00dc82;
  color: #020420;
  font-weight: 900;
  border: none;
  padding: 0.85rem;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  font-size: 0.92rem;
  transition: all 0.2s ease;
}

.btn-primary:disabled, .btn-secondary:disabled {
  background: #1e293b;
  cursor: not-allowed;
  color: #64748b;
  border-color: transparent;
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 0 18px rgba(0, 220, 130, 0.4);
  transform: translateY(-1px);
}

.btn-secondary {
  background: #020420;
  color: #f8fafc;
  font-weight: 700;
  border: 1px solid #1e293b;
  padding: 0.65rem 1.1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(0, 220, 130, 0.08);
  border-color: #00dc82;
  color: #00dc82;
}

/* TERMINAL CONSOLE */
.console-box {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 1.25rem;
  min-height: 220px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.88rem;
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.log-line.status { color: #38bdf8; }
.log-line.error { color: #ef4444; }
.log-line strong { color: #00dc82; }
.highlight { color: #f59e0b; font-weight: bold; }

.loading-line {
  color: #a855f7;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  display: inline-block;
  animation: pulse 1s infinite alternate;
}

@keyframes pulse {
  from { opacity: 0.3; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1.1); }
}
</style>