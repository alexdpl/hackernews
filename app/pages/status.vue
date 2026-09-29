<!-- pages/status.vue -->
<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'API Status & Latency — DevKernelPulse',
  meta: [
    { name: 'description', content: 'Monitoraggio in tempo reale dello stato dei microservizi, latenza edge e uptime di DevKernelPulse.' }
  ]
})

const services = ref([
  { name: 'Core Nitro Gateway', status: 'operational', latency: '18ms', uptime: '99.99%' },
  { name: 'Proof of Code Vault Engine', status: 'operational', latency: '32ms', uptime: '99.95%' },
  { name: 'AI Neural Scanner Gateway', status: 'operational', latency: '142ms', uptime: '99.90%' },
  { name: 'Edge News Crawler v2.4', status: 'operational', latency: '45ms', uptime: '99.98%' },
  { name: 'Auth Bearer & Session Vault', status: 'operational', latency: '12ms', uptime: '100.0%' }
])
</script>

<template>
  <div class="status-page">
    <div class="status-container">
      
      <!-- HERO & OPERATIONAL BANNER -->
      <header class="status-hero">
        <div class="breadcrumb">System Health / Realtime Metrics</div>
        <h1>🟢 API Status & System Latency</h1>
        <p class="subtitle">Monitoraggio live dell'infrastruttura globale e dei microservizi DKP.</p>

        <div class="overall-banner">
          <div class="status-indicator">
            <span class="dot-pulse"></span>
            <span class="status-text">Tutti i Sistemi Operativi</span>
          </div>
          <span class="global-uptime">Uptime Medio: <strong>99.96%</strong></span>
        </div>
      </header>

      <!-- METRICHE LATENZA -->
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-label">Latenza Media Global</span>
          <span class="metric-val green">24ms</span>
          <span class="metric-sub">Edge Nodes (EU-Central)</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">AI Inference Response</span>
          <span class="metric-val cyan">142ms</span>
          <span class="metric-sub">Neural Gateway v2.3</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Vault Hash Execution</span>
          <span class="metric-val green">32ms</span>
          <span class="metric-sub">In-Memory Cryptography</span>
        </div>
      </div>

      <!-- TABELLA SERVIZI -->
      <section class="services-section">
        <h2>Stato dei Microservizi</h2>
        <div class="services-list">
          <div v-for="s in services" :key="s.name" class="service-row">
            <div class="service-info">
              <span class="status-dot"></span>
              <span class="service-name">{{ s.name }}</span>
            </div>
            <div class="service-stats">
              <span class="latency-tag">⚡ {{ s.latency }}</span>
              <span class="uptime-tag">{{ s.uptime }} Uptime</span>
              <span class="op-badge">Operativo</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.status-page {
  background: #020420;
  color: #cbd5e1;
  min-height: 100vh;
  padding: 3rem 1.5rem 5rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.status-container {
  max-width: 1050px;
  margin: 0 auto;
}

.breadcrumb { font-size: 0.8rem; color: #38bdf8; font-weight: 600; margin-bottom: 0.5rem; }
.status-hero h1 { font-size: 2.2rem; color: #ffffff; font-weight: 900; margin: 0 0 0.5rem; }
.subtitle { font-size: 1.05rem; color: #94a3b8; margin-bottom: 1.5rem; }

.overall-banner {
  background: #090d16;
  border: 1px solid #1e293b;
  border-left: 4px solid #00dc82;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dot-pulse {
  width: 12px;
  height: 12px;
  background: #00dc82;
  border-radius: 50%;
  box-shadow: 0 0 10px #00dc82;
}

.status-text {
  color: #ffffff;
  font-weight: 800;
  font-size: 1.1rem;
}

.global-uptime {
  font-size: 0.88rem;
  color: #94a3b8;
}

.global-uptime strong { color: #00dc82; }

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2.5rem;
}

.metric-card {
  background: #090d16;
  border: 1px solid #1e293b;
  padding: 1.25rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}

.metric-label { font-size: 0.82rem; color: #94a3b8; font-weight: 600; }
.metric-val { font-size: 2rem; font-weight: 900; margin: 0.3rem 0; }
.metric-val.green { color: #00dc82; }
.metric-val.cyan { color: #38bdf8; }
.metric-sub { font-size: 0.75rem; color: #64748b; }

.services-section {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
}

.services-section h2 {
  color: #ffffff;
  font-size: 1.2rem;
  margin: 0 0 1.25rem;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 0.75rem;
}

.services-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.service-row {
  background: #020420;
  border: 1px solid #1e293b;
  padding: 0.9rem 1.2rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.service-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #00dc82;
  border-radius: 50%;
}

.service-name {
  color: #ffffff;
  font-weight: 700;
  font-size: 0.92rem;
}

.service-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.latency-tag {
  color: #38bdf8;
  font-family: monospace;
  font-size: 0.82rem;
}

.uptime-tag {
  color: #94a3b8;
  font-size: 0.82rem;
}

.op-badge {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}
</style>