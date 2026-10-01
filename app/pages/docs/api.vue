<!-- pages/docs/api.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'API Reference v2.4 Interattiva — DKP Docs',
  meta: [
    { name: 'description', content: 'Documentazione tecnica interattiva delle API REST di DevKernelPulse v2.4. Endpoints, autenticazione e code snippet.' }
  ]
})

// Linguaggio Selezionato per i Code Snippet
const selectedLang = ref<'curl' | 'javascript' | 'python' | 'go'>('curl')

// Filtro di Ricerca Endpoints
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
  params?: { name: string; type: string; required: boolean; desc: string }[]
  bodyExample?: string
  responseExample: string
}

const endpoints: Endpoint[] = [
  {
    id: 'get-news',
    method: 'GET',
    path: '/api/v2/news',
    title: 'Lista Feed Tech News',
    description: 'Restituisce l\'elenco paginato delle notizie e risorse inviate e crawlate.',
    protected: false,
    rateLimit: '60 req/min (Free) | 1000 req/min (Pro)',
    params: [
      { name: 'page', type: 'integer', required: false, desc: 'Numero pagina (default: 1)' },
      { name: 'category', type: 'string', required: false, desc: 'Filtra per categoria (es. ai, devops, security)' }
    ],
    responseExample: `{
  "status": "success",
  "data": [
    {
      "id": "item_9921",
      "title": "Claude Opus 5.5 is now available on Google Cloud",
      "url": "https://dev.to/...",
      "author": "pugsandprincesses",
      "xp_awarded": 15,
      "created_at": "2026-09-29T13:30:00Z"
    }
  ],
  "meta": { "total": 128, "page": 1, "pages": 4 }
}`
  },
  {
    id: 'post-proof-of-code',
    method: 'POST',
    path: '/api/v2/vault/notarize',
    title: 'Notarizzazione Proof of Code',
    description: 'Genera un hash SHA-256 e un certificato crittografico immutabile per un frammento di codice.',
    protected: true,
    rateLimit: '10 req/min (Free) | 200 req/min (Pro)',
    bodyExample: `{
  "title": "Algoritmo DKP Matcher v2",
  "source_code": "function verifyHash(code) { return sha256(code); }",
  "language": "typescript"
}`,
    responseExample: `{
  "status": "notarized",
  "vault_id": "vlt_88120491",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "timestamp": "2026-09-29T15:45:00Z",
  "verification_url": "https://devkernelpulse.org/tools/proof-of-code?v=vlt_88120491"
}`
  },
  {
    id: 'post-ai-scan',
    method: 'POST',
    path: '/api/v2/ai/scan',
    title: 'AI Code Security Audit',
    description: 'Sottopone il frammento di codice all\'AI Scanner v2.3 per rilevare falle e problemi di sicurezza.',
    protected: true,
    rateLimit: '5 req/min (Free) | 100 req/min (Pro)',
    bodyExample: `{
  "code": "const query = 'SELECT * FROM users WHERE id = ' + req.query.id;",
  "language": "javascript"
}`,
    responseExample: `{
  "vulnerabilities_found": 1,
  "risk_score": "HIGH",
  "details": [
    {
      "severity": "CRITICAL",
      "type": "SQL Injection (CWE-89)",
      "line": 1,
      "recommendation": "Utilizzare query parametrizzate per prevenire SQLi."
    }
  ]
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
  const baseUrl = 'https://api.devkernelpulse.org'
  
  if (lang === 'curl') {
    return `curl -X ${endpoint.method} "${baseUrl}${endpoint.path}" \\
  -H "Content-Type: application/json" ${endpoint.protected ? '\\\n  -H "Authorization: Bearer YOUR_DKP_API_KEY"' : ''} ${endpoint.bodyExample ? `\\\n  -d '${endpoint.bodyExample.replace(/\n/g, '')}'` : ''}`
  }
  
  if (lang === 'javascript') {
    return `const response = await fetch('${baseUrl}${endpoint.path}', {
  method: '${endpoint.method}',
  headers: {
    'Content-Type': 'application/json'${endpoint.protected ? ',\n    \'Authorization\': \'Bearer YOUR_DKP_API_KEY\'' : ''}
  }${endpoint.bodyExample ? `,\n  body: JSON.stringify(${endpoint.bodyExample})` : ''}
});
const data = await response.json();
console.log(data);`
  }

  if (lang === 'python') {
    return `import requests

url = "${baseUrl}${endpoint.path}"
headers = {
    "Content-Type": "application/json"${endpoint.protected ? ',\n    "Authorization": "Bearer YOUR_DKP_API_KEY"' : ''}
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
    ${endpoint.protected ? 'req.Header.Add("Authorization", "Bearer YOUR_DKP_API_KEY")' : ''}

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
          <span class="version">v2.4-OpenAPI</span>
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
        
        <!-- HEADER OVERVIEW RATE LIMITS & AUTH -->
        <div class="auth-card">
          <div class="auth-info">
            <h4>🔑 Autenticazione Bearer Token</h4>
            <p>Tutti gli endpoint protetti richiedono l'header <code>Authorization: Bearer &lt;DKP_API_KEY&gt;</code> generabile dal tuo <NuxtLink to="/user/dashboard">Pannello Dashboard</NuxtLink>.</p>
          </div>
          <div class="rate-info">
            <strong>Limiti di Chiamata:</strong>
            <ul>
              <li><span class="free">FREE</span> 60 req/min</li>
              <li><span class="pro">PRO</span> 1,000 req/min</li>
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

          <div class="meta-row">
            <span><strong>Rate Limit:</strong> {{ activeEndpoint.rateLimit }}</span>
          </div>

          <!-- PARAMETRI QUERY / URL -->
          <div v-if="activeEndpoint.params && activeEndpoint.params.length" class="params-section">
            <h4>Query Parameters</h4>
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

          <!-- CODE SNIPPET GENERATOR -->
          <div class="code-generator">
            <div class="code-header">
              <h4>💻 Code Snippets Pronti all'Uso</h4>
              <div class="lang-selector">
                <button @click="selectedLang = 'curl'" :class="{ active: selectedLang === 'curl' }">cURL</button>
                <button @click="selectedLang = 'javascript'" :class="{ active: selectedLang === 'javascript' }">JS/TS</button>
                <button @click="selectedLang = 'python'" :class="{ active: selectedLang === 'python' }">Python</button>
                <button @click="selectedLang = 'go'" :class="{ active: selectedLang === 'go' }">Go</button>
              </div>
            </div>

            <pre class="code-block"><code>{{ getSnippet(activeEndpoint, selectedLang) }}</code></pre>
          </div>

          <!-- ESEMPIO RISPOSTA JSON -->
          <div class="response-section">
            <h4>Esempio Risposta HTTP 200 OK</h4>
            <pre class="code-block json-response"><code>{{ activeEndpoint.responseExample }}</code></pre>
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
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.api-container {
  max-width: 1350px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2rem;
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
  padding: 0.3rem;
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

/* MAIN DETAILS */
.auth-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1.5rem;
}

.auth-info h4 { margin: 0 0 0.3rem; color: #fff; }
.auth-info p { margin: 0; font-size: 0.85rem; color: #94a3b8; }
.auth-info code { color: #38bdf8; background: #020420; padding: 0.1rem 0.3rem; border-radius: 4px; }

.rate-info { font-size: 0.8rem; color: #94a3b8; }
.rate-info ul { list-style: none; padding: 0; margin: 0.3rem 0 0; display: flex; gap: 0.8rem; }
.rate-info .free { color: #cbd5e1; font-weight: 800; }
.rate-info .pro { color: #00dc82; font-weight: 800; }

.endpoint-detail-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.75rem;
}

.ep-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.ep-headline {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ep-headline code {
  color: #fff;
  font-size: 1.1rem;
  font-weight: 700;
  font-family: monospace;
}

.badge-protected {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.badge-public {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.endpoint-detail-card h3 { color: #fff; margin: 0 0 0.5rem; }
.ep-desc { color: #94a3b8; font-size: 0.95rem; margin-bottom: 1rem; }

.meta-row {
  font-size: 0.85rem;
  color: #64748b;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.params-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.8rem;
}

.params-table th, .params-table td {
  padding: 0.6rem 0.8rem;
  text-align: left;
  border-bottom: 1px solid #1e293b;
  font-size: 0.85rem;
}

.params-table th { color: #fff; background: #020420; }
.params-table code { color: #38bdf8; }
.params-table .type { color: #00dc82; font-family: monospace; }

/* CODE BLOCK GENERATOR */
.code-generator {
  margin-top: 1.75rem;
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 8px;
  overflow: hidden;
}

.code-header {
  background: #090d16;
  padding: 0.6rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #1e293b;
}

.code-header h4 { margin: 0; color: #fff; font-size: 0.85rem; }

.lang-selector button {
  background: transparent;
  border: none;
  color: #64748b;
  font-weight: 700;
  font-size: 0.75rem;
  padding: 0.25rem 0.55rem;
  cursor: pointer;
}

.lang-selector button.active {
  color: #00dc82;
  border-bottom: 2px solid #00dc82;
}

.code-block {
  margin: 0;
  padding: 1rem;
  color: #38bdf8;
  font-family: monospace;
  font-size: 0.82rem;
  overflow-x: auto;
  line-height: 1.5;
}

.code-block.json-response {
  color: #00dc82;
}

.response-section {
  margin-top: 1.5rem;
}

.response-section h4 {
  color: #fff;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}
</style>