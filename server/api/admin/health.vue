<!-- app/pages/admin/health.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// In locale precompila con 'admin' per comodità immediata
const adminSecret = ref('admin')
const healthData = ref<any>(null)
const loading = ref(false)
const errorMessage = ref('')
const autoRefresh = ref(true)
let timer: any = null

useSeoMeta({
  title: 'System Health & Metrics - Admin',
  description: 'Pannello di monitoraggio stato e prestazioni del sistema DevKernelPulse'
})

// Normalizzatore universale di risposta
function normalizeHealthResponse(res: any): any {
  if (!res) return null
  if (res.status && res.database) return res
  if (res.data) {
    if (res.data.status && res.data.database) return res.data
    if (res.data.data && res.data.data.status) return res.data.data
  }
  return res
}

async function fetchMetrics() {
  if (!adminSecret.value) {
    errorMessage.value = 'Inserisci la chiave segreta Admin per caricare le metriche.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const rawRes: any = await $fetch('/api/admin/health', {
      headers: {
        'x-admin-secret': adminSecret.value
      }
    })

    const clean = normalizeHealthResponse(rawRes)

    if (clean && clean.status) {
      healthData.value = clean
      if (import.meta.client) {
        sessionStorage.setItem('dkp_admin_secret', adminSecret.value)
      }
    } else {
      errorMessage.value = 'Risposta dal server non valida.'
    }
  } catch (err: any) {
    healthData.value = null
    errorMessage.value = err.data?.statusMessage || err.statusMessage || 'Chiave non valida o errore di connessione.'
  } finally {
    loading.value = false
  }
}

function formatUptime(seconds: number) {
  if (!seconds) return '0s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}h ${m}m ${s}s`
}

onMounted(() => {
  if (import.meta.client) {
    const saved = sessionStorage.getItem('dkp_admin_secret')
    if (saved) {
      adminSecret.value = saved
    }
    // Caricamento automatico iniziale
    fetchMetrics()
  }

  timer = setInterval(() => {
    if (autoRefresh.value && adminSecret.value && healthData.value) {
      fetchMetrics()
    }
  }, 10000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="health-dashboard">
    <div class="dashboard-header">
      <h1>🛠️ Health Check & Metriche di Sistema</h1>
      <p class="subtitle">Monitoraggio in tempo reale del server Nitro e del database Neon Postgres</p>
    </div>

    <!-- Modulo Autenticazione Admin -->
    <div class="auth-card">
      <form @submit.prevent="fetchMetrics" class="auth-form">
        <label for="admin-key">Chiave Segreta Admin (Default dev: admin)</label>
        <div class="input-group">
          <input 
            id="admin-key"
            v-model="adminSecret" 
            type="password" 
            placeholder="Inserisci la password di amministrazione..."
            required
          />
          <button type="submit" :disabled="loading" class="btn-primary">
            {{ loading ? 'Caricamento...' : 'Carica Metriche' }}
          </button>
        </div>
      </form>
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    </div>

    <!-- Visualizzazione Metriche -->
    <div v-if="healthData && healthData.status" class="metrics-grid">
      <!-- Stato Generale -->
      <div class="metric-card">
        <h3>Stato Sistema</h3>
        <div class="status-badge" :class="healthData.status">
          ● {{ String(healthData.status).toUpperCase() }}
        </div>
        <p class="metric-sub">
          Ultimo aggiornamento: {{ healthData.timestamp ? new Date(healthData.timestamp).toLocaleTimeString('it-IT') : '-' }}
        </p>
        <div class="toggle-box">
          <label>
            <input type="checkbox" v-model="autoRefresh" /> Auto-refresh (10s)
          </label>
        </div>
      </div>

      <!-- Database Neon -->
      <div v-if="healthData.database" class="metric-card">
        <h3>Database (Neon)</h3>
        <div class="metric-value">
          {{ healthData.database.latencyMs }} <span class="unit">ms</span>
        </div>
        <p class="metric-sub">Latenza query `SELECT 1`</p>
        <div class="status-pill" :class="healthData.database.status">
          Connessione {{ healthData.database.status }}
        </div>
      </div>

      <!-- Server Uptime -->
      <div v-if="healthData.uptimeSeconds !== undefined" class="metric-card">
        <h3>Server Uptime</h3>
        <div class="metric-value">
          {{ formatUptime(healthData.uptimeSeconds) }}
        </div>
        <p class="metric-sub">
          Node.js {{ healthData.system?.nodeVersion || 'v20' }} ({{ healthData.system?.env || 'development' }})
        </p>
      </div>

      <!-- Memoria RAM -->
      <div v-if="healthData.memory" class="metric-card full-width">
        <h3>Consumo Memoria Nitro / Node.js</h3>
        <div class="memory-grid">
          <div class="mem-item">
            <span class="label">Heap Usato</span>
            <span class="value">{{ healthData.memory.heapUsedMB }} MB</span>
          </div>
          <div class="mem-item">
            <span class="label">Heap Totale</span>
            <span class="value">{{ healthData.memory.heapTotalMB }} MB</span>
          </div>
          <div class="mem-item">
            <span class="label">RSS (Residente)</span>
            <span class="value">{{ healthData.memory.rssMB }} MB</span>
          </div>
          <div class="mem-item">
            <span class="label">Esterna</span>
            <span class="value">{{ healthData.memory.externalMB }} MB</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.health-dashboard {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 1rem;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
}

.dashboard-header {
  margin-bottom: 1.5rem;
}

.dashboard-header h1 {
  color: #020420;
  font-size: 1.6rem;
  margin-bottom: 0.2rem;
}

.subtitle {
  color: #64748b;
  font-size: 0.9rem;
}

.auth-card {
  background: #ffffff;
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-bottom: 1.5rem;
}

.auth-form label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.5rem;
}

.input-group {
  display: flex;
  gap: 0.75rem;
}

.input-group input {
  flex-grow: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
}

.btn-primary {
  background-color: #020420;
  color: #00dc82;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
}

.error-text {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

.metric-card {
  background: #020420;
  color: #ffffff;
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.metric-card.full-width {
  grid-column: 1 / -1;
}

.metric-card h3 {
  font-size: 0.9rem;
  color: #a1a1aa;
  margin-bottom: 0.75rem;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: #00dc82;
}

.unit {
  font-size: 1rem;
  color: #a1a1aa;
}

.metric-sub {
  font-size: 0.8rem;
  color: #71717a;
  margin-top: 0.4rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
}

.status-badge.healthy {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
}

.status-badge.degraded {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.status-pill {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-pill.healthy { color: #00dc82; }
.status-pill.unhealthy { color: #ef4444; }

.toggle-box {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: #a1a1aa;
}

.memory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 0.5rem;
}

.mem-item {
  background: rgba(255, 255, 255, 0.04);
  padding: 0.75rem;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
}

.mem-item .label {
  font-size: 0.75rem;
  color: #a1a1aa;
}

.mem-item .value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  margin-top: 0.2rem;
}
</style>