<!-- pages/api-console.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'DKP API Console v2.4-GOLD — DevKernelPulse',
  meta: [
    { name: 'description', content: 'Console di controllo API, metriche di traffico, latenza Nitro v2.4 e gestione chiavi di accesso.' }
  ]
})
const { getMainUrl } = useDomain()

// Simulazione stato Utente/Admin (sostituire con useUser() o useAuth() del progetto)
const user = ref({
  username: 'alexdpl',
  role: 'admin', // 'admin' | 'user'
  requestsUsed: 742,
  requestsLimit: 1000
})

const isAdmin = computed(() => user.value.role === 'admin')
const usagePercentage = computed(() => {
  if (isAdmin.value) return 0
  return Math.min(100, Math.round((user.value.requestsUsed / user.value.requestsLimit) * 100))
})

// Key Management Mock
const apiKeys = ref([
  { id: 1, name: 'Production Server Key', key: 'dkp_live_9f8a37b12c4e...', created: '2026-08-12', status: 'ACTIVE' },
  { id: 2, name: 'CLI Toolkit Dev Key', key: 'dkp_dev_11c9a87d4e21...', created: '2026-09-01', status: 'ACTIVE' }
])
</script>

<template>
  <div class="api-console-page">
    <div class="console-container">
      
      <!-- HEADER CONSOLE & ADMIN RATE LIMIT WIDGET -->
      <header class="console-header">
        <div class="header-titles">
          <div class="console-badge-row">
            <span class="badge-icon">🔌</span>
            <h1>DKP API Console</h1>
            <span class="version-tag">v2.4-GOLD</span>
          </div>
          <p class="subtitle">
            Pannello isolato per il controllo delle API, gestione delle chiavi di accesso e metriche di consumo.
          </p>
        </div>

        <!-- WIDGET QUOTA / STATO ADMIN -->
        <div class="quota-widget-box" :class="{ 'admin-unlimited': isAdmin }">
          <template v-if="isAdmin">
            <div class="widget-top">
              <div class="admin-title">
                <span class="infinite-symbol">♾️</span>
                <div class="title-text">
                  <span class="label">STATUS ACCOUNT</span>
                  <strong>Accesso Admin Illimitato</strong>
                </div>
              </div>
              <span class="god-badge">👑 GOD MODE</span>
            </div>

            <div class="admin-info-bar">
              <span class="status-dot green"></span>
              <span>Rate Limit Bypassed • ∞ req/mese</span>
            </div>

            <NuxtLink to="/admin/api-gateway" class="admin-control-btn">
              ⚙️ Configura Limiti Utenti ↗
            </NuxtLink>
          </template>

          <template v-else>
            <div class="widget-top">
              <span class="label">Consumo Mese:</span>
              <strong>{{ user.requestsUsed.toLocaleString() }} / {{ user.requestsLimit.toLocaleString() }} req</strong>
              <span class="percentage-pill">{{ usagePercentage }}%</span>
            </div>

            <div class="progress-bar-track">
              <div class="progress-bar-fill" :style="{ width: `${usagePercentage}%` }"></div>
            </div>

            <button class="upgrade-btn">
              🚀 Upgrade a Pro (100k req/m)
            </button>
          </template>
        </div>
      </header>

  <div class="console-container">
  <NuxtLink 
    :to="getMainUrl('/user/dashboard?tab=api')" 
    external 
    class="dkp-nav-link-btn"
  >
    <span>🔑 DKP API Console & Keys Manager</span>
  </NuxtLink>
</div>

      <!-- METRICHE DI UTILIZZO & LATENZA -->
      <section class="metrics-section">
        <h2>📊 Metriche di Utilizzo & Latenza</h2>

        <div class="metrics-grid">
          <div class="metric-card">
            <span class="card-label">Chiamate Totali (30 gg)</span>
            <div class="card-value">14,290</div>
            <span class="card-sub positive">▲ +12% rispetto al mese scorso</span>
          </div>

          <div class="metric-card">
            <span class="card-label">Latenza Media API</span>
            <div class="card-value highlight">22 ms</div>
            <span class="card-sub engine">⚡ Nitro Engine v2.4 Optimal</span>
          </div>

          <div class="metric-card">
            <span class="card-label">Tasso Errori (4xx / 5xx)</span>
            <div class="card-value">0.02%</div>
            <span class="card-sub stable">🟢 Sistema Stabile</span>
          </div>
        </div>
      </section>

      <!-- GRAFICO TRAFFICO 24H -->
      <section class="chart-section">
        <div class="chart-header">
          <h3>Traffico API nelle ultime 24 ore (Req/min)</h3>
          <span class="live-tag"><span class="dot"></span> Live Stream</span>
        </div>

        <div class="mock-chart-bars">
          <div class="bar-col" style="height: 30%;"><span class="bar-val">00:00</span></div>
          <div class="bar-col" style="height: 20%;"><span class="bar-val">04:00</span></div>
          <div class="bar-col" style="height: 15%;"><span class="bar-val">08:00</span></div>
          <div class="bar-col" style="height: 55%;"><span class="bar-val">12:00</span></div>
          <div class="bar-col" style="height: 75%;"><span class="bar-val">16:00</span></div>
          <div class="bar-col" style="height: 90%;"><span class="bar-val">20:00</span></div>
          <div class="bar-col active" style="height: 80%;"><span class="bar-val">23:59</span></div>
        </div>
      </section>

      <!-- GESTIONE CHIAVI API -->
      <section class="keys-section">
        <div class="section-title-row">
          <h3>🔑 Le Tue Chiavi API {{ isAdmin ? '(Admin System Keys)' : '' }}</h3>
          <button class="create-key-btn">+ Genera Nuova API Key</button>
        </div>

        <div class="keys-table-container">
          <table class="keys-table">
            <thead>
              <tr>
                <th>Nome Chiave</th>
                <th>API Key Token</th>
                <th>Data Creazione</th>
                <th>Stato</th>
                <th>Azione</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="key in apiKeys" :key="key.id">
                <td><strong>{{ key.name }}</strong></td>
                <td><code class="key-code">{{ key.key }}</code></td>
                <td>{{ key.created }}</td>
                <td><span class="status-badge active">{{ key.status }}</span></td>
                <td><button class="revoke-btn">Revoca</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.api-console-page {
  background: #020420;
  color: #cbd5e1;
  min-height: 100vh;
  padding: 2.5rem 1.5rem 5rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}


