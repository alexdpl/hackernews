<!-- app/pages/tools/index.vue -->
<script setup lang="ts">
useDkpSeo({
  title: 'Panoramica DKP Tools v2.4-GOLD & Ecosistema Auth',
  description: 'Guida ufficiale ai 5 DKP Tools v2.4, funzionalità CLI, AI Scanner ed uso del DKP Auth Core.'
})

const toolsList = [
  {
    id: 'auth-core',
    name: 'DKP Auth Core',
    version: 'v2.4-GOLD',
    badge: 'CORE SYSTEM',
    icon: '🔑',
    description: 'Sistema di autenticazione proprietario con state hydration sincronizzata, cookie dkp_session ed integrazione OAuth 2.0 multi-provider.',
    purpose: 'Autentica gli sviluppatori e sincronizza i ruoli (Admin, VIP Developer, Member) con accesso istantaneo al Vault ed ai DKP Tools.',
    route: '/login'
  },
  {
    id: 'dkp-cli-toolkit',
    name: 'DKP CLI Toolkit',
    version: 'v2.4-GOLD',
    badge: 'NEW RELEASE',
    icon: '⚡',
    description: 'Strumento a riga di comando per gestire il deploy rapido, la migrazione dei DB Neon e la pulizia della cache di PM2 direttamente da terminale.',
    purpose: 'Velocizzare i processi DevOps e CI/CD, fornendo agli sviluppatori comandi diretti (dkp build, dkp db:push) senza usare script complessi.',
    route: '/tools/cli'
  },
  {
    id: 'neural-playground',
    name: 'Neural Playground',
    version: 'v2.4-GOLD',
    badge: 'AI ENGINE',
    icon: '🧠',
    description: 'Ambiente di testing live per Prompt Engineering e benchmarking di modelli di intelligenza artificiale per sviluppatori.',
    purpose: 'Sperimentare contesti LLM, misurare la latenza dei prompt ed ottimizzare la generazione di codice in tempo reale.',
    route: '/tools/neural-playground'
  },
  {
    id: 'terminal',
    name: 'Terminal Web Shell',
    version: 'v2.4-GOLD',
    badge: 'CLI & SDK',
    icon: '💻',
    description: 'Web CLI in-browser ad alte prestazioni per interagire con le API di DevKernelPulse e l\'SDK proprietario.',
    purpose: 'Eseguire comandi di sistema, interrogare endpoint API blindati e gestire i certificati direttamente dalla shell browser.',
    route: '/tools/terminal'
  },
  {
    id: 'ai-scanner',
    name: 'AI Code Scanner v2',
    version: 'v2.4-GOLD',
    badge: 'SECURITY AUDIT',
    icon: '🔍',
    description: 'Motore di audit automatico per la scansione delle vulnerabilità del codice sorgente, mem-leak e security flaw.',
    purpose: 'Analizzare snippet e repository per rilevare falla di sicurezza prima del deploy in produzione.',
    route: '/tools/ai-scanner'
  },
  {
    id: 'proof-of-code',
    name: 'Proof of Code (Vault)',
    version: 'v2.4-GOLD',
    badge: 'CRIPTO VAULT',
    icon: '🛡️',
    description: 'Notarizzazione crittografica delle repository con generazione di Hash immutabili salvati nel Neon PostgreSQL DB.',
    purpose: 'Garantire la paternità del codice sorgente, generare certificati Vault verificabili ed attestare il valore meritocratico.',
    route: '/tools/proof-of-code'
  }
]
</script>

