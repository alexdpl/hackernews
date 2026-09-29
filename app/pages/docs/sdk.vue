<!-- pages/docs/sdk.vue -->
<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'SDK & Guida Integrazione — DKP Docs',
  meta: [
    { name: 'description', content: 'Guida completa all\'installazione e integrazione dell\'SDK DevKernelPulse per Node.js, Python e Go.' }
  ]
})

const activeTab = ref<'node' | 'python' | 'go'>('node')

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="docs-page">
    <div class="docs-container">
      
      <!-- SIDEBAR -->
      <aside class="docs-sidebar">
        <div class="sidebar-header">
          <span class="badge">SDK TOOLS</span>
          <h3>DKP SDK v2.4</h3>
        </div>

        <nav class="sidebar-nav">
          <button @click="scrollToSection('install')" class="nav-item">📦 Installazione Pacchetti</button>
          <button @click="scrollToSection('quickstart')" class="nav-item">⚡ Quickstart & Auth</button>
          <button @click="scrollToSection('vault-sdk')" class="nav-item">🛡️ Notarizzazione Vault</button>
          <button @click="scrollToSection('ai-sdk')" class="nav-item">🔍 AI Code Audit</button>
        </nav>

        <div class="sidebar-footer">
          <NuxtLink to="/docs/api" class="api-docs-btn">
            🔌 API Reference Completa ↗
          </NuxtLink>
        </div>
      </aside>

      <!-- CONTENT -->
      <main class="docs-content">
        
        <header class="docs-hero">
          <div class="breadcrumb">Docs / Software Development Kits</div>
          <h1>⚙️ SDK & Guida Integrazione</h1>
          <p class="subtitle">
            Integra le funzionalità crittografiche e di audit IA di DevKernelPulse direttamente nella tua applicazione con gli SDK nativi.
          </p>
        </header>

        <!-- INSTALLAZIONE -->
        <section id="install" class="doc-section">
          <h2><span class="sec-icon">📦</span> Installazione Pacchetti</h2>
          <p>Seleziona il tuo linguaggio di riferimento per installare il pacchetto DKP SDK ufficiale:</p>

          <div class="lang-tabs">
            <button @click="activeTab = 'node'" :class="{ active: activeTab === 'node' }">Node.js / TS</button>
            <button @click="activeTab = 'python'" :class="{ active: activeTab === 'python' }">Python 3.10+</button>
            <button @click="activeTab = 'go'" :class="{ active: activeTab === 'go' }">Go Modules</button>
          </div>

          <pre class="code-block" v-if="activeTab === 'node'"><code>npm install @devkernelpulse/sdk # Oppure yarn add / pnpm add</code></pre>
          <pre class="code-block" v-if="activeTab === 'python'"><code>pip install dkp-sdk</code></pre>
          <pre class="code-block" v-if="activeTab === 'go'"><code>go get github.com/devkernelpulse/dkp-go-sdk/v2</code></pre>
        </section>

        <!-- QUICKSTART -->
        <section id="quickstart" class="doc-section">
          <h2><span class="sec-icon">⚡</span> Inizializzazione Client</h2>
          <p>Crea un'istanza del client passando la tua <code>DKP_API_KEY</code> ottenibile dalla dashboard utente.</p>

          <pre class="code-block"><code>import { DevKernelPulse } from '@devkernelpulse/sdk';

const dkp = new DevKernelPulse({
  apiKey: process.env.DKP_API_KEY,
  environment: 'production' // 'production' | 'sandbox'
});</code></pre>
        </section>

        <!-- VAULT SDK -->
        <section id="vault-sdk" class="doc-section">
          <h2><span class="sec-icon">🛡️</span> Esempio Notarizzazione Proof of Code</h2>
          <p>Invia un sorgente al Vault per ottenere un hash SHA-256 e una prova di paternità firmata:</p>

          <pre class="code-block"><code>const proof = await dkp.vault.notarize({
  title: 'Cryptographic Auth Module',
  sourceCode: 'function verifyToken(token) { return jwt.verify(token, SECRET); }',
  language: 'typescript'
});

console.log('SHA256 Certificato:', proof.sha256);
console.log('Vault URL:', proof.verificationUrl);</code></pre>
        </section>

        <!-- AI AUDIT -->
        <section id="ai-sdk" class="doc-section">
          <h2><span class="sec-icon">🔍</span> Scansione Vulnerabilità AI</h2>
          <p>Esegui la scansione statica automatica del codice all'interno delle tue pipeline CI/CD:</p>

          <pre class="code-block"><code>const scanResult = await dkp.ai.scanCode({
  code: 'SELECT * FROM users WHERE username = ' + input,
  language: 'javascript'
});

if (scanResult.riskScore === 'HIGH') {
  console.warn('Vulnerabilità rilevata:', scanResult.details[0].type);
}</code></pre>
        </section>

      </main>

    </div>
  </div>
</template>

<style scoped>
.docs-page {
  background: #020420;
  color: #cbd5e1;
  min-height: 100vh;
  padding: 2rem 1.5rem 5rem;
}

.docs-container {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 3rem;
}

@media (max-width: 900px) {
  .docs-container { grid-template-columns: 1fr; }
}

/* SIDEBAR */
.docs-sidebar {
  position: sticky;
  top: 5rem;
  height: fit-content;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.sidebar-header .badge {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

.sidebar-header h3 { color: #fff; margin: 0.3rem 0 0; font-size: 1.1rem; }

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.nav-item {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  text-align: left;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-item:hover { background: rgba(0, 220, 130, 0.1); color: #00dc82; }

.api-docs-btn {
  display: block;
  text-align: center;
  background: #00dc82;
  color: #020420;
  font-weight: 800;
  font-size: 0.82rem;
  padding: 0.6rem;
  border-radius: 8px;
  text-decoration: none;
}

/* CONTENT */
.docs-content {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.breadcrumb { font-size: 0.8rem; color: #38bdf8; font-weight: 600; margin-bottom: 0.5rem; }
.docs-hero h1 { font-size: 2.2rem; color: #ffffff; font-weight: 900; margin: 0 0 0.5rem; }
.subtitle { font-size: 1.05rem; color: #94a3b8; line-height: 1.6; }

.doc-section {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.75rem;
}

.doc-section h2 {
  color: #ffffff;
  font-size: 1.35rem;
  margin-top: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 0.75rem;
}

.lang-tabs {
  display: flex;
  gap: 0.4rem;
  margin: 1rem 0;
}

.lang-tabs button {
  background: #020420;
  border: 1px solid #1e293b;
  color: #94a3b8;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.lang-tabs button.active {
  color: #00dc82;
  border-color: #00dc82;
}

.code-block {
  background: #020420;
  border: 1px solid #1e293b;
  color: #38bdf8;
  padding: 1rem;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.85rem;
  overflow-x: auto;
  line-height: 1.5;
  margin-top: 0.8rem;
}
</style>