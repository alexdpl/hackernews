<!-- app/pages/tools/index.vue -->
<script setup lang="ts">
useDkpSeo({
  title: 'Panoramica DKP Tools v2.0 & Ecosistema Auth',
  description: 'Guida ufficiale ai 4 DKP Tools v2.0, funzionalità, versioni ed uso del DKP Auth Core.'
})

const toolsList = [
  {
    id: 'auth-core',
    name: 'DKP Auth Core',
    version: 'v2.0.4',
    badge: 'CORE SYSTEM',
    icon: '🔑',
    description: 'Sistema di autenticazione proprietario con state hydration sincronizzata, cookie dkp_session ed integrazione OAuth 2.0 multi-provider.',
    purpose: 'Autentica gli sviluppatori e sincronizza i ruoli (Admin, VIP Developer, Member) con accesso istantaneo al Vault ed ai DKP Tools.',
    route: '/login'
  },
  {
    id: 'neural-playground',
    name: 'Neural Playground',
    version: 'v2.0.1',
    badge: 'AI ENGINE',
    icon: '🧠',
    description: 'Ambiente di testing live per Prompt Engineering e benchmarking di modelli di intelligenza artificiale per sviluppatori.',
    purpose: 'Sperimentare contesti LLM, misurare la latenza dei prompt ed ottimizzare la generazione di codice in tempo reale.',
    route: '/tools/neural-playground'
  },
  {
    id: 'terminal',
    name: 'Terminal Web Shell',
    version: 'v2.0.0',
    badge: 'CLI & SDK',
    icon: '💻',
    description: 'Web CLI in-browser ad alte prestazioni per interagire con le API di DevKernelPulse e l\'SDK proprietario.',
    purpose: 'Eseguire comandi di sistema, interrogare endpoint API blindati e gestire i certificati direttamente dalla shell browser.',
    route: '/tools/terminal'
  },
  {
    id: 'ai-scanner',
    name: 'AI Code Scanner v2',
    version: 'v2.1.0',
    badge: 'SECURITY AUDIT',
    icon: '🔍',
    description: 'Motore di audit automatico per la scansione delle vulnerabilità del codice sorgente, mem-leak e security flaw.',
    purpose: 'Analizzare snippet e repository per rilevare falla di sicurezza prima del deploy in produzione.',
    route: '/tools/ai-scanner'
  },
  {
    id: 'proof-of-code',
    name: 'Proof of Code (Vault)',
    version: 'v2.0.2',
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
      <h1>I Nostri <span class="highlight">DKP Tools v2.0</span> & Auth Core</h1>
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
            <span class="tool-badge">{{ tool.badge }}</span>
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
          Apri {{ tool.name }} ⚡
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
  color: #f8fafc;
}

.hero-header {
  text-align: center;
  margin-bottom: 3.5rem;
}

.pill-tag {
  background: rgba(0, 220, 130, 0.12);
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.3);
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.hero-header h1 {
  font-size: 2.5rem;
  font-weight: 900;
  margin: 1rem 0 0.5rem;
}

.highlight { color: #00dc82; }
.subtitle { color: #94a3b8; font-size: 1.05rem; max-width: 650px; margin: 0 auto; }

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3.5rem;
}

.tool-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, border-color 0.2s;
}

.tool-card:hover {
  border-color: #00dc82;
  transform: translateY(-4px);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.icon-box { font-size: 2.2rem; }

.version-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.tool-badge {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.version-num { font-size: 0.75rem; color: #64748b; font-weight: 700; }

.tool-card h2 { font-size: 1.3rem; margin: 0 0 0.5rem; color: #ffffff; }
.desc { color: #cbd5e1; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1rem; }

.purpose-box {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 0.85rem;
  margin-bottom: 1.5rem;
  flex: 1;
}

.purpose-box strong { display: block; font-size: 0.8rem; color: #00dc82; margin-bottom: 0.3rem; }
.purpose-box p { margin: 0; font-size: 0.82rem; color: #94a3b8; line-height: 1.4; }

.launch-btn {
  background: #00dc82;
  color: #020420;
  text-align: center;
  font-weight: 800;
  font-size: 0.9rem;
  padding: 0.75rem;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.2s;
}

.launch-btn:hover { background: #00bf71; }

.copyright-notice-box {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 2rem;
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.notice-icon { font-size: 2.5rem; }
.notice-content h3 { margin: 0 0 0.5rem; color: #ffffff; }
.notice-content p { margin: 0 0 0.75rem; color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }
.notice-links a { color: #00dc82; font-weight: 700; text-decoration: none; font-size: 0.88rem; }
.notice-links a:hover { text-decoration: underline; }
</style>