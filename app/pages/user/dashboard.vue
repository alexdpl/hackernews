<!-- app/pages/user/dashboard.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const { currentUser } = useAuthCore()
const { getMainUrl, getMailUrl, getApiUrl } = useDomain()

// 1. GESTIONE TAB SNELLA
const activeTab = computed({
  get: () => (route.query.tab as string) || 'profile',
  set: (val: string) => router.replace({ query: { ...route.query, tab: val } })
})

// 2. FORM PROFILO CON REDDIT
const profileForm = ref({
  avatar: currentUser.value?.avatar || 'https://github.com/alexdpl.png',
  bio: currentUser.value?.bio || 'Lead Architect & Core Creator of DevKernelPulse',
  github: 'https://github.com/alexdpl',
  twitter: 'https://x.com/alexdpl',
  linkedin: 'https://linkedin.com/in/alexdpl',
  reddit: 'https://reddit.com/user/alexdpl'
})
const profileSaved = ref(false)

function saveProfile() {
  profileSaved.value = true
  setTimeout(() => profileSaved.value = false, 3000)
}

// 3. GESTIONE BLOG POST
const articles = ref([
  { id: 1, title: 'Architettura Micro-frontend con Nuxt 3 e Module Federation', status: 'published', date: '2026-09-12', views: 342 },
  { id: 2, title: 'Guida Pratica a Proof of Code & Decentralized Identity', status: 'draft', date: '2026-10-01', views: 0 }
])
const isEditingArticle = ref(false)
const articleForm = ref({ id: 0, title: '', status: 'draft' })

function openNewArticleModal() {
  articleForm.value = { id: Date.now(), title: '', status: 'draft' }
  isEditingArticle.value = true
}

function saveArticle() {
  if (!articleForm.value.title.trim()) return
  const index = articles.value.findIndex(a => a.id === articleForm.value.id)
  if (index !== -1) {
    articles.value[index].title = articleForm.value.title
    articles.value[index].status = articleForm.value.status
  } else {
    articles.value.unshift({
      id: articleForm.value.id,
      title: articleForm.value.title,
      status: articleForm.value.status,
      date: new Date().toISOString().split('T')[0],
      views: 0
    })
  }
  isEditingArticle.value = false
}

function deleteArticle(id: number) {
  articles.value = articles.value.filter(a => a.id !== id)
}

// 4. DKP API CONSOLE (STILE BREVO / OPENAI)
const apiKeys = ref([
  { id: 'key_01', name: 'Server Produzione', key: 'dkp_live_9f8a...3b21', rawKey: 'dkp_live_9f8a7c2b1d0e3b21', created: '2026-08-10', lastUsed: 'Oggi 14:20' }
])
const newKeyName = ref('')
const generatedKeyModal = ref<string | null>(null)
const copiedKey = ref(false)

function generateApiKey() {
  if (!newKeyName.value.trim()) return
  const rawKey = `dkp_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`
  apiKeys.value.push({
    id: `key_${Date.now()}`,
    name: newKeyName.value.trim(),
    key: `${rawKey.substring(0, 12)}...${rawKey.slice(-4)}`,
    rawKey: rawKey,
    created: new Date().toISOString().split('T')[0],
    lastUsed: 'Mai'
  })
  generatedKeyModal.value = rawKey
  newKeyName.value = ''
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  copiedKey.value = true
  setTimeout(() => copiedKey.value = false, 2000)
}

function revokeApiKey(id: string) {
  apiKeys.value = apiKeys.value.filter(k => k.id !== id)
}
</script>

