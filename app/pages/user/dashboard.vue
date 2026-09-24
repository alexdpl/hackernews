<!-- app/pages/user/dashboard.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const route = useRoute()
const { currentUser, isAuthenticated, fetchSession } = useAuthCore()

const activeTab = ref(route.query.tab?.toString() || 'profile')

watch(() => route.query.tab, (newTab) => {
  if (newTab) activeTab.value = newTab.toString()
})

onMounted(async () => {
  await fetchSession()
})

// Dati dimostrativi attività utente e Vault DKP
const userStats = ref({
  reputation: 240,
  submittedNews: 8,
  commentsCount: 19,
  vaultCerts: 3,
  aiAudits: 5
})

const myNews = ref([
  { id: 101, title: 'Open Source eCommerce & Multi-Vendor Marketplace on GitHub', date: '24 Set 2026', points: 142, comments: 18 },
  { id: 102, title: 'DevKernelPulse v2.0 Modular SaaS Architecture & Kernel Vault Released', date: '20 Set 2026', points: 98, comments: 24 }
])

const myVaultItems = ref([
  { id: 'POC-8821', type: 'Proof of Code', name: 'DKP Kernel Auth Core Module', hash: '0x9f8a...c41e', date: '22 Set 2026', status: 'NOTARIZZATO' },
  { id: 'SCAN-3310', type: 'AI Code Scanner', name: 'PostgreSQL Connection Pooler Review', hash: '0x3c1b...fa88', date: '18 Set 2026', status: 'SECURE (0 VULN)' }
])

const apiKey = ref('dkp_live_99a82f7100bc82e4418a09')
const copiedKey = ref(false)

const copyApiKey = () => {
  navigator.clipboard.writeText(apiKey.value)
  copiedKey.value = true
  setTimeout(() => copiedKey.value = false, 2000)
}
</script>

