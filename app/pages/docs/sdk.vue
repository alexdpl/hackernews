<!-- app/pages/docs/sdk.vue -->
<script setup lang="ts">
import { ref } from 'vue'

useDkpSeo({
  title: 'SDK Ufficiale @devkernelpulse/sdk v2.6-PURE-SQL — Integrazione TS/JS & CLI',
  description: 'Documentazione e guida rapida v2.6-PURE-SQL per integrare il motore AI Trinity, il Vault, l\'Editorial Hub e la moderazione Sentinel tramite SDK e CLI Toolkit.'
})

const activeLang = ref<'node' | 'python' | 'go' | 'cli'>('node')
const activeCliCmd = ref<'auth' | 'scan' | 'vault' | 'blog' | 'db' | 'status'>('auth')
const copiedKey = ref<string | null>(null)

const npmInstall = 'npm install @devkernelpulse/sdk@latest'

const sdkMainExample = `import { DKPClient } from '@devkernelpulse/sdk'

// 1. Inizializzazione del client unificato v2.6-PURE-SQL
const dkp = new DKPClient({
  apiKey: process.env.DKP_API_KEY, // Inizia con dkp_live_
  environment: 'production'
})

// 2. Audit SAST Sentinel + Notarizzazione Vault Pure SQL
async function secureDeploy() {
  const audit = await dkp.sentinel.scanCode({ source: 'const key = "secret"' })
  
  if (audit.riskScore > 50) {
    throw new Error('Deploy bloccato da Pulse Sentinel AI v2.6!')
  }

  const cert = await dkp.vault.notarize({ 
    title: 'Deploy Pure SQL v2.6', 
    content: 'Codice verificato e firmato...',
    language: 'typescript' 
  })
  
  console.log('Certificato Vault SHA-256:', cert.certificateId)
}

// 3. Pubblicazione automatica nel DKP Editorial Hub (+150 XP)
async function publishReleaseNotes() {
  const article = await dkp.blog.publish({
    title: 'Migration Report: Pure SQL Performance',
    content: '## Benchmark\\nLatenza media scesa sotto gli 8ms...',
    category: 'System Architecture',
    notarize: true
  })

  console.log('Articolo live:', article.url)
}

// 4. Streaming AI con DKP Coder (Trinity Engine)
async function generateUI() {
  const stream = await dkp.ai.chat({
    model: 'dkp-coder',
    messages: [{ role: 'user', content: 'Crea un pulsante verde in Tailwind' }]
  })

  for await (const chunk of stream) {
    process.stdout.write(chunk.text)
  }
}`