.console-container {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.dkp-nav-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 220, 130, 0.08);
  border: 1px solid #00dc82;
  color: #00dc82;
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(0, 220, 130, 0.15);
}

.dkp-nav-link-btn:hover {
  background: #00dc82;
  color: #020420;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 220, 130, 0.3);
}

/* HEADER & WIDGET */
.console-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.75rem;
}

@media (max-width: 900px) {
  .console-header {
    flex-direction: column;
  }
}

.console-badge-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.console-badge-row h1 {
  font-size: 2rem;
  color: #ffffff;
  margin: 0;
  font-weight: 900;
}

.version-tag {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.subtitle {
  color: #94a3b8;
  margin: 0.5rem 0 0;
  font-size: 0.95rem;
  max-width: 600px;
}

/* QUOTA WIDGET BOX */
.quota-widget-box {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 1.25rem;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.quota-widget-box.admin-unlimited {
  border-color: rgba(0, 220, 130, 0.4);
  background: radial-gradient(circle at top right, rgba(0, 220, 130, 0.08), #020420 80%);
}

.widget-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.admin-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.infinite-symbol {
  font-size: 1.6rem;
}

.title-text {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 0.68rem;
  color: #64748b;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.admin-title strong {
  color: #00dc82;
  font-size: 1rem;
}

.god-badge {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}

.admin-info-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #cbd5e1;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.green {
  background: #00dc82;
  box-shadow: 0 0 8px #00dc82;
}

.admin-control-btn {
  display: block;
  text-align: center;
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.3);
  font-weight: 800;
  font-size: 0.82rem;
  padding: 0.55rem;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.15s ease;
}

.admin-control-btn:hover {
  background: #00dc82;
  color: #020420;
}

.upgrade-btn {
  background: #00dc82;
  color: #020420;
  border: none;
  font-weight: 800;
  padding: 0.6rem;
  border-radius: 6px;
  cursor: pointer;
}

/* METRICHE */
.metrics-section h2 {
  font-size: 1.2rem;
  color: #ffffff;
  margin-bottom: 1rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

.metric-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.card-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
}

.card-value {
  font-size: 1.8rem;
  font-weight: 900;
  color: #ffffff;
}

.card-value.highlight {
  color: #00dc82;
}

.card-sub {
  font-size: 0.75rem;
  font-weight: 700;
}

.card-sub.positive { color: #38bdf8; }
.card-sub.engine { color: #00dc82; }
.card-sub.stable { color: #a855f7; }

/* GRAFICO MOCK */
.chart-section {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.chart-header h3 {
  color: #fff;
  margin: 0;
  font-size: 1.05rem;
}

.live-tag {
  color: #00dc82;
  font-size: 0.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.live-tag .dot {
  width: 6px;
  height: 6px;
  background: #00dc82;
  border-radius: 50%;
  box-shadow: 0 0 6px #00dc82;
}

.mock-chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 1.5rem;
  height: 160px;
  padding-top: 1rem;
  border-bottom: 1px solid #1e293b;
}

.bar-col {
  flex: 1;
  background: #1e293b;
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: background 0.2s ease;
}

.bar-col.active {
  background: #00dc82;
  box-shadow: 0 0 12px rgba(0, 220, 130, 0.4);
}

.bar-val {
  position: absolute;
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  color: #64748b;
}

/* TABLE KEYS */
.keys-section {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.section-title-row h3 {
  color: #fff;
  margin: 0;
  font-size: 1.05rem;
}

.create-key-btn {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
}

.keys-table {
  width: 100%;
  border-collapse: collapse;
}

.keys-table th, .keys-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #1e293b;
  font-size: 0.85rem;
}

.keys-table th {
  color: #64748b;
}

.key-code {
  background: rgba(255, 255, 255, 0.05);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  color: #00dc82;
  font-family: monospace;
}

.status-badge.active {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 800;
}

.revoke-btn {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}
</style>