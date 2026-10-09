<!-- app/pages/docs/cli-automation.vue -->
<script setup lang="ts">
const currentYear = new Date().getFullYear()
const { getMainUrl, getMailUrl, getApiUrl } = useDomain()

useDkpSeo({
  title: 'DKP CLI & Local Automation Guide v2.5-BETA - DevKernelPulse',
  description: 'Documentazione ufficiale DKP CLI Toolkit v2.5. Scopri come automatizzare test E2E, gestire API Key in locale e interagire con i microservizi DKP dal terminale.'
})
</script>

<template>
  <div class="docs-page-container">
    
    <!-- HERO HEADER -->
    <header class="docs-hero">
      <div class="hero-badge">
        <span class="badge-status gold">⚙️ DKP DEVELOPER DOCUMENTATION v2.5</span>
      </div>
      <h1>DKP CLI & <span class="highlight">Local Automation</span></h1>
      <p class="subtitle">
        La guida definitiva per sviluppatori e DevOps. Impara a sincronizzare il tuo ecosistema locale, configurare pipeline di Continuous Integration e gestire la sicurezza direttamente dalla riga di comando.
      </p>
    </header>

    <!-- CONTENT SECTIONS -->
    <div class="docs-content-grid">
      
      <!-- SEZIONE 1: INTRODUZIONE E REQUISITI -->
      <section class="doc-card">
        <h2>🛠️ 1. Prerequisiti & Installazione Globale</h2>
        <p>
          Il <strong>DKP CLI Toolkit v2.5-BETA</strong> è stato progettato per Node.js (richiesta versione <strong>18.17.0+</strong> o <strong>20.x+</strong>). Ti permette di avere il controllo totale sull'ecosistema Pulse Nexus senza dover mai aprire il browser.
        </p>
        <p>
          Installa il pacchetto in modo globale tramite NPM o Yarn per rendere il comando <code>dkp</code> disponibile ovunque nel tuo sistema:
        </p>
        <div class="code-block">
          <code># Usa NPM
npm install -g @devkernelpulse/cli@beta

# Oppure con Yarn
yarn global add @devkernelpulse/cli@beta</code>
        </div>
        <p class="note-text">
          ✅ <strong>Verifica:</strong> Digita <code>dkp --version</code> per confermare che l'installazione sia andata a buon fine.
        </p>
      </section>

      <!-- SEZIONE 2: AUTENTICAZIONE ED ENDPOINT -->
      <section class="doc-card">
        <h2>🌐 2. Autenticazione & Environment Sync</h2>
        <p>
          Prima di interagire con il tuo cluster o lanciare scansioni AI, la CLI deve essere autenticata e sincronizzata con l'ambiente DKP attivo.
        </p>
        
        <h4>Login Interattivo</h4>
        <div class="code-block">
          <code>dkp auth login</code>
        </div>
        <p>
          Questo comando aprirà automaticamente il browser puntando al tuo <strong>Main Portal</strong> (<code>{{ getMainUrl() }}</code>) per la procedura di OAuth2 e scaricherà in locale il token sicuro.
        </p>
        
        <h4>Endpoint di Riferimento del tuo Workspace</h4>
        <p>Il toolkit dialogherà con le seguenti infrastrutture cloud in tempo reale:</p>
        <ul class="endpoint-list">
          <li><strong>API Gateway (Gestione Modelli & Sync):</strong> <code>{{ getApiUrl() }}</code></li>
          <li><strong>Sistema Notifiche Mail Server:</strong> <code>{{ getMailUrl() }}</code></li>
        </ul>
      </section>

      <!-- SEZIONE 3: COMANDI PRINCIPALI (FOCUS V2.5) -->
      <section class="doc-card">
        <h2>⚡ 3. Gestione Ecosistema e Comandi Core</h2>
        <p>Di seguito i comandi più utilizzati per automatizzare i tuoi processi di sviluppo quotidiani.</p>
        
        <div class="command-group">
          <!-- Scanner AI -->
          <div class="command-item">
            <div class="command-header">
              <strong>dkp scan [repo-url]</strong>
              <span class="cmd-badge ai">AI Powered</span>
            </div>
            <p>
              Invia un repository remoto o una directory locale all'<strong>AI Repository Scanner</strong>. La CLI restituirà in stdout il tuo score <strong>S-Tier</strong>, un'analisi dello stack e eventuali raccomandazioni di refactoring.
            </p>
            <code>dkp scan ./mio-progetto --format=json</code>
          </div>

          <!-- API Key Management -->
          <div class="command-item">
            <div class="command-header">
              <strong>dkp keys:create [nome]</strong>
              <span class="cmd-badge sec">Security</span>
            </div>
            <p>
              Genera dinamicamente una nuova <strong>API Key Nitro Enterprise</strong> per i tuoi script o pipeline CI. 
            </p>
            <code>dkp keys:create "GitHub Actions Prod" --ttl=30d</code>
          </div>

          <!-- Code Vault -->
          <div class="command-item">
            <div class="command-header">
              <strong>dkp vault:push [file]</strong>
              <span class="cmd-badge core">Data</span>
            </div>
            <p>
              Invia un file Markdown o uno snippet di codice al <strong>Code Vault</strong> per la notarizzazione crittografica. Ottimo per versionare gli articoli del blog.
            </p>
            <code>dkp vault:push architecture-docs.md</code>
          </div>
        </div>
      </section>

      <!-- SEZIONE 4: AUTOMAZIONE CI/CD & FIREWALL LIVE -->
      <section class="doc-card">
        <h2>🔒 4. Continuous Integration & Monitoraggio</h2>
        
        <h4>Automazione dei Test E2E</h4>
        <p>
          Integra DKP CLI all'interno dei tuoi file YAML di GitHub Actions o GitLab CI per bloccare i deployment se i test E2E Playwright falliscono.
        </p>
        <div class="code-block">
          <code>dkp ci run-tests --framework=playwright --fail-fast</code>
        </div>
        
        <h4>Monitoraggio Firewall SSE</h4>
        <p>
          Per i Sysadmin: puoi agganciare il tuo terminale al flusso eventi in diretta del <strong>DKP Cyber Firewall</strong>, leggendo lo streaming Server-Sent Events senza ritardi.
        </p>
        <div class="code-block">
          <code>dkp firewall:monitor --level=critical,warning</code>
        </div>
        <p class="note-text">
           ⚠️ Usa <code>Ctrl+C</code> per sganciare la CLI dallo stream live.
        </p>
      </section>
      
      <!-- SEZIONE 5: SUPPORTO -->
      <section class="doc-card secondary">
        <h3>Need Help?</h3>
        <p>
          Se incontri problemi con la CLI o ricevi errori 401, verifica che il demone locale sia in esecuzione (<code>dkp daemon status</code>) e che il token JWT non sia scaduto.
        </p>
        <p>Per la reference completa di tutti i flag disponibili, esegui sempre: <code>dkp --help</code>.</p>
      </section>

    </div>

    <!-- FOOTER LINK -->
    <div class="docs-footer-nav">
      <NuxtLink to="/tools" class="back-btn">← Ritorna all'hub dei Tools</NuxtLink>
    </div>

  </div>