function copySnippet(key: string, text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text)
    copiedKey.value = key
    setTimeout(() => { copiedKey.value = null }, 2000)
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-200 px-4 sm:px-6 py-10 pb-20 font-sans">
    <div class="max-w-6xl mx-auto flex flex-col gap-10">

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
      
      <!-- HEADER CON BADGE SENTINEL -->
      <header class="bg-[#090d16] border border-slate-800 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-36 bg-emerald-500/10 blur-[110px] rounded-full pointer-events-none"></div>

        <div class="inline-flex items-center gap-3 mb-4 flex-wrap justify-center font-mono relative z-10">
          <span class="bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 text-xs font-extrabold px-3.5 py-1 rounded-full">
            v2.6-PURE-SQL Specification
          </span>
          <span class="bg-purple-500/15 text-purple-300 border border-purple-500/40 text-xs font-extrabold px-3.5 py-1 rounded-full">
            🛡️ Sentinel AI v2.6 Active
          </span>
        </div>

        <h1 class="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight leading-tight relative z-10">
          SDK &amp; CLI <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">Integration Center</span>
        </h1>

        <p class="text-slate-400 text-sm sm:text-base mx-auto mb-7 max-w-2xl leading-relaxed relative z-10">
          Porta la potenza della Trinity AI, il Proof-of-Code Vault, l'Editorial Hub e la moderazione Sentinel direttamente nelle tue applicazioni web, backend e pipeline CI/CD sotto il namespace ufficiale <code class="text-sky-400 bg-[#020420] px-1.5 py-0.5 rounded font-mono text-xs">@devkernelpulse/sdk</code>.
        </p>

        <div class="bg-[#020420] border border-slate-800 px-4 py-3 rounded-xl inline-flex items-center gap-4 shadow-xl relative z-10 max-w-full overflow-x-auto">
          <code class="text-emerald-400 font-mono text-xs sm:text-sm font-bold whitespace-nowrap">{{ npmInstall }}</code>
          <button
            type="button"
            class="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors whitespace-nowrap"
            @click="copySnippet('install', npmInstall)"
          >
            {{ copiedKey === 'install' ? '✅ Copiato' : '📋 Copia' }}
          </button>
        </div>
      </header>

      <!-- CARATTERISTICHE (Integrazione SDK) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-[#090d16] border border-slate-800 p-6 rounded-2xl shadow-lg">
          <span class="text-3xl mb-3 block">🔒</span>
          <h3 class="text-white text-lg font-extrabold mb-2">Zero-Trust Pure SQL</h3>
          <p class="text-slate-400 text-xs sm:text-sm leading-relaxed m-0">
            Le chiavi API (<code class="text-sky-400 font-mono">dkp_live_...</code>) non vengono mai esposte; validazione hash SHA-256 diretta su Neon PostgreSQL senza latenza ORM.
          </p>
        </div>

        <div class="bg-[#090d16] border border-slate-800 p-6 rounded-2xl shadow-lg">
          <span class="text-3xl mb-3 block">⚡</span>
          <h3 class="text-white text-lg font-extrabold mb-2">Edge &amp; Serverless Ready</h3>
          <p class="text-slate-400 text-xs sm:text-sm leading-relaxed m-0">
            Zero dipendenze native pesanti: compatibile con Vercel Edge, Cloudflare Workers, Nuxt Nitro e qualsiasi runtime moderno TS/JS.
          </p>
        </div>

        <div class="bg-[#090d16] border border-slate-800 p-6 rounded-2xl shadow-lg">
          <span class="text-3xl mb-3 block">🤖</span>
          <h3 class="text-white text-lg font-extrabold mb-2">AI Streaming &amp; Vault Nativo</h3>
          <p class="text-slate-400 text-xs sm:text-sm leading-relaxed m-0">
            Accesso diretto ai modelli Trinity (Flash, Coder, Pro), notarizzazione SHA-256 nel Vault e pubblicazione editoriale in 3 righe di codice.
          </p>
        </div>
      </div>

      <!-- BANNER DI AVVISO SICUREZZA SENTINEL AI -->
      <section class="bg-gradient-to-br from-purple-500/10 to-[#090d16] border border-purple-500/60 rounded-2xl p-6 flex flex-col sm:flex-row gap-4 items-start shadow-[0_4px_25px_rgba(168,85,247,0.12)]">
        <div class="text-3xl shrink-0">🛡️</div>
        <div>
          <h3 class="text-purple-300 text-base sm:text-lg font-extrabold mb-1.5">
            ⚡ Protezione Ecosistema: Pulse Sentinel AI v2.6-PURE-SQL
          </h3>
          <p class="text-slate-300 text-xs sm:text-sm leading-relaxed m-0">
            Ogni chiamata API, comando CLI e richiesta SDK è monitorata in tempo reale dal nostro <strong class="text-white">Firewall Euristico con analisi SAST/AST</strong> e query Pure SQL parametrizzate. Tentativi di <strong class="text-white">Prompt Injection</strong>, <strong class="text-white">Rate Limit Abuse</strong> o <strong class="text-white">Payload Maliziosi</strong> comportano il <strong class="text-rose-400">BAN PERMANENTE dell'IP</strong> e la revoca immediata delle chiavi API dall'Hub.
          </p>
        </div>
      </section>

      <!-- GUIDA INSTALLAZIONE LINGUAGGI & CLI -->
      <section class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <h2 class="text-xl sm:text-2xl font-extrabold text-white mb-5 pb-3 border-b border-slate-800">
          1. Selezione Modulo &amp; Installazione
        </h2>
        <div class="flex gap-2 mb-4 flex-wrap font-mono">
          <button
            type="button"
            @click="activeLang = 'node'"
            :class="['px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all', activeLang === 'node' ? 'text-emerald-400 border-emerald-500 bg-emerald-500/10' : 'bg-[#020420] border-slate-800 text-slate-400 hover:border-sky-400 hover:text-sky-400']"
          >
            🟢 Node.js / TS
          </button>
          <button
            type="button"
            @click="activeLang = 'python'"
            :class="['px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all', activeLang === 'python' ? 'text-emerald-400 border-emerald-500 bg-emerald-500/10' : 'bg-[#020420] border-slate-800 text-slate-400 hover:border-sky-400 hover:text-sky-400']"
          >
            🐍 Python 3
          </button>
          <button
            type="button"
            @click="activeLang = 'go'"
            :class="['px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all', activeLang === 'go' ? 'text-emerald-400 border-emerald-500 bg-emerald-500/10' : 'bg-[#020420] border-slate-800 text-slate-400 hover:border-sky-400 hover:text-sky-400']"
          >
            🔵 Go Modules
          </button>
          <button
            type="button"
            @click="activeLang = 'cli'"
            :class="['px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all', activeLang === 'cli' ? 'text-emerald-400 border-emerald-500 bg-emerald-500/10' : 'bg-[#020420] border-slate-800 text-slate-400 hover:border-sky-400 hover:text-sky-400']"
          >
            ⚡ CLI Toolkit
          </button>
        </div>

        <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 font-mono text-sky-400 text-xs sm:text-sm overflow-x-auto">
          <pre v-if="activeLang === 'node'" class="m-0"><code>npm install @devkernelpulse/sdk@latest  # Oppure pnpm add / yarn add @devkernelpulse/sdk</code></pre>
          <pre v-if="activeLang === 'python'" class="m-0"><code>pip install devkernelpulse-sdk</code></pre>
          <pre v-if="activeLang === 'go'" class="m-0"><code>go get github.com/devkernelpulse/dkp-go-sdk/v2</code></pre>
          <pre v-if="activeLang === 'cli'" class="m-0"><code>npm install -g @devkernelpulse/cli@latest  # Installazione globale CLI Toolkit v2.6</code></pre>
        </div>
      </section>

      <!-- CODICE DI ESEMPIO NODE.JS INTEGRATO -->
      <section class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div class="flex justify-between items-center mb-5 pb-3 border-b border-slate-800 flex-wrap gap-2">
          <h2 class="text-xl sm:text-2xl font-extrabold text-white m-0">
            2. Inizializzazione SDK in Applicazioni Backend
          </h2>
          <button
            type="button"
            @click="copySnippet('sdk-example', sdkMainExample)"
            class="px-3 py-1.5 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-xs font-mono font-bold text-slate-300 hover:text-emerald-400 rounded-lg cursor-pointer transition-colors"
          >
            {{ copiedKey === 'sdk-example' ? '✅ Codice Copiato!' : '📋 Copia Esempio' }}
          </button>
        </div>

        <div class="bg-[#020420] border border-slate-800 rounded-xl p-5 font-mono text-sky-400 text-xs sm:text-sm overflow-x-auto">
          <pre class="m-0 leading-relaxed"><code>{{ sdkMainExample }}</code></pre>
        </div>
      </section>

      <!-- SEZIONE DEDICATA AL CLI TOOLKIT -->
      <section class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <h2 class="text-xl sm:text-2xl font-extrabold text-white mb-3 pb-3 border-b border-slate-800">
          3. Direttive &amp; Utilizzo da Riga di Comando (CLI v2.6)
        </h2>
        <p class="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
          Il pacchetto <code class="text-sky-400 bg-[#020420] px-1.5 py-0.5 rounded font-mono">@devkernelpulse/cli</code> consente a developer e architetti di eseguire audit SAST, pubblicare articoli nell'Editorial Hub, verificare il DB Pure SQL e notarizzare release direttamente dal terminale.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-5 bg-[#020420]/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div class="flex flex-col gap-2 font-mono">
            <button
              type="button"
              @click="activeCliCmd = 'auth'"
              :class="['px-3.5 py-2.5 rounded-xl border text-left font-bold text-xs cursor-pointer transition-all', activeCliCmd === 'auth' ? 'text-emerald-400 border-emerald-500 bg-emerald-500/10' : 'bg-[#020420] border-slate-800 text-slate-400 hover:border-sky-400 hover:text-sky-400']"
            >
              🔑 dkp auth login
            </button>
            <button
              type="button"
              @click="activeCliCmd = 'db'"
              :class="['px-3.5 py-2.5 rounded-xl border text-left font-bold text-xs cursor-pointer transition-all', activeCliCmd === 'db' ? 'text-emerald-400 border-emerald-500 bg-emerald-500/10' : 'bg-[#020420] border-slate-800 text-slate-400 hover:border-sky-400 hover:text-sky-400']"
            >
              🗄️ dkp db:health
            </button>
            <button
              type="button"
              @click="activeCliCmd = 'blog'"
              :class="['px-3.5 py-2.5 rounded-xl border text-left font-bold text-xs cursor-pointer transition-all', activeCliCmd === 'blog' ? 'text-emerald-400 border-emerald-500 bg-emerald-500/10' : 'bg-[#020420] border-slate-800 text-slate-400 hover:border-sky-400 hover:text-sky-400']"
            >
              ✍️ dkp blog:publish
            </button>
            <button
              type="button"
              @click="activeCliCmd = 'scan'"
              :class="['px-3.5 py-2.5 rounded-xl border text-left font-bold text-xs cursor-pointer transition-all', activeCliCmd === 'scan' ? 'text-emerald-400 border-emerald-500 bg-emerald-500/10' : 'bg-[#020420] border-slate-800 text-slate-400 hover:border-sky-400 hover:text-sky-400']"
            >
              🔍 dkp ai scan
            </button>
            <button
              type="button"
              @click="activeCliCmd = 'vault'"
              :class="['px-3.5 py-2.5 rounded-xl border text-left font-bold text-xs cursor-pointer transition-all', activeCliCmd === 'vault' ? 'text-emerald-400 border-emerald-500 bg-emerald-500/10' : 'bg-[#020420] border-slate-800 text-slate-400 hover:border-sky-400 hover:text-sky-400']"
            >
              🛡️ dkp vault notarize
            </button>
            <button
              type="button"
              @click="activeCliCmd = 'status'"
              :class="['px-3.5 py-2.5 rounded-xl border text-left font-bold text-xs cursor-pointer transition-all', activeCliCmd === 'status' ? 'text-emerald-400 border-emerald-500 bg-emerald-500/10' : 'bg-[#020420] border-slate-800 text-slate-400 hover:border-sky-400 hover:text-sky-400']"
            >
              ⚡ dkp status
            </button>
          </div>

          <div class="bg-[#020420] border border-slate-800 rounded-xl p-5 flex flex-col justify-center">
            <div v-if="activeCliCmd === 'auth'">
              <h4 class="text-white font-bold text-base mb-1.5">Autenticazione con API Hub Key</h4>
              <p class="text-slate-400 text-xs sm:text-sm mb-4 leading-relaxed">Associa il tuo terminale locale al tuo account DKP generando una chiave dall'API Console:</p>
              <pre class="bg-[#050811] border border-slate-800 p-4 rounded-xl text-emerald-400 font-mono text-xs sm:text-sm m-0 overflow-x-auto"><code>dkp auth login --key dkp_live_9f8a2b3c4d5e6f7a</code></pre>
            </div>

            <div v-if="activeCliCmd === 'db'">
              <h4 class="text-white font-bold text-base mb-1.5">Telemetria &amp; Health Check Neon Pure SQL</h4>
              <p class="text-slate-400 text-xs sm:text-sm mb-4 leading-relaxed">Misura la latenza delle query SQL native senza ORM e verifica gli indici attivi su blog, news e nodi:</p>
              <pre class="bg-[#050811] border border-slate-800 p-4 rounded-xl text-emerald-400 font-mono text-xs sm:text-sm m-0 overflow-x-auto"><code>dkp db:health --pure-sql --verify-indexes</code></pre>
            </div>

            <div v-if="activeCliCmd === 'blog'">
              <h4 class="text-white font-bold text-base mb-1.5">Pubblicazione Diretta nell'Editorial Hub (+150 XP)</h4>
              <p class="text-slate-400 text-xs sm:text-sm mb-4 leading-relaxed">Carica un file Markdown locale direttamente sul blog DKP con generazione slug SEO e firma SHA-256 nel Vault:</p>
              <pre class="bg-[#050811] border border-slate-800 p-4 rounded-xl text-emerald-400 font-mono text-xs sm:text-sm m-0 overflow-x-auto"><code>dkp blog:publish ./guida-pure-sql.md --category="System Architecture" --notarize</code></pre>
            </div>

            <div v-if="activeCliCmd === 'scan'">
              <h4 class="text-white font-bold text-base mb-1.5">Scansione Vulnerabilità AI in Locale</h4>
              <p class="text-slate-400 text-xs sm:text-sm mb-4 leading-relaxed">Invia il codice sorgente all'engine Pulse Sentinel AI v2.6 per un report SAST/AST immediato:</p>
              <pre class="bg-[#050811] border border-slate-800 p-4 rounded-xl text-emerald-400 font-mono text-xs sm:text-sm m-0 overflow-x-auto"><code>dkp ai scan ./server/api/auth.ts --format json</code></pre>
            </div>

            <div v-if="activeCliCmd === 'vault'">
              <h4 class="text-white font-bold text-base mb-1.5">Notarizzazione Crittografica nel Vault</h4>
              <p class="text-slate-400 text-xs sm:text-sm mb-4 leading-relaxed">Genera la marcatura SHA-256 e ottieni il certificato immutabile di notarizzazione (+100 XP):</p>
              <pre class="bg-[#050811] border border-slate-800 p-4 rounded-xl text-emerald-400 font-mono text-xs sm:text-sm m-0 overflow-x-auto"><code>dkp vault notarize ./dist/bundle.js --title "Release v2.6-PURE-SQL"</code></pre>
            </div>

            <div v-if="activeCliCmd === 'status'">
              <h4 class="text-white font-bold text-base mb-1.5">Verifica Stato Kernel &amp; Latency</h4>
              <p class="text-slate-400 text-xs sm:text-sm mb-4 leading-relaxed">Controlla lo stato dei servizi GCP Armor, la latenza verso OpenRouter / Neon DB e la quota rimanente:</p>
              <pre class="bg-[#050811] border border-slate-800 p-4 rounded-xl text-emerald-400 font-mono text-xs sm:text-sm m-0 overflow-x-auto"><code>dkp status</code></pre>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA FOOTER -->
      <div class="text-center bg-gradient-to-b from-[#090d16] to-[#020420] border border-slate-800 p-8 sm:p-12 rounded-3xl shadow-xl">
        <h3 class="text-white text-2xl sm:text-3xl font-black mb-3">Pronto per scalare le tue architetture?</h3>
        <p class="text-slate-400 mb-7 text-sm sm:text-base max-w-xl mx-auto">
          Ottieni la tua API Key dalla Dashboard, sblocca la Trinity AI e integra il motore Pure SQL nel tuo stack.
        </p>
        <div class="flex flex-wrap justify-center gap-3 font-mono text-xs">
          <NuxtLink to="/user/dashboard?tab=api" class="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            🧬 Genera una API Key DKP
          </NuxtLink>
          <NuxtLink to="/docs/api" class="px-6 py-3 bg-[#020420] border border-slate-700 hover:border-sky-400 text-sky-400 font-extrabold rounded-xl transition-all">
            🔌 API Reference v2.6
          </NuxtLink>
          <NuxtLink to="/docs/cli-automation" class="px-6 py-3 bg-[#020420] border border-slate-700 hover:border-purple-400 text-purple-400 font-extrabold rounded-xl transition-all">
            ⚙️ Guida CLI Completa
          </NuxtLink>
        </div>
      </div>

    </div>
  </div>
</template>