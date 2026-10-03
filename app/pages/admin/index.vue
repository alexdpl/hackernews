<!-- app/pages/admin/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

useDkpSeo({
  title: 'Admin Control Center - DKP Sentinel AI',
  description: 'Pannello di controllo centrale e monitoraggio difensivo con Pulse Sentinel AI.'
})

// Stato reattivo Notifiche Toast
const showToast = ref(false)
const toastMessage = ref('')

const { getMainUrl, getMailUrl, getApiUrl } = useDomain()

const activeTab = ref<'users' | 'moderation' | 'infrastructure' | 'sentinel'>('users')
const searchQuery = ref('')

// Gestione Reattiva Utenti
const users = ref([
  { id: 1, username: 'alexdpl', email: 'alex@devkernelpulse.org', role: 'Admin', status: 'ACTIVE', joined: '2026-01-10' },
  { id: 2, username: 'dev_ninja', email: 'ninja@code.dev', role: 'Moderator', status: 'ACTIVE', joined: '2026-03-12' },
  { id: 3, username: 'bot_scrapper', email: 'crawler@darknet.org', role: 'User', status: 'SUSPENDED', joined: '2026-09-20' }
])

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return users.value
  const q = searchQuery.value.toLowerCase()
  return users.value.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
})

// Dati Sentinel AI Firewall
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