<template>
  <div class="dashboard-page">
    <div class="dashboard-container">
      
      <!-- HEADER CYBER-GLASSMORPHIC CLONATO E ADATTATO DALL'ADMIN -->
      <div class="user-header-card">
        <div class="header-main-info">
          <div class="user-avatar-wrap">
            <img :src="profileForm.avatar" alt="Avatar Utente" class="user-avatar" />
            <span class="online-indicator"></span>
          </div>
          <div class="user-details">
            <h1 class="user-title">
              Pannello Riservato <span class="username-highlight">@{{ currentUser?.username || 'alexdpl' }}</span>
            </h1>
            <div class="user-badges">
              <span class="role-badge">🛡️ Developer VIP Member</span>
              <span class="points-badge">⚡ 127 Punti DKP</span>
            </div>
          </div>
        </div>

        <NuxtLink :to="getMainUrl(`/user/${currentUser?.username || 'alexdpl'}`)" external class="public-profile-btn">
          🌐 Vedi Profilo Pubblico
        </NuxtLink>
      </div>

      <!-- TAB MENU RESPONSIVE SENZA SCROLLBAR -->
      <nav class="tabs-navigation">
        <button class="tab-item" :class="{ active: activeTab === 'profile' }" @click="activeTab = 'profile'">
          ⚙️ Profilo & Social
        </button>
        <button class="tab-item" :class="{ active: activeTab === 'content' }" @click="activeTab = 'content'">
          📰 I Miei Contenuti
        </button>
        <button class="tab-item" :class="{ active: activeTab === 'vault' }" @click="activeTab = 'vault'">
          🛡️ Proof of Code Vault
        </button>
        <button class="tab-item" :class="{ active: activeTab === 'api' }" @click="activeTab = 'api'">
          🔑 DKP API Console
        </button>
        <button class="tab-item" :class="{ active: activeTab === 'gamification' }" @click="activeTab = 'gamification'">
          🏆 Gamification & XP
        </button>
      </nav>

      <!-- PANNELLO 1: PROFILO & SOCIAL -->
      <section v-if="activeTab === 'profile'" class="tab-panel">
        <div class="panel-card">
          <h2 class="section-title">Informazioni Developer</h2>
          <p class="section-sub">Personalizza l'aspetto del tuo profilo pubblico e collega i tuoi canali social.</p>

          <form @submit.prevent="saveProfile" class="form-layout">
            <div class="form-group full-width">
              <label>URL Avatar Personalizzato</label>
              <input v-model="profileForm.avatar" type="url" class="dkp-input" />
            </div>

            <div class="form-group full-width">
              <label>Biografia Developer</label>
              <textarea v-model="profileForm.bio" rows="3" class="dkp-input textarea"></textarea>
            </div>

            <div class="social-grid">
              <div class="form-group">
                <label>Profilo GitHub</label>
                <input v-model="profileForm.github" type="url" class="dkp-input" />
              </div>
              <div class="form-group">
                <label>Profilo X / Twitter</label>
                <input v-model="profileForm.twitter" type="url" class="dkp-input" />
              </div>
              <div class="form-group">
                <label>Profilo LinkedIn</label>
                <input v-model="profileForm.linkedin" type="url" class="dkp-input" />
              </div>
              <!-- CAMPO REDDIT INTEGRATO -->
              <div class="form-group">
                <label>Profilo Reddit</label>
                <input v-model="profileForm.reddit" type="url" placeholder="https://reddit.com/user/username" class="dkp-input" />
              </div>
            </div>

            <div class="form-footer">
              <button type="submit" class="dkp-btn-success">Salva Modifiche</button>
              <span v-if="profileSaved" class="save-toast">✓ Profilo Aggiornato!</span>
            </div>
          </form>

          <!-- BADGE IN BASSO A DESTRA -->
          <div class="nexus-badge-wrap">
            <div class="pulse-nexus-badge">
              <span class="dot"></span> ⚡ Pulse Nexus <span class="ver">v2.4</span>
            </div>
          </div>
        </div>
      </section>

      <!-- PANNELLO 2: GESTIONE POST BLOG -->
      <section v-if="activeTab === 'content'" class="tab-panel">
        <div class="panel-card">
          <div class="panel-header-action">
            <div>
              <h2 class="section-title">Gestione Post & Blog</h2>
              <p class="section-sub">Crea, modifica e gestisci gli articoli pubblicati nell'ecosistema DevKernelPulse.</p>
            </div>
            <button @click="openNewArticleModal" class="dkp-btn-success">+ Nuovo Post</button>
          </div>

          <div class="table-container">
            <table class="dkp-table">
              <thead>
                <tr>
                  <th>Titolo Articolo</th>
                  <th>Stato</th>
                  <th>Data</th>
                  <th>Letture</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="art in articles" :key="art.id">
                  <td class="font-bold">{{ art.title }}</td>
                  <td>
                    <span :class="['status-pill', art.status]">
                      {{ art.status === 'published' ? 'Pubblicato' : 'Bozza' }}
                    </span>
                  </td>
                  <td>{{ art.date }}</td>
                  <td>{{ art.views }}</td>
                  <td class="actions-cell">
                    <button @click="deleteArticle(art.id)" class="btn-danger-sm">Elimina</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- MODALE CREAZIONE/MODIFICA POST -->
          <div v-if="isEditingArticle" class="dkp-modal-backdrop">
            <div class="dkp-modal">
              <h3>✏️ Editor Post Blog</h3>
              <div class="form-group">
                <label>Titolo Post</label>
                <input v-model="articleForm.title" type="text" class="dkp-input" placeholder="Titolo dell'articolo..." />
              </div>
              <div class="form-group">
                <label>Stato Pubblicazione</label>
                <select v-model="articleForm.status" class="dkp-input">
                  <option value="draft">Bozza</option>
                  <option value="published">Pubblicato</option>
                </select>
              </div>
              <div class="modal-actions">
                <button @click="saveArticle" class="dkp-btn-success">Salva Articolo</button>
                <button @click="isEditingArticle = false" class="btn-secondary">Annulla</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- PANNELLO 3: DKP API CONSOLE (STILE BREVO) -->
      <section v-if="activeTab === 'api'" class="tab-panel">
        <div class="panel-card">
          <h2 class="section-title">🔑 DKP API Console & Keys Manager</h2>  
          <p class="section-sub">Genera e gestisci le chiavi API per integrare l'ecosistema DKP nelle tue applicazioni esterne.</p>
          
		  <!-- Da inserire nel pannello API di dashboard.vue -->
