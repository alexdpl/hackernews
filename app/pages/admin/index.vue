<!-- app/pages/admin/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const { currentUser, isAuthenticated } = useAuthCore()
const router = useRouter()

// Guard client-side per bloccare chiunque non sia alexdpl / admin
const isAdmin = computed(() => {
  if (!currentUser.value) return false
  const username = currentUser.value.username?.toLowerCase()
  const role = currentUser.value.role?.toLowerCase()
  return username === 'alexdpl' || role === 'admin'
})

onMounted(() => {
  if (!isAuthenticated.value || !isAdmin.value) {
    router.push('/')
  }
})

// Tab Admin: 'users' | 'moderation' | 'metrics'
const activeAdminTab = ref<'users' | 'moderation' | 'metrics'>('users')

// --- METRICHE DI SISTEMA (Neon DB, GCP, PM2) ---
const systemMetrics = ref({
  neonStatus: 'CONNECTED',
  neonLatencyMs: 18,
  neonConnections: '14/50 active',
  gcpLoadCpu: '24%',
  gcpRamUsed: '1.4 GB / 4.0 GB',
  pm2Status: 'ONLINE',
  pm2Uptime: '14 giorni, 6 ore',
  activeUsersOnline: 42
})

// --- GESTIONE UTENTI ---
const searchQuery = ref('')
const usersList = ref([
  { id: 'usr-1', username: 'alexdpl', email: 'alex@devkernelpulse.io', role: 'admin', status: 'ACTIVE', joined: '2026-01-10' },
  { id: 'usr-2', username: 'dev_ninja', email: 'ninja@code.dev', role: 'moderator', status: 'ACTIVE', joined: '2026-03-12' },
  { id: 'usr-3', username: 'spammer_bot', email: 'bot@spam.com', role: 'user', status: 'SUSPENDED', joined: '2026-09-01' },
  { id: 'usr-4', username: 'marco_vue', email: 'marco@framework.it', role: 'user', status: 'ACTIVE', joined: '2026-08-15' }
])

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return usersList.value
  const q = searchQuery.value.toLowerCase()
  return usersList.value.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
})

function changeRole(userId: string, newRole: 'user' | 'moderator' | 'admin') {
  const user = usersList.value.find(u => u.id === userId)
  if (user) user.role = newRole
}

function toggleUserStatus(userId: string) {
  const user = usersList.value.find(u => u.id === userId)
  if (user) {
    user.status = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
  }
}

// --- MODERAZIONE CONTENUTI ---
const pendingModeration = ref([
  { id: 'mod-1', type: 'submission', title: 'Script di automazione web scraping in Python', author: 'spammer_bot', flagReason: 'Possibile link malevolo / Spam' },
  { id: 'mod-2', type: 'comment', title: 'Commento su "Nuovo compilatore Vue"', author: 'anon_dev', content: 'Questo tool è spazzatura, visitate il mio sito xyz.com', flagReason: 'Linguaggio inappropriato' },
  { id: 'mod-3', type: 'job', title: 'Senior Backend Engineer (Remote)', author: 'tech_corp', company: 'Tech Corp LLC', flagReason: 'In attesa di verifica' }
])

function approveContent(id: string) {
  pendingModeration.value = pendingModeration.value.filter(item => item.id !== id)
}

function rejectContent(id: string) {
  pendingModeration.value = pendingModeration.value.filter(item => item.id !== id)
}
</script>

<template>
  <div v-if="isAdmin" class="admin-wrapper">
    <!-- ADMIN HEADER -->
    <header class="admin-header">
      <div>
        <h1>🔒 Control Center Admin</h1>
        <p class="admin-subtitle">Gestione piattaforma, moderazione contenuti e stato dell'infrastruttura.</p>
      </div>
      <div class="server-pill">
        <span class="status-dot"></span> GCP Region: europe-west1
      </div>
    </header>

    <!-- SYSTEM METRICS CARDS -->
    <section class="metrics-grid">
      <div class="metric-card">
        <div class="metric-top">
          <span class="metric-label">Neon DB Status</span>
          <span class="badge-status online">{{ systemMetrics.neonStatus }}</span>
        </div>
        <div class="metric-value">{{ systemMetrics.neonLatencyMs }} ms</div>
        <div class="metric-sub">{{ systemMetrics.neonConnections }}</div>
      </div>

      <div class="metric-card">
        <div class="metric-top">
          <span class="metric-label">GCP Cloud Load</span>
          <span class="badge-status normal">STABLE</span>
        </div>
        <div class="metric-value">{{ systemMetrics.gcpLoadCpu }}</div>
        <div class="metric-sub">RAM: {{ systemMetrics.gcpRamUsed }}</div>
      </div>

      <div class="metric-card">
        <div class="metric-top">
          <span class="metric-label">PM2 Process</span>
          <span class="badge-status online">{{ systemMetrics.pm2Status }}</span>
        </div>
        <div class="metric-value">Uptime</div>
        <div class="metric-sub">{{ systemMetrics.pm2Uptime }}</div>
      </div>

      <div class="metric-card">
        <div class="metric-top">
          <span class="metric-label">Utenti Attivi</span>
          <span class="badge-status live">LIVE</span>
        </div>
        <div class="metric-value">{{ systemMetrics.activeUsersOnline }}</div>
        <div class="metric-sub">Connessioni Socket simultanee</div>
      </div>
    </section>

    <!-- NAVIGAZIONE SCHEDE ADMIN -->
    <nav class="admin-tabs">
      <button :class="['tab-btn', { active: activeAdminTab === 'users' }]" @click="activeAdminTab = 'users'">
        👥 Gestione Utenti ({{ usersList.length }})
      </button>
      <button :class="['tab-btn', { active: activeAdminTab === 'moderation' }]" @click="activeAdminTab = 'moderation'">
        🛡️ Coda Moderazione ({{ pendingModeration.length }})
      </button>
      <button :class="['tab-btn', { active: activeAdminTab === 'metrics' }]" @click="activeAdminTab = 'metrics'">
        📊 Monitoraggio Infrastruttura
      </button>
    </nav>

    <!-- SEZIONE 1: GESTIONE UTENTI -->
    <section v-if="activeAdminTab === 'users'" class="admin-pane">
      <div class="pane-controls">
        <input v-model="searchQuery" type="text" placeholder="Cerca utente per username o email..." class="search-input" />
      </div>

      <table class="admin-table">
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
          <tr v-for="u in filteredUsers" :key="u.id">
            <td><strong>@{{ u.username }}</strong></td>
            <td class="text-subtle">{{ u.email }}</td>
            <td>
              <select :value="u.role" @change="e => changeRole(u.id, (e.target as HTMLSelectElement).value as any)" class="role-select">
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </td>
            <td>
              <span class="status-pill" :class="u.status.toLowerCase()">{{ u.status }}</span>
            </td>
            <td class="text-subtle">{{ u.joined }}</td>
            <td>
              <button @click="toggleUserStatus(u.id)" class="action-btn" :class="u.status === 'ACTIVE' ? 'ban' : 'unban'">
                {{ u.status === 'ACTIVE' ? 'Sospendi' : 'Riabilita' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- SEZIONE 2: CODA DI MODERAZIONE -->
    <section v-if="activeAdminTab === 'moderation'" class="admin-pane">
      <div v-if="pendingModeration.length > 0" class="moderation-list">
        <div v-for="item in pendingModeration" :key="item.id" class="mod-card">
          <div class="mod-header">
            <span class="mod-type">{{ item.type.toUpperCase() }}</span>
            <span class="mod-reason">Segnalazione: {{ item.flagReason }}</span>
          </div>
          <h3 class="mod-title">{{ item.title }}</h3>
          <p v-if="item.content" class="mod-content">"{{ item.content }}"</p>
          <p class="mod-author">Autore: <strong>@{{ item.author }}</strong></p>
          <div class="mod-actions">
            <button @click="approveContent(item.id)" class="btn-approve">✓ Approva</button>
            <button @click="rejectContent(item.id)" class="btn-reject">✕ Rimuovi / Ban</button>
          </div>
        </div>
      </div>
      <div v-else class="empty-mod">
        <p>🎉 Nessun elemento in attesa di moderazione!</p>
      </div>
    </section>

    <!-- SEZIONE 3: METRICHE DETTAGLIATE -->
    <section v-if="activeAdminTab === 'metrics'" class="admin-pane">
      <div class="metrics-detail-box">
        <h3>Neon PostgreSQL Cluster Details</h3>
        <p>Region: <code>aws-eu-central-1</code> | Engine Version: <code>PostgreSQL 16</code></p>
        <div class="log-box">
          <code>[SYSTEM LOG] 2026-09-24 20:00:00 - Database Health Check OK (Latency 18ms)</code><br />
          <code>[SYSTEM LOG] 2026-09-24 20:05:00 - GCP Instance auto-scale pool stable</code><br />
          <code>[SYSTEM LOG] 2026-09-24 20:10:00 - Nitro SSR worker thread memory clean</code>
        </div>
      </div>
    </section>

  </div>
  
  <div v-else class="access-denied">
    <h2>Reindirizzamento in corso...</h2>
  </div>
</template>

<style scoped>
.admin-wrapper {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
  color: #f8fafc;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: #090d16;
  border: 1px solid #1e293b;
  padding: 1.5rem 2rem;
  border-radius: 12px;
}

.admin-header h1 { margin: 0 0 0.25rem 0; font-size: 1.6rem; }
.admin-subtitle { margin: 0; color: #94a3b8; font-size: 0.9rem; }

.server-pill {
  background: #020420;
  border: 1px solid #1e293b;
  padding: 0.4rem 0.8rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  color: #38bdf8;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #00dc82;
  border-radius: 50%;
  box-shadow: 0 0 8px #00dc82;
}

/* CARDS METRICHE */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 1.25rem;
}

.metric-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.metric-label { font-size: 0.8rem; color: #94a3b8; font-weight: 600; }

.badge-status {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

.badge-status.online, .badge-status.normal { background: rgba(0, 220, 130, 0.15); color: #00dc82; }
.badge-status.live { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }

.metric-value { font-size: 1.5rem; font-weight: 800; color: #f8fafc; margin-bottom: 0.25rem; }
.metric-sub { font-size: 0.75rem; color: #64748b; }

/* TABS */
.admin-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid #1e293b;
  margin-bottom: 1.5rem;
}

.tab-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab-btn.active { color: #00dc82; border-bottom-color: #00dc82; }

/* PANES & TABLES */
.admin-pane {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
}

.pane-controls { margin-bottom: 1.25rem; }

.search-input {
  width: 100%;
  max-width: 400px;
  background: #020420;
  border: 1px solid #1e293b;
  color: #fff;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.85rem;
}

.admin-table th { color: #64748b; border-bottom: 1px solid #1e293b; padding: 0.75rem; }
.admin-table td { border-bottom: 1px solid #1e293b; padding: 0.75rem; }
.text-subtle { color: #94a3b8; }

.role-select {
  background: #020420;
  border: 1px solid #1e293b;
  color: #cbd5e1;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.status-pill {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.status-pill.active { background: rgba(0, 220, 130, 0.15); color: #00dc82; }
.status-pill.suspended { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

.action-btn {
  border: none;
  padding: 0.3rem 0.65rem;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.75rem;
  cursor: pointer;
}

.action-btn.ban { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.action-btn.unban { background: rgba(0, 220, 130, 0.15); color: #00dc82; }

/* MODERATION LIST */
.moderation-list { display: flex; flex-direction: column; gap: 1rem; }
.mod-card { background: #020420; border: 1px solid #1e293b; border-radius: 8px; padding: 1.25rem; }
.mod-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
.mod-type { font-size: 0.7rem; font-weight: 800; color: #38bdf8; }
.mod-reason { font-size: 0.75rem; color: #eab308; }
.mod-title { margin: 0 0 0.5rem 0; font-size: 1rem; }
.mod-content { font-style: italic; color: #cbd5e1; font-size: 0.85rem; margin: 0 0 0.5rem 0; }
.mod-author { font-size: 0.8rem; color: #94a3b8; margin: 0 0 1rem 0; }
.mod-actions { display: flex; gap: 0.75rem; }

.btn-approve { background: #00dc82; color: #020420; font-weight: 800; border: none; padding: 0.4rem 0.85rem; border-radius: 4px; cursor: pointer; }
.btn-reject { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4); font-weight: 700; padding: 0.4rem 0.85rem; border-radius: 4px; cursor: pointer; }

.log-box { background: #020420; border: 1px solid #1e293b; padding: 1rem; border-radius: 6px; font-size: 0.8rem; color: #38bdf8; line-height: 1.6; }
</style>