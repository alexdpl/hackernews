<!-- app/pages/docs/sdk.vue -->
<script setup lang="ts">
import { ref } from 'vue'

useDkpSeo({
  title: 'SDK Ufficiale @devkernelpulse/sdk — Integrazione TS/JS & CLI',
  description: 'Documentazione e guida rapida per integrare il motore AI Trinity, il Vault e la moderazione Sentinel nelle tue applicazioni tramite SDK e CLI Toolkit.'
})

const activeLang = ref<'node' | 'python' | 'go' | 'cli'>('node')
const activeCliCmd = ref<'auth' | 'scan' | 'vault' | 'status'>('auth')
const copied = ref(false)

const npmInstall = 'npm install @devkernelpulse/sdk'

function copySnippet(text: string) {
  navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div class="sdk-page">
    <div class="docs-container">
      
      <!-- HEADER CON BADGE SENTINEL -->
      <header class="docs-header">
        <div class="header-top">
          <span class="badge-gold">v2.5-GOLD Specification</span>
          <span class="sentinel-shield">🛡️ Sentinel AI v2.5 Active</span>
        </div>
        <h1>SDK & CLI Integration Center</h1>
        <p class="subtitle">
          Porta la potenza della Trinity AI, il Proof-of-Code Vault e la moderazione Sentinel direttamente nelle tue applicazioni web, backend e CLI sotto il namespace ufficiale <code>@devkernelpulse/sdk</code>.
        </p>

        <div class="install-box">
          <code>{{ npmInstall }}</code>
          <button class="copy-btn" @click="copySnippet(npmInstall)">
            {{ copied ? '✅ Copiato' : '📋 Copia' }}
          </button>
        </div>
      </header>

      <!-- CARATTERISTICHE (Integrazione SDK) -->
      <div class="features-grid">
        <div class="feature-card">
          <span class="feat-icon">🔒</span>
          <h3>Zero-Trust Security</h3>
          <p>Le chiavi API (es. <code>dkp_live_...</code>) non vengono mai esposte, validazione con Hash SHA-256 integrata nel client.</p>
        </div>
        <div class="feature-card">
          <span class="feat-icon">⚡</span>
          <h3>Edge Ready</h3>
          <p>Compatibile con Vercel Edge, Cloudflare Workers, Nuxt Nitro e qualsiasi runtime moderno TS/JS.</p>
        </div>
        <div class="feature-card">
          <span class="feat-icon">🤖</span>
          <h3>AI Streaming Nativo</h3>
          <p>Accesso diretto ai modelli Trinity (Flash, Coder, Pro) con gestione automatica dei chunk di testo.</p>
        </div>
      </div>

      <!-- BANNER DI AVVISO SICUREZZA SENTINEL AI -->
      <section class="sentinel-notice-banner mt-12">
        <div class="banner-icon">🛡️</div>
        <div class="banner-content">
          <h3>⚡ Protezione Ecosistema: Pulse Sentinel AI v2.5-GOLD</h3>
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
          <pre v-if="activeLang === 'node'"><code>npm install @devkernelpulse/sdk # Oppure pnpm add / yarn add @devkernelpulse/sdk</code></pre>
          <pre v-if="activeLang === 'python'"><code>pip install devkernelpulse-sdk</code></pre>
          <pre v-if="activeLang === 'go'"><code>go get github.com/devkernelpulse/dkp-go-sdk/v2</code></pre>
          <pre v-if="activeLang === 'cli'"><code>npm install -g @devkernelpulse/cli # Installazione globale CLI Toolkit</code></pre>
        </div>
      </section>

      <!-- CODICE DI ESEMPIO NODE.JS INTEGRATO -->
      <section class="docs-section">
        <h2>2. Inizializzazione SDK in Applicazioni Backend</h2>
        <div class="code-block-wrapper multiline">
          <pre><code>import { DKPClient } from '@devkernelpulse/sdk'

// 1. Inizializzazione del client unificato
const dkp = new DKPClient({
  apiKey: process.env.DKP_API_KEY, // Inizia con dkp_live_
  environment: 'production'
})

// 2. Esempio: Audit SAST e Notarizzazione Vault
async function secureDeploy() {
  const audit = await dkp.sentinel.scanCode({ source: 'const key = "secret"' })
  
  if (audit.riskScore > 50) {
    throw new Error('Deploy bloccato da Pulse Sentinel AI!')
  }

  const cert = await dkp.vault.notarize({ 
    title: 'Deploy Gold v2.5', 
    content: 'Codice verificato...',
    language: 'typescript' 
  })
  
  console.log('Certificato Vault:', cert.certificateId)
}

// 3. Esempio: Streaming AI con DKP Coder (Qwen/Dots-3)
async function generateUI() {
  const stream = await dkp.ai.chat({
    model: 'dkp-coder',
    messages: [{ role: 'user', content: 'Crea un pulsante verde in Tailwind' }]
  })

  for await (const chunk of stream) {
    process.stdout.write(chunk.text)
  }
}</code></pre>
        </div>
      </section>

      <!-- SEZIONE DEDICATA AL CLI TOOLKIT -->
      <section class="docs-section">
        <h2>3. Autenticazione & Utilizzo da Riga di Comando (CLI)</h2>
        <p class="desc-text">
          Il pacchetto <code>@devkernelpulse/cli</code> consente ai developer e agli architetti software di gestire le scansioni, generare codice e notarizzare direttamente all'interno delle pipeline CI/CD o dal proprio terminale.
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
              <pre><code>dkp vault notarize ./dist/bundle.js --title "Release v2.5-GOLD"</code></pre>
            </div>

            <div v-if="activeCliCmd === 'status'">
              <h4>Verifica Stato Kernel & Latency</h4>
              <p>Controlla lo stato dei servizi GCP Armor, la latenza di rete verso OpenRouter e la quota rimanente:</p>
              <pre><code>dkp status</code></pre>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA FOOTER -->
      <div class="cta-footer">
        <h3>Pronto per scalare le tue architetture?</h3>
        <p>Ottieni la tua API Key dalla Dashboard, sblocca la Trinity AI e inizia a costruire.</p>
        <NuxtLink to="/user/dashboard?tab=api" class="btn-primary">🧬 Genera una API Key DKP</NuxtLink>
      </div>

    </div>
  </div>
</template>

<style scoped>
.sdk-page { background: #020420; color: #cbd5e1; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif; }
.docs-container { max-width: 1080px; margin: 0 auto; padding: 3rem 1.5rem 5rem; display: flex; flex-direction: column; }

/* HEADER */
.docs-header { text-align: center; margin-bottom: 3rem; display: flex; flex-direction: column; align-items: center; }
.header-top { display: inline-flex; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; justify-content: center; }
.badge-gold { background: rgba(0, 220, 130, 0.15); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.4); font-size: 0.75rem; font-weight: 800; padding: 0.35rem 0.8rem; border-radius: 20px; }
.sentinel-shield { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); font-size: 0.75rem; font-weight: 800; padding: 0.35rem 0.8rem; border-radius: 20px; }
.docs-header h1 { font-size: 2.8rem; color: #fff; margin: 0 0 1rem; font-weight: 900; line-height: 1.2; }
.subtitle { color: #94a3b8; font-size: 1.1rem; margin: 0 auto 2rem; max-width: 700px; line-height: 1.6; }

.install-box { background: #090d16; border: 1px solid #1e293b; padding: 0.8rem 1.2rem; border-radius: 12px; display: inline-flex; align-items: center; gap: 1.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
.install-box code { color: #00dc82; font-family: 'Fira Code', monospace; font-size: 1rem; font-weight: 700; }
.copy-btn { background: #1e293b; color: #fff; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.8rem; font-weight: bold; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
.copy-btn:hover { background: #334155; }

/* FEATURES */
.features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
.feature-card { background: #090d16; border: 1px solid #1e293b; padding: 1.5rem; border-radius: 12px; }
.feat-icon { font-size: 2rem; margin-bottom: 1rem; display: block; }
.feature-card h3 { color: #fff; font-size: 1.15rem; margin: 0 0 0.5rem; }
.feature-card p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; margin: 0; }

/* BANNER SENTINEL */
.mt-12 { margin-top: 3rem; }
.sentinel-notice-banner { background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(3, 7, 18, 0.9) 100%); border: 1px solid #a855f7; border-radius: 12px; padding: 1.5rem; display: flex; gap: 1.25rem; align-items: flex-start; margin-bottom: 3.5rem; box-shadow: 0 4px 20px rgba(168, 85, 247, 0.15); }
.banner-icon { font-size: 2.2rem; }
.banner-content h3 { margin: 0 0 0.4rem; color: #c084fc; font-size: 1.1rem; font-weight: 800; }
.banner-content p { margin: 0; color: #cbd5e1; font-size: 0.9rem; line-height: 1.6; }

/* SEZIONI E TAB */
.docs-section { margin-bottom: 3.5rem; }
.docs-section h2 { font-size: 1.5rem; color: #fff; margin-bottom: 1.25rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.75rem; }
.desc-text { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.25rem; }

.lang-selector { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.lang-selector button { background: #090d16; border: 1px solid #1e293b; color: #94a3b8; padding: 0.5rem 1.2rem; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease; }
.lang-selector button:hover { border-color: #38bdf8; color: #38bdf8; }
.lang-selector button.active { color: #00dc82; border-color: #00dc82; background: rgba(0, 220, 130, 0.1); }

.code-block-wrapper { background: #050811; border: 1px solid #1e293b; border-radius: 10px; padding: 1.25rem; font-family: 'Fira Code', monospace; color: #38bdf8; font-size: 0.9rem; overflow-x: auto; }
.code-block-wrapper pre { margin: 0; }
.code-block-wrapper.multiline pre { line-height: 1.6; }

/* CLI DISPLAY GRID */
.cli-command-grid { display: grid; grid-template-columns: 240px 1fr; gap: 1.5rem; background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; }
@media (max-width: 768px) { .cli-command-grid { grid-template-columns: 1fr; } }
.cli-sidebar { display: flex; flex-direction: column; gap: 0.5rem; }
.cli-sidebar button { background: #020420; border: 1px solid #1e293b; color: #94a3b8; padding: 0.75rem 1rem; border-radius: 8px; text-align: left; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease; }
.cli-sidebar button:hover { border-color: #38bdf8; color: #38bdf8; }
.cli-sidebar button.active { color: #00dc82; border-color: #00dc82; background: rgba(0, 220, 130, 0.1); }

.cli-display { background: #020420; border: 1px solid #1e293b; border-radius: 8px; padding: 1.25rem; }
.cli-display h4 { color: #fff; margin: 0 0 0.5rem; font-size: 1.05rem; }
.cli-display p { color: #94a3b8; font-size: 0.9rem; margin-top: 0; margin-bottom: 1rem; line-height: 1.5; }
.cli-display pre { background: #050811; border: 1px solid #1e293b; padding: 1rem; border-radius: 6px; color: #00dc82; font-family: 'Fira Code', monospace; font-size: 0.9rem; margin: 0; overflow-x: auto; }

/* CTA */
.cta-footer { text-align: center; background: linear-gradient(180deg, #090d16, #020420); border: 1px solid #1e293b; padding: 3.5rem 2rem; border-radius: 16px; margin-top: 2rem; }
.cta-footer h3 { color: #fff; font-size: 1.8rem; margin: 0 0 1rem; font-weight: 800; }
.cta-footer p { color: #94a3b8; margin: 0 0 2.5rem; font-size: 1.05rem; }
.btn-primary { background: rgba(0, 220, 130, 0.1); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.4); font-weight: 700; font-size: 0.9rem; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; transition: all 0.2s ease; }
.btn-primary:hover { background: #00dc82; color: #020420; transform: translateY(-2px); box-shadow: 0 0 20px rgba(0, 220, 130, 0.4); }
</style>