<!-- app/pages/docs/api.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useDkpSeo({
  title: 'API Reference v2.5 Interattiva — DKP Docs',
  description: 'Documentazione tecnica interattiva ed OpenAPI delle API REST di DevKernelPulse v2.5-GOLD. Integration OpenRouter, metering crediti, rate limit, validazione crittografica e code snippets.'
})

const selectedLang = ref<'curl' | 'javascript' | 'python' | 'go'>('curl')
const searchQuery = ref('')
const selectedCategory = ref('all')

interface Endpoint {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  title: string
  description: string
  protected: boolean
  rateLimit: string
  costPerReq: string
  params?: { name: string; type: string; required: boolean; desc: string }[]
  bodyExample?: string
  responseExample: string
}

const endpoints: Endpoint[] = [
  {
    id: 'post-ai-chat',
    method: 'POST',
    path: '/api/ai/chat',
    title: 'Neural AI Chat & OpenUI Streaming',
    description: 'Endpoint di routing dinamico verso OpenRouter (DKP Trinity). Gestisce la generazione in streaming di codice UI e componenti Tailwind. Il Bearer token viene validato in volo (SHA-256) ed ogni chiamata consuma 1 credito dalla quota sul DB Neon.',
    protected: true,
    rateLimit: 'Free: 1.000 req/mo | Pro: 50.000 req/mo | Enterprise: 1.000.000 req/mo',
    costPerReq: '1 Richiesta API (usage_count +1)',
    params: [],
    bodyExample: `{
  "model": "dkp-coder",
  "messages": [
    { "role": "user", "content": "Crea un badge di stato pulsante verde in Tailwind CSS" }
  ],
  "systemPrompt": "Sei un assistente esperto di programmazione OpenUI.",
  "temperature": 0.7,
  "maxTokens": 2048
}`,
    responseExample: `// Risposta HTTP 200 (Streaming text/plain compatibile con Vercel AI SDK)
0:"Ecco il badge richiesto:"
0:"\\n\`\`\`html"
0:"\\n<div class=\\"inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold\\">"
0:"\\n  <span class=\\"w-2 h-2 rounded-full bg-emerald-400 animate-pulse\\"></span> Online"
0:"\\n</div>"`
  },
  {
    id: 'post-nodes-publish',
    method: 'POST',
    path: '/api/nodes',
    title: 'DKP Nodes - Pubblicazione & Pulse Sentinel Moderation',
    description: 'Pubblica un nuovo Node (snippet o post dev) nella community. Il contenuto viene scansionato in tempo reale da Pulse Sentinel (Gemini 2.0 Flash) per bloccare spam, injection o malware prima dell\'inserimento su Neon DB.',
    protected: true,
    rateLimit: '30 req/ora (Free) | 500 req/ora (Pro)',
    costPerReq: '1 Richiesta API + Reward +50 XP al superamento della moderazione',
    params: [],
    bodyExample: `{
  "title": "Nuxt 4 Nitro Server Handler Pattern",
  "content": "Ecco come strutturare un middleware per la gestione dinamica delle API Keys...",
  "tags": ["nuxt", "typescript", "backend"]
}`,
    responseExample: `{
  "success": true,
  "node_id": "nd_992140",
  "moderation": {
    "status": "APPROVED",
    "sentinel_model": "google/gemini-2.0-flash-exp:free",
    "safety_score": 0.99
  },
  "reward": {
    "xp_gained": 50,
    "current_user_xp": 1450
  }
}`
  },
  {
    id: 'post-proof-of-code',
    method: 'POST',
    path: '/api/v2/vault/notarize',
    title: 'Notarizzazione Proof of Code Vault',
    description: 'Calcola l\'hash SHA-256 e genera un certificato crittografico immutabile per un frammento di codice o script salvandolo sul database Neon.',
    protected: true,
    rateLimit: '10 req/min (Free) | 200 req/min (Pro)',
    costPerReq: '1 Richiesta API + Reward +100 XP automatici nel Vault',
    bodyExample: `{
  "title": "SmartContract_Auth_v2.sol",
  "source_code": "function verifyHash(code) { return sha256(code); }",
  "language": "solidity"
}`,
    responseExample: `{
  "status": "notarized",
  "vault_id": "vlt_88120491",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "timestamp": "2026-10-30T16:00:00Z",
  "verification_url": "https://devkernelpulse.org/user/dashboard?tab=vault"
}`
  },
  {
    id: 'get-commercial-data',
    method: 'GET',
    path: '/api/v1/data',
    title: 'Commercial Suite Data Stream',
    description: 'Endpoint ad alte prestazioni protetto da API Gateway per l\'estrazione dei dati. Applica il metering Nitro tramite il check del key_hash su Drizzle ORM.',
    protected: true,
    rateLimit: '1.000 req/mese (Free) | 50.000 req/mese (Pro) | 1.000.000 req/mese (Enterprise)',
    costPerReq: '1 Richiesta API dal contatore mensile',
    params: [
      { name: 'format', type: 'string', required: false, desc: 'Formato di output dei dati (json | xml, default: json)' }
    ],
    responseExample: `{
  "success": true,
  "message": "Accesso autorizzato alle API commerciali DevKernelPulse v2.5-GOLD",
  "clientContext": {
    "keyId": 42,
    "keyName": "App Produzione Mobile",
    "roleTier": "PRO",
    "requestsUsed": 129,
    "requestsMax": 50000
  },
  "data": {
    "status": "OPERATIONAL",
    "service": "DKP Commercial Suite v1",
    "timestamp": "2026-10-30T16:00:00.000Z"
  }
}`
  }
]

