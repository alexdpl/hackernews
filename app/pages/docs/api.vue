<!-- app/pages/docs/api.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useDkpSeo({
  title: 'API Reference v2.6-PURE-SQL Interattiva — DKP Docs',
  description: 'Documentazione tecnica interattiva ed OpenAPI delle API REST di DevKernelPulse v2.6-PURE-SQL. Integration OpenRouter, Neon Pure SQL metering, rate limit, validazione crittografica SHA-256 e code snippets.'
})

const selectedLang = ref<'curl' | 'javascript' | 'python' | 'go'>('curl')
const searchQuery = ref('')
const selectedCategory = ref<'all' | 'public' | 'protected'>('all')
const copiedSnippet = ref(false)

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
    description: 'Endpoint di routing dinamico verso OpenRouter (DKP Trinity). Gestisce la generazione in streaming di codice UI e componenti Tailwind. Il Bearer token viene validato in volo (SHA-256) su Neon Pure SQL ed ogni chiamata consuma 1 credito dalla quota.',
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
    title: 'DKP Talks Hub - Pubblicazione & Pulse Sentinel Moderation',
    description: 'Pubblica un nuovo Node (snippet o post dev) nella community. Il contenuto viene scansionato in tempo reale da Pulse Sentinel per bloccare spam, SQL/XSS injection o malware prima dell\'inserimento su Neon PostgreSQL Pure SQL.',
    protected: true,
    rateLimit: '30 req/ora (Free) | 500 req/ora (Pro)',
    costPerReq: '1 Richiesta API + Reward +50 XP al superamento della moderazione',
    params: [],
    bodyExample: `{
  "title": "Nuxt 4 Nitro Server Handler Pattern v2.6",
  "content": "Ecco come strutturare un middleware Pure SQL per la gestione dinamica delle API Keys...",
  "tags": ["nuxt", "typescript", "pure-sql"]
}`,
    responseExample: `{
  "success": true,
  "node_id": "nd_992140",
  "engine": "v2.6-PURE-SQL",
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
    description: 'Calcola l\'hash crittografico SHA-256 e genera un certificato immutabile per un frammento di codice, documento tecnico o articolo salvandolo tramite query parametrizzate Pure SQL su Neon DB.',
    protected: true,
    rateLimit: '10 req/min (Free) | 200 req/min (Pro)',
    costPerReq: '1 Richiesta API + Reward +100 XP automatici nel Vault',
    bodyExample: `{
  "title": "SmartContract_Auth_v26.sol",
  "source_code": "function verifyHash(code) { return sha256(code); }",
  "language": "solidity"
}`,
    responseExample: `{
  "status": "notarized",
  "engine": "v2.6-PURE-SQL",
  "vault_id": "vlt_88120491",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "timestamp": "2026-11-12T07:50:00Z",
  "verification_url": "https://devkernelpulse.org/user/dashboard?tab=vault"
}`
  },
  {
    id: 'get-commercial-data',
    method: 'GET',
    path: '/api/v1/data',
    title: 'Commercial Suite Data Stream (Pure SQL Gateway)',
    description: 'Endpoint ad alte prestazioni protetto da API Gateway per l\'estrazione dei dati. Applica il metering Nitro a latenza sub-10ms tramite query Pure SQL su key_hash.',
    protected: true,
    rateLimit: '1.000 req/mese (Free) | 50.000 req/mese (Pro) | 1.000.000 req/mese (Enterprise)',
    costPerReq: '1 Richiesta API dal contatore mensile',
    params: [
      { name: 'format', type: 'string', required: false, desc: 'Formato di output dei dati (json | xml, default: json)' }
    ],
    responseExample: `{
  "success": true,
  "message": "Accesso autorizzato alle API commerciali DevKernelPulse v2.6-PURE-SQL",
  "clientContext": {
    "keyId": 42,
    "keyName": "App Produzione Mobile",
    "roleTier": "PRO",
    "requestsUsed": 129,
    "requestsMax": 50000
  },
  "data": {
    "status": "OPERATIONAL",
    "service": "DKP Commercial Suite v2.6",
    "timestamp": "2026-11-12T07:50:00.000Z"
  }
}`
  },
  {
    id: 'get-news-stream',
    method: 'GET',
    path: '/api/news',
    title: 'DKP Tech Feed — Hacker News AI Stream',
    description: 'Restituisce lo stream paginato e filtrabile delle notizie tecnologiche elaborate da Trinity AI e indicizzate da Sentinel Score su Neon PostgreSQL.',
    protected: false,
    rateLimit: '60 req/min per IP (Cache Edge + Pure SQL)',
    costPerReq: 'Gratuito (Endpoint Pubblico)',
    params: [
      { name: 'page', type: 'number', required: false, desc: 'Numero di pagina (default: 1)' },
      { name: 'limit', type: 'number', required: false, desc: 'Elementi per pagina (default: 12, max: 50)' },
      { name: 'q', type: 'string', required: false, desc: 'Filtro ricerca testuale su titolo e sintesi AI' },
      { name: 'minScore', type: 'number', required: false, desc: 'Punteggio minimo Sentinel AI (0 - 90)' },
      { name: 'category', type: 'string', required: false, desc: 'Tipologia notizia: show | ask' }
    ],
    responseExample: `{
  "success": true,
  "meta": { "page": 1, "limit": 12, "total": 248, "totalPages": 21 },
  "data": [
    {
      "id": 1042,
      "slug": "postgres-pure-sql-performance-2026",
      "title": "Zero-ORM Pure SQL Patterns on Serverless Postgres",
      "type": "news",
      "points": 412,
      "techScore": 94,
      "summary_it": "Analisi tecnica sull'abbattimento della latenza cold-start eliminando layer ORM pesanti..."
    }
  ]
}`
  },
  {
    id: 'get-blog-posts',
    method: 'GET',
    path: '/api/blog/posts',
    title: 'DKP Editorial Hub — Articoli & Vault Feed',
    description: 'Estrae la lista completa degli articoli tecnici pubblicati nella community e notarizzati nel Vault DKP, ordinati cronologicamente dal più recente.',
    protected: false,
    rateLimit: '60 req/min per IP',
    costPerReq: 'Gratuito (Endpoint Pubblico)',
    params: [],
    responseExample: `{
  "success": true,
  "engine": "v2.6-PURE-SQL",
  "data": [
    {
      "id": 88,
      "slug": "migrazione-dkp-v26-pure-sql",
      "title": "Architettura DevKernelPulse v2.6-PURE-SQL",
      "categoryName": "System Architecture",
      "isVerified": true,
      "views": 340,
      "likes": 45
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
    const q = searchQuery.value.toLowerCase()
    const matchesSearch = e.title.toLowerCase().includes(q) || e.path.toLowerCase().includes(q)
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
    "io"
)

func main() {
    url := "${baseUrl}${endpoint.path}"
    req, _ := http.NewRequest("${endpoint.method}", url, nil)
    req.Header.Add("Content-Type", "application/json")
    ${endpoint.protected ? 'req.Header.Add("Authorization", "Bearer dkp_live_tua_api_key")' : ''}

    res, _ := http.DefaultClient.Do(req)
    defer res.Body.Close()
    body, _ := io.ReadAll(res.Body)
    fmt.Println(string(body))
}`
  }

  return ''
}

function copyCodeSnippet() {
  if (typeof navigator !== 'undefined' && navigator.clipboard && activeEndpoint.value) {
    navigator.clipboard.writeText(getSnippet(activeEndpoint.value, selectedLang.value))
    copiedSnippet.value = true
    setTimeout(() => { copiedSnippet.value = false }, 2000)
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-200 px-4 sm:px-6 py-10 pb-20 font-sans">
    <div class="max-w-7xl mx-auto flex flex-col gap-8">

      <!-- BARRA 4 PILASTRI ECOSISTEMA DKP v2.6 -->
      <nav aria-label="Navigazione Ecosistema DKP" class="flex flex-wrap gap-2.5 justify-center font-mono bg-[#090d16] border border-slate-800 p-3 rounded-2xl shadow-lg">
        <NuxtLink
          to="/news"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-400 font-extrabold text-xs rounded-xl transition-all"
        >
          🌍 DKP Tech Feed
        </NuxtLink>

        <NuxtLink
          to="/nodes"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-purple-400 text-purple-400 font-extrabold text-xs rounded-xl transition-all"
        >
          💬 DKP Talks Hub
        </NuxtLink>

        <NuxtLink
          to="/tools"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-sky-400 text-sky-400 font-extrabold text-xs rounded-xl transition-all"
        >
          🛠️ Developer Tools
        </NuxtLink>

        <NuxtLink
          to="/blog"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-300 font-extrabold text-xs rounded-xl transition-all"
        >
          ✍️ DKP Editorial Hub
        </NuxtLink>
      </nav>

      <!-- GRID CONSOLE -->
      <div class="grid grid-cols-1 lg:grid-cols-[330px_1fr] gap-8 items-start">
        
        <!-- LEFT SIDEBAR: FILTRI ED ENDPOINTS -->
        <aside class="bg-[#090d16] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 lg:sticky lg:top-20 shadow-xl">
          <div class="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <h3 class="text-white font-extrabold text-base m-0">🔌 DKP API Console</h3>
            <span class="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-black">
              v2.6-PURE-SQL
            </span>
          </div>

          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="🔍 Cerca endpoint o URL..." 
            class="bg-[#020420] border border-slate-800 focus:border-emerald-500 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none transition-colors"
          />

          <div class="flex gap-1 bg-[#020420] p-1 rounded-xl border border-slate-800/80 font-mono">
            <button
              type="button"
              @click="selectedCategory = 'all'"
              :class="['flex-1 text-xs font-bold py-1.5 rounded-lg transition-all cursor-pointer', selectedCategory === 'all' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300']"
            >
              Tutti
            </button>
            <button
              type="button"
              @click="selectedCategory = 'public'"
              :class="['flex-1 text-xs font-bold py-1.5 rounded-lg transition-all cursor-pointer', selectedCategory === 'public' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300']"
            >
              Pubblici
            </button>
            <button
              type="button"
              @click="selectedCategory = 'protected'"
              :class="['flex-1 text-xs font-bold py-1.5 rounded-lg transition-all cursor-pointer', selectedCategory === 'protected' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300']"
            >
              Protetti
            </button>
          </div>

          <div class="flex flex-col gap-1.5">
            <button 
              v-for="e in filteredEndpoints" 
              :key="e.id"
              type="button"
              @click="activeEndpointId = e.id"
              :class="[
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer',
                activeEndpointId === e.id
                  ? 'bg-[#020420] border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                  : 'bg-transparent border-transparent hover:bg-[#020420]/60 hover:border-slate-800'
              ]"
            >
              <span
                :class="[
                  'text-[10px] font-mono font-black px-2 py-0.5 rounded uppercase shrink-0',
                  e.method === 'GET' ? 'bg-sky-500/15 text-sky-400' : 'bg-emerald-500/15 text-emerald-400'
                ]"
              >
                {{ e.method }}
              </span>
              <span :class="['text-xs font-semibold truncate', activeEndpointId === e.id ? 'text-emerald-400' : 'text-slate-300']">
                {{ e.title }}
              </span>
            </button>

            <p v-if="filteredEndpoints.length === 0" class="text-xs text-slate-500 font-mono text-center py-4">
              Nessun endpoint trovato.
            </p>
          </div>
        </aside>

        <!-- MAIN PANEL: SPECS & SNIPPETS -->
        <main class="min-w-0 flex flex-col gap-6">
          
          <!-- HEADER CONSUMO CREDITI & AUTENTICAZIONE -->
          <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 flex justify-between items-start gap-6 flex-wrap shadow-xl">
            <div class="flex-1 min-w-[280px]">
              <div class="flex items-center gap-2 mb-2">
                <h4 class="text-white font-extrabold text-base m-0">⚡ Consumo API &amp; Metering Pure SQL</h4>
                <span class="text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded font-bold">
                  SHA-256 ZERO-TRUST
                </span>
              </div>
              <p class="text-sm text-slate-400 leading-relaxed mb-2">
                Tutte le chiamate protette verso il Gateway DKP (Neural Playground, Talks Hub, Vault e Commercial Suite) <strong class="text-slate-200">consumano 1 credito</strong> scalando direttamente dal contatore <code class="text-sky-400 bg-[#020420] px-1.5 py-0.5 rounded text-xs">usage_count</code> su Neon PostgreSQL.
              </p>
              <p class="text-xs text-slate-500 m-0">
                Invia l'header <code class="text-sky-400 bg-[#020420] px-1.5 py-0.5 rounded">Authorization: Bearer dkp_live_...</code>. La chiave viene verificata tramite hash SHA-256 senza latenza ORM.
              </p>
            </div>

            <div class="text-xs text-slate-400 bg-[#020420] border border-slate-800 p-4 rounded-xl min-w-[240px] font-mono">
              <strong class="text-slate-200 block mb-2">Quote Mensili Disponibili:</strong>
              <ul class="flex flex-col gap-1.5 m-0 p-0 list-none">
                <li><span class="text-slate-200 font-extrabold">FREE:</span> 1.000 req/mese (DKP-Flash)</li>
                <li><span class="text-emerald-400 font-extrabold">PRO:</span> 50.000 req/mese (Coder &amp; Pro)</li>
                <li><span class="text-amber-400 font-extrabold">ENTERPRISE:</span> 1.000.000 req/mese</li>
              </ul>
            </div>
          </div>

          <!-- ENDPOINT DETAILS SECTION -->
          <div v-if="activeEndpoint" class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 min-w-0 overflow-hidden shadow-xl">
            <div class="flex justify-between items-center mb-4 flex-wrap gap-3 pb-4 border-b border-slate-800/80">
              <div class="flex items-center gap-3 flex-wrap">
                <span
                  :class="[
                    'text-xs font-mono font-black px-2.5 py-1 rounded-md uppercase',
                    activeEndpoint.method === 'GET' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  ]"
                >
                  {{ activeEndpoint.method }}
                </span>
                <code class="text-white text-base sm:text-lg font-bold font-mono break-all">{{ activeEndpoint.path }}</code>
              </div>

              <span v-if="activeEndpoint.protected" class="bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-mono font-bold px-3 py-1 rounded-lg">
                🔒 API Key Required
              </span>
              <span v-else class="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold px-3 py-1 rounded-lg">
                🌐 Public Endpoint
              </span>
            </div>

            <h3 class="text-white font-black text-xl sm:text-2xl mb-2">{{ activeEndpoint.title }}</h3>
            <p class="text-slate-400 text-sm sm:text-base mb-6 leading-relaxed">{{ activeEndpoint.description }}</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div class="bg-[#020420] border border-slate-800 p-4 rounded-xl flex flex-col gap-1">
                <span class="text-[11px] font-mono text-slate-500 font-bold uppercase">Allocazione &amp; Rate Limit:</span>
                <span class="text-xs sm:text-sm text-slate-200 font-semibold">{{ activeEndpoint.rateLimit }}</span>
              </div>
              <div class="bg-[#020420] border border-emerald-500/30 p-4 rounded-xl flex flex-col gap-1">
                <span class="text-[11px] font-mono text-slate-500 font-bold uppercase">Costo &amp; Metering:</span>
                <span class="text-xs sm:text-sm text-emerald-400 font-extrabold">⚡ {{ activeEndpoint.costPerReq }}</span>
              </div>
            </div>

            <!-- PARAMETRI QUERY / URL -->
            <div v-if="activeEndpoint.params && activeEndpoint.params.length" class="mb-6">
              <h4 class="text-white font-bold text-sm mb-3">Query Parameters</h4>
              <div class="w-full overflow-x-auto border border-slate-800 rounded-xl">
                <table class="w-full border-collapse min-w-[500px] text-left text-xs sm:text-sm">
                  <thead>
                    <tr class="bg-[#020420] text-slate-300 border-b border-slate-800">
                      <th class="p-3 font-mono">Parametro</th>
                      <th class="p-3 font-mono">Tipo</th>
                      <th class="p-3 font-mono">Obbligatorio</th>
                      <th class="p-3">Descrizione</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="p in activeEndpoint.params" :key="p.name" class="border-b border-slate-800/70 last:border-none">
                      <td class="p-3"><code class="text-sky-400 font-mono font-bold">{{ p.name }}</code></td>
                      <td class="p-3"><span class="text-emerald-400 font-mono">{{ p.type }}</span></td>
                      <td class="p-3 text-slate-400">{{ p.required ? 'Sì' : 'No' }}</td>
                      <td class="p-3 text-slate-300">{{ p.desc }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- CODE SNIPPET GENERATOR -->
            <div class="mt-6 bg-[#020420] border border-slate-800 rounded-xl overflow-hidden">
              <div class="bg-[#0d1322] px-4 py-2.5 flex justify-between items-center border-b border-slate-800 flex-wrap gap-2">
                <h4 class="m-0 text-white text-xs font-mono font-bold">💻 Code Snippet Generato</h4>
                <div class="flex items-center gap-1.5 font-mono">
                  <button
                    v-for="lang in (['curl', 'javascript', 'python', 'go'] as const)"
                    :key="lang"
                    type="button"
                    @click="selectedLang = lang"
                    :class="[
                      'text-xs font-bold px-2.5 py-1 rounded cursor-pointer transition-colors',
                      selectedLang === lang ? 'text-emerald-400 bg-emerald-500/15' : 'text-slate-500 hover:text-slate-300'
                    ]"
                  >
                    {{ lang === 'curl' ? 'cURL' : lang === 'javascript' ? 'JS / TS' : lang === 'python' ? 'Python' : 'Go' }}
                  </button>
                  <button
                    type="button"
                    @click="copyCodeSnippet"
                    class="ml-2 text-xs font-bold px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer transition-colors"
                  >
                    {{ copiedSnippet ? '✅ Copiato!' : '📋 Copia' }}
                  </button>
                </div>
              </div>

              <div class="max-w-full overflow-x-auto bg-[#020420]">
                <pre class="m-0 p-5 text-sky-400 font-mono text-xs leading-relaxed whitespace-pre"><code>{{ getSnippet(activeEndpoint, selectedLang) }}</code></pre>
              </div>
            </div>

            <!-- ESEMPIO RISPOSTA JSON / STREAM -->
            <div class="mt-6">
              <h4 class="text-white text-xs font-mono font-bold uppercase tracking-wider mb-2.5">Esempio Risposta HTTP / Stream Payload</h4>
              <div class="max-w-full overflow-x-auto bg-[#020420] border border-slate-800 rounded-xl">
                <pre class="m-0 p-5 text-emerald-400 font-mono text-xs leading-relaxed whitespace-pre"><code>{{ activeEndpoint.responseExample }}</code></pre>
              </div>
            </div>

          </div>
        </main>
      </div>

      <!-- FOOTER NAVIGATION -->
      <div class="flex flex-wrap justify-between items-center gap-4 pt-6 border-t border-slate-800 font-mono text-xs">
        <NuxtLink to="/tools" class="text-sky-400 hover:text-emerald-400 font-bold transition-colors">
          ← Ritorna ai Developer Tools
        </NuxtLink>
        <NuxtLink to="/docs/cli-automation" class="text-emerald-400 hover:underline font-bold">
          Vai a DKP CLI &amp; Local Automation v2.6 ➔
        </NuxtLink>
      </div>

    </div>
  </div>
</template>