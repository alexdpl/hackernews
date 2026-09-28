<!-- pages/admin/crawler.vue -->
<template>
  <div class="crawler-admin-container">
    
    <!-- HEADER CONTROL CENTER -->
    <div class="crawler-header">
      <span class="crawler-badge">DKP KERNEL CRAWLER ENGINE v2.4-GOLD</span>
      <h1 class="crawler-title">
        Control Center <span class="highlight">Ingestione Notizie</span>
      </h1>
      <p class="crawler-subtitle">
        Interroga i provider tech globali (HN, Dev.to, RemoteOK), filtra i doppioni e popola Neon DB in tempo reale.
      </p>
    </div>

    <div class="crawler-grid">
      
      <!-- PANNELLO AZIONI -->
      <div class="action-card">
        <h2 class="card-title">⚡ Azioni Kernel Istantanee</h2>

        <div class="form-group">
          <label class="form-label">Sezione Destinazione</label>
          <select v-model="selectedSection" class="form-select" :disabled="isCrawling">
            <option value="news">📰 Tech Feed (News & General)</option>
            <option value="ask">💬 Ask Community (Discussioni & Q&A)</option>
            <option value="show">⚡ Show DKP (Showcase Progetti)</option>
            <option value="jobs">💼 Tech Jobs Hub</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Numero Max Elementi Unici</label>
          <select v-model="selectedLimit" class="form-select" :disabled="isCrawling">
            <option :value="5">5 Contenuti Unici</option>
            <option :value="10">10 Contenuti Unici (Consigliato)</option>
            <option :value="15">15 Contenuti Unici</option>
            <option :value="25">25 Contenuti Unici</option>
          </select>
        </div>

        <button 
          @click="runCrawler" 
          class="btn-action btn-crawl" 
          :disabled="isCrawling || isResetting"
        >
          <span v-if="!isCrawling">🚀 Avvia Crawler {{ selectedSection.toUpperCase() }}</span>
          <span v-else>⏳ Ingestione {{ selectedSection.toUpperCase() }} in corso...</span>
        </button>

        <button 
          @click="resetDatabase" 
          class="btn-action btn-reset" 
          :disabled="isCrawling || isResetting"
        >
          <span v-if="!isResetting">🗑️ Reset Totale Database Neon</span>
          <span v-else>🧹 Pulizia DB in corso...</span>
        </button>
      </div>

      <!-- LOG CONSOLE DKP ENGINE -->
      <div class="console-card">
        <h2 class="card-title">💻 Log Console DKP Kernel Engine</h2>
        
        <div class="console-terminal" ref="terminalRef">
          <div v-for="(log, idx) in logs" :key="idx" class="log-line" :class="log.type">
            <span class="log-time">[{{ log.time }}]</span>
            <span class="log-msg">{{ log.message }}</span>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

definePageMeta({
  middleware: 'admin-only'
})

useHead({
  title: 'Control Center Ingestione Crawler v2.4-GOLD'
})

const selectedSection = ref('news')
const selectedLimit = ref(10)
const isCrawling = ref(false)
const isResetting = ref(false)
const terminalRef = ref<HTMLElement | null>(null)

interface LogItem {
  time: string
  message: string
  type: 'info' | 'success' | 'error'
}

const logs = ref<LogItem[]>([])

function addLog(message: string, type: 'info' | 'success' | 'error' = 'info') {
  const now = new Date()
  const timeStr = now.toTimeString().split(' ')[0]
  logs.value.push({ time: timeStr, message, type })
  
  nextTick(() => {
    if (terminalRef.value) {
      terminalRef.value.scrollTop = terminalRef.value.scrollHeight
    }
  })
}

onMounted(() => {
  addLog('Kernel Engine v2.4-GOLD Inizializzato. In attesa di comandi...')
})

// Esecuzione Crawler
async function runCrawler() {
  isCrawling.value = true
  addLog(`⚡ Avvio Crawler Engine per sezione: '${selectedSection.value.toUpperCase()}' (Limit: ${selectedLimit.value})...`, 'info')

  try {
    const res = await $fetch<{ success: boolean; message: string; addedCount: number }>('/api/admin/crawler/run', {
      method: 'POST',
      body: {
        section: selectedSection.value,
        limit: selectedLimit.value
      }
    })

    if (res && res.success) {
      addLog(`✅ ${res.message} (Aggiunti: ${res.addedCount || 0})`, 'success')
    } else {
      addLog(`❌ Errore Ingestione: ${res.message || 'Risposta non valida'}`, 'error')
    }
  } catch (err: any) {
    addLog(`❌ Errore Esecuzione Crawler: ${err?.statusMessage || err?.message || 'Server Error'}`, 'error')
  } finally {
    isCrawling.value = false
  }
}

// Reset Database
async function resetDatabase() {
  if (!confirm('Sei sicuro di voler azzerare l\'intero database Neon? L\'azione è irreversibile.')) {
    return
  }

  isResetting.value = true
  addLog('🧹 Pulizia totale database Neon in corso...', 'info')

  try {
    const res = await $fetch<{ success: boolean; message: string }>('/api/admin/db-reset', {
      method: 'POST'
    })

    if (res && res.success) {
      addLog(`✅ ${res.message}`, 'success')
    } else {
      addLog(`❌ Errore Reset: ${res.message}`, 'error')
    }
  } catch (err: any) {
    addLog(`❌ Errore Reset: ${err?.statusMessage || err?.message || 'Server Error'}`, 'error')
  } finally {
    isResetting.value = false
  }
}
</script>

<style scoped>
.crawler-admin-container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  color: #f8fafc;
}

.crawler-header {
  margin-bottom: 2rem;
}

.crawler-badge {
  font-size: 0.7rem;
  font-weight: 800;
  color: #00dc82;
  background: rgba(0, 220, 130, 0.1);
  border: 1px solid rgba(0, 220, 130, 0.3);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.crawler-title {
  font-size: 2.2rem;
  font-weight: 900;
  margin: 0.5rem 0 0.2rem;
}

.highlight {
  color: #00dc82;
}

.crawler-subtitle {
  color: #94a3b8;
  font-size: 0.95rem;
}

.crawler-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .crawler-grid {
    grid-template-columns: 1fr;
  }
}

.action-card, .console-card {
  background: #060a12;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 1.15rem;
  font-weight: 800;
  margin-top: 0;
  margin-bottom: 1.25rem;
  color: #f8fafc;
}

.form-group {
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #94a3b8;
}

.form-select {
  background: #090d16;
  border: 1px solid #1e293b;
  color: #f8fafc;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-select:focus {
  border-color: #00dc82;
}

.btn-action {
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 800;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.btn-crawl {
  background: #00dc82;
  color: #020420;
}

.btn-crawl:hover:not(:disabled) {
  background: #00bf71;
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.4);
}

.btn-reset {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.btn-reset:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.25);
  border-color: #ef4444;
}

.btn-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* TERMINAL LOG CONSOLE */
.console-terminal {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 1rem;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.82rem;
  height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.log-line {
  display: flex;
  gap: 0.6rem;
}

.log-time {
  color: #64748b;
}

.log-line.info .log-msg { color: #38bdf8; }
.log-line.success .log-msg { color: #34d399; }
.log-line.error .log-msg { color: #f87171; }
</style>