const activeEndpointId = ref<string>(endpoints[0].id)

const activeEndpoint = computed(() => {
  return endpoints.find(e => e.id === activeEndpointId.value) || endpoints[0]
})

const filteredEndpoints = computed(() => {
  return endpoints.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          e.path.toLowerCase().includes(searchQuery.value.toLowerCase())
    if (selectedCategory.value === 'protected') return matchesSearch && e.protected
    if (selectedCategory.value === 'public') return matchesSearch && !e.protected
    return matchesSearch
  })
})

function getSnippet(endpoint: Endpoint, lang: string) {
  const baseUrl = 'https://devkernelpulse.org'
  
  if (lang === 'curl') {
    return `curl -X ${endpoint.method} "${baseUrl}${endpoint.path}" \\
  -H "Content-Type: application/json" ${endpoint.protected ? '\\\n  -H "Authorization: Bearer dkp_live_tua_api_key"' : ''} ${endpoint.bodyExample ? `\\\n  -d '${endpoint.bodyExample.replace(/\n/g, '')}'` : ''}`
  }
  
  if (lang === 'javascript') {
    return `const response = await fetch('${baseUrl}${endpoint.path}', {
  method: '${endpoint.method}',
  headers: {
    'Content-Type': 'application/json'${endpoint.protected ? ',\n    \'Authorization\': \'Bearer dkp_live_tua_api_key\'' : ''}
  }${endpoint.bodyExample ? `,\n  body: JSON.stringify(${endpoint.bodyExample})` : ''}
});
const data = await response.json();
console.log(data);`
  }

  if (lang === 'python') {
    return `import requests

url = "${baseUrl}${endpoint.path}"
headers = {
    "Content-Type": "application/json"${endpoint.protected ? ',\n    "Authorization": "Bearer dkp_live_tua_api_key"' : ''}
}
${endpoint.bodyExample ? `payload = ${endpoint.bodyExample}\nresponse = requests.${endpoint.method.toLowerCase()}(url, json=payload, headers=headers)` : `response = requests.${endpoint.method.toLowerCase()}(url, headers=headers)`}

print(response.json())`
  }

  if (lang === 'go') {
    return `package main

import (
    "fmt"
    "net/http"
    "io/ioutil"
)

func main() {
    url := "${baseUrl}${endpoint.path}"
    req, _ := http.NewRequest("${endpoint.method}", url, nil)
    req.Header.Add("Content-Type", "application/json")
    ${endpoint.protected ? 'req.Header.Add("Authorization", "Bearer dkp_live_tua_api_key")' : ''}

    res, _ := http.DefaultClient.Do(req)
    defer res.Body.Close()
    body, _ := ioutil.ReadAll(res.Body)
    fmt.Println(string(body))
}`
  }

  return ''
}
</script>

