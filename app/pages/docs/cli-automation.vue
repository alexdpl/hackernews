<!-- app/pages/docs/cli-automation.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const { getMainUrl, getMailUrl, getApiUrl } = useDomain()

useDkpSeo({
  title: 'DKP CLI & Local Automation Guide v2.6-PURE-SQL — DevKernelPulse',
  description: 'Documentazione ufficiale DKP CLI Toolkit v2.6-PURE-SQL. Scopri come automatizzare test E2E, verificare il database Neon Pure SQL, pubblicare articoli Markdown e gestire API Key dal terminale.'
})

const copiedKey = ref<string | null>(null)
function copyCmd(key: string, text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text)
    copiedKey.value = key
    setTimeout(() => { copiedKey.value = null }, 2000)
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 sm:px-6 py-10 pb-20 font-sans">
    <div class="max-w-5xl mx-auto flex flex-col gap-8">

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

      <!-- HERO HEADER -->
      <header class="bg-[#090d16] border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-36 bg-emerald-500/10 blur-[110px] rounded-full pointer-events-none"></div>

        <div class="mb-4 relative z-10">
          <span class="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/50 px-4 py-1.5 rounded-full text-xs font-mono font-extrabold tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            ⚙️ DKP DEVELOPER DOCUMENTATION v2.6-PURE-SQL
          </span>
        </div>

        <h1 class="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight relative z-10">
          DKP CLI &amp; <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">Local Automation</span>
        </h1>

        <p class="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed relative z-10">
          La guida definitiva per sviluppatori, architetti e DevOps. Sincronizza il tuo ecosistema locale, verifica la telemetria Pure SQL, pubblica sul Vault e automatizza la sicurezza dalla riga di comando.
        </p>
      </header>

      <!-- CONTENT SECTIONS -->
      <div class="flex flex-col gap-6">
        
        <!-- SEZIONE 1: INTRODUZIONE E REQUISITI -->
        <section class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <h2 class="text-xl sm:text-2xl font-extrabold text-white mb-4 pb-3 border-b border-slate-800">
            🛠️ 1. Prerequisiti &amp; Installazione Globale
          </h2>
          <p class="text-slate-400 text-sm sm:text-base leading-relaxed mb-4">
            Il <strong class="text-white">DKP CLI Toolkit v2.6-PURE-SQL</strong> è progettato per Node.js (richiesta versione <strong class="text-emerald-400">20.x+</strong> o <strong class="text-emerald-400">22.x LTS</strong>). Ti permette di governare l'intero ecosistema Pulse Nexus senza aprire il browser.
          </p>
          <p class="text-slate-400 text-sm sm:text-base leading-relaxed mb-4">
            Installa il pacchetto globalmente tramite NPM, PNPM o Yarn per abilitare il comando <code class="text-sky-400 bg-[#020420] px-1.5 py-0.5 rounded font-mono text-xs">dkp</code> nel tuo terminale:
          </p>

          <div class="bg-[#020420] border border-slate-800 rounded-xl overflow-hidden mb-4">
            <div class="bg-[#0d1322] px-4 py-2 border-b border-slate-800 flex justify-between items-center font-mono text-xs">
              <span class="text-slate-400">bash / zsh</span>
              <button
                type="button"
                @click="copyCmd('install', 'npm install -g @devkernelpulse/cli@latest')"
                class="text-slate-300 hover:text-emerald-400 cursor-pointer"
              >
                {{ copiedKey === 'install' ? '✅ Copiato!' : '📋 Copia' }}
              </button>
            </div>
            <pre class="p-4 m-0 overflow-x-auto"><code class="font-mono text-sky-400 text-xs sm:text-sm leading-relaxed"># Usa NPM (Consigliato)
npm install -g @devkernelpulse/cli@latest

# Oppure con PNPM
pnpm add -g @devkernelpulse/cli@latest</code></pre>
          </div>

          <p class="text-xs sm:text-sm text-slate-400 italic m-0">
            ✅ <strong class="text-slate-200 not-italic">Verifica:</strong> Esegui <code class="text-emerald-400 bg-[#020420] px-1.5 py-0.5 rounded font-mono not-italic">dkp --version</code> per verificare che il runtime <code class="text-emerald-400 font-mono not-italic">v2.6.0-pure-sql</code> sia attivo.
          </p>
        </section>

        <!-- SEZIONE 2: AUTENTICAZIONE ED ENDPOINT -->
        <section class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <h2 class="text-xl sm:text-2xl font-extrabold text-white mb-4 pb-3 border-b border-slate-800">
            🌐 2. Autenticazione &amp; Environment Sync
          </h2>
          <p class="text-slate-400 text-sm sm:text-base leading-relaxed mb-4">
            Prima di interagire con i microservizi, lanciare scansioni AI o interrogare il database Neon, autentica la CLI con il tuo account DKP.
          </p>
          
          <h4 class="text-base font-bold text-slate-200 mb-2">Login Interattivo OAuth2 / Token</h4>
          <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 mb-4 flex justify-between items-center gap-3 overflow-x-auto">
            <code class="font-mono text-sky-400 text-xs sm:text-sm">dkp auth login</code>
            <button
              type="button"
              @click="copyCmd('login', 'dkp auth login')"
              class="text-xs font-mono text-slate-400 hover:text-emerald-400 shrink-0 cursor-pointer"
            >
              {{ copiedKey === 'login' ? '✅ Copiato!' : '📋 Copia' }}
            </button>
          </div>
          <p class="text-slate-400 text-sm leading-relaxed mb-6">
            Il comando apre il tuo <strong class="text-white">Main Portal</strong> (<code class="text-emerald-400 bg-[#020420] px-1.5 py-0.5 rounded font-mono text-xs">{{ getMainUrl() }}</code>) e salva il token crittografato nel keychain locale (<code class="text-slate-300 font-mono text-xs">~/.dkp/credentials.json</code>).
          </p>
          
          <h4 class="text-base font-bold text-slate-200 mb-3">Endpoint di Riferimento del tuo Workspace</h4>
          <ul class="flex flex-col gap-2.5 m-0 p-0 list-none">
            <li class="text-xs sm:text-sm text-slate-300 bg-[#020420] p-3.5 rounded-xl border border-slate-800 flex justify-between items-center flex-wrap gap-2">
              <strong>API Gateway (Pure SQL &amp; Modelli AI):</strong>
              <code class="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded">{{ getApiUrl() }}</code>
            </li>
            <li class="text-xs sm:text-sm text-slate-300 bg-[#020420] p-3.5 rounded-xl border border-slate-800 flex justify-between items-center flex-wrap gap-2">
              <strong>Sistema Notifiche &amp; Alerting Mail Server:</strong>
              <code class="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded">{{ getMailUrl() }}</code>
            </li>
          </ul>
        </section>

        <!-- SEZIONE 3: COMANDI PRINCIPALI (FOCUS V2.6-PURE-SQL) -->
        <section class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <h2 class="text-xl sm:text-2xl font-extrabold text-white mb-4 pb-3 border-b border-slate-800">
            ⚡ 3. Direttive Core &amp; Comandi v2.6-PURE-SQL
          </h2>
          <p class="text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
            Tutte le direttive operative per gestire scansioni, database Pure SQL, pubblicazione editoriale e chiavi crittografiche.
          </p>
          
          <div class="flex flex-col gap-4">
            <!-- Direttiva Pure SQL Health -->
            <div class="bg-[#020420]/80 p-5 rounded-xl border border-slate-800 border-l-4 border-l-emerald-400">
              <div class="flex justify-between items-center mb-2 flex-wrap gap-2">
                <strong class="text-emerald-400 font-mono text-sm sm:text-base">dkp db:health --pure-sql</strong>
                <span class="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                  NEW v2.6 · PURE SQL
                </span>
              </div>
              <p class="text-xs sm:text-sm text-slate-400 mb-3 leading-relaxed">
                Verifica lo stato del pool serverless su <strong class="text-slate-200">Neon PostgreSQL</strong>, misura la latenza delle query native senza ORM e controlla l'integrità degli indici di blog, news e nodi.
              </p>
              <code class="block font-mono text-xs text-sky-400 bg-black/70 p-3 rounded-lg border border-slate-800/80">dkp db:health --pure-sql --verify-indexes</code>
            </div>

            <!-- Direttiva Editorial Hub Publish -->
            <div class="bg-[#020420]/80 p-5 rounded-xl border border-slate-800 border-l-4 border-l-emerald-400">
              <div class="flex justify-between items-center mb-2 flex-wrap gap-2">
                <strong class="text-emerald-400 font-mono text-sm sm:text-base">dkp blog:publish [file.md]</strong>
                <span class="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                  NEW v2.6 · EDITORIAL HUB
                </span>
              </div>
              <p class="text-xs sm:text-sm text-slate-400 mb-3 leading-relaxed">
                Pubblica un file Markdown locale direttamente nel <strong class="text-slate-200">DKP Editorial Hub</strong>, generando automaticamente lo slug SEO, la notarizzazione SHA-256 nel Vault e assegnando <strong class="text-emerald-400">+150 XP</strong>.
              </p>
              <code class="block font-mono text-xs text-sky-400 bg-black/70 p-3 rounded-lg border border-slate-800/80">dkp blog:publish ./guida-pure-sql.md --category="System Architecture" --notarize</code>
            </div>

            <!-- Scanner AI -->
            <div class="bg-[#020420]/80 p-5 rounded-xl border border-slate-800 border-l-4 border-l-purple-400">
              <div class="flex justify-between items-center mb-2 flex-wrap gap-2">
                <strong class="text-emerald-400 font-mono text-sm sm:text-base">dkp scan [repo-url]</strong>
                <span class="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase">
                  AI POWERED
                </span>
              </div>
              <p class="text-xs sm:text-sm text-slate-400 mb-3 leading-relaxed">
                Invia un repository remoto o una directory locale all'<strong class="text-slate-200">AI Repository Scanner</strong>. Restituisce in stdout lo score <strong class="text-slate-200">S-Tier</strong>, analisi dello stack e suggerimenti di refactoring.
              </p>
              <code class="block font-mono text-xs text-sky-400 bg-black/70 p-3 rounded-lg border border-slate-800/80">dkp scan ./mio-progetto --format=json</code>
            </div>

            <!-- API Key Management -->
            <div class="bg-[#020420]/80 p-5 rounded-xl border border-slate-800 border-l-4 border-l-rose-400">
              <div class="flex justify-between items-center mb-2 flex-wrap gap-2">
                <strong class="text-emerald-400 font-mono text-sm sm:text-base">dkp keys:create [nome]</strong>
                <span class="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase">
                  SECURITY
                </span>
              </div>
              <p class="text-xs sm:text-sm text-slate-400 mb-3 leading-relaxed">
                Genera dinamicamente una nuova <strong class="text-slate-200">API Key Nitro Enterprise</strong> con hashing SHA-256 immediato per i tuoi script o pipeline CI/CD.
              </p>
              <code class="block font-mono text-xs text-sky-400 bg-black/70 p-3 rounded-lg border border-slate-800/80">dkp keys:create "GitHub Actions Prod" --ttl=30d</code>
            </div>

            <!-- Code Vault -->
            <div class="bg-[#020420]/80 p-5 rounded-xl border border-slate-800 border-l-4 border-l-sky-400">
              <div class="flex justify-between items-center mb-2 flex-wrap gap-2">
                <strong class="text-emerald-400 font-mono text-sm sm:text-base">dkp vault:push [file]</strong>
                <span class="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 uppercase">
                  VAULT NOTARIZATION
                </span>
              </div>
              <p class="text-xs sm:text-sm text-slate-400 mb-3 leading-relaxed">
                Invia uno snippet di codice o un documento tecnico al <strong class="text-slate-200">Code Vault</strong> per la notarizzazione crittografica SHA-256 immutabile.
              </p>
              <code class="block font-mono text-xs text-sky-400 bg-black/70 p-3 rounded-lg border border-slate-800/80">dkp vault:push architecture-docs.md</code>
            </div>
          </div>
        </section>

        <!-- SEZIONE 4: AUTOMAZIONE CI/CD, CRAWLER & FIREWALL LIVE -->
        <section class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <h2 class="text-xl sm:text-2xl font-extrabold text-white mb-4 pb-3 border-b border-slate-800">
            🔒 4. Continuous Integration, Stream Sync &amp; Firewall SSE
          </h2>
          
          <h4 class="text-base font-bold text-slate-200 mb-2">Automazione dei Test E2E</h4>
          <p class="text-slate-400 text-sm leading-relaxed mb-3">
            Integra DKP CLI all'interno dei workflow GitHub Actions o GitLab CI per bloccare i deployment se i test E2E Playwright falliscono.
          </p>
          <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 mb-6 overflow-x-auto">
            <code class="font-mono text-sky-400 text-xs sm:text-sm">dkp ci run-tests --framework=playwright --fail-fast</code>
          </div>

          <h4 class="text-base font-bold text-slate-200 mb-2">Sincronizzazione Manuale DKP Tech Feed (Trinity AI)</h4>
          <p class="text-slate-400 text-sm leading-relaxed mb-3">
            Forza l'ingestione e la traduzione AI delle ultime top stories da Hacker News nel database Pure SQL senza attendere il cron automatico:
          </p>
          <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 mb-6 overflow-x-auto">
            <code class="font-mono text-sky-400 text-xs sm:text-sm">dkp news:sync --limit=20 --min-score=70</code>
          </div>
          
          <h4 class="text-base font-bold text-slate-200 mb-2">Monitoraggio Firewall SSE</h4>
          <p class="text-slate-400 text-sm leading-relaxed mb-3">
            Aggancia il tuo terminale al flusso eventi in diretta del <strong class="text-white">DKP Cyber Firewall</strong> leggendo lo streaming Server-Sent Events in tempo reale:
          </p>
          <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 mb-3 overflow-x-auto">
            <code class="font-mono text-sky-400 text-xs sm:text-sm">dkp firewall:monitor --level=critical,warning</code>
          </div>
          <p class="text-xs text-slate-500 italic m-0">
            ⚠️ Usa <code class="text-slate-300 font-mono not-italic">Ctrl+C</code> per sganciare la CLI dallo stream live.
          </p>
        </section>
        
        <!-- SEZIONE 5: SUPPORTO -->
        <section class="bg-slate-900/40 border border-slate-700/80 rounded-2xl p-6">
          <h3 class="text-base font-extrabold text-slate-200 mb-2">🆘 Troubleshooting &amp; Diagnostica</h3>
          <p class="text-xs sm:text-sm text-slate-400 leading-relaxed mb-2">
            Se incontri errori <code class="text-rose-400 font-mono">401 Unauthorized</code> o timeout di rete, verifica che il demone locale sia attivo (<code class="text-emerald-400 font-mono">dkp daemon status</code>) e rinnova la sessione con <code class="text-emerald-400 font-mono">dkp auth refresh</code>.
          </p>
          <p class="text-xs sm:text-sm text-slate-400 m-0">
            Per l'elenco completo di comandi e flag disponibili: <code class="text-sky-400 font-mono">dkp --help</code>.
          </p>
        </section>

      </div>

      <!-- FOOTER LINK -->
      <div class="flex flex-wrap justify-between items-center gap-4 pt-6 border-t border-slate-800 font-mono text-xs">
        <NuxtLink to="/tools" class="text-sky-400 hover:text-emerald-400 font-bold transition-colors">
          ← Ritorna ai Developer Tools
        </NuxtLink>
        <NuxtLink to="/docs/api" class="text-emerald-400 hover:underline font-bold">
          Esplora API Reference v2.6-PURE-SQL ➔
        </NuxtLink>
      </div>

    </div>
  </div>
</template>