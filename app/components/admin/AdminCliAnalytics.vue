<!-- components/admin/AdminCliAnalytics.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface CliCommandStat {
  command: string
  endpoint: string
  totalCalls: number
  avgLatencyMs: number
  errorCount: number
}

const stats = ref<CliCommandStat[]>([])
const loading = ref(true)

async function fetchCliAnalytics() {
  loading.value = true
  try {
    const res = await fetch('/api/admin/cli-analytics')
    const json = await res.json()
    if (json.success) {
      stats.value = json.data.commands || []
    }
  } catch (err) {
    console.error('Errore caricamento telemetria CLI:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCliAnalytics()
})
</script>

<template>
  <div class="cli-analytics-card">
    <div class="card-header">
      <div class="title-group">
        <span class="icon">💻</span>
        <div>
          <h3>CLI Telemetry & API Usage</h3>
          <p class="subtitle">Utilizzo comandi CLI dkp (24h)</p>
        </div>
      </div>
      <button class="btn-refresh" @click="fetchCliAnalytics" :disabled="loading">
        🔄 Aggiorna
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <span>Caricamento metriche CLI in corso...</span>
    </div>

    <div v-else-if="stats.length === 0" class="empty-state">
      Nessuna telemetria CLI registrata nelle ultime 24 ore.
    </div>

    <div v-else class="cli-list">
      <div v-for="item in stats" :key="item.command" class="cli-item">
        <div class="cli-info">
          <span class="cmd-badge">{{ item.command }}</span>
          <span class="endpoint-text">{{ item.endpoint }}</span>
        </div>
        <div class="cli-metrics">
          <div class="metric">
            <span class="label">Chiamate</span>
            <span class="value">{{ item.totalCalls }}</span>
          </div>
          <div class="metric">
            <span class="label">Latenza Media</span>
            <span class="value cyan">{{ item.avgLatencyMs }} ms</span>
          </div>
          <div class="metric">
            <span class="label">Errori</span>
            <span class="value" :class="item.errorCount > 0 ? 'red' : 'green'">{{ item.errorCount }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cli-analytics-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
  color: #f8fafc;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-group .icon { font-size: 1.5rem; }
.title-group h3 { margin: 0; font-size: 1.1rem; font-weight: 800; }
.subtitle { margin: 0; font-size: 0.8rem; color: #64748b; }

.btn-refresh {
  background: #1e293b;
  color: #cbd5e1;
  border: 1px solid #334155;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-refresh:hover { background: #334155; color: #ffffff; }

.cli-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cli-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #1e293b;
  padding: 0.85rem 1rem;
  border-radius: 8px;
}

.cmd-badge {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
  font-family: monospace;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.endpoint-text {
  font-size: 0.8rem;
  color: #64748b;
  margin-left: 0.75rem;
}

.cli-metrics {
  display: flex;
  gap: 1.5rem;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.metric .label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; }
.metric .value { font-size: 0.95rem; font-weight: 800; color: #f8fafc; }
.metric .value.cyan { color: #38bdf8; }
.metric .value.green { color: #00dc82; }
.metric .value.red { color: #f43f5e; }

.loading-state, .empty-state {
  text-align: center;
  padding: 2rem;
  color: #64748b;
  font-size: 0.9rem;
}
</style>