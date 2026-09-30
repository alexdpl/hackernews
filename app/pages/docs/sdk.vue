<!-- app/pages/docs/sdk.vue -->
<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'SDK & CLI Integration Guide v2.4-GOLD — DevKernelPulse',
  meta: [
    { name: 'description', content: 'Guida ufficiale all\'integrazione di @alexdpl/sdk e @alexdpl/cli con protezione Pulse Sentinel AI v2.4-Gold.' }
  ]
})

const activeLang = ref<'node' | 'python' | 'go' | 'cli'>('node')
const activeCliCmd = ref<'auth' | 'scan' | 'vault' | 'status'>('auth')
const copied = ref(false)

function copySnippet(text: string) {
  navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div class="docs-container">
    <!-- HEADER CON BADGE SENTINEL -->
    <header class="docs-header">
      <div class="header-top">
        <span class="badge-gold">v2.4-GOLD Specification</span>
        <span class="sentinel-shield">🛡️ Sentinel AI v2.4 Active</span>
      </div>
      <h1>SDK & CLI Integration Center</h1>
      <p class="subtitle">
        Integrazione unificata per ambienti Node.js, Python, Go e Terminale locale sotto il namespace ufficiale <code>@alexdpl/sdk</code>.
      </p>
    </header>

    <!-- BANNER DI AVVISO SICUREZZA SENTINEL AI -->
    <section class="sentinel-notice-banner">
      <div class="banner-icon">🛡️</div>
      <div class="banner-content">
        <h3>⚡ Protezione Ecosistema: Pulse Sentinel AI v2.4-GOLD</h3>
        <p>
          Ogni chiamata API, comando CLI e richiesta SDK è monitorata in tempo reale dal nostro **Firewall Euristico con analisi SAST/AST**. 
          Tentativi di **Prompt Injection**, **Rate Limit Abuse** o **Payload Maliziosi** comporteranno il **BAN PERMANENTE immodificabile dell'IP** e la revoca immediata delle chiavi API dall'Hub.
        </p>
      </div>
    </section>

    <!-- GUIDA INSTALLAZIONE LINGUAGGI & CLI -->
    <section class="docs-section">
      <h2>1. Selezione Modulo & Installazione</h2>
      <div class="lang-selector">
        <button @click="activeLang = 'node'" :class="{ active: activeLang === 'node' }">🟢 Node.js / TS</button>
        <button @click="activeLang = 'python'" :class="{ active: activeLang === 'python' }">🐍 Python 3</button>
        <button @click="activeLang = 'go'" :class="{ active: activeLang === 'go' }">🔵 Go Modules</button>
        <button @click="activeLang = 'cli'" :class="{ active: activeLang === 'cli' }">⚡ CLI Toolkit</button>
      </div>

      <div class="code-block-wrapper">
        <pre v-if="activeLang === 'node'"><code>npm install @alexdpl/sdk # Oppure pnpm add / yarn add @alexdpl/sdk</code></pre>
        <pre v-if="activeLang === 'python'"><code>pip install alexdpl-sdk</code></pre>
        <pre v-if="activeLang === 'go'"><code>go get github.com/alexdpl/dkp-go-sdk/v2</code></pre>
        <pre v-if="activeLang === 'cli'"><code>npm install -g @alexdpl/cli # Installazione globale CLI Toolkit</code></pre>
      </div>
    </section>

    <!-- SEZIONE DEDICATA AL CLI TOOLKIT -->
    <section class="docs-section">
      <h2>2. Autenticazione & Utilizzo da Riga di Comando (CLI)</h2>
      <p class="desc-text">
        Il pacchetto <code>@alexdpl/cli</code> consente ai developer e agli architetti software di gestire le scansioni e la notarizzazione direttamente all'interno delle pipeline CI/CD o dal proprio terminale.
      </p>

      <div class="cli-command-grid">
        <div class="cli-sidebar">
          <button @click="activeCliCmd = 'auth'" :class="{ active: activeCliCmd === 'auth' }">🔑 dkp auth login</button>
          <button @click="activeCliCmd = 'scan'" :class="{ active: activeCliCmd === 'scan' }">🔍 dkp ai scan</button>
          <button @click="activeCliCmd = 'vault'" :class="{ active: activeCliCmd === 'vault' }">🛡️ dkp vault notarize</button>
          <button @click="activeCliCmd = 'status'" :class="{ active: activeCliCmd === 'status' }">⚡ dkp status</button>
        </div>

        <div class="cli-display">
          <div v-if="activeCliCmd === 'auth'">
            <h4>Autenticazione con API Hub Key</h4>
            <p>Associa il tuo terminale locale al tuo account DKP generando una chiave dall'API Console:</p>
            <pre><code>dkp auth login --key dkp_live_9f8a2b3c4d5e6f7a</code></pre>
          </div>

          <div v-if="activeCliCmd === 'scan'">
            <h4>Scansione Vulnerabilità AI in Locale</h4>
            <p>Invia il codice sorgente all'engine Pulse Sentinel AI per un report SAST/AST immediato:</p>
            <pre><code>dkp ai scan ./server/api/auth.ts --format json</code></pre>
          </div>

          <div v-if="activeCliCmd === 'vault'">
            <h4>Notarizzazione Crittografica nel Vault</h4>
            <p>Genera la marcatura SHA-256 e ottieni il certificato immutabile di notarizzazione:</p>
            <pre><code>dkp vault notarize ./dist/bundle.js --title "Release v2.4-GOLD"</code></pre>
          </div>

          <div v-if="activeCliCmd === 'status'">
            <h4>Verifica Stato Kernel & Latency</h4>
            <p>Controlla lo stato dei servizi GCP Armor, la latenza di rete e la quota rimanente:</p>
            <pre><code>dkp status</code></pre>
          </div>
        </div>
      </div>
    </section>

    <!-- CODICE DI ESEMPIO NODE.JS INTEGRATO -->
    <section class="docs-section">
      <h2>3. Inizializzazione SDK in Applicazioni Backend</h2>
      <div class="code-block-wrapper">
        <pre><code>import { DevKernelPulse } from '@alexdpl/sdk'

// Inizializzazione del client unificato
const dkp = new DevKernelPulse({
  apiKey: process.env.DKP_API_KEY,
  environment: 'production'
})

// Esempio: Audit SAST e Notarizzazione Vault
async function secureDeploy() {
  const audit = await dkp.sentinel.scanCode({ source: 'const key = "secret"' })
  if (audit.riskScore > 50) {
    throw new Error('Deploy bloccato da Pulse Sentinel AI!')
  }

  const cert = await dkp.vault.notarize({ title: 'Deploy Gold', content: '...' })
  console.log('Certificato Vault:', cert.certificateId)
}</code></pre>
      </div>
    </section>
  </div>
</template>

<style scoped>
.docs-container { max-width: 1080px; margin: 0 auto; padding: 2rem 1.5rem 5rem; color: #cbd5e1; font-family: system-ui, -apple-system, sans-serif; }
.docs-header { margin-bottom: 2rem; }
.header-top { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; }
.badge-gold { background: rgba(0, 220, 130, 0.15); color: #00dc82; border: 1px solid #00dc82; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: 4px; }
.sentinel-shield { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid #a855f7; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: 4px; }
.docs-header h1 { font-size: 2.2rem; color: #fff; margin: 0; font-weight: 900; }
.subtitle { color: #94a3b8; font-size: 1.05rem; margin-top: 0.5rem; }

/* BANNER SENTINEL */
.sentinel-notice-banner { background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(3, 7, 18, 0.9) 100%); border: 1px solid #a855f7; border-radius: 12px; padding: 1.25rem 1.5rem; display: flex; gap: 1.25rem; align-items: flex-start; margin-bottom: 2.5rem; box-shadow: 0 4px 20px rgba(168, 85, 247, 0.15); }
.banner-icon { font-size: 2rem; }
.banner-content h3 { margin: 0 0 0.35rem; color: #c084fc; font-size: 1.1rem; font-weight: 800; }
.banner-content p { margin: 0; color: #cbd5e1; font-size: 0.88rem; line-height: 1.5; }

/* SEZIONI E TAB */
.docs-section { margin-bottom: 3rem; }
.docs-section h2 { font-size: 1.35rem; color: #fff; margin-bottom: 1rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.5rem; }
.desc-text { color: #94a3b8; font-size: 0.92rem; line-height: 1.6; margin-bottom: 1rem; }

.lang-selector { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
.lang-selector button { background: #090d16; border: 1px solid #1e293b; color: #94a3b8; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
.lang-selector button.active { color: #00dc82; border-color: #00dc82; background: #020420; }

.code-block-wrapper { background: #020420; border: 1px solid #1e293b; border-radius: 10px; padding: 1.25rem; font-family: monospace; color: #38bdf8; font-size: 0.9rem; overflow-x: auto; }
.code-block-wrapper pre { margin: 0; }

/* CLI DISPLAY GRID */
.cli-command-grid { display: grid; grid-template-columns: 240px 1fr; gap: 1.5rem; background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.25rem; }
@media (max-width: 768px) { .cli-command-grid { grid-template-columns: 1fr; } }
.cli-sidebar { display: flex; flex-direction: column; gap: 0.5rem; }
.cli-sidebar button { background: #020420; border: 1px solid #1e293b; color: #94a3b8; padding: 0.65rem 1rem; border-radius: 8px; text-align: left; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
.cli-sidebar button.active { color: #00dc82; border-color: #00dc82; }

.cli-display { background: #020420; border: 1px solid #1e293b; border-radius: 8px; padding: 1rem 1.25rem; }
.cli-display h4 { color: #fff; margin: 0 0 0.5rem; font-size: 1rem; }
.cli-display p { color: #94a3b8; font-size: 0.85rem; margin-top: 0; margin-bottom: 0.75rem; }
.cli-display pre { background: #050811; border: 1px solid #1e293b; padding: 0.75rem; border-radius: 6px; color: #38bdf8; font-family: monospace; font-size: 0.88rem; margin: 0; }
</style>