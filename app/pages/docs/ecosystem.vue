<!-- app/pages/docs/ecosystem.vue -->
<script setup lang="ts">
import { ref } from 'vue'

useDkpSeo({
  title: 'Guida Ecosistema & Architettura v2.5-BETA — DKP Docs',
  description: 'Documentazione ufficiale sull\'architettura di DevKernelPulse v2.5-BETA, moduli SaaS proprietari (Firewall SSE, API Management), CLI Toolkit e Gamification XP.'
})

const currentYear = new Date().getFullYear()

const activeSection = ref('architettura')
const sections = [
  { id: 'architettura', title: '🏗️ Architettura DKP', icon: '⚡' },
  { id: 'moduli', title: '🛠️ Moduli & Strumenti SaaS', icon: '🧩' },
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
          <h3>Ecosistema v2.5-BETA</h3>
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
          <div class="breadcrumb">Docs / Ecosistema & Architettura v2.5-BETA</div>
          <h1>DevKernelPulse Knowledge Base</h1>
          <p class="subtitle">
            Guida completa all'architettura modulare DKP, dal Cyber Firewall con streaming Live SSE al motore Proof of Code, l'integrazione IA, il CLI Toolkit nativo e il sistema di reputazione XP.
          </p>
        </header>

        <!-- SEZIONE 1: ARCHITETTURA -->
        <section id="architettura" class="doc-section">
          <h2><span class="sec-icon">🏗</span> Architettura di Sistema DKP v2.5-BETA</h2>
          <p>
            <strong>DevKernelPulse (DKP)</strong> è costruito secondo un paradigma micro-frontend ad alte prestazioni orientato agli eventi, alimentato da <strong>Nuxt 3 (Vue 3, Nitro Engine)</strong>, database serverless <strong>Neon PostgreSQL</strong> con ORM <strong>Drizzle</strong>, flussi <strong>Server-Sent Events (SSE)</strong> per il tempo reale e microservizi in Rust/Go per la notarizzazione crittografica.
          </p>

          <div class="architecture-grid">
            <div class="arch-card">
              <h4>🌐 Edge Processing & Crawler</h4>
              <p>Il crawler automatizzato DKP estrae, analizza e vettorizza in tempo reale contenuti da GitHub, dev.to, Hacker News e feed RSS di sicurezza.</p>
            </div>
            <div class="arch-card">
              <h4>🛡️ Vault & Live Firewall SSE</h4>
              <p>Hashing SHA-256 (Proof-of-Code) su Neon DB e monitoraggio IDS/IPS in tempo reale con flussi Server-Sent Events (SSE) contro SQLi e bot.</p>
            </div>
            <div class="arch-card">
              <h4>🧠 Neural Inference Gateway</h4>
              <p>Pipeline multi-LLM che gestisce i prompt di testing nel Playground, l'analisi statica di sicurezza del codice e il controllo editoriale (Sentinel AI).</p>
            </div>
            <div class="arch-card">
              <h4>🗄️ Neon Serverless DB & Nitro API</h4>
              <p>Persistenza dati ultra-veloce con Rate Limiting Enterprise. Gestione relazionale per la tassonomia del Blog e calcolo real-time degli XP utente.</p>
            </div>
          </div>
        </section>

        <!-- SEZIONE 2: MODULI & STRUMENTI -->
        <section id="moduli" class="doc-section">
          <h2><span class="sec-icon">🛠️</span> Moduli Proprietari DKP v2.5-BETA</h2>
          <p>La piattaforma offre una suite completa di strumenti integrati per la sicurezza, la produttività dello sviluppatore e la certificazione del codice:</p>

          <div class="module-list">
            
            <div class="module-box firewall">
              <div class="mod-header">
                <span class="mod-icon">🛡️</span>
                <h3>Cyber Firewall & Live SSE Monitor v2.5</h3>
              </div>
              <p>Monitoraggio in tempo reale delle minacce all'ecosistema tramite streaming nativo Server-Sent Events (SSE). Rilevamento di intrusioni (XSS, SQLi), blocco IP automatico e telemetria live con aggiornamenti sub-second.</p>
            </div>

            <div class="module-box keys">
              <div class="mod-header">
                <span class="mod-icon">🔑</span>
                <h3>API Key Enterprise Management v2.5</h3>
              </div>
              <p>Generazione decentralizzata di chiavi API crittografate (argon2/SHA) per l'interazione da CLI e script. Controllo granulare, limitazione chiamate (Rate Limiting Nitro) e revoca selettiva dei token di accesso.</p>
            </div>

            <div class="module-box">
              <div class="mod-header">
                <span class="mod-icon">📰</span>
                <h3>Code Vault Blog Engine & Zen Mode v2.5</h3>
              </div>
              <p>Sistema editoriale avanzato con categorizzazione a 2 livelli. Nuovo editor Markdown "Pro Vault" con inserimento tabelle, tag HTML e modalità di scrittura immersiva (Zen Mode Fullscreen). Integrazione Sentinel AI per l'approvazione.</p>
            </div>

            <div class="module-box">
              <div class="mod-header">
                <span class="mod-icon">🤖</span>
                <h3>AI Repository & Code Scanner v2.4-GOLD</h3>
              </div>
              <p>Analizzatore potenziato da modelli IA che rileva secret leaking, vulnerabilità (SAST/DAST) in oltre 18 linguaggi e calcola un Reputation Score da 0 a 100 per validare il codice prima del deployment.</p>
            </div>

            <div class="module-box">
              <div class="mod-header">
                <span class="mod-icon">🔐</span>
                <h3>Proof of Code (Vault) v2.4-GOLD</h3>
              </div>
              <p>Consente di generare un'impronta digitale immutabile del tuo sorgente. Dimostra la titolarità intellettuale registrando un certificato SHA-256 nel Vault DKP prima del rilascio pubblico.</p>
            </div>

            <div class="module-box">
              <div class="mod-header">
                <span class="mod-icon">🧠</span>
                <h3>Neural Playground & Web Shell v2.4-GOLD</h3>
              </div>
              <p>Ambiente integrato In-Browser: da un lato una Sandbox per il testing dei prompt LLM (Temperature, Top-P), dall'altro un simulatore Terminal xterm.js per interrogare le API.</p>
            </div>

          </div>
        </section>

        <!-- SEZIONE 3: DKP CLI TOOLKIT -->
        <section id="cli-toolkit" class="doc-section">
          <h2><span class="sec-icon">⚡</span> DKP CLI Toolkit v2.5-BETA</h2>
          <p>
            L'interfaccia a riga di comando nativa per sviluppatori. Consente di integrare l'ecosistema DKP nei terminali locali, negli script bash e nelle pipeline CI/CD, agganciandosi direttamente al Firewall SSE.
          </p>

          <div class="cli-command-box">
            <div class="cli-header">
              <span>Terminal / Bash</span>
              <span class="cli-badge">v2.5-BETA</span>
            </div>
            <pre><code><span class="comment"># Installazione globale tramite NPM</span>
npm install -g @devkernelpulse/cli

<span class="comment"># Autenticazione con Enterprise API Key</span>
dkp auth login --key DKP-SECRET-KEY-12345

<span class="comment"># Monitoraggio Live Firewall SSE</span>
dkp firewall:monitor --level=critical,warning

<span class="comment"># Scansione di sicurezza del codice locale</span>
dkp scan ./src --output json

<span class="comment"># Notarizzazione istantanea sul Vault</span>
dkp vault notarize ./src/core/kernel.ts --title "Kernel Core"</code></pre>
          </div>
        </section>

        <!-- SEZIONE 4: GAMIFICATION & XP -->
        <section id="gamification" class="doc-section">
          <h2><span class="sec-icon">🏆</span> Gamification & XP Reputation Engine</h2>
          <p>
            Ogni interazione su DevKernelPulse genera <strong>Experience Points (XP)</strong> legati al tuo profilo sviluppatore, incrementando il tuo rank nella community e sbloccando limiti API più elevati.
          </p>

          <table class="xp-table">
            <thead>
              <tr>
                <th>Azione Utente</th>
                <th>Guadagno XP</th>
                <th>Badge / Sblocco</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Pubblicazione Articolo Blog Pro</strong></td>
                <td><span class="xp-badge gold">+50 XP</span></td>
                <td>Tech Publisher</td>
              </tr>
              <tr>
                <td><strong>Notarizzazione Code Vault</strong></td>
                <td><span class="xp-badge">+25 XP</span></td>
                <td>Vault Guardian</td>
              </tr>
              <tr>
                <td><strong>Segnalazione / Blocco Minaccia Firewall</strong></td>
                <td><span class="xp-badge sec">+20 XP</span></td>
                <td>Cyber Shield</td>
              </tr>
              <tr>
                <td><strong>Audit Codice con AI Scanner / CLI</strong></td>
                <td><span class="xp-badge">+10 XP</span></td>
                <td>SecInspector</td>
              </tr>
              <tr>
                <td><strong>Generazione API Key Pro</strong></td>
                <td><span class="xp-badge">+5 XP</span></td>
                <td>Nitro API User</td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- SEZIONE 5: BEST PRACTICES -->
        <section id="best-practices" class="doc-section">
          <h2><span class="sec-icon">💡</span> Best Practices per gli Sviluppatori</h2>
          <div class="tip-box">
            <h4>⚡ Integrazione CI/CD Raccomandata</h4>
            <p>Usa la CLI <code>dkp scan</code> o gli endpoint API nel tuo workflow di GitHub Actions per automatizzare la scansione di sicurezza e la notarizzazione ad ogni <code>git push main</code>.</p>
          </div>
          <div class="tip-box green">
            <h4>🔑 Sicurezza delle API Key (Nitro)</h4>
            <p>Non committare mai le tue chiavi DKP nei repository pubblici. Utilizza sempre variabili d'ambiente protette come <code>DKP_API_TOKEN</code> ed imposta una scadenza (TTL) rigida dal gestore API.</p>
          </div>
          <div class="tip-box purple">
            <h4>🛡️ Certificazione Pre-Release</h4>
            <p>Genera sempre l'hash di Vault prima del primo commit o rilascio open source per proteggere la proprietà intellettuale dei tuoi algoritmi.</p>
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

/* Highlight modules new to v2.5 */
.module-box.firewall { border-left: 4px solid #ef4444; }
.module-box.keys { border-left: 4px solid #f59e0b; }

.module-box p {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: #94a3b8;
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

.xp-badge.sec {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
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