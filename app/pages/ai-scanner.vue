<!-- app/pages/ai-scanner.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const targetUrl = ref('')
const loading = ref(false)
const scanResult = ref<any>(null)
const errorMessage = ref('')

async function runScan() {
  if (!targetUrl.value) return
  loading.value = true
  scanResult.value = null
  errorMessage.value = ''

  try {
    const res: any = await $fetch('/api/ai-scan', {
      method: 'POST',
      body: { url: targetUrl.value }
    })

    if (res.success) {
      scanResult.value = res.data
    } else {
      errorMessage.value = res.error
    }
  } catch (err) {
    errorMessage.value = 'Errore di comunicazione con il motore di scansione.'
  } finally {
    loading.value = false
  }
}

useSeoMeta({
  title: 'AI Link Scanner - DevKernelPulse',
  description: 'Analizza repository GitHub e articoli tecnici con l\'intelligenza artificiale di DevKernelPulse.'
})
</script>

<template>
  <div class="scanner-container">
    <div class="scanner-hero">
      <span class="badge-ai">🤖 DKP AI Core v2.6</span>
      <h1>AI Link & Repository Scanner</h1>
      <p>
        Incolla l'URL di un repository GitHub o di un articolo tecnico: il nostro motore analizzerà stack, sicurezza e qualità del codice in tempo reale.
      </p>

      <div class="search-box">
        <input 
          v-model="targetUrl" 
          type="url" 
          placeholder="https://github.com/tuo-profilo/tuo-progetto" 
          @keyup.enter="runScan"
          class="url-input"
        />
        <button @click="runScan" :disabled="loading" class="scan-btn">
          {{ loading ? 'Scansione in corso...' : 'Avvia Scanner ⚡' }}
        </button>
      </div>

      <div v-if="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>
    </div>

    <!-- Risultati della scansione -->
    <div v-if="scanResult" class="result-card">
      <div class="result-header">
        <div>
          <h3>Risultato Analisi</h3>
          <span class="analyzed-url">{{ scanResult.url }}</span>
        </div>
        <div class="score-badge">
          Score: <strong>{{ scanResult.score }}</strong>
        </div>
      </div>

      <div class="result-grid">
        <div class="result-section">
          <h4>🔒 Stato di Sicurezza</h4>
          <p class="sec-text">{{ scanResult.securityStatus }}</p>
        </div>

        <div class="result-section">
          <h4>🛠️ Tech Stack Rilevato</h4>
          <div class="tags-list">
            <span v-for="tech in scanResult.detectedStack" :key="tech" class="tech-tag">{{ tech }}</span>
          </div>
        </div>
      </div>

      <div class="result-section summary-box">
        <h4>💡 Sintesi AI</h4>
        <p>{{ scanResult.aiSummary }}</p>
      </div>

      <div class="result-section">
        <h4>🚀 Raccomandazioni di Ottimizzazione</h4>
        <ul>
          <li v-for="(rec, idx) in scanResult.recommendations" :key="idx">{{ rec }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scanner-container {
  max-width: 900px;
  margin: 2.5rem auto;
  padding: 0 1rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
  color: #020420;
}
.scanner-hero {
  background: #020420;
  color: #ffffff;
  padding: 3rem 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 10px 25px -5px rgba(2, 4, 32, 0.2);
}
.badge-ai {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid rgba(0, 220, 130, 0.3);
}
.scanner-hero h1 {
  font-size: 2rem;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
.scanner-hero p {
  color: #94a3b8;
  max-width: 600px;
  margin: 0 auto 2rem auto;
  font-size: 0.95rem;
  line-height: 1.5;
}
.search-box {
  display: flex;
  gap: 0.5rem;
  max-width: 650px;
  margin: 0 auto;
}
.url-input {
  flex: 1;
  padding: 0.8rem 1rem;
  border-radius: 6px;
  border: 1px solid #334155;
  background: #0f172a;
  color: #ffffff;
  font-size: 0.95rem;
}
.url-input:focus {
  outline: none;
  border-color: #00dc82;
}
.scan-btn {
  background: #00dc82;
  color: #020420;
  border: none;
  padding: 0 1.5rem;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s;
}
.scan-btn:hover {
  opacity: 0.9;
}
.error-banner {
  background: #7f1d1d;
  color: #fecaca;
  padding: 0.8rem;
  border-radius: 6px;
  margin-top: 1rem;
  font-size: 0.9rem;
}
.result-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 2rem;
  margin-top: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
}
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}
.result-header h3 {
  font-size: 1.25rem;
  color: #020420;
  margin-bottom: 0.2rem;
}
.analyzed-url {
  font-size: 0.85rem;
  color: #64748b;
  word-break: break-all;
}
.score-badge {
  background: #ecfdf5;
  color: #047857;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  border: 1px solid #a7f3d0;
  font-size: 0.9rem;
}
.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
@media (max-width: 700px) {
  .result-grid { grid-template-columns: 1fr; }
}
.result-section h4 {
  font-size: 0.9rem;
  color: #475569;
  margin-bottom: 0.5rem;
}
.sec-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: #059669;
}
.tags-list {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.tech-tag {
  background: #f1f5f9;
  color: #334155;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}
.summary-box {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #00dc82;
  margin-bottom: 1.5rem;
}
.summary-box p {
  color: #334155;
  line-height: 1.5;
  font-size: 0.95rem;
  margin-top: 0.3rem;
}
.result-section ul {
  padding-left: 1.2rem;
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.6;
}
</style>