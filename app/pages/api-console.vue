<!-- pages/api-console.vue -->
<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'DKP API Console & Hub Backend — DevKernelPulse',
  meta: [
    { name: 'description', content: 'Gestisci le tue API Key, monitora il traffico e aggiorna il piano licenze nel DKP API Console.' }
  ]
})

// Stato Licenza Utente
const currentPlan = ref<'free' | 'pro' | 'enterprise'>('free')
const showNewKeyModal = ref(false)

// Dati Simulati Token API
const apiKeys = ref([
  {
    id: 'key_1',
    name: 'Production Server Backend',
    prefix: 'dkp_live_8f9a...',
    fullKey: 'dkp_live_8f9a2d3e4190xzz',
    created: '2026-08-12',
    lastUsed: '2 minuti fa',
    permissions: ['Read News', 'Proof Vault', 'AI Scan'],
    status: 'active'
  },
  {
    id: 'key_2',
    name: 'CI/CD GitHub Action',
    prefix: 'dkp_live_12c4...',
    fullKey: 'dkp_live_12c49a008211abc',
    created: '2026-09-01',
    lastUsed: '1 ora fa',
    permissions: ['AI Scan'],
    status: 'active'
  }
])

// Form Creazione Nuovo Token
const newKeyName = ref('')
const selectedPerms = ref({
  readNews: true,
  vaultWrite: true,
  aiScan: true,
  admin: false
})

function createApiKey() {
  if (!newKeyName.value.trim()) return
  const randomHash = Math.random().toString(36).substring(2, 10)
  
  const permsList: string[] = []
  if (selectedPerms.value.readNews) permsList.push('Read News')
  if (selectedPerms.value.vaultWrite) permsList.push('Proof Vault')
  if (selectedPerms.value.aiScan) permsList.push('AI Scan')
  if (selectedPerms.value.admin) permsList.push('Admin')

  apiKeys.value.unshift({
    id: `key_${Date.now()}`,
    name: newKeyName.value,
    prefix: `dkp_live_${randomHash}...`,
    fullKey: `dkp_live_${randomHash}_full_token`,
    created: new Date().toISOString().split('T')[0],
    lastUsed: 'Mai usata',
    permissions: permsList,
    status: 'active'
  })

  newKeyName.value = ''
  showNewKeyModal.value = false
}

function revokeKey(id: string) {
  apiKeys.value = apiKeys.value.filter(k => k.id !== id)
}

function copyKey(keyText: string) {
  navigator.clipboard.writeText(keyText)
  alert('API Key copiata negli appunti!')
}
</script>