<div class="api-action-header">
  <NuxtLink 
    :to="getApiUrl('/api-console')" 
    external 
    class="dkp-api-link-btn"
  >
    <span>⚡ Consumo delle API</span>
  </NuxtLink>
</div>
		 
		  <div class="api-generate-box">
            <input v-model="newKeyName" type="text" placeholder="Nome Token (es. App Produzione)" class="dkp-input" />
            <button @click="generateApiKey" class="dkp-btn-success">Genera Nuova API Key</button>
		  </div>
          <!-- POPUP CHIAVE GENERATA -->
          <div v-if="generatedKeyModal" class="generated-key-alert">
            <p class="alert-title">⚠️ Copia la tua API Key ora. Per sicurezza non verrà mai più mostrata in chiaro:</p>
            <div class="raw-key-box">
              <code>{{ generatedKeyModal }}</code>
              <button @click="copyToClipboard(generatedKeyModal)" class="btn-copy">
                {{ copiedKey ? 'Copiato!' : 'Copia' }}
              </button>
            </div>
            <button @click="generatedKeyModal = null" class="btn-secondary-sm">Ho salvato la chiave</button>
          </div>

          <!-- TABELLA KEYS -->
          <div class="table-container">
            <table class="dkp-table">
              <thead>
                <tr>
                  <th>Nome Token</th>
                  <th>Chiave API</th>
                  <th>Creata Il</th>
                  <th>Ultimo Uso</th>
                  <th>Azione</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="key in apiKeys" :key="key.id">
                  <td class="font-bold">{{ key.name }}</td>
                  <td><code class="code-badge">{{ key.key }}</code></td>
                  <td>{{ key.created }}</td>
                  <td>{{ key.lastUsed }}</td>
                  <td>
                    <button @click="revokeApiKey(key.id)" class="btn-danger-sm">Revoca</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- SNIPPET DI ESEMPIO INTEGRATO -->
          <div class="code-snippet-card">
            <h3>⚡ Integrazione Rapida (cURL)</h3>
            <pre class="code-block"><code>curl -X GET "https://api.devkernelpulse.com/v2/user" \
  -H "Authorization: Bearer YOUR_DKP_API_KEY" \
  -H "Content-Type: application/json"</code></pre>
          </div>
        </div>
      </section>

      <!-- PANNELLO 4: VAULT -->
      <section v-if="activeTab === 'vault'" class="tab-panel">
        <div class="panel-card">
          <h2 class="section-title">🛡️ Proof of Code Vault</h2>
          <p class="section-sub">Notarizzazione crittografica delle tue repository e attestazioni di codice sulla blockchain DKP.</p>
        </div>
      </section>

      <!-- PANNELLO 5: GAMIFICATION -->
      <section v-if="activeTab === 'gamification'" class="tab-panel">
        <div class="panel-card">
          <h2 class="section-title">🏆 Gamification & DKP XP</h2>
          <p class="section-sub">Monitora le tue attività, traguardi e badge ottenuti nella piattaforma.</p>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  background: #020420;
  min-height: 100vh;
  padding: 2rem 1rem;
  color: #f8fafc;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.dashboard-container {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.api-action-header {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 1.25rem;
}

.dkp-api-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid #38bdf8;
  color: #38bdf8;
  padding: 0.65rem 1.2rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.88rem;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.12);
}

.dkp-api-link-btn:hover {
  background: #38bdf8;
  color: #020420;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(56, 189, 248, 0.3);
}

