<!-- app/pages/admin/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

useDkpSeo({
  title: 'Admin Control Center - DKP Sentinel AI',
  description: 'Pannello di controllo centrale e monitoraggio difensivo con Pulse Sentinel AI.'
})

const activeTab = ref<'users' | 'moderation' | 'infrastructure' | 'sentinel'>('users')
const searchQuery = ref('')

const users = ref([
  { id: 1, username: 'alexdpl', email: 'alex@devkernelpulse.io', role: 'Admin', status: 'ACTIVE', joined: '2026-01-10' },
  { id: 2, username: 'dev_ninja', email: 'ninja@code.dev', role: 'Moderator', status: 'ACTIVE', joined: '2026-03-12' },
  { id: 3, username: 'bot_scrapper', email: 'crawler@darknet.org', role: 'User', status: 'SUSPENDED', joined: '2026-09-20' }
])

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return users.value
  const q = searchQuery.value.toLowerCase()
  return users.value.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
})

// STATO INIZIALE PREDEFINITO (Garantisce che il banner sia visibile da subito)
const sentinelData = ref<any>({
  status: 'ACTIVE_PROTECTION',
  autoDefendEnabled: true,
  globalThreatIndex: 12,
  blockedRequests24h: 1420,
  activeFirewallRules: 18,
  gcpArmorStatus: 'OPTIMAL',
  recentThreats: [
    {
      id: 'TH-9041',
      type: 'Prompt Injection Attempt',
      target: 'Pulse Nexus Chat',
      ip: '185.220.101.5',
      severity: 'CRITICAL',
      timestamp: new Date().toISOString()
    }
  ]
})

const isActionLoading = ref(false)
const notificationMsg = ref('')

async function fetchSentinel() {
  try {
    const res = await $fetch<any>('/api/admin/sentinel')
    if (res?.success && res?.sentinelState) {
      sentinelData.value = res.sentinelState
    }
  } catch (err) {
    console.warn('Utilizzo dati locali per Sentinel AI:', err)
  }
}

async function triggerAction(actionName: string, payload: any = {}) {
  isActionLoading.value = true
  try {
    const res = await $fetch<any>('/api/admin/sentinel/action', {
      method: 'POST',
      body: { action: actionName, ...payload }
    })
    if (res?.success) {
      notificationMsg.value = res.message
      await fetchSentinel()
      setTimeout(() => { notificationMsg.value = '' }, 4000)
    }
  } catch (err: any) {
    alert('Errore esecuzione azione Sentinel: ' + (err.message || err))
  } finally {
    isActionLoading.value = false
  }
}

function toggleUserStatus(user: any) {
  user.status = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
  notificationMsg.value = `Stato utente @${user.username} modificato in: ${user.status}`
  setTimeout(() => { notificationMsg.value = '' }, 3500)
}

onMounted(() => {
  fetchSentinel()
})
</script>