<template>
  <div class="api-console-page">
    <div class="console-container">
      
      <!-- HERO & PLAN OVERVIEW -->
      <header class="console-hero">
        <div class="hero-top">
          <div>
            <div class="breadcrumb">Services / Backend Portal</div>
            <h1>⚡ DKP API Console</h1>
            <p class="subtitle">
              Pannello isolato per il controllo delle API, gestione delle chiavi di accesso e metriche di consumo.
            </p>
          </div>

          <!-- CURRENT PLAN BADGE -->
          <div class="plan-card">
            <div class="plan-info">
              <span class="plan-label">Piano Attivo</span>
              <span class="plan-name" :class="currentPlan">
                {{ currentPlan === 'free' ? 'FREE TIER' : currentPlan === 'pro' ? 'PRO GOLD' : 'ENTERPRISE' }}
              </span>
            </div>
            <div class="quota-bar-wrapper">
              <div class="quota-text">
                <span>Consumo Mese: <strong>742 / 1,000 req</strong></span>
                <span class="pct">74%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: 74%"></div>
              </div>
            </div>
            <NuxtLink to="/shop" class="upgrade-btn">
              🚀 Upgrade a Pro (100k req/m)
            </NuxtLink>
          </div>
        </div>
      </header>

      <!-- METRICHE DI UTILIZZO E GRAFICO -->
      <section class="metrics-section">
        <h2>📊 Metriche di Utilizzo & Latenza</h2>
        
        <div class="metrics-grid">
          <div class="stat-card">
            <span class="stat-title">Chiamate Totali (30 gg)</span>
            <span class="stat-value cyan">14,290</span>
            <span class="stat-trend">▲ +12% rispetto al mese scorso</span>
          </div>

          <div class="stat-card">
            <span class="stat-title">Latenza Media API</span>
            <span class="stat-value green">22 ms</span>
            <span class="stat-trend green-txt">⚡ Nitro Engine v2.4 Optimal</span>
          </div>

          <div class="stat-card">
            <span class="stat-title">Tasso Errori (4xx / 5xx)</span>
            <span class="stat-value">0.02%</span>
            <span class="stat-trend green-txt">🟢 Sistema Stabile</span>
          </div>
        </div>

        <!-- VISUAL CHART SIMULATION -->
        <div class="chart-box">
          <div class="chart-header">
            <h4>Traffico API nelle ultime 24 ore (Req/min)</h4>
            <span class="live-dot">🟢 Live Stream</span>
          </div>
          <div class="chart-bars">
            <div class="bar" style="height: 35%" title="00:00 - 32 req"></div>
            <div class="bar" style="height: 20%" title="03:00 - 18 req"></div>
            <div class="bar" style="height: 15%" title="06:00 - 12 req"></div>
            <div class="bar" style="height: 60%" title="09:00 - 85 req"></div>
            <div class="bar" style="height: 85%" title="12:00 - 120 req"></div>
            <div class="bar" style="height: 95%" title="15:00 - 145 req"></div>
            <div class="bar active" style="height: 70%" title="18:00 - 98 req"></div>
          </div>
          <div class="chart-labels">
            <span>00:00</span>
            <span>04:00</span>
            <span>08:00</span>
            <span>12:00</span>
            <span>16:00</span>
            <span>20:00</span>
            <span>23:59</span>
          </div>
        </div>
      </section>

      <!-- GESTIONE TOKEN & PERMESSI -->
      <section class="tokens-section">
        <div class="section-header">
          <div>
            <h2>🔑 Gestione API Token (Bearer)</h2>
            <p>Crea e configura chiavi di sicurezza con permessi granulari per i tuoi servizi.</p>
          </div>
          <button @click="showNewKeyModal = true" class="create-key-btn">
            ➕ Genera Nuovo Token
          </button>
        </div>

        <!-- TABLE KEYS -->
        <div class="keys-table-wrapper">
          <table class="keys-table">
            <thead>
              <tr>
                <th>Nome Identificativo</th>
                <th>Token Prefix</th>
                <th>Permessi Granulari</th>
                <th>Ultimo Utilizzo</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="key in apiKeys" :key="key.id">
                <td>
                  <strong class="key-name">{{ key.name }}</strong>
                  <div class="key-date">Creato il {{ key.created }}</div>
                </td>
                <td>
                  <code class="key-prefix">{{ key.prefix }}</code>
                </td>
                <td>
                  <div class="perm-tags">
                    <span v-for="p in key.permissions" :key="p" class="perm-tag">{{ p }}</span>
                  </div>
                </td>
                <td><span class="last-used">{{ key.lastUsed }}</span></td>
                <td>
                  <div class="action-btns">
                    <button @click="copyKey(key.fullKey)" class="action-btn copy" title="Copia Key">📋</button>
                    <button @click="revokeKey(key.id)" class="action-btn delete" title="Revoca Token">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- SEZIONE UPGRADE & PIANI LICENZE -->
      <section class="plans-section">
        <h2>🛍️ Piani Licenze API & Sblocco Kernel 2.4-GOLD</h2>
        <p class="plans-sub">Seleziona il piano più adatto per la tua infrastruttura o software aziendale.</p>

        <div class="plans-grid">
          
          <!-- PIANO FREE -->
          <div class="plan-card-item">
            <span class="plan-badge">START</span>
            <h3>Free Developer</h3>
            <div class="price">€0 <span>/ mese</span></div>
            <ul class="plan-features">
              <li>✅ 1,000 Chiamate API / Mese</li>
              <li>✅ Rate limit: 60 req/min</li>
              <li>✅ Accesso Pubblico Tech News</li>
              <li>⚡ Vault SHA-256 Limitato</li>
            </ul>
            <button disabled class="plan-btn disabled">Piano Attuale</button>
          </div>

          <!-- PIANO PRO GOLD -->
          <div class="plan-card-item featured">
            <span class="plan-badge gold">MOST POPULAR</span>
            <h3>Pro Kernel Gold</h3>
            <div class="price">€29 <span>/ mese</span></div>
            <ul class="plan-features">
              <li>🚀 100,000 Chiamate API / Mese</li>
              <li>🚀 Rate limit: 1,000 req/min</li>
              <li>🚀 AI Code Scanner v2.3 Illimitato</li>
              <li>🛡️ Vault Proof of Code Prioritario</li>
              <li>🔑 Token con Permessi Granulari</li>
            </ul>
            <NuxtLink to="/shop" class="plan-btn gold-btn">Attiva Licenza Pro ↗</NuxtLink>
          </div>

          <!-- PIANO ENTERPRISE -->
          <div class="plan-card-item">
            <span class="plan-badge enterprise">ENTERPRISE</span>
            <h3>Custom Ecosystem</h3>
            <div class="price">€99 <span>/ mese</span></div>
            <ul class="plan-features">
              <li>⚡ Richieste Illimitate / SLA 99.99%</li>
              <li>⚡ Cluster Dedicato Multi-Region</li>
              <li>⚡ Webhook Custom & GitHub Actions</li>
              <li>🤝 Supporto Tecnico Diretto H24</li>
            </ul>
            <NuxtLink to="/shop" class="plan-btn outline-btn">Contatta Sales ↗</NuxtLink>
          </div>

        </div>
      </section>

      <!-- MODALE GENERAZIONE CHIAVE -->
      <div v-if="showNewKeyModal" class="modal-backdrop" @click.self="showNewKeyModal = false">
        <div class="modal-content">
          <h3>➕ Genera Nuova API Key</h3>
          <p>Assegna un nome descrittivo e seleziona le autorizzazioni consentite.</p>

          <div class="form-group">
            <label>Nome Token / Applicazione</label>
            <input v-model="newKeyName" type="text" placeholder="Es. Staging App Server" class="form-input" />
          </div>

          <div class="form-group">
            <label>Permessi Granulari</label>
            <div class="checkbox-grid">
              <label><input type="checkbox" v-model="selectedPerms.readNews" /> Read News Feed</label>
              <label><input type="checkbox" v-model="selectedPerms.vaultWrite" /> Proof of Code Vault</label>
              <label><input type="checkbox" v-model="selectedPerms.aiScan" /> AI Code Scanner</label>
              <label><input type="checkbox" v-model="selectedPerms.admin" /> Full Admin Control</label>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="showNewKeyModal = false" class="btn-cancel">Annulla</button>
            <button @click="createApiKey" class="btn-confirm">Crea API Key</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.api-console-page {
  background: #020420;
  color: #cbd5e1;
  min-height: 100vh;
  padding: 3rem 1.5rem 5rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.console-container {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.breadcrumb { font-size: 0.8rem; color: #38bdf8; font-weight: 600; margin-bottom: 0.5rem; }

.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  flex-wrap: wrap;
}

.hero-top h1 { font-size: 2.2rem; color: #fff; font-weight: 900; margin: 0 0 0.5rem; }
.subtitle { color: #94a3b8; font-size: 1.05rem; max-width: 600px; margin: 0; }

/* PLAN CARD */
.plan-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.plan-info { display: flex; justify-content: space-between; align-items: center; }
.plan-label { font-size: 0.8rem; color: #64748b; font-weight: 700; }
.plan-name {
  font-size: 0.85rem;
  font-weight: 900;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
}
.plan-name.free { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }

.quota-bar-wrapper { display: flex; flex-direction: column; gap: 0.4rem; }
.quota-text { display: flex; justify-content: space-between; font-size: 0.82rem; color: #cbd5e1; }
.progress-bar { height: 6px; background: #020420; border-radius: 999px; overflow: hidden; }
.progress-fill { height: 100%; background: #00dc82; border-radius: 999px; }

.upgrade-btn {
  background: #00dc82;
  color: #020420;
  text-align: center;
  font-weight: 800;
  font-size: 0.85rem;
  padding: 0.6rem;
  border-radius: 8px;
  text-decoration: none;
  transition: transform 0.15s ease;
}
.upgrade-btn:hover { transform: translateY(-2px); }

/* METRICS */
.metrics-section h2, .tokens-section h2, .plans-section h2 {
  color: #fff; font-size: 1.3rem; margin: 0 0 1rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
}

.stat-title { font-size: 0.82rem; color: #94a3b8; font-weight: 600; }
.stat-value { font-size: 1.8rem; font-weight: 900; margin: 0.3rem 0; color: #fff; }
.stat-value.cyan { color: #38bdf8; }
.stat-value.green { color: #00dc82; }
.stat-trend { font-size: 0.75rem; color: #38bdf8; }
.stat-trend.green-txt { color: #00dc82; }

/* CHART BOX */
.chart-box {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
}

.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.chart-header h4 { color: #fff; margin: 0; font-size: 0.95rem; }
.live-dot { color: #00dc82; font-size: 0.8rem; font-weight: 700; }

.chart-bars {
  height: 120px;
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 0.5rem;
}

.bar {
  flex: 1;
  background: rgba(56, 189, 248, 0.3);
  border-radius: 4px 4px 0 0;
  transition: all 0.2s ease;
}
.bar:hover, .bar.active { background: #00dc82; box-shadow: 0 0 10px rgba(0, 220, 130, 0.5); }

.chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
}

/* TOKENS TABLE */
.section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.25rem; }
.section-header p { color: #94a3b8; font-size: 0.9rem; margin: 0.2rem 0 0; }

.create-key-btn {
  background: #38bdf8;
  color: #020420;
  font-weight: 800;
  border: none;
  padding: 0.65rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.88rem;
}

.keys-table-wrapper {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  overflow-x: auto;
}

.keys-table { width: 100%; border-collapse: collapse; text-align: left; }
.keys-table th, .keys-table td { padding: 1rem 1.25rem; border-bottom: 1px solid #1e293b; font-size: 0.88rem; }
.keys-table th { background: #020420; color: #fff; font-size: 0.8rem; }

.key-name { color: #fff; display: block; }
.key-date { font-size: 0.75rem; color: #64748b; }
.key-prefix { color: #38bdf8; background: #020420; padding: 0.2rem 0.5rem; border-radius: 4px; }

.perm-tags { display: flex; gap: 0.3rem; flex-wrap: wrap; }
.perm-tag { background: rgba(0, 220, 130, 0.1); color: #00dc82; font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.4rem; border-radius: 4px; }

.last-used { color: #94a3b8; font-size: 0.82rem; }
.action-btns { display: flex; gap: 0.5rem; }
.action-btn { background: #020420; border: 1px solid #1e293b; padding: 0.4rem 0.6rem; border-radius: 6px; cursor: pointer; }

/* PLANS GRID */
.plans-sub { color: #94a3b8; margin: -0.5rem 0 1.5rem; font-size: 0.92rem; }
.plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }

.plan-card-item {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  position: relative;
}

.plan-card-item.featured { border-color: #00dc82; box-shadow: 0 0 20px rgba(0, 220, 130, 0.1); }

.plan-badge { font-size: 0.65rem; font-weight: 900; background: #1e293b; color: #94a3b8; padding: 0.2rem 0.5rem; border-radius: 4px; width: fit-content; margin-bottom: 0.8rem; }
.plan-badge.gold { background: rgba(0, 220, 130, 0.2); color: #00dc82; }
.plan-badge.enterprise { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }

.plan-card-item h3 { color: #fff; margin: 0 0 0.5rem; font-size: 1.2rem; }
.price { font-size: 2rem; font-weight: 900; color: #fff; margin-bottom: 1.25rem; }
.price span { font-size: 0.85rem; color: #64748b; font-weight: 500; }

.plan-features { list-style: none; padding: 0; margin: 0 0 2rem; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.88rem; color: #cbd5e1; }

.plan-btn {
  margin-top: auto;
  text-align: center;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 800;
  text-decoration: none;
  font-size: 0.88rem;
}
.plan-btn.disabled { background: #1e293b; color: #64748b; border: none; }
.gold-btn { background: #00dc82; color: #020420; }
.outline-btn { border: 1px solid #38bdf8; color: #38bdf8; }

/* MODAL */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(2, 4, 32, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 480px;
}

.modal-content h3 { color: #fff; margin: 0 0 0.4rem; }
.modal-content p { color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.5rem; }

.form-group { margin-bottom: 1.25rem; }
.form-group label { display: block; color: #fff; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.4rem; }
.form-input { width: 100%; background: #020420; border: 1px solid #1e293b; color: #fff; padding: 0.65rem 0.8rem; border-radius: 6px; box-sizing: border-box; }

.checkbox-grid { display: flex; flex-direction: column; gap: 0.5rem; background: #020420; padding: 0.8rem; border-radius: 6px; border: 1px solid #1e293b; }
.checkbox-grid label { font-weight: 500; font-size: 0.85rem; color: #cbd5e1; cursor: pointer; }

.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
.btn-cancel { background: transparent; border: 1px solid #1e293b; color: #94a3b8; padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer; }
.btn-confirm { background: #00dc82; color: #020420; border: none; font-weight: 800; padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer; }
</style>