<template>
  <div class="api-page">
    <div class="api-container">
      
      <!-- LEFT SIDEBAR: FILTRI ED ENDPOINTS -->
      <aside class="api-sidebar">
        <div class="sidebar-top">
          <h3>🔌 DKP API Console</h3>
          <span class="version">v2.5-GOLD</span>
        </div>

        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="🔍 Cerca endpoint o URL..." 
          class="api-search"
        />

        <div class="category-tabs">
          <button @click="selectedCategory = 'all'" :class="{ active: selectedCategory === 'all' }">Tutti</button>
          <button @click="selectedCategory = 'public'" :class="{ active: selectedCategory === 'public' }">Pubblici</button>
          <button @click="selectedCategory = 'protected'" :class="{ active: selectedCategory === 'protected' }">Protetti</button>
        </div>

        <div class="endpoint-list">
          <button 
            v-for="e in filteredEndpoints" 
            :key="e.id"
            @click="activeEndpointId = e.id"
            :class="{ active: activeEndpointId === e.id }"
            class="endpoint-btn"
          >
            <span class="method-badge" :class="e.method.toLowerCase()">{{ e.method }}</span>
            <span class="ep-title">{{ e.title }}</span>
          </button>
        </div>
      </aside>

      <!-- MAIN PANEL: SPECS & SNIPPETS -->
      <main class="api-main">
        
        <!-- HEADER CONSUMO CREDITI & AUTENTICAZIONE -->
        <div class="auth-card">
          <div class="auth-info">
            <h4>⚡ Consumo API &amp; Metering Automatico</h4>
            <p>
              Tutte le chiamate verso il Gateway DKP (Neural Playground, Nodes, Vault e Commercial Suite) <strong>consumano 1 credito</strong> scalando direttamente dal contatore <code>usage_count</code> nel Database Neon.
            </p>
            <p class="sub-auth">
              Invia l'header <code>Authorization: Bearer dkp_live_...</code>. La tua chiave viene verificata tramite l'hash crittografato SHA-256 per garantire la massima sicurezza zero-trust.
            </p>
          </div>
          <div class="rate-info">
            <strong>Quote Mensili Disponibili:</strong>
            <ul>
              <li><span class="free">FREE:</span> 1.000 req/mese (DKP-Flash)</li>
              <li><span class="pro">PRO:</span> 50.000 req/mese (Coder &amp; Pro)</li>
              <li><span class="enterprise">ENTERPRISE:</span> 1.000.000 req/mese</li>
            </ul>
          </div>
        </div>

        <!-- ENDPOINT DETAILS SECTION -->
        <div class="endpoint-detail-card" v-if="activeEndpoint">
          <div class="ep-header">
            <div class="ep-headline">
              <span class="method-badge large" :class="activeEndpoint.method.toLowerCase()">{{ activeEndpoint.method }}</span>
              <code>{{ activeEndpoint.path }}</code>
            </div>
            <span v-if="activeEndpoint.protected" class="badge-protected">🔒 API Key Required</span>
            <span v-else class="badge-public">🌐 Public</span>
          </div>

          <h3>{{ activeEndpoint.title }}</h3>
          <p class="ep-desc">{{ activeEndpoint.description }}</p>

          <div class="meta-grid">
            <div class="meta-box">
              <span class="meta-label">Allocazione &amp; Quota:</span>
              <span class="meta-val">{{ activeEndpoint.rateLimit }}</span>
            </div>
            <div class="meta-box highlight-cost">
              <span class="meta-label">Costo Chiamata:</span>
              <span class="meta-val text-emerald">⚡ {{ activeEndpoint.costPerReq }}</span>
            </div>
          </div>

          <!-- PARAMETRI QUERY / URL -->
          <div v-if="activeEndpoint.params && activeEndpoint.params.length" class="params-section">
            <h4>Query Parameters</h4>
            <div class="table-responsive">
              <table class="params-table">
                <thead>
                  <tr>
                    <th>Parametro</th>
                    <th>Tipo</th>
                    <th>Obbligatorio</th>
                    <th>Descrizione</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in activeEndpoint.params" :key="p.name">
                    <td><code>{{ p.name }}</code></td>
                    <td><span class="type">{{ p.type }}</span></td>
                    <td>{{ p.required ? 'Sì' : 'No' }}</td>
                    <td>{{ p.desc }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- CODE SNIPPET GENERATOR -->
          <div class="code-generator">
            <div class="code-header">
              <h4>💻 Code Snippet Generato</h4>
              <div class="lang-selector">
                <button @click="selectedLang = 'curl'" :class="{ active: selectedLang === 'curl' }">cURL</button>
                <button @click="selectedLang = 'javascript'" :class="{ active: selectedLang === 'javascript' }">JS / TS</button>
                <button @click="selectedLang = 'python'" :class="{ active: selectedLang === 'python' }">Python</button>
                <button @click="selectedLang = 'go'" :class="{ active: selectedLang === 'go' }">Go</button>
              </div>
            </div>

            <div class="code-wrapper">
              <pre class="code-block"><code>{{ getSnippet(activeEndpoint, selectedLang) }}</code></pre>
            </div>
          </div>

          <!-- ESEMPIO RISPOSTA JSON / STREAM -->
          <div class="response-section">
            <h4>Esempio Risposta HTTP / Stream Payload</h4>
            <div class="code-wrapper">
              <pre class="code-block json-response"><code>{{ activeEndpoint.responseExample }}</code></pre>
            </div>
          </div>

        </div>

      </main>

    </div>
  </div>
</template>

<style scoped>
.api-page {
  background: #020420;
  color: #cbd5e1;
  min-height: 100vh;
  padding: 2rem 1.5rem 5rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.api-container {
  max-width: 1350px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2rem;
}

/* 🟢 FIX CRITICO PER OVERFLOW GRID: impone ai figli del grid di non espandersi oltre lo schermo */
.api-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (max-width: 960px) {
  .api-container { grid-template-columns: 1fr; }
}

/* SIDEBAR */
.api-sidebar {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: fit-content;
  position: sticky;
  top: 5rem;
}

.sidebar-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-top h3 { color: #fff; margin: 0; font-size: 1.1rem; }
.sidebar-top .version {
  font-size: 0.65rem;
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-weight: 800;
}

.api-search {
  background: #020420;
  border: 1px solid #1e293b;
  color: #fff;
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
}

.category-tabs {
  display: flex;
  gap: 0.3rem;
  background: #020420;
  padding: 0.2rem;
  border-radius: 6px;
}

.category-tabs button {
  flex: 1;
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem;
  border-radius: 4px;
  cursor: pointer;
}

.category-tabs button.active {
  background: #1e293b;
  color: #00dc82;
}

.endpoint-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.endpoint-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: transparent;
  border: 1px solid transparent;
  padding: 0.55rem 0.7rem;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.endpoint-btn:hover, .endpoint-btn.active {
  background: #020420;
  border-color: #1e293b;
}

.endpoint-btn.active .ep-title { color: #00dc82; }

.ep-title {
  color: #cbd5e1;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* BADGES METHOD */
.method-badge {
  font-size: 0.65rem;
  font-weight: 900;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  text-transform: uppercase;
}

.method-badge.get { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
.method-badge.post { background: rgba(0, 220, 130, 0.15); color: #00dc82; }
.method-badge.large { font-size: 0.85rem; padding: 0.3rem 0.6rem; }

/* MAIN DETAILS & AUTH CARD */
.auth-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.auth-info { flex: 1; min-width: 280px; }
.auth-info h4 { margin: 0 0 0.4rem; color: #fff; font-size: 1.1rem; }
.auth-info p { margin: 0 0 0.5rem; font-size: 0.88rem; color: #94a3b8; line-height: 1.5; }
.auth-info .sub-auth { font-size: 0.82rem; color: #64748b; }
.auth-info code { color: #38bdf8; background: #020420; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.8rem; }

.rate-info { 
  font-size: 0.82rem; 
  color: #94a3b8; 
  background: #020420;
  border: 1px solid #1e293b;
  padding: 1rem;
  border-radius: 8px;
  min-width: 220px;
}
.rate-info ul { list-style: none; padding: 0; margin: 0.5rem 0 0; display: flex; flex-direction: column; gap: 0.35rem; }
.rate-info .free { color: #cbd5e1; font-weight: 800; }
.rate-info .pro { color: #00dc82; font-weight: 800; }
.rate-info .enterprise { color: #f59e0b; font-weight: 800; }

.endpoint-detail-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.75rem;
  min-width: 0;
  overflow: hidden;
}

.ep-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.ep-headline {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.ep-headline code {
  color: #fff;
  font-size: 1.1rem;
  font-weight: 700;
  font-family: monospace;
  word-break: break-all;
}

.badge-protected {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
}

.badge-public {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
}

.endpoint-detail-card h3 { color: #fff; margin: 0 0 0.5rem; font-size: 1.3rem; }
.ep-desc { color: #94a3b8; font-size: 0.95rem; margin-bottom: 1.25rem; line-height: 1.6; }

/* META GRID PER RATE LIMIT & COSTO */
.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.meta-box {
  background: #020420;
  border: 1px solid #1e293b;
  padding: 0.85rem 1rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.meta-box.highlight-cost {
  border-color: rgba(0, 220, 130, 0.3);
}

.meta-label { font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; }
.meta-val { font-size: 0.88rem; color: #cbd5e1; font-weight: 600; }
.text-emerald { color: #00dc82; font-weight: 800; }

/* TABELLA RESPONSIVE */
.table-responsive {
  width: 100%;
  overflow-x: auto;
  margin-top: 0.8rem;
}

.params-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 500px;
}

.params-table th, .params-table td {
  padding: 0.65rem 0.8rem;
  text-align: left;
  border-bottom: 1px solid #1e293b;
  font-size: 0.85rem;
}

.params-table th { color: #fff; background: #020420; }
.params-table code { color: #38bdf8; }
.params-table .type { color: #00dc82; font-family: monospace; }

/* CODE BLOCK GENERATOR & WRAPPERS */
.code-generator {
  margin-top: 1.75rem;
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 8px;
  overflow: hidden;
}

.code-header {
  background: #0d1322;
  padding: 0.6rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #1e293b;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.code-header h4 { margin: 0; color: #fff; font-size: 0.85rem; }

.lang-selector {
  display: flex;
  gap: 0.2rem;
}

.lang-selector button {
  background: transparent;
  border: none;
  color: #64748b;
  font-weight: 700;
  font-size: 0.75rem;
  padding: 0.25rem 0.55rem;
  cursor: pointer;
  border-radius: 4px;
}

.lang-selector button.active {
  color: #00dc82;
  background: rgba(0, 220, 130, 0.1);
}

.code-wrapper {
  max-width: 100%;
  overflow-x: auto;
  background: #020420;
}

.code-block {
  margin: 0;
  padding: 1.25rem;
  color: #38bdf8;
  font-family: 'Fira Code', 'Courier New', Courier, monospace;
  font-size: 0.82rem;
  line-height: 1.6;
  white-space: pre;
}

.code-block.json-response {
  color: #00dc82;
}

.response-section {
  margin-top: 1.75rem;
}

.response-section h4 {
  color: #fff;
  font-size: 0.9rem;
  margin-bottom: 0.6rem;
}
</style>