<template>
  <div class="admin-container">
    <!-- HEADER CONTROL CENTER -->
    <div class="admin-header">
      <div class="header-main">
        <h1>🔒 Control Center Admin</h1>
        <p>Gestione piattaforma, moderazione contenuti e protezione infrastruttura GCP in tempo reale.</p>
      </div>
      <div class="region-badge">
        <span class="status-dot green"></span>
        GCP Region: europe-west1
      </div>
    </div>

    <!-- MONITOR FIREWALL SENTINEL AI (SEMPRE VISIBILE ORA) -->
    <div class="sentinel-monitor-banner">
      <div class="sentinel-monitor-header">
        <div class="sentinel-brand">
          <span class="shield-pulse">🛡️</span>
          <div>
            <h2>Pulse Sentinel AI <span class="badge-status">Protected</span></h2>
            <p class="sentinel-sub">Firewall Euristico & System Defense attivi nell'infrastruttura Kernel v2.0</p>
          </div>
        </div>
        <button 
          @click="triggerAction('toggle_autodefend')" 
          :disabled="isActionLoading"
          :class="['btn-toggle-switch', sentinelData.autoDefendEnabled ? 'active' : 'inactive']"
        >
          <span>Auto-Defend AI</span>
          <strong>{{ sentinelData.autoDefendEnabled ? 'ENABLED 🟢' : 'DISABLED 🔴' }}</strong>
        </button>
      </div>

      <div class="sentinel-monitor-grid">
        <div class="monitor-cell">
          <span class="cell-label">Global Threat Index</span>
          <div class="threat-meter-box">
            <div class="threat-bar">
              <div class="threat-fill" :style="{ width: sentinelData.globalThreatIndex + '%' }"></div>
            </div>
            <span class="threat-val">{{ sentinelData.globalThreatIndex }}%</span>
          </div>
        </div>

        <div class="monitor-cell">
          <span class="cell-label">Richieste Malevole Bloccate (24h)</span>
          <div class="cell-val highlight-purple">{{ sentinelData.blockedRequests24h }}</div>
        </div>

        <div class="monitor-cell">
          <span class="cell-label">GCP Armor Engine</span>
          <div class="cell-val highlight-green">{{ sentinelData.gcpArmorStatus }}</div>
        </div>

        <div class="monitor-cell">
          <span class="cell-label">Regole Attive</span>
          <div class="cell-val highlight-blue">{{ sentinelData.activeFirewallRules }} Rules</div>
        </div>
      </div>
    </div>

    <!-- NOTIFICA SISTEMA -->
    <Transition name="fade">
      <div v-if="notificationMsg" class="sentinel-notification">
        ⚡ {{ notificationMsg }}
      </div>
    </Transition>

    <!-- METRICHE TOP DASHBOARD -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="card-title">Neon DB Status <span class="badge green">CONNECTED</span></div>
        <div class="card-value">18 ms</div>
        <div class="card-sub">14/50 active connections</div>
      </div>

      <div class="metric-card">
        <div class="card-title">GCP Cloud Load <span class="badge green">STABLE</span></div>
        <div class="card-value">24%</div>
        <div class="card-sub">RAM: 1.4 GB / 4.0 GB</div>
      </div>

      <div class="metric-card">
        <div class="card-title">PM2 Process <span class="badge green">ONLINE</span></div>
        <div class="card-value">Uptime</div>
        <div class="card-sub">14 giorni, 6 ore</div>
      </div>

      <div class="metric-card">
        <div class="card-title">Utenti Attivi <span class="badge blue">LIVE</span></div>
        <div class="card-value">42</div>
        <div class="card-sub">Connessioni Socket simultanee</div>
      </div>
    </div>

    <!-- TAB DI NAVIGAZIONE -->
    <div class="admin-tabs">
      <button :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">👥 Gestione Utenti ({{ users.length }})</button>
      <button :class="{ active: activeTab === 'moderation' }" @click="activeTab = 'moderation'">🛡️ Coda Moderazione (3)</button>
      <button :class="{ active: activeTab === 'infrastructure' }" @click="activeTab = 'infrastructure'">📊 Monitoraggio Infrastruttura</button>
      <button :class="{ active: activeTab === 'sentinel' }" @click="activeTab = 'sentinel'" class="tab-sentinel">🤖 Log Minacce & Policy Sentinel AI</button>
    </div>

    <!-- TAB 1: GESTIONE UTENTI -->
    <div v-if="activeTab === 'users'" class="tab-content">
      <div class="search-bar">
        <input v-model="searchQuery" type="text" placeholder="Cerca utente per username o email..." class="input-search" />
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>UTENTE</th>
            <th>EMAIL</th>
            <th>RUOLO</th>
            <th>STATO</th>
            <th>ISCRITTO IL</th>
            <th>AZIONI</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td><strong>@{{ user.username }}</strong></td>
            <td>{{ user.email }}</td>
            <td><span class="role-badge">{{ user.role }}</span></td>
            <td>
              <span :class="['status-badge', user.status === 'ACTIVE' ? 'active' : 'suspended']">
                {{ user.status }}
              </span>
            </td>
            <td>{{ user.joined }}</td>
            <td>
              <button @click="toggleUserStatus(user)" :class="['btn-action', user.status === 'ACTIVE' ? 'danger' : 'success']">
                {{ user.status === 'ACTIVE' ? 'Sospendi' : 'Riattiva' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- TAB 4: PULSE SENTINEL AI FIREWALL LOGS -->
    <div v-else-if="activeTab === 'sentinel'" class="tab-content sentinel-panel">
      <div class="policy-warning-box">
        <div class="warning-icon">⚠️</div>
        <div class="warning-text">
          <h4>Policy di Protezione GCP & Uso Etico</h4>
          <p>
            Il nostro sistema difensivo monitora attivamente i tentativi di abusare delle API, Prompt Injection sulla chat
            Pulse Nexus, e attacchi DDoS. Ogni abuso viene registrato e penalizzato con il ban istantaneo dell'IP e dell'account.
          </p>
        </div>
      </div>

      <div v-if="sentinelData && sentinelData.recentThreats" class="threats-section">
        <div class="section-header">
          <h3>Registro Minacce Intercettate dall'IA</h3>
          <button @click="triggerAction('purge_threats')" class="btn-purge">Pulisci Log</button>
        </div>

        <div class="threats-list">
          <div v-for="threat in sentinelData.recentThreats" :key="threat.id" class="threat-item">
            <div class="threat-left">
              <span :class="['severity-badge', threat.severity.toLowerCase()]">{{ threat.severity }}</span>
              <div class="threat-info">
                <strong>{{ threat.type }}</strong>
                <span>Destinazione: {{ threat.target }} • IP: <code>{{ threat.ip }}</code></span>
              </div>
            </div>
            <div class="threat-right">
              <span class="threat-time">{{ new Date(threat.timestamp).toLocaleTimeString() }}</span>
              <button @click="triggerAction('ban_ip', { ip: threat.ip })" class="btn-ban">
                🚫 Ban Definitivo IP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container { max-width: 1240px; margin: 0 auto; padding: 2rem 1.5rem; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }

.admin-header { display: flex; justify-content: space-between; align-items: center; background: #090d16; border: 1px solid #1e293b; padding: 1.5rem 2rem; border-radius: 14px; margin-bottom: 1.5rem; }
.admin-header h1 { font-size: 1.8rem; margin: 0 0 0.3rem; font-weight: 900; }
.admin-header p { margin: 0; color: #94a3b8; font-size: 0.9rem; }

.region-badge { background: rgba(15, 23, 42, 0.8); border: 1px solid #1e293b; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.8rem; color: #38bdf8; display: flex; align-items: center; gap: 0.5rem; font-weight: 700; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-dot.green { background: #00dc82; box-shadow: 0 0 8px #00dc82; }

/* SENTINEL AI BANNER */
.sentinel-monitor-banner { background: linear-gradient(135deg, #090d16 0%, #030712 100%); border: 1px solid #1e293b; border-left: 4px solid #a855f7; border-radius: 14px; padding: 1.5rem 2rem; margin-bottom: 1.5rem; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); }
.sentinel-monitor-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06); padding-bottom: 1.25rem; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
.sentinel-brand { display: flex; align-items: center; gap: 1rem; }
.shield-pulse { font-size: 2.2rem; filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.5)); }
.sentinel-brand h2 { margin: 0; font-size: 1.4rem; font-weight: 900; color: #f8fafc; display: flex; align-items: center; gap: 0.75rem; }
.badge-status { font-size: 0.7rem; background: rgba(0, 220, 130, 0.15); color: #00dc82; border: 1px solid #00dc82; padding: 0.15rem 0.5rem; border-radius: 4px; text-transform: uppercase; }
.sentinel-sub { margin: 0.2rem 0 0; color: #94a3b8; font-size: 0.85rem; }

.btn-toggle-switch { background: #020420; border: 1px solid #1e293b; color: #f8fafc; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; align-items: flex-end; gap: 0.2rem; }
.btn-toggle-switch span { font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 800; }
.btn-toggle-switch.active { border-color: #00dc82; color: #00dc82; background: rgba(0, 220, 130, 0.05); }

.sentinel-monitor-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
.monitor-cell { display: flex; flex-direction: column; gap: 0.4rem; }
.cell-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 800; }
.cell-val { font-size: 1.5rem; font-weight: 900; }
.highlight-purple { color: #c084fc; }
.highlight-green { color: #00dc82; }
.highlight-blue { color: #38bdf8; }

.threat-meter-box { display: flex; align-items: center; gap: 0.75rem; }
.threat-bar { flex-grow: 1; height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden; }
.threat-fill { height: 100%; background: linear-gradient(90deg, #00dc82 0%, #f59e0b 50%, #ef4444 100%); }
.threat-val { font-size: 1.1rem; font-weight: 900; color: #38bdf8; width: 42px; }

.sentinel-notification { background: rgba(0, 220, 130, 0.12); border: 1px solid #00dc82; color: #00dc82; padding: 1rem 1.5rem; border-radius: 10px; margin-bottom: 1.5rem; font-weight: 800; }

.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
.metric-card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.25rem; }
.card-title { display: flex; justify-content: space-between; font-size: 0.85rem; color: #94a3b8; font-weight: 700; }
.card-value { font-size: 1.8rem; font-weight: 900; color: #f8fafc; margin: 0.5rem 0 0.2rem; }
.card-sub { font-size: 0.78rem; color: #64748b; }

.badge { font-size: 0.65rem; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 800; }
.badge.green { background: rgba(0, 220, 130, 0.15); color: #00dc82; }
.badge.blue { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }

.admin-tabs { display: flex; gap: 0.75rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.admin-tabs button { background: transparent; border: 1px solid transparent; color: #94a3b8; padding: 0.65rem 1.2rem; border-radius: 8px; font-weight: 700; font-size: 0.88rem; cursor: pointer; }
.admin-tabs button.active { background: #090d16; border-color: #00dc82; color: #00dc82; }
.admin-tabs button.tab-sentinel.active { border-color: #a855f7; color: #c084fc; }

.search-bar { margin-bottom: 1rem; }
.input-search { width: 100%; max-width: 400px; background: #090d16; border: 1px solid #1e293b; padding: 0.75rem 1rem; border-radius: 8px; color: #f8fafc; outline: none; }

.data-table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; text-align: left; }
.data-table th, .data-table td { padding: 0.85rem 1rem; border-bottom: 1px solid #1e293b; font-size: 0.9rem; }
.data-table th { color: #64748b; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; }

.role-badge { background: #1e293b; color: #38bdf8; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
.status-badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 800; }
.status-badge.active { background: rgba(0, 220, 130, 0.15); color: #00dc82; }
.status-badge.suspended { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

.btn-action { border: none; padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 0.78rem; }
.btn-action.danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.btn-action.success { background: rgba(0, 220, 130, 0.15); color: #00dc82; }

.policy-warning-box { background: rgba(234, 179, 8, 0.08); border: 1px solid rgba(234, 179, 8, 0.25); border-radius: 12px; padding: 1.25rem 1.5rem; display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
.warning-icon { font-size: 1.8rem; }
.warning-text h4 { margin: 0 0 0.25rem; color: #facc15; font-size: 1rem; }
.warning-text p { margin: 0; color: #cbd5e1; font-size: 0.88rem; line-height: 1.4; }

.threats-section { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
.section-header h3 { margin: 0; font-size: 1.1rem; }

.btn-purge { background: #020420; border: 1px solid #1e293b; color: #94a3b8; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }

.threats-list { display: flex; flex-direction: column; gap: 0.75rem; }
.threat-item { background: #020420; border: 1px solid #1e293b; border-radius: 10px; padding: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }

.threat-left { display: flex; align-items: center; gap: 1rem; }
.severity-badge { font-size: 0.68rem; font-weight: 900; padding: 0.2rem 0.5rem; border-radius: 4px; }
.severity-badge.critical { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; }
.severity-badge.high { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid #f59e0b; }
.severity-badge.medium { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #38bdf8; }

.threat-info { display: flex; flex-direction: column; }
.threat-info strong { font-size: 0.95rem; color: #f8fafc; }
.threat-info span { font-size: 0.8rem; color: #64748b; margin-top: 0.15rem; }
.threat-info code { color: #38bdf8; }

.threat-right { display: flex; align-items: center; gap: 1rem; }
.threat-time { font-size: 0.8rem; color: #64748b; }

.btn-ban { background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #ef4444; padding: 0.45rem 0.85rem; border-radius: 6px; font-weight: 700; font-size: 0.8rem; cursor: pointer; }
.btn-ban:hover { background: #ef4444; color: #ffffff; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>