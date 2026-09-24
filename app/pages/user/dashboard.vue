<!-- app/pages/user/dashboard.vue -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

// Integrazione Auth Core
const { currentUser, isAuthenticated } = useAuthCore()
const router = useRouter()

// Controllo Accesso / Protezione Rotta
onMounted(() => {
  if (!isAuthenticated.value) {
    // Se l'utente non è loggato, reindirizza alla home o al login
    router.push('/')
  }
})

// Tab Attiva: 'profile' | 'activity' | 'vault' | 'tokens'
const activeTab = ref<'profile' | 'activity' | 'vault' | 'tokens'>('profile')

// --- TAB 1: PROFILO DEVELOPER ---
const profileForm = reactive({
  avatarUrl: currentUser.value?.avatar || '',
  bio: currentUser.value?.bio || 'Sviluppatore Full-Stack e contributor dell\'ecosistema DevKernelPulse.',
  github: 'https://github.com/alexdpl',
  twitter: 'https://x.com/alexdpl',
  linkedin: 'https://linkedin.com/in/alexdpl'
})

const isSavingProfile = ref(false)
const profileSavedSuccess = ref(false)

function saveProfileSettings() {
  isSavingProfile.value = true
  setTimeout(() => {
    isSavingProfile.value = false
    profileSavedSuccess.value = true
    setTimeout(() => profileSavedSuccess.value = false, 3000)
  }, 600)
}

// --- TAB 2: I MIEI CONTENUTI ---
const activityFilter = ref<'all' | 'submissions' | 'comments' | 'show'>('all')

const userSubmissions = ref([
  { id: 1, type: 'submission', title: 'Rilasciato Nuxt 3.12: Nuove ottimizzazioni Nitro e SSR', date: '2 ore fa', points: 42, commentsCount: 12 },
  { id: 2, type: 'show', title: 'Show DKP: DevKernelPulse Auth Core v1.0 Released', date: '1 giorno fa', points: 128, commentsCount: 34 },
  { id: 3, type: 'comment', title: 'Commento su "Nuove API WebGPU per browser moderni"', date: '3 giorni fa', content: 'Incredibile incremento di performance per le reti neurali in-browser!' }
])

const filteredSubmissions = computed(() => {
  if (activityFilter.value === 'all') return userSubmissions.value
  if (activityFilter.value === 'submissions') return userSubmissions.value.filter(item => item.type === 'submission')
  if (activityFilter.value === 'comments') return userSubmissions.value.filter(item => item.type === 'comment')
  if (activityFilter.value === 'show') return userSubmissions.value.filter(item => item.type === 'show')
  return userSubmissions.value
})

// --- TAB 3: VAULT PERSONALE DKP TOOLS ---
const vaultCategory = ref<'poc' | 'scanner' | 'snippets'>('poc')

const pocCertificates = ref([
  { id: 'poc-98421', repo: 'alexdpl/devkernel-pulse', hash: '0x8f3a...b19c', badge: '🌱 Script Kiddie', date: '2026-09-20' },
  { id: 'poc-98499', repo: 'alexdpl/nitro-auth-plugin', hash: '0x4d12...a90f', badge: '⚡ Code Ninja', date: '2026-09-22' }
])

const scannerAudits = ref([
  { id: 'audit-001', target: 'app/server/api/auth.ts', score: 98, status: 'SECURE', date: '12 ore fa' },
  { id: 'audit-002', target: 'app/composables/useAuthCore.ts', score: 100, status: 'EXCELLENT', date: '2 giorni fa' }
])

const savedSnippets = ref([
  { id: 'snip-101', name: 'DKP Auth Interceptor', lang: 'TypeScript', date: '1 giorno fa' },
  { id: 'snip-102', name: 'Neural Prompt System Template', lang: 'JSON', date: '5 giorni fa' }
])

// --- TAB 4: API KEYS & DEVELOPER TOKENS ---
const apiKeys = ref([
  { id: 'key-1', name: 'CLI Terminal Local SDK', prefix: 'dkp_live_98a...41b', created: '2026-09-15', lastUsed: 'Oggi 14:20' }
])

const newKeyName = ref('')
const generatedKeyModal = ref<string | null>(null)

function generateNewApiKey() {
  if (!newKeyName.value.trim()) return
  const randomHash = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  const fullToken = `dkp_live_${randomHash}`
  
  apiKeys.value.push({
    id: `key-${Date.now()}`,
    name: newKeyName.value.trim(),
    prefix: `${fullToken.substring(0, 12)}...${fullToken.substring(fullToken.length - 4)}`,
    created: 'Adesso',
    lastUsed: 'Mai'
  })

  generatedKeyModal.value = fullToken
  newKeyName.value = ''
}

function revokeApiKey(id: string) {
  apiKeys.value = apiKeys.value.filter(k => k.id !== id)
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  alert('Copiato negli appunti!')
}
</script>

<template>
  <div class="dashboard-wrapper">
    
    <!-- HEADER PANNELLO UTENTE -->
    <header class="dashboard-header">
      <div class="user-summary">
        <div class="avatar-box">
          <img v-if="profileForm.avatarUrl" :src="profileForm.avatarUrl" alt="Avatar" />
          <span v-else>{{ currentUser?.username?.charAt(0).toUpperCase() || 'D' }}</span>
        </div>
        <div class="user-meta">
          <h1>Pannello Riservato <span class="username-gradient">@{{ currentUser?.username || 'Developer' }}</span></h1>
          <p class="role-badge">🛡️ Developer VIP Member • <span class="reputation-text">127 Punti DKP</span></p>
        </div>
      </div>

      <NuxtLink :to="`/user/${currentUser?.username || 'alexdpl'}`" class="public-profile-link">
        🌐 Vedi Profilo Pubblico
      </NuxtLink>
    </header>

    <!-- NAVIGAZIONE A SCHEDE (TABS) -->
    <nav class="dashboard-tabs">
      <button 
        :class="['tab-btn', { active: activeTab === 'profile' }]" 
        @click="activeTab = 'profile'"
      >
        👤 Profilo & Social
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'activity' }]" 
        @click="activeTab = 'activity'"
      >
        📰 I Miei Contenuti
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'vault' }]" 
        @click="activeTab = 'vault'"
      >
        🔐 DKP Vault
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'tokens' }]" 
        @click="activeTab = 'tokens'"
      >
        🔑 API Keys & Tokens
      </button>
    </nav>

    <!-- CONTENUTO DELLE SCHEDE -->
    <main class="dashboard-content">

      <!-- TAB 1: PROFILO & SOCIAL -->
      <section v-if="activeTab === 'profile'" class="tab-pane">
        <div class="pane-header">
          <h2>Informazioni Developer</h2>
          <p>Personalizza l'aspetto del tuo profilo pubblico e collega i tuoi canali social.</p>
        </div>

        <form @submit.prevent="saveProfileSettings" class="settings-form">
          <div class="form-group">
            <label>URL Avatar Personalizzato</label>
            <input v-model="profileForm.avatarUrl" type="url" placeholder="https://domain.com/avatar.png" class="dkp-input" />
          </div>

          <div class="form-group">
            <label>Biografia Developer</label>
            <textarea v-model="profileForm.bio" rows="3" placeholder="Scrivi una breve introduzione..." class="dkp-input"></textarea>
          </div>

          <div class="social-grid">
            <div class="form-group">
              <label>Profilo GitHub</label>
              <input v-model="profileForm.github" type="url" placeholder="https://github.com/username" class="dkp-input" />
            </div>
            <div class="form-group">
              <label>Profilo X / Twitter</label>
              <input v-model="profileForm.twitter" type="url" placeholder="https://x.com/username" class="dkp-input" />
            </div>
            <div class="form-group">
              <label>Profilo LinkedIn</label>
              <input v-model="profileForm.linkedin" type="url" placeholder="https://linkedin.com/in/username" class="dkp-input" />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" :disabled="isSavingProfile" class="save-btn">
              {{ isSavingProfile ? 'Salvataggio...' : 'Salva Modifiche' }}
            </button>
            <span v-if="profileSavedSuccess" class="success-toast">✓ Profilo aggiornato con successo!</span>
          </div>
        </form>
      </section>

      <!-- TAB 2: I MIEI CONTENUTI -->
      <section v-if="activeTab === 'activity'" class="tab-pane">
        <div class="pane-header flex-between">
          <div>
            <h2>I Miei Contenuti</h2>
            <p>Storico dei tuoi contributi sulla piattaforma DKP.</p>
          </div>
          <div class="filter-pills">
            <button :class="['pill-btn', { active: activityFilter === 'all' }]" @click="activityFilter = 'all'">Tutti</button>
            <button :class="['pill-btn', { active: activityFilter === 'submissions' }]" @click="activityFilter = 'submissions'">Posts</button>
            <button :class="['pill-btn', { active: activityFilter === 'show' }]" @click="activityFilter = 'show'">Show DKP</button>
            <button :class="['pill-btn', { active: activityFilter === 'comments' }]" @click="activityFilter = 'comments'">Commenti</button>
          </div>
        </div>

        <div class="activity-list">
          <div v-for="item in filteredSubmissions" :key="item.id" class="activity-card">
            <div class="activity-meta">
              <span class="badge-type" :class="item.type">{{ item.type.toUpperCase() }}</span>
              <span class="date-text">{{ item.date }}</span>
            </div>
            <h3 class="activity-title">{{ item.title }}</h3>
            <p v-if="item.content" class="activity-subtext">"{{ item.content }}"</p>
            <div class="activity-footer" v-if="item.points !== undefined">
              <span>🔥 {{ item.points }} punti</span>
              <span>💬 {{ item.commentsCount }} commenti</span>
            </div>
          </div>
        </div>
      </section>

      <!-- TAB 3: VAULT PERSONALE DKP TOOLS -->
      <section v-if="activeTab === 'vault'" class="tab-pane">
        <div class="pane-header">
          <h2>Vault Personale DKP Tools</h2>
          <p>Archivio sicuro delle tue certificazioni, audit di sicurezza e snippet salvati.</p>
        </div>

        <!-- Sub-filtri Vault -->
        <div class="vault-subtabs">
          <button :class="['subtab-btn', { active: vaultCategory === 'poc' }]" @click="vaultCategory = 'poc'">
            ⚡ Proof of Code Hashes ({{ pocCertificates.length }})
          </button>
          <button :class="['subtab-btn', { active: vaultCategory === 'scanner' }]" @click="vaultCategory = 'scanner'">
            🛡️ AI Scanner Audits ({{ scannerAudits.length }})
          </button>
          <button :class="['subtab-btn', { active: vaultCategory === 'snippets' }]" @click="vaultCategory = 'snippets'">
            💻 Snippet & Playground ({{ savedSnippets.length }})
          </button>
        </div>

        <!-- Sotto-scheda PoC -->
        <div v-if="vaultCategory === 'poc'" class="vault-grid">
          <div v-for="poc in pocCertificates" :key="poc.id" class="vault-card">
            <div class="vault-card-top">
              <span class="poc-badge">{{ poc.badge }}</span>
              <span class="vault-date">{{ poc.date }}</span>
            </div>
            <h4>{{ poc.repo }}</h4>
            <div class="hash-row">
              <code>Hash: {{ poc.hash }}</code>
              <button @click="copyToClipboard(poc.hash)" class="copy-small-btn">Copia</button>
            </div>
          </div>
        </div>

        <!-- Sotto-scheda AI Scanner -->
        <div v-if="vaultCategory === 'scanner'" class="vault-grid">
          <div v-for="audit in scannerAudits" :key="audit.id" class="vault-card">
            <div class="vault-card-top">
              <span class="audit-status" :class="audit.status">{{ audit.status }} ({{ audit.score }}/100)</span>
              <span class="vault-date">{{ audit.date }}</span>
            </div>
            <h4>{{ audit.target }}</h4>
            <p class="audit-desc">Nessuna vulnerabilità critica rilevata nell'ultimo audit Nitro/Nuxt.</p>
          </div>
        </div>

        <!-- Sotto-scheda Snippets -->
        <div v-if="vaultCategory === 'snippets'" class="vault-grid">
          <div v-for="snip in savedSnippets" :key="snip.id" class="vault-card">
            <div class="vault-card-top">
              <span class="lang-tag">{{ snip.lang }}</span>
              <span class="vault-date">{{ snip.date }}</span>
            </div>
            <h4>{{ snip.name }}</h4>
            <button class="open-snippet-btn">Apri in Playground →</button>
          </div>
        </div>
      </section>

      <!-- TAB 4: API KEYS & DEVELOPER TOKENS -->
      <section v-if="activeTab === 'tokens'" class="tab-pane">
        <div class="pane-header">
          <h2>API Keys & Developer Tokens</h2>
          <p>Genera chiavi di autenticazione per integrare l'ecosistema DKP nei tuoi script CLI o progetti locali.</p>
        </div>

        <!-- Form Generazione Nuova Key -->
        <div class="key-generator-box">
          <h3>Genera Nuova Chiave API</h3>
          <div class="gen-input-group">
            <input v-model="newKeyName" type="text" placeholder="Nome Token (es. Local CLI Scanner)" class="dkp-input" />
            <button @click="generateNewApiKey" class="gen-btn">Genera Key</button>
          </div>
        </div>

        <!-- Modal/Alert Token Generato -->
        <div v-if="generatedKeyModal" class="key-created-alert">
          <div class="alert-content">
            <h4>⚠️ Salva la tua chiave API adesso! Non verrà più mostrata.</h4>
            <div class="full-token-box">
              <code>{{ generatedKeyModal }}</code>
              <button @click="copyToClipboard(generatedKeyModal)" class="copy-btn">Copia Token</button>
            </div>
            <button @click="generatedKeyModal = null" class="close-alert-btn">Ho salvato la chiave</button>
          </div>
        </div>

        <!-- Tabella Chiavi Attive -->
        <div class="keys-list">
          <h3>Chiavi API Attive</h3>
          <table class="keys-table" v-if="apiKeys.length > 0">
            <thead>
              <tr>
                <th>NOME TOKEN</th>
                <th>PREFISSO CHIAVE</th>
                <th>CREATO IL</th>
                <th>ULTIMO USO</th>
                <th>AZIONI</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="key in apiKeys" :key="key.id">
                <td><strong>{{ key.name }}</strong></td>
                <td><code>{{ key.prefix }}</code></td>
                <td>{{ key.created }}</td>
                <td>{{ key.lastUsed }}</td>
                <td>
                  <button @click="revokeApiKey(key.id)" class="revoke-btn">Revoca</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="empty-state">Nessuna chiave API attiva al momento.</p>
        </div>
      </section>

    </main>
  </div>
</template>

<style scoped>
.dashboard-wrapper {
  max-width: 1100px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
  color: #f8fafc;
}

/* HEADER */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.user-summary {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.avatar-box {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00dc82, #38bdf8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 800;
  color: #020420;
  overflow: hidden;
}

.avatar-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-meta h1 {
  font-size: 1.5rem;
  margin: 0 0 0.25rem 0;
}

.username-gradient {
  color: #38bdf8;
}

.role-badge {
  margin: 0;
  color: #94a3b8;
  font-size: 0.85rem;
}

.reputation-text {
  color: #00dc82;
  font-weight: 700;
}

.public-profile-link {
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.3);
  background: rgba(0, 220, 130, 0.05);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 700;
  transition: all 0.2s;
}

.public-profile-link:hover {
  background: #00dc82;
  color: #020420;
}

/* SCHEDE (TABS) */
.dashboard-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid #1e293b;
  margin-bottom: 2rem;
  overflow-x: auto;
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
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-btn:hover {
  color: #ffffff;
}

.tab-btn.active {
  color: #00dc82;
  border-bottom-color: #00dc82;
}

/* SEZIONE CONTENUTI */
.tab-pane {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 2rem;
}

.pane-header {
  margin-bottom: 1.75rem;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 1rem;
}

.pane-header h2 {
  font-size: 1.3rem;
  margin: 0 0 0.3rem 0;
}

.pane-header p {
  color: #94a3b8;
  margin: 0;
  font-size: 0.9rem;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

/* FORM STYLES */
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.85rem;
  color: #cbd5e1;
  font-weight: 600;
}

.dkp-input {
  background: #020420;
  border: 1px solid #1e293b;
  color: #ffffff;
  padding: 0.7rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.dkp-input:focus {
  outline: none;
  border-color: #00dc82;
}

.social-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.save-btn {
  background: #00dc82;
  color: #020420;
  font-weight: 800;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
}

.save-btn:hover { background: #00bf71; }

.success-toast {
  color: #00dc82;
  font-size: 0.85rem;
  font-weight: 700;
}

/* FILTRI & ACTIVTY CARD */
.filter-pills {
  display: flex;
  gap: 0.4rem;
}

.pill-btn {
  background: #020420;
  border: 1px solid #1e293b;
  color: #94a3b8;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
}

.pill-btn.active {
  background: #38bdf8;
  color: #020420;
  font-weight: 700;
  border-color: #38bdf8;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-card {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 1.25rem;
}

.activity-meta {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.badge-type {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

.badge-type.submission { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
.badge-type.show { background: rgba(0, 220, 130, 0.2); color: #00dc82; }
.badge-type.comment { background: rgba(148, 163, 184, 0.2); color: #cbd5e1; }

.date-text { color: #64748b; font-size: 0.75rem; }

.activity-title { margin: 0 0 0.4rem 0; font-size: 1rem; }
.activity-subtext { color: #cbd5e1; font-style: italic; font-size: 0.85rem; margin: 0; }

.activity-footer {
  display: flex;
  gap: 1rem;
  color: #94a3b8;
  font-size: 0.8rem;
  margin-top: 0.75rem;
}

/* VAULT SECTION */
.vault-subtabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.subtab-btn {
  background: #020420;
  border: 1px solid #1e293b;
  color: #cbd5e1;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}

.subtab-btn.active {
  border-color: #00dc82;
  color: #00dc82;
  font-weight: 700;
}

.vault-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.vault-card {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 1.25rem;
}

.vault-card-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.poc-badge { color: #00dc82; font-weight: 700; font-size: 0.8rem; }
.audit-status { color: #00dc82; font-weight: 800; font-size: 0.75rem; }
.lang-tag { color: #38bdf8; font-weight: 700; font-size: 0.8rem; }
.vault-date { color: #64748b; font-size: 0.75rem; }

.vault-card h4 { margin: 0 0 0.75rem 0; font-size: 0.95rem; }

.hash-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #090d16;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
}

.hash-row code { font-size: 0.75rem; color: #cbd5e1; }
.copy-small-btn {
  background: transparent;
  border: none;
  color: #38bdf8;
  font-size: 0.7rem;
  cursor: pointer;
}

.audit-desc { color: #94a3b8; font-size: 0.8rem; margin: 0; }
.open-snippet-btn {
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  margin-top: 0.5rem;
}

/* API KEYS SECTION */
.key-generator-box {
  background: #020420;
  border: 1px solid #1e293b;
  padding: 1.25rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.key-generator-box h3 { font-size: 1rem; margin: 0 0 1rem 0; }

.gen-input-group {
  display: flex;
  gap: 0.75rem;
}

.gen-input-group input { flex: 1; }

.gen-btn {
  background: #38bdf8;
  color: #020420;
  font-weight: 800;
  border: none;
  padding: 0 1.25rem;
  border-radius: 6px;
  cursor: pointer;
}

.key-created-alert {
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid #eab308;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 2rem;
}

.alert-content h4 { color: #eab308; margin: 0 0 0.75rem 0; font-size: 0.9rem; }

.full-token-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #020420;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.full-token-box code { color: #00dc82; font-size: 0.85rem; font-weight: 700; }
.copy-btn { background: #00dc82; color: #020420; font-weight: 800; border: none; padding: 0.3rem 0.75rem; border-radius: 4px; cursor: pointer; }

.close-alert-btn {
  background: transparent;
  border: 1px solid #eab308;
  color: #eab308;
  padding: 0.35rem 0.85rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

.keys-list h3 { font-size: 1rem; margin: 0 0 1rem 0; }

.keys-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.85rem;
}

.keys-table th {
  color: #64748b;
  border-bottom: 1px solid #1e293b;
  padding: 0.75rem;
}

.keys-table td {
  border-bottom: 1px solid #1e293b;
  padding: 0.75rem;
}

.revoke-btn {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
}

.empty-state { color: #64748b; font-size: 0.85rem; font-style: italic; }
</style>