<!-- app/pages/docs/ecosystem.vue -->
<script setup lang="ts">
import { ref } from 'vue'

useDkpSeo({
  title: 'Guida Ecosistema & Architettura v2.5-GOLD — DKP Docs',
  description: 'Documentazione ufficiale sull\'architettura di DevKernelPulse v2.5-GOLD, DKP Nodes, Sentinella Gemini, Integrazione OpenRouter AI, OpenUI Studio e Gamification XP.'
})

const activeSection = ref('architettura')
const sections = [
  { id: 'architettura', title: '🏗️ Architettura DKP', icon: '⚡' },
  { id: 'moduli', title: '🛠️ Moduli, Nodes & OpenUI', icon: '🧩' },
  { id: 'cli-toolkit', title: '⚡ DKP CLI Toolkit', icon: '💻' },
  { id: 'gamification', title: '🏆 Gamification & XP System', icon: '🎮' },
  { id: 'best-practices', title: '💡 Best Practices & Growth', icon: '🚀' }
]

function scrollToSection(id: string) {
  activeSection.value = id
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <div class="docs-page">
    <div class="docs-container">
      
      <!-- SIDEBAR NAVIGAZIONE DOCS -->
      <aside class="docs-sidebar">
        <div class="sidebar-header">
          <span class="badge">DKP DOCS</span>
          <h3>Ecosistema v2.5-GOLD</h3>
        </div>

        <nav class="sidebar-nav">
          <button 
            v-for="item in sections" 
            :key="item.id" 
            @click="scrollToSection(item.id)"
            :class="{ active: activeSection === item.id }"
            class="nav-item"
          >
            <span>{{ item.title }}</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <NuxtLink to="/docs/api" class="api-docs-btn">
            🔌 Passa alla Documentazione API ↗
          </NuxtLink>
        </div>
      </aside>

      <!-- CONTENUTO PRINCIPALE -->
      <main class="docs-content">
        
        <!-- HERO DOCS -->
        <header class="docs-hero">
          <div class="breadcrumb">Docs / Ecosistema &amp; Architettura v2.5-GOLD</div>
          <h1>DevKernelPulse Knowledge Base</h1>
          <p class="subtitle">
            Guida completa all'architettura modulare DKP v2.5-GOLD: dal motore Proof-of-Code Vault su Neon DB ai DKP Nodes, la Sentinella SAST con Gemini 2.0 Flash, l'OpenUI Live Engine e il sistema di reputazione XP.
          </p>
        </header>

        <!-- SEZIONE 1: ARCHITETTURA -->
        <section id="architettura" class="doc-section">
          <h2><span class="sec-icon">🏗</span> Architettura di Sistema DKP v2.5-GOLD</h2>
          <p>
            <strong>DevKernelPulse (DKP)</strong> è costruito secondo un paradigma reattivo ad alte prestazioni, alimentato da <strong>Nuxt 4 (Vue 3, Nitro Engine)</strong>, database serverless <strong>Neon PostgreSQL</strong> con ORM <strong>Drizzle</strong>, e un'infrastruttura AI decentralizzata tramite OpenRouter.
          </p>

          <div class="architecture-grid">
            <div class="arch-card">
              <h4>🌐 Edge Processing &amp; AI Gateway</h4>
              <p>Gateway Nitro H3 con crittografia SHA-256 nativa in-flight, gestione dinamica delle API Keys DKP per metering e rate-limiting in tempo reale.</p>
            </div>
            <div class="arch-card">
              <h4>🛡️ Pulse Sentinel &amp; SAST Engine</h4>
              <p>Sentinella integrata su <strong>Google Gemini 2.0 Flash</strong> per l'analisi statica del codice, la moderazione istantanea dei DKP Nodes e la prevenzione injection.</p>
            </div>
            <div class="arch-card">
              <h4>🧠 OpenRouter Trinity Pipeline</h4>
              <p>Integrazione unificata multi-LLM (Vercel AI SDK) con supporto streaming in tempo reale per DKP Flash, DKP Coder e DKP Pro.</p>
            </div>
            <div class="arch-card">
              <h4>🗄️ Neon Serverless DB &amp; Drizzle</h4>
              <p>Persistenza dati ultra-veloce, gestione atomica dei contatori `usage_count`, transazioni di Gamification XP e tabelle `api_keys` / `vault`.</p>
            </div>
          </div>
        </section>

        <!-- SEZIONE 2: MODULI & STRUMENTI -->
        <section id="moduli" class="doc-section">
          <h2><span class="sec-icon">🛠️</span> Moduli Proprietari DKP v2.5-GOLD</h2>
          <p>La piattaforma offre una suite completa di strumenti integrati per la sicurezza, la produttività dello sviluppatore e il rendering UI in tempo reale:</p>

          <div class="module-list">
            
            <div class="module-box firewall">
              <div class="mod-header">
                <span class="mod-icon">🛡️</span>
                <h3>Pulse Sentinel SAST &amp; DKP Nodes Moderation</h3>
              </div>
              <p>Sistema di moderazione intelligente alimentato da <strong>Google Gemini 2.0 Flash</strong> (<code>google/gemini-2.0-flash-exp:free</code>). Analizza i post della community nei DKP Nodes e scansiona il codice prevenendo vulnerabilità prima della pubblicazione.</p>
            </div>

            <div class="module-box keys">
              <div class="mod-header">
                <span class="mod-icon">🔑</span>
                <h3>API Key Enterprise Management &amp; Paywall</h3>
              </div>
              <p>Gestione chiavi crittografate (salvataggio tramite <code>key_hash</code>). Valida le chiamate, gestisce il metering atomico su Neon DB e applica il Paywall Dinamico tra i tier FREE, PRO e ENTERPRISE.</p>
            </div>

            <div class="module-box">
              <div class="mod-header">
                <span class="mod-icon">🎨</span>
                <h3>OpenUI Studio &amp; Live Rendering</h3>
              </div>
              <p>Motore visivo reattivo integrato nel Playground. Genera componenti Tailwind CSS, interfacce e layout inviando prompt naturali e li renderizza istantaneamente in un sandbox iframe protetto.</p>
            </div>

            <div class="module-box">
              <div class="mod-header">
                <span class="mod-icon">🧠</span>
                <h3>Neural Playground &amp; DKP Trinity Engine</h3>
              </div>
              <p>Sandbox interattiva per il testing e la generazione AI in streaming. Alimentata dalla nuova suite di modelli OpenRouter:</p>
              <ul class="model-doc-list">
                <li>⚡ <strong>DKP-Flash:</strong> <code>google/gemini-2.0-flash-exp:free</code> — Risposta istantanea e moderazione.</li>
                <li>💻 <strong>DKP-Coder:</strong> <code>dots-studio/dots-3-note-preview:free</code> — Specializzato in blocchi di codice e componenti OpenUI.</li>
                <li>🧠 <strong>DKP-Pro:</strong> <code>nvidia/nemotron-3-ultra-550b-a55b:free</code> — Architetture avanzate con output a 3 varianti.</li>
              </ul>
            </div>

            <div class="module-box vault">
              <div class="mod-header">
                <span class="mod-icon">📜</span>
                <h3>Proof-of-Code Vault v2.5</h3>
              </div>
              <p>Permette di generare un'impronta digitale immutabile (SHA-256) del tuo sorgente o output OpenUI, notarizzandolo direttamente sul database Neon con reward XP immediato.</p>
            </div>

          </div>
        </section>

        <!-- SEZIONE 3: DKP CLI TOOLKIT -->
        <section id="cli-toolkit" class="doc-section">
          <h2><span class="sec-icon">⚡</span> DKP CLI Toolkit v2.5-GOLD</h2>
          <p>
            L'interfaccia a riga di comando nativa per sviluppatori. Consente di interrogare l'ecosistema DKP direttamente dai terminali locali e di interagire con le API di produzione.
          </p>

          <div class="cli-command-box">
            <div class="cli-header">
              <span>Terminal / Bash</span>
              <span class="cli-badge">v2.5-GOLD</span>
            </div>
            <pre><code><span class="comment"># Installazione globale tramite NPM</span>
npm install -g @devkernelpulse/cli

<span class="comment"># Autenticazione con API Key crittografata</span>
dkp auth login --key dkp_live_xxx

<span class="comment"># Generazione UI da Terminale tramite Trinity (Dots-3 Engine)</span>
dkp ui generate "Dashboard Tailwind Dark"

<span class="comment"># Notarizzazione istantanea sul Vault Cloud</span>
dkp vault notarize https://miosito.com

<span class="comment"># Verifica stato API Gateway & Sentinel</span>
dkp status</code></pre>
          </div>
        </section>

        <!-- SEZIONE 4: GAMIFICATION & XP -->
        <section id="gamification" class="doc-section">
          <h2><span class="sec-icon">🏆</span> Gamification &amp; XP Reputation Engine</h2>
          <p>
            Ogni interazione su DevKernelPulse genera <strong>Experience Points (XP)</strong> registrati in tempo reale nella tabella <code>api_keys</code> e <code>users</code> su Neon DB, incrementando il tuo rank sviluppatore.
          </p>

          <table class="xp-table">
            <thead>
              <tr>
                <th>Azione Utente</th>
                <th>Guadagno XP</th>
                <th>Target Backend / Funzione</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Notarizzazione Vault (Web o CLI)</strong></td>
                <td><span class="xp-badge gold">+100 XP</span></td>
                <td><code>/api/user/vault</code></td>
              </tr>
              <tr>
                <td><strong>Pubblicazione Post / Node Moderato</strong></td>
                <td><span class="xp-badge gold">+50 XP</span></td>
                <td><code>/api/nodes / Pulse Sentinel</code></td>
              </tr>
              <tr>
                <td><strong>Generazione OpenUI / DKP-Coder</strong></td>
                <td><span class="xp-badge">+30 XP</span></td>
                <td><code>/api/ai/chat.post.ts</code></td>
              </tr>
              <tr>
                <td><strong>Esecuzione Neural Playground (Trinity)</strong></td>
                <td><span class="xp-badge">+15 XP</span></td>
                <td><code>streamText (Gemini / Nemotron)</code></td>
              </tr>
              <tr>
                <td><strong>Comandi Web Terminal Shell</strong></td>
                <td><span class="xp-badge">+5 XP / +50 XP</span></td>
                <td><code>/api/tools/terminal-exec</code></td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- SEZIONE 5: BEST PRACTICES -->
        <section id="best-practices" class="doc-section">
          <h2><span class="sec-icon">💡</span> Best Practices per gli Sviluppatori</h2>
          <div class="tip-box">
            <h4>⚡ Model Routing Intelligente</h4>
            <p>Usa <strong>DKP-Flash</strong> (Gemini 2.0) per query veloci o analisi di testo, <strong>DKP-Coder</strong> (Dots-3) per generare componenti Tailwind/Vue in OpenUI, e <strong>DKP-Pro</strong> (Nemotron-3) per richiedere 3 varianti di architetture complesse.</p>
          </div>
          <div class="tip-box green">
            <h4>🔑 Sicurezza e Crittografia API</h4>
            <p>Le chiavi DKP (es. <code>dkp_live_...</code>) non vengono mai memorizzate in chiaro. Il sistema salva e confronta in tempo reale unicamente l'hash crittografato (SHA-256) per la massima sicurezza aziendale.</p>
          </div>
          <div class="tip-box purple">
            <h4>🛡️ Moderazione Nodes &amp; Pulse Sentinel</h4>
            <p>Tutti i contributi pubblicati nei DKP Nodes passano automaticamente la scansione della Sentinella Gemini prima di essere visibili nel feed principale.</p>
          </div>
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
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.docs-container {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 3rem;
}

@media (max-width: 900px) {
  .docs-container {
    grid-template-columns: 1fr;
  }
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

.sidebar-header h3 {
  color: #ffffff;
  margin: 0.3rem 0 0;
  font-size: 1.1rem;
}

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

.nav-item:hover, .nav-item.active {
  background: rgba(0, 220, 130, 0.1);
  color: #00dc82;
}

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
  transition: transform 0.15s ease;
}

.api-docs-btn:hover {
  transform: translateY(-2px);
}

/* CONTENT */
.docs-content {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.breadcrumb {
  font-size: 0.8rem;
  color: #38bdf8;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.docs-hero h1 {
  font-size: 2.2rem;
  color: #ffffff;
  font-weight: 900;
  margin: 0 0 0.5rem;
}

.subtitle {
  font-size: 1.05rem;
  color: #94a3b8;
  line-height: 1.6;
}

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

.sec-icon { font-size: 1.2rem; }

.architecture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-top: 1.25rem;
}

.arch-card {
  background: #020420;
  border: 1px solid #1e293b;
  padding: 1rem;
  border-radius: 8px;
}

.arch-card h4 {
  color: #00dc82;
  margin: 0 0 0.5rem;
}

.arch-card p {
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0;
  color: #94a3b8;
}

.module-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.25rem;
}

.module-box {
  background: #020420;
  border: 1px solid #1e293b;
  padding: 1.25rem;
  border-radius: 8px;
}

.module-box.firewall { border-left: 4px solid #3b82f6; }
.module-box.keys { border-left: 4px solid #f59e0b; }
.module-box.vault { border-left: 4px solid #10b981; }

.module-box p {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: #94a3b8;
}

.model-doc-list {
  margin: 0.75rem 0 0 1rem;
  padding: 0;
  font-size: 0.85rem;
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.model-doc-list code {
  color: #38bdf8;
}

.mod-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.4rem;
}

.mod-header h3 {
  color: #ffffff;
  margin: 0;
  font-size: 1.05rem;
}

.mod-icon {
  font-size: 1.2rem;
}

/* CLI COMMAND BOX */
.cli-command-box {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 1.25rem;
}

.cli-header {
  background: #0d1322;
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #64748b;
  border-bottom: 1px solid #1e293b;
  font-family: monospace;
}

.cli-badge {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-weight: 700;
}

.cli-command-box pre {
  margin: 0;
  padding: 1rem 1.25rem;
  font-family: 'Fira Code', 'Courier New', Courier, monospace;
  font-size: 0.85rem;
  color: #00dc82;
  line-height: 1.6;
  overflow-x: auto;
}

.cli-command-box .comment {
  color: #64748b;
  font-style: italic;
}

/* GAMIFICATION TABLE */
.xp-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1.25rem;
}

.xp-table th, .xp-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #1e293b;
}

.xp-table th {
  background: #020420;
  color: #ffffff;
  font-size: 0.85rem;
}

.xp-badge {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.xp-badge.gold {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

/* TIP BOXES */
.tip-box {
  background: #020420;
  border-left: 4px solid #38bdf8;
  padding: 1rem 1.25rem;
  border-radius: 0 8px 8px 0;
  margin-top: 1rem;
}

.tip-box.green {
  border-left-color: #00dc82;
}

.tip-box.purple {
  border-left-color: #8b5cf6;
}

.tip-box h4 {
  margin: 0 0 0.3rem;
  color: #ffffff;
}

.tip-box p {
  margin: 0;
  font-size: 0.88rem;
  color: #94a3b8;
}

code {
  background: rgba(255, 255, 255, 0.08);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
  color: #38bdf8;
}
</style>