<template>
  <div class="tools-overview-container">
    <div class="hero-header">
      <span class="pill-tag">OFFICIAL DKP ECOSYSTEM DOCUMENTATION</span>
      <h1>I Nostri <span class="highlight">DKP Tools v2.4-GOLD</span> & Auth Core</h1>
      <p class="subtitle">
        Piattaforma suite proprietaria ad alte prestazioni progettata per sviluppatori, architetti software ed esperti di sicurezza.
      </p>
    </div>

    <!-- Griglia dei Tools -->
    <div class="tools-grid">
      <div v-for="tool in toolsList" :key="tool.id" class="tool-card">
        <div class="card-top">
          <div class="icon-box">{{ tool.icon }}</div>
          <div class="version-box">
            <span :class="['tool-badge', tool.id === 'dkp-cli-toolkit' ? 'badge-new' : '']">{{ tool.badge }}</span>
            <span class="version-num">{{ tool.version }}</span>
          </div>
        </div>

        <h2>{{ tool.name }}</h2>
        <p class="desc">{{ tool.description }}</p>

        <div class="purpose-box">
          <strong>🎯 A cosa serve:</strong>
          <p>{{ tool.purpose }}</p>
        </div>

        <NuxtLink :to="tool.route" class="launch-btn">
          Apri {{ tool.name }} <span class="btn-icon">➔</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Box Copyright & Termini d'Uso -->
    <div class="copyright-notice-box">
      <div class="notice-icon">⚖️</div>
      <div class="notice-content">
        <h3>Copyright & Proprietà Intellettuale dell'Ecosistema DKP</h3>
        <p>
          Tutti i DKP Tools, l'architettura DKP Auth Core e il motore Proof of Code sono di proprietà esclusiva di <strong>DevKernelPulse</strong>. L'uso automatizzato non autorizzato, lo scraping intensivo o il reverse engineering dei componenti costituiscono violazione dei Termini di Servizio.
        </p>
        <div class="notice-links">
          <NuxtLink to="/legal/terms">Consulta i Termini di Servizio completi ➔</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tools-overview-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
  color: #f8fafc;
  font-family: system-ui, -apple-system, sans-serif;
}

.hero-header {
  text-align: center;
  margin-bottom: 4rem;
}

.pill-tag {
  display: inline-block;
  background: rgba(0, 220, 130, 0.12);
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.3);
  padding: 0.4rem 1rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  margin-bottom: 1.5rem;
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.15);
}

.hero-header h1 {
  font-size: 2.8rem;
  font-weight: 900;
  margin: 0 0 1rem 0;
  color: #ffffff;
}

.highlight { color: #00dc82; text-shadow: 0 0 20px rgba(0, 220, 130, 0.3); }

.subtitle { 
  color: #94a3b8; 
  font-size: 1.1rem; 
  max-width: 700px; 
  margin: 0 auto;
  line-height: 1.6;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 1.75rem;
  margin-bottom: 4rem;
}

.tool-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.tool-card:hover {
  border-color: #00dc82;
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 220, 130, 0.15);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.icon-box { 
  font-size: 2.8rem; 
  line-height: 1;
  filter: drop-shadow(0 0 10px rgba(255,255,255,0.1));
}

.version-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
}

.tool-badge {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  letter-spacing: 0.05em;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.tool-badge.badge-new {
  background: rgba(250, 204, 21, 0.15);
  color: #facc15;
  border-color: rgba(250, 204, 21, 0.4);
  box-shadow: 0 0 10px rgba(250, 204, 21, 0.2);
}

.version-num { font-size: 0.75rem; color: #64748b; font-weight: 700; font-family: ui-monospace, monospace; }

.tool-card h2 { font-size: 1.4rem; font-weight: 800; margin: 0 0 0.75rem; color: #ffffff; }
.desc { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem; flex-grow: 1; }

.purpose-box {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.purpose-box strong { display: block; font-size: 0.8rem; color: #00dc82; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.05em; }
.purpose-box p { margin: 0; font-size: 0.85rem; color: #cbd5e1; line-height: 1.5; }

.launch-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  background: #020420;
  color: #00dc82;
  border: 1px solid #00dc82;
  font-weight: 800;
  font-size: 0.95rem;
  padding: 0.85rem;
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.launch-btn:hover { 
  background: #00dc82; 
  color: #020420;
  box-shadow: 0 0 20px rgba(0, 220, 130, 0.3);
}

.btn-icon { font-size: 1.1rem; transition: transform 0.2s; }
.launch-btn:hover .btn-icon { transform: translateX(4px); }

/* COPYRIGHT BOX */
.copyright-notice-box {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 2.5rem;
  display: flex;
  gap: 2rem;
  align-items: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.notice-icon { font-size: 3.5rem; }
.notice-content h3 { margin: 0 0 0.75rem; color: #ffffff; font-size: 1.25rem; font-weight: 800; }
.notice-content p { margin: 0 0 1rem; color: #94a3b8; font-size: 0.95rem; line-height: 1.6; }
.notice-links a { 
  color: #38bdf8; 
  font-weight: 700; 
  text-decoration: none; 
  font-size: 0.9rem;
  transition: color 0.2s; 
}
.notice-links a:hover { color: #7dd3fc; text-decoration: underline; }

@media (max-width: 768px) {
  .copyright-notice-box { flex-direction: column; text-align: center; padding: 1.5rem; }
  .notice-icon { font-size: 2.5rem; }
}
</style>