// Funzione Toggle Auto-Defend AI con Toast verde
function toggleAutoDefend() {
  // 1. Inverte lo stato locale reattivo
  sentinelData.value.autoDefendEnabled = !sentinelData.value.autoDefendEnabled
  
  // 2. Prepara il messaggio Toast
  if (sentinelData.value.autoDefendEnabled) {
    toastMessage.value = '🤖 Auto-Defend AI: Sistema di protezione euristica ATTIVATO e sincronizzato!'
  } else {
    toastMessage.value = '⚠️ Auto-Defend AI: Sistema di protezione euristica DISATTIVATO.'
  }
  
  // 3. Mostra la finestrella verde Toast
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)

  // 4. Sincronizza in background con il server
  triggerAction('toggle_autodefend', { enabled: sentinelData.value.autoDefendEnabled })
}

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
      setTimeout(() => { notificationMsg.value = '' }, 4000)
    }
  } catch (err: any) {
    console.warn('Esecuzione locale fallback azione Sentinel:', actionName)
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
    <!-- FINESTRELLA VERDE TOAST NOTIFICATION -->
    <Transition name="toast-fade">
      <div v-if="showToast" class="dkp-toast-success">
        <div class="toast-content">
          <span class="toast-icon">✅</span>
          <span class="toast-text">{{ toastMessage }}</span>
        </div>
      </div>
    </Transition>

    <!-- 1. HEADER CONTROL CENTER -->
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

    <!-- NUOVA NAVBAR GRID v2.4-GOLD (DASHBOARD IN ALTO + 2 RIGHE X 4 MODULI) -->
<div class="admin-nav-container">
  <!-- TOP BAR SUPERIORE: BRANDING & DASHBOARD IN ALTO A DESTRA -->
  <div class="admin-nav-top">
    <div class="nav-branding">
      <span class="status-dot green"></span>
      <span class="nav-title">DKP ADMIN CONTROL CENTER</span>
    </div>

    <NuxtLink :to="getMainUrl('/admin')" external class="nav-tab btn-dashboard-main" exact-active-class="active">
      🏠 Dashboard Main
    </NuxtLink>
  </div>

  <!-- GRID MODULI: 2 RIGHE DA 4 LINK (8 MODULI TOTALI) -->
  <nav class="admin-grid-nav">
    <!-- RIGA 1 (4 LINK) -->
    <NuxtLink :to="getMainUrl('/admin/api-gateway')" external class="nav-tab btn-dashboard" active-class="active">
      ⚙️ API Gateway
    </NuxtLink>
    <NuxtLink :to="getMailUrl('/admin/mail')" external class="nav-tab btn-dashboard" active-class="active">
      📧 Mail Center
    </NuxtLink>
    <NuxtLink :to="getMailUrl('/admin/newsletter')" external class="nav-tab btn-dashboard" active-class="active">
      📣 Newsletter
    </NuxtLink>
    <NuxtLink :to="getMailUrl('/admin/autoresponder')" external class="nav-tab btn-dashboard" active-class="active">
      📡 Autoresponder
    </NuxtLink>

    <!-- RIGA 2 (4 LINK INCLUSO JOBS) -->
    <NuxtLink to="/admin/crawler" external class="nav-tab btn-dashboard" active-class="active">
      🤖 Crawler Engine
    </NuxtLink>
    <NuxtLink to="/admin/blog" external class="nav-tab btn-dashboard" active-class="active">
      📝 Gestione Blog
    </NuxtLink>
    <NuxtLink to="/admin/shop" external class="nav-tab btn-dashboard" active-class="active">
      🛍️ Gestione Shop
    </NuxtLink>
    <NuxtLink to="/admin/jobs" external class="nav-tab btn-dashboard" active-class="active">
      💼 Gestione Jobs
    </NuxtLink>
  </nav>
</div>

    <!-- 3. MONITOR FIREWALL SENTINEL AI BANNER (v2.4-GOLD) -->
    <div class="sentinel-monitor-banner">
      <div class="sentinel-monitor-header">
        <div class="sentinel-brand">
          <span class="shield-pulse">🛡️</span>
          <div>
            <h2>
              Pulse Sentinel AI 
              <span class="badge-status gold">v2.4-GOLD</span>
            </h2>
            <p class="sentinel-sub">
              Firewall Euristico, SAST/AST Engine & System Defense attivi nell'infrastruttura Kernel v2.4
            </p>
          </div>
        </div>

        <!-- Bottone Interattivo di Toggle Auto-Defend -->
        <button 
          @click="toggleAutoDefend" 
          :class="['btn-toggle-switch', sentinelData.autoDefendEnabled ? 'active' : 'inactive']"
          title="Clicca per attivare/disattivare Auto-Defend AI"
        >
          <span>Auto-Defend AI</span>
          <strong>{{ sentinelData.autoDefendEnabled ? 'ENABLED 🟢' : 'DISABLED 🔴' }}</strong>
        </button>
      </div>

      <!-- Grid dinamica con dati reattivi da sentinelData -->
      <div class="sentinel-monitor-grid">
        <div class="monitor-cell">
          <span class="cell-label">GLOBAL THREAT INDEX</span>
          <div class="threat-meter-box">
            <div class="threat-bar">
              <div class="threat-fill" :style="{ width: sentinelData.globalThreatIndex + '%' }"></div>
            </div>
            <span class="threat-val">{{ sentinelData.globalThreatIndex }}%</span>
          </div>
        </div>

        <div class="monitor-cell">
          <span class="cell-label">RICHIESTE MALEVOLE BLOCCATE (24H)</span>
          <span class="cell-val purple">{{ sentinelData.blockedRequests24h || 1845 }}</span>
        </div>

        <div class="monitor-cell">
          <span class="cell-label">GCP ARMOR ENGINE</span>
          <span class="cell-val green">{{ sentinelData.gcpArmorStatus || 'OPTIMAL' }}</span>
        </div>

        <div class="monitor-cell">
          <span class="cell-label">REGOLE ATTIVE</span>
          <span class="cell-val blue">{{ sentinelData.activeFirewallRules || 24 }} Rules</span>
        </div>
      </div>
    </div>

    <!-- NOTIFICA SISTEMA INTERNA -->
    <Transition name="fade">
      <div v-if="notificationMsg" class="sentinel-notification">
        ⚡ {{ notificationMsg }}
      </div>
    </Transition>

    <!-- 4. METRICHE TOP DASHBOARD -->
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

    <!-- 5. TAB DI NAVIGAZIONE INTERNA -->
    <div class="admin-tabs">
      <button :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
        👥 Gestione Utenti ({{ users.length }})
      </button>
      <button :class="{ active: activeTab === 'moderation' }" @click="activeTab = 'moderation'">
        🛡️ Coda Moderazione (3)
      </button>
      <button :class="{ active: activeTab === 'infrastructure' }" @click="activeTab = 'infrastructure'">
        📊 Monitoraggio Infrastruttura
      </button>
      <button :class="{ active: activeTab === 'sentinel' }" @click="activeTab = 'sentinel'" class="tab-sentinel">
        🤖 Log Minacce & Policy Sentinel AI
      </button>
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

    <!-- TAB 4: SENTINEL LOGS -->
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

/* -------------------------------------------------------------
   🎨 STILI DKP ADMIN NAVBAR v2.4-GOLD
------------------------------------------------------------- */
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

/* GRID MODULI (2 RIGHE X 4 LINK) */
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

/* 🟢 MODULI STANDARD (VERDE NEON) */
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

/* 🌐 TASTO MAIN DASHBOARD (CIANO ELECTRIC) */
.btn-dashboard-main {
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.06);
  border: 1px solid rgba(0, 240, 255, 0.4);
}

.btn-dashboard-main:hover,
.btn-dashboard-main.active {
  background: rgba(0, 240, 255, 0.16);
  border-color: #00f0ff;
  box-shadow: 0 0 14px rgba(0, 240, 255, 0.35);
  transform: translateY(-1px);
}

/* ADATTAMENTO PER SCHERMI PICCOLI / TABLET */
@media (max-width: 1024px) {
  .admin-grid-nav {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 580px) {
  .admin-grid-nav {
    grid-template-columns: 1fr;
  }
}

/* ==========================================================================
   FINESTRELLA TOAST NOTIFICATION (FINESTRELLA VERDE)
   ========================================================================== */
.dkp-toast-success {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 999999;
  background: #061811;
  border: 1px solid #00dc82;
  box-shadow: 0 10px 30px rgba(0, 220, 130, 0.35), 0 0 15px rgba(0, 220, 130, 0.2);
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
  line-height: 1.4;
}

.toast-icon {
  font-size: 1.15rem;
}

.toast-fade-enter-active, .toast-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-fade-enter-from, .toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-15px) scale(0.95);
}

/* ==========================================================================
   1. LAYOUT GENERALE & CONTAINER DASHBOARD
   ========================================================================== */
.admin-container {
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 4rem;
}

/* ==========================================================================
   2. HERO BANNER & STATUS REGIONALE
   ========================================================================== */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.75rem 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.admin-header h1 {
  font-size: 1.9rem;
  margin: 0 0 0.4rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.admin-header p {
  margin: 0;
  color: #94a3b8;
  font-size: 0.95rem;
  line-height: 1.5;
}

.region-badge {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid #1e293b;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  color: #38bdf8;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.green {
  background: #00dc82;
  box-shadow: 0 0 10px #00dc82;
}

/* ==========================================================================
   3. NAVBAR ORIZZONTALE DI AMMINISTRAZIONE v2.4-GOLD
   ========================================================================== */
.admin-horizontal-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #090d16;
  border: 1px solid #1e293b;
  padding: 0.5rem;
  border-radius: 10px;
  overflow-x: auto;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.admin-horizontal-nav::-webkit-scrollbar { display: none; }
.admin-horizontal-nav { -ms-overflow-style: none; scrollbar-width: none; }

.nav-tab {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 1.15rem;
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: 6px;
  transition: all 0.2s ease;
  background: transparent;
  border: 1px solid transparent;
}

.nav-tab:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
}

.nav-tab.active {
  background: rgba(0, 220, 130, 0.12);
  color: #00dc82;
  border-color: rgba(0, 220, 130, 0.35);
  box-shadow: 0 0 12px rgba(0, 220, 130, 0.15);
}

/* ==========================================================================
   4. PULSE SENTINEL AI BANNER & FIREWALL MONITOR
   ========================================================================== */
.sentinel-monitor-banner {
  background: linear-gradient(135deg, #090d16 0%, #030712 100%);
  border: 1px solid #1e293b;
  border-left: 4px solid #a855f7;
  border-radius: 12px;
  padding: 1.75rem 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.sentinel-monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 1.25rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.sentinel-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.shield-pulse {
  font-size: 2.2rem;
  filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.5));
}

.sentinel-brand h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 900;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.badge-status.gold {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  border: 1px solid #00dc82;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 800;
  box-shadow: 0 0 10px rgba(0, 220, 130, 0.2);
  text-transform: uppercase;
}

.sentinel-sub {
  margin: 0.3rem 0 0;
  color: #94a3b8;
  font-size: 0.88rem;
}

/* SWITCH SENTINEL ACTIVE */
.btn-toggle-switch {
  background: #020420;
  border: 1px solid #1e293b;
  color: #f8fafc;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
  transition: all 0.2s ease;
}

.btn-toggle-switch span {
  font-size: 0.7rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 800;
}

.btn-toggle-switch.active {
  border-color: #00dc82;
  color: #00dc82;
  background: rgba(0, 220, 130, 0.08);
  box-shadow: 0 0 12px rgba(0, 220, 130, 0.2);
}

.btn-toggle-switch.inactive {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

.btn-toggle-switch:hover {
  transform: translateY(-1px);
}

/* GRID METRICHE SENTINEL */
.sentinel-monitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.monitor-cell {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.cell-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.cell-val {
  font-size: 1.55rem;
  font-weight: 900;
}

.cell-val.purple { color: #c084fc; }
.cell-val.green { color: #00dc82; }
.cell-val.blue { color: #38bdf8; }

.threat-meter-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.threat-bar {
  flex-grow: 1;
  height: 8px;
  background: #1e293b;
  border-radius: 4px;
  overflow: hidden;
}

.threat-fill {
  height: 100%;
  background: linear-gradient(90deg, #00dc82 0%, #f59e0b 50%, #ef4444 100%);
  transition: width 0.3s ease;
}

.threat-val {
  font-size: 1.1rem;
  font-weight: 900;
  color: #38bdf8;
  width: 42px;
}

.sentinel-notification {
  background: rgba(0, 220, 130, 0.12);
  border: 1px solid #00dc82;
  color: #00dc82;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  font-weight: 800;
}

/* ==========================================================================
   5. CARDS METRICHE DI SISTEMA (NEON, GCP, PM2)
   ========================================================================== */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}

.metric-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  border-color: #334155;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #94a3b8;
  font-weight: 700;
}

.card-value {
  font-size: 1.85rem;
  font-weight: 900;
  color: #f8fafc;
  margin: 0.5rem 0 0.2rem;
}

.card-sub {
  font-size: 0.78rem;
  color: #64748b;
}

.badge {
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-weight: 800;
}

.badge.green { background: rgba(0, 220, 130, 0.15); color: #00dc82; }
.badge.blue { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }

/* ==========================================================================
   6. TAB ED ELEMENTI DI FILTRAGGIO
   ========================================================================== */
.admin-tabs {
  display: flex;
  gap: 0.75rem;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 0.75rem;
  flex-wrap: wrap;
}

.admin-tabs button {
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  padding: 0.65rem 1.2rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.admin-tabs button:hover {
  color: #ffffff;
}

.admin-tabs button.active {
  background: #090d16;
  border-color: #00dc82;
  color: #00dc82;
}

.admin-tabs button.tab-sentinel.active {
  border-color: #a855f7;
  color: #c084fc;
}

.search-bar {
  margin-bottom: 0.5rem;
}

.input-search {
  width: 100%;
  max-width: 400px;
  background: #090d16;
  border: 1px solid #1e293b;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: #f8fafc;
  outline: none;
  font-size: 0.88rem;
  transition: border-color 0.2s ease;
}

.input-search:focus {
  border-color: #00dc82;
}

/* ==========================================================================
   7. TABELLA DATI & BADGES AZIONE
   ========================================================================== */
.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  overflow: hidden;
}

.data-table th,
.data-table td {
  padding: 0.85rem 1.2rem;
  border-bottom: 1px solid #1e293b;
  font-size: 0.88rem;
}

.data-table th {
  background: #020420;
  color: #64748b;
  font-weight: 800;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.role-badge {
  background: #1e293b;
  color: #38bdf8;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
}

.status-badge {
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 800;
}

.status-badge.active { background: rgba(0, 220, 130, 0.15); color: #00dc82; }
.status-badge.suspended { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

.btn-action {
  border: none;
  padding: 0.4rem 0.85rem;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.78rem;
  transition: all 0.15s ease;
}

.btn-action.danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.btn-action.danger:hover { background: #ef4444; color: #ffffff; }

.btn-action.success { background: rgba(0, 220, 130, 0.15); color: #00dc82; }
.btn-action.success:hover { background: #00dc82; color: #020420; }

/* ==========================================================================
   8. ALERT DI SICUREZZA & SEZIONE MINACCE SENTINEL
   ========================================================================== */
.policy-warning-box {
  background: rgba(234, 179, 8, 0.08);
  border: 1px solid rgba(234, 179, 8, 0.25);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.warning-icon { font-size: 1.8rem; }
.warning-text h4 { margin: 0 0 0.25rem; color: #facc15; font-size: 1rem; }
.warning-text p { margin: 0; color: #cbd5e1; font-size: 0.88rem; line-height: 1.4; }

.threats-section {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.section-header h3 { margin: 0; font-size: 1.1rem; color: #ffffff; }

.btn-purge {
  background: #020420;
  border: 1px solid #1e293b;
  color: #94a3b8;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 700;
  transition: all 0.15s ease;
}

.btn-purge:hover {
  border-color: #00dc82;
  color: #00dc82;
}

.threats-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.threat-item {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.threat-left { display: flex; align-items: center; gap: 1rem; }

.severity-badge {
  font-size: 0.68rem;
  font-weight: 900;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.severity-badge.critical { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; }
.severity-badge.high { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid #f59e0b; }
.severity-badge.medium { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #38bdf8; }

.threat-info { display: flex; flex-direction: column; }
.threat-info strong { font-size: 0.95rem; color: #f8fafc; }
.threat-info span { font-size: 0.8rem; color: #64748b; margin-top: 0.15rem; }
.threat-info code { color: #38bdf8; font-family: monospace; }

.threat-right { display: flex; align-items: center; gap: 1rem; }
.threat-time { font-size: 0.8rem; color: #64748b; }

.btn-ban {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-ban:hover {
  background: #ef4444;
  color: #ffffff;
}

/* ==========================================================================
   9. MEDIA QUERIES & RESPONSIVE DESIGN
   ========================================================================== */
@media (max-width: 900px) {
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .sentinel-monitor-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .threat-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .threat-right {
    width: 100%;
    justify-content: space-between;
  }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>