/* HEADER USER CARD CYBER-GLASS */
.user-header-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.header-main-info {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.user-avatar-wrap {
  position: relative;
  width: 64px;
  height: 64px;
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #00dc82;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #00dc82;
  border: 2px solid #090d16;
  border-radius: 50%;
}

.user-title {
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0 0 0.4rem;
}

.username-highlight {
  color: #38bdf8;
}

.user-badges {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.role-badge {
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.points-badge {
  background: rgba(0, 220, 130, 0.12);
  color: #00dc82;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  border: 1px solid rgba(0, 220, 130, 0.3);
}

.public-profile-btn {
  background: transparent;
  border: 1px solid #00dc82;
  color: #00dc82;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.public-profile-btn:hover {
  background: rgba(0, 220, 130, 0.12);
  transform: translateY(-1px);
}

/* TAB NAVIGATION SENZA SCROLLBAR */
.tabs-navigation {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 0.75rem;
}

.tab-item {
  background: #090d16;
  border: 1px solid #1e293b;
  color: #94a3b8;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1 1 auto;
  text-align: center;
}

.tab-item:hover {
  border-color: #38bdf8;
  color: #ffffff;
}

.tab-item.active {
  background: rgba(0, 220, 130, 0.12);
  border-color: #00dc82;
  color: #00dc82;
}

/* PANNELLO CARD */
.panel-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.75rem;
  position: relative;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0 0 0.25rem;
}

.section-sub {
  color: #94a3b8;
  font-size: 0.88rem;
  margin: 0 0 1.5rem;
}

/* FORMS */
.form-layout {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.social-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #cbd5e1;
}

.dkp-input {
  background: #020420;
  border: 1px solid #1e293b;
  color: #ffffff;
  padding: 0.65rem 0.85rem;
  border-radius: 6px;
  font-size: 0.88rem;
  transition: border-color 0.2s;
}

.dkp-input:focus {
  outline: none;
  border-color: #00dc82;
}

.dkp-input.textarea {
  resize: vertical;
}

.form-footer {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.dkp-btn-success {
  background: #00dc82;
  color: #020420;
  border: none;
  font-weight: 800;
  padding: 0.65rem 1.3rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.88rem;
}

.dkp-btn-success:hover {
  background: #00bf71;
}

.save-toast {
  color: #00dc82;
  font-weight: 700;
  font-size: 0.85rem;
}

/* NEXUS BADGE IN BASSO A DESTRA */
.nexus-badge-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.pulse-nexus-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #020420;
  border: 1px solid #00dc82;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 800;
  color: #ffffff;
}

.pulse-nexus-badge .dot {
  width: 8px;
  height: 8px;
  background: #00dc82;
  border-radius: 50%;
}

.pulse-nexus-badge .ver {
  background: #00dc82;
  color: #020420;
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
  font-size: 0.68rem;
}

/* TABELLE & API */
.panel-header-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.table-container {
  overflow-x: auto;
  margin-top: 1rem;
}

.dkp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  text-align: left;
}

.dkp-table th {
  background: #020420;
  color: #64748b;
  padding: 0.75rem;
  border-bottom: 1px solid #1e293b;
  text-transform: uppercase;
  font-size: 0.7rem;
}

.dkp-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #1e293b;
  color: #cbd5e1;
}

.font-bold { font-weight: 700; }

.status-pill {
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
}

.status-pill.published { background: rgba(0, 220, 130, 0.15); color: #00dc82; }
.status-pill.draft { background: rgba(234, 179, 8, 0.15); color: #eab308; }

.btn-danger-sm {
  background: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}

.btn-danger-sm:hover {
  background: rgba(239, 68, 68, 0.15);
}

.api-generate-box {
  display: flex;
  gap: 0.75rem;
  max-width: 500px;
  margin-bottom: 1rem;
}

.generated-key-alert {
  background: #020420;
  border: 1px solid #00dc82;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alert-title { font-size: 0.85rem; font-weight: 700; color: #00dc82; margin: 0; }
.raw-key-box { display: flex; align-items: center; gap: 0.5rem; background: #090d16; padding: 0.5rem; border-radius: 4px; }
.raw-key-box code { color: #38bdf8; font-family: monospace; flex: 1; }
.btn-copy { background: #38bdf8; color: #020420; border: none; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 4px; cursor: pointer; }
.btn-secondary-sm { background: #1e293b; color: #cbd5e1; border: none; padding: 0.35rem 0.75rem; border-radius: 4px; cursor: pointer; align-self: flex-start; }
.code-badge { background: #020420; color: #38bdf8; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; }
.code-snippet-card { margin-top: 1.5rem; background: #020420; border: 1px solid #1e293b; border-radius: 8px; padding: 1rem; }
.code-snippet-card h3 { font-size: 0.9rem; margin: 0 0 0.5rem; color: #38bdf8; }
.code-block { background: #090d16; padding: 0.75rem; border-radius: 6px; color: #a7f3d0; font-family: monospace; font-size: 0.8rem; overflow-x: auto; margin: 0; }

/* MODALE */
.dkp-modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.dkp-modal { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; width: 100%; max-width: 450px; display: flex; flex-direction: column; gap: 1rem; }
.modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
.btn-secondary { background: #1e293b; color: #ffffff; border: none; padding: 0.55rem 1rem; border-radius: 6px; cursor: pointer; }
</style>