<template>
  <div class="user-dashboard-container">
    <!-- Non loggato -->
    <div v-if="!isAuthenticated" class="auth-gate">
      <h2>🔒 Accesso Riservato agli Sviluppatori Loggati</h2>
      <p>Effettua il login o crea un account per accedere alla tua Dashboard e ai tuoi DKP Tools.</p>
      <NuxtLink to="/login" class="gate-btn">Accedi al tuo Account</NuxtLink>
    </div>

    <!-- Pannello Utente Loggato -->
    <div v-else class="dashboard-wrapper">
      <!-- User Profile Header -->
      <div class="profile-header-card">
        <div class="avatar-box">👤</div>
        <div class="user-info">
          <div class="user-main">
            <h1>@{{ currentUser?.username || 'alexdpl' }}</h1>
            <span class="badge-pro">PRO DEVELOPER</span>
          </div>
          <p class="user-email">📧 {{ currentUser?.email || 'alex@devkernelpulse.org' }}</p>
          <div class="user-badges">
            <span class="badge-item">🛡️ Proof of Code Verified</span>
            <span class="badge-item blue">🧠 AI Scanner Member</span>
          </div>
        </div>

        <!-- Metric Cards -->
        <div class="header-stats">
          <div class="h-stat">
            <span class="s-val green">{{ userStats.reputation }}</span>
            <span class="s-lbl">Punti DKP</span>
          </div>
          <div class="h-stat">
            <span class="s-val blue">{{ userStats.submittedNews }}</span>
            <span class="s-lbl">News Inviate</span>
          </div>
          <div class="h-stat">
            <span class="s-val yellow">{{ userStats.vaultCerts }}</span>
            <span class="s-lbl">Vault Certs</span>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="dashboard-tabs">
        <button 
          @click="activeTab = 'profile'" 
          class="tab-btn" 
          :class="{ active: activeTab === 'profile' }"
        >
          👤 Profilo & API Keys
        </button>
        <button 
          @click="activeTab = 'activity'" 
          class="tab-btn" 
          :class="{ active: activeTab === 'activity' }"
        >
          📰 Le Mie News ({{ myNews.length }})
        </button>
        <button 
          @click="activeTab = 'vault'" 
          class="tab-btn" 
          :class="{ active: activeTab === 'vault' }"
        >
          🛡️ DKP Vault & Certificati ({{ myVaultItems.length }})
        </button>
      </div>

      <!-- TAB 1: PROFILO & API KEYS -->
      <div v-if="activeTab === 'profile'" class="tab-content">
        <div class="card-grid">
          <div class="dashboard-card">
            <h3>⚙️ Configurazione Account Sviluppatore</h3>
            <form @submit.prevent class="dash-form">
              <div class="form-group">
                <label>Username</label>
                <input type="text" :value="currentUser?.username || 'alexdpl'" disabled class="dash-input disabled" />
              </div>
              <div class="form-group">
                <label>Bio Developer</label>
                <textarea rows="3" placeholder="Es. Full-Stack Engineer appassionato di Nuxt 3, Rust e AI tools..." class="dash-input"></textarea>
              </div>
              <div class="form-group">
                <label>GitHub Profile URL</label>
                <input type="text" placeholder="https://github.com/username" class="dash-input" />
              </div>
              <button class="save-btn">Salva Modifiche</button>
            </form>
          </div>

          <div class="dashboard-card">
            <h3>🔑 Developer API Key (DKP Tools Core)</h3>
            <p class="card-desc">Usa questa chiave API per integrare l'AI Code Scanner e la Notarizzazione Vault nella tua CLI o nei tuoi progetti.</p>
            
            <div class="api-key-box">
              <code class="key-code">{{ apiKey }}</code>
              <button @click="copyApiKey" class="copy-btn">
                {{ copiedKey ? '✅ Copiata!' : '📋 Copia' }}
              </button>
            </div>
            
            <div class="key-status">
              <span class="status-dot green"></span>
              <span>Chiave Attiva • Limite: 10.000 req/mese</span>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: LE MIE NEWS -->
      <div v-else-if="activeTab === 'activity'" class="tab-content">
        <div class="dashboard-card">
          <h3>📰 Contenuti Pubblicati nella Community</h3>
          <div v-if="myNews.length" class="items-list">
            <div v-for="item in myNews" :key="item.id" class="list-item">
              <div class="item-main">
                <NuxtLink :to="`/story/${item.id}`" class="item-title">{{ item.title }}</NuxtLink>
                <div class="item-sub">
                  <span>Data: {{ item.date }}</span> • 
                  <span class="green-txt">{{ item.points }} Punti</span> • 
                  <span>💬 {{ item.comments }} commenti</span>
                </div>
              </div>
              <NuxtLink :to="`/story/${item.id}`" class="action-btn">Vedi Post ↗</NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: DKP VAULT & CERTIFICATI -->
      <div v-else-if="activeTab === 'vault'" class="tab-content">
        <div class="dashboard-card">
          <h3>🛡️ DKP Vault: Registri Notarizzati e Audit</h3>
          <p class="card-desc">Elenco dei certificati crittografici di **Proof of Code** e delle scansioni effettuate con **AI Code Scanner v2**.</p>
          
          <div class="items-list">
            <div v-for="vault in myVaultItems" :key="vault.id" class="list-item vault-item">
              <div class="item-main">
                <div class="vault-badge-row">
                  <span class="v-type">{{ vault.type }}</span>
                  <span class="v-status">{{ vault.status }}</span>
                </div>
                <h4 class="v-name">{{ vault.name }}</h4>
                <div class="item-sub">
                  <span>HASH: <code class="hash-code">{{ vault.hash }}</code></span> • 
                  <span>Data: {{ vault.date }}</span>
                </div>
              </div>
              <button class="action-btn download-btn">📄 Download PDF Cert</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.user-dashboard-container {
  max-width: 1100px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.auth-gate {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  margin: 3rem auto;
  max-width: 600px;
}

.auth-gate h2 { color: #38bdf8; font-size: 1.4rem; margin-bottom: 1rem; }
.auth-gate p { color: #94a3b8; margin-bottom: 2rem; }
.gate-btn { background: #00dc82; color: #020420; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 800; text-decoration: none; }

.profile-header-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.75rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.avatar-box {
  width: 70px;
  height: 70px;
  background: #020420;
  border: 2px solid #00dc82;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.user-info { flex: 1; }
.user-main { display: flex; align-items: center; gap: 0.75rem; }
.user-main h1 { font-size: 1.6rem; color: #ffffff; font-weight: 800; }
.badge-pro { background: rgba(0, 220, 130, 0.15); color: #00dc82; font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 4px; border: 1px solid rgba(0, 220, 130, 0.3); }
.user-email { color: #64748b; font-size: 0.85rem; margin-top: 0.2rem; }
.user-badges { display: flex; gap: 0.5rem; margin-top: 0.6rem; }
.badge-item { background: #020420; color: #38bdf8; font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 4px; border: 1px solid #1e293b; font-weight: 600; }
.badge-item.blue { color: #00dc82; }

.header-stats { display: flex; gap: 1.25rem; }
.h-stat { background: #020420; border: 1px solid #1e293b; padding: 0.75rem 1rem; border-radius: 8px; text-align: center; min-width: 90px; }
.s-val { font-size: 1.3rem; font-weight: 800; display: block; }
.s-val.green { color: #00dc82; }
.s-val.blue { color: #38bdf8; }
.s-val.yellow { color: #f59e0b; }
.s-lbl { font-size: 0.7rem; color: #64748b; font-weight: 700; text-transform: uppercase; }

.dashboard-tabs { display: flex; gap: 0.75rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.75rem; margin-bottom: 1.5rem; }
.tab-btn { background: transparent; border: 1px solid transparent; color: #94a3b8; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
.tab-btn:hover { color: #ffffff; background: #090d16; }
.tab-btn.active { color: #00dc82; background: #090d16; border-color: #00dc82; }

.card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; }
.dashboard-card { background: #090d16; border: 1px solid #1e293b; padding: 1.5rem; border-radius: 12px; }
.dashboard-card h3 { color: #ffffff; font-size: 1.1rem; margin-bottom: 0.75rem; font-weight: 700; }
.card-desc { color: #94a3b8; font-size: 0.85rem; line-height: 1.5; margin-bottom: 1.25rem; }

.dash-form { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label { font-size: 0.8rem; color: #64748b; font-weight: 700; }
.dash-input { background: #020420; border: 1px solid #1e293b; color: #ffffff; padding: 0.6rem 0.8rem; border-radius: 6px; font-size: 0.9rem; }
.dash-input.disabled { color: #64748b; }
.save-btn { background: #00dc82; color: #020420; border: none; padding: 0.65rem; border-radius: 6px; font-weight: 800; cursor: pointer; margin-top: 0.5rem; }

.api-key-box { display: flex; align-items: center; justify-content: space-between; background: #020420; border: 1px solid #38bdf8; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; }
.key-code { color: #38bdf8; font-family: monospace; font-size: 0.85rem; font-weight: 700; }
.copy-btn { background: #38bdf8; color: #020420; border: none; padding: 0.35rem 0.75rem; border-radius: 4px; font-size: 0.75rem; font-weight: 800; cursor: pointer; }

.key-status { display: flex; align-items: center; gap: 0.5rem; color: #64748b; font-size: 0.8rem; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-dot.green { background: #00dc82; }

.items-list { display: flex; flex-direction: column; gap: 0.85rem; }
.list-item { display: flex; align-items: center; justify-content: space-between; background: #020420; border: 1px solid #1e293b; padding: 1rem; border-radius: 8px; }
.item-title { color: #38bdf8; text-decoration: none; font-weight: 700; font-size: 0.95rem; }
.item-title:hover { color: #00dc82; text-decoration: underline; }
.item-sub { color: #64748b; font-size: 0.8rem; margin-top: 0.3rem; }
.green-txt { color: #00dc82; font-weight: 700; }

.action-btn { background: #090d16; border: 1px solid #1e293b; color: #38bdf8; padding: 0.4rem 0.8rem; border-radius: 6px; text-decoration: none; font-size: 0.8rem; font-weight: 700; }
.action-btn:hover { border-color: #00dc82; color: #00dc82; }

.vault-badge-row { display: flex; gap: 0.5rem; margin-bottom: 0.3rem; }
.v-type { background: rgba(56, 189, 248, 0.1); color: #38bdf8; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.4rem; border-radius: 4px; }
.v-status { background: rgba(0, 220, 130, 0.1); color: #00dc82; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.4rem; border-radius: 4px; }
.v-name { color: #ffffff; font-size: 1rem; margin-bottom: 0.2rem; font-weight: 700; }
.hash-code { color: #38bdf8; }
.download-btn { cursor: pointer; }
</style>