</template>

<style scoped>
/* ==========================================================================
   LAYOUT GUIDA DKP CLI (Stile Docs)
   ========================================================================== */
.docs-page-container {
  max-width: 950px; /* Leggermente allargato per facilitare la lettura del codice */
  margin: 2rem auto;
  padding: 0 1.5rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #f8fafc;
}

.docs-hero {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 3rem 2.5rem; /* Respiro maggiore nell'header */
  text-align: center;
  margin-bottom: 2.5rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.hero-badge { margin-bottom: 1rem; }

.badge-status.gold {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  border: 1px solid #00dc82;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.2);
}

.docs-hero h1 {
  font-size: 2.5rem;
  font-weight: 900;
  margin: 0 0 1rem 0;
  color: #ffffff;
}

.highlight {
  color: #00dc82;
  text-shadow: 0 0 20px rgba(0, 220, 130, 0.3);
}

.subtitle {
  color: #94a3b8;
  max-width: 700px;
  margin: 0 auto;
  font-size: 1.05rem;
  line-height: 1.6;
}

/* GRIGLIA SEZIONI DOCS */
.docs-content-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem; /* Distanza maggiore tra un capitolo e l'altro */
}

.doc-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.doc-card.secondary {
  background: rgba(30, 41, 59, 0.3);
  border-color: #334155;
  padding: 1.5rem 2rem;
}
.doc-card.secondary h3 { color: #cbd5e1; margin-top: 0; }

.doc-card h2 {
  font-size: 1.4rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #1e293b;
}

.doc-card h4 {
  font-size: 1.05rem;
  color: #e2e8f0;
  margin: 1.5rem 0 0.8rem 0;
}

.doc-card p {
  color: #94a3b8;
  font-size: 0.95rem;
  line-height: 1.7;
  margin-bottom: 1.2rem;
}

/* BLOCCHI DI CODICE */
.code-block {
  background: #020420;
  border: 1px solid #1e293b;
  padding: 1.2rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow-x: auto;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
}

.code-block code {
  font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace;
  color: #38bdf8;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre; /* Mantiene a capo nativi del testo inserito */
}

.note-text {
  font-size: 0.88rem;
  color: #64748b !important;
  font-style: italic;
  margin: 0;
}

/* LISTA ENDPOINT */
.endpoint-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.endpoint-list li {
  font-size: 0.95rem;
  color: #cbd5e1;
  background: #020420;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  border: 1px solid #1e293b;
  display: flex;
  justify-content: space-between; /* Spinge l'URL a destra */
  align-items: center;
  flex-wrap: wrap;
}

.endpoint-list code {
  color: #00dc82;
  font-family: monospace;
  font-weight: 600;
  background: rgba(0, 220, 130, 0.1);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
}

/* LISTA COMANDI (Migliorata graficamente) */
.command-group {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.command-item {
  background: rgba(2, 4, 32, 0.6);
  padding: 1.2rem;
  border-radius: 10px;
  border: 1px solid #1e293b;
  border-left: 3px solid #38bdf8; /* Accent border laterale */
}

.command-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}

.command-item strong {
  color: #00dc82;
  font-family: monospace;
  font-size: 1.05rem;
}

.cmd-badge {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.cmd-badge.ai { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
.cmd-badge.sec { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
.cmd-badge.core { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }

.command-item p {
  margin: 0 0 0.8rem 0;
  font-size: 0.9rem;
  color: #94a3b8;
}

.command-item code {
  display: block;
  font-family: monospace;
  font-size: 0.85rem;
  color: #64748b;
  background: #000000;
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
}

/* FOOTER NAV */
.docs-footer-nav {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid #1e293b;
  display: flex;
  justify-content: flex-start;
}

.back-btn {
  color: #38bdf8;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.back-btn:hover { 
  color: #00dc82; 
  transform: translateX(-4px); /* Effettino slide a sinistra */
}
</style>