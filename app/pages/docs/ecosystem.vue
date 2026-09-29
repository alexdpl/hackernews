<!-- pages/docs/ecosystem.vue -->
<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'Guida Ecosistema & Architettura — DKP Docs',
  meta: [
    { name: 'description', content: 'Documentazione ufficiale sull\'architettura di DevKernelPulse, moduli proprietari e sistema di Gamification XP.' }
  ]
})

const activeSection = ref('architettura')

const sections = [
  { id: 'architettura', title: '🏗️ Architettura DKP', icon: '⚡' },
  { id: 'moduli', title: '🛠️ Moduli & Strumenti SaaS', icon: '🧩' },
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
          <h3>Ecosistema v2.4</h3>
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
          <div class="breadcrumb">Docs / Ecosistema & Architettura</div>
          <h1>DevKernelPulse Knowledge Base</h1>
          <p class="subtitle">
            Guida completa all'architettura modulare DKP, al motore di Proof of Code, all'integrazione IA e al sistema di reputazione decentralizzato.
          </p>
        </header>

        <!-- SEZIONE 1: ARCHITETTURA -->
        <section id="architettura" class="doc-section">
          <h2><span class="sec-icon">🏗️</span> Architettura di Sistema DKP</h2>
          <p>
            <strong>DevKernelPulse (DKP)</strong> è costruito secondo un paradigma micro-frontend ad alte prestazioni orientato agli eventi, alimentato da <strong>Nuxt 3 (Vue 3, Nitro Engine)</strong> nel layer di frontend e da microservizi Rust/Go per il processing crittografico.
          </p>

          <div class="architecture-grid">
            <div class="arch-card">
              <h4>🌐 Edge Processing & Crawler</h4>
              <p>Il crawler automatizzato DKP v2.4 estrae, analizza e vettorizza in tempo reale contenuti da GitHub, dev.to, Hacker News e feed RSS di sicurezza.</p>
            </div>
            <div class="arch-card">
              <h4>🛡️ Vault Crittografico</h4>
              <p>Hashing SHA-256 e notarizzazione Proof-of-Code direttamente in-memory con esportazione firmata crittograficamente in formato JSON-LD/Proof.</p>
            </div>
            <div class="arch-card">
              <h4>🧠 Neural Inference Gateway</h4>
              <p>Pipeline multi-LLM che gestisce sia i prompt di testing nel Playground sia l'analisi statica di sicurezza del codice con tempo di risposta &lt; 150ms.</p>
            </div>
          </div>
        </section>

        <!-- SEZIONE 2: MODULI & STRUMENTI -->
        <section id="moduli" class="doc-section">
          <h2><span class="sec-icon">🛠️</span> Moduli Proprietari DKP</h2>
          <p>La piattaforma è strutturata in strumenti specializzati focalizzati sulla produttività dello sviluppatore e sulla notarizzazione del software:</p>

          <div class="module-list">
            <div class="module-box">
              <div class="mod-header">
                <span class="mod-icon">🛡️</span>
                <h3>Proof of Code (Vault)</h3>
              </div>
              <p>Consente di generare un'impronta digitale immutabile del tuo sorgente o algoritmo. Utile per dimostrare la titolarità intellettuale del codice prima del rilascio pubblico.</p>
            </div>

            <div class="module-box">
              <div class="mod-header">
                <span class="mod-icon">🔍</span>
                <h3>AI Code Scanner v2.3</h3>
              </div>
              <p>Analizzatore di vulnerabilità (SAST/DAST) potenziato da modelli IA che rileva secret leaking, SQLi, Buffer Overflow e antipattern in oltre 18 linguaggi.</p>
            </div>

            <div class="module-box">
              <div class="mod-header">
                <span class="mod-icon">💻</span>
                <h3>Terminal Web Shell</h3>
              </div>
              <p>Un ambiente CLI in-browser completamente simulato basato su xterm.js per interrogare l'API DKP, eseguire comandi rapido ed emulare scenari devops.</p>
            </div>

            <div class="module-box">
              <div class="mod-header">
                <span class="mod-icon">🧠</span>
                <h3>Neural Playground</h3>
              </div>
              <p>Ambiente di testing sandbox per ottimizzare prompt per la generazione di codice, il refactoring automatico e l'audit logico delle funzioni.</p>
            </div>
          </div>
        </section>

        <!-- SEZIONE 3: GAMIFICATION & XP -->
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
                <td><strong>Submit Link / Articolo</strong></td>
                <td><span class="xp-badge">+15 XP</span></td>
                <td>Curator Badge</td>
              </tr>
              <tr>
                <td><strong>Notarizzazione Code Vault</strong></td>
                <td><span class="xp-badge">+25 XP</span></td>
                <td>Vault Guardian</td>
              </tr>
              <tr>
                <td><strong>Audit Codice con AI Scanner</strong></td>
                <td><span class="xp-badge">+10 XP</span></td>
                <td>SecInspector</td>
              </tr>
              <tr>
                <td><strong>Upvote o Commento Utile</strong></td>
                <td><span class="xp-badge">+5 XP</span></td>
                <td>Community Pulse</td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- SEZIONE 4: BEST PRACTICES -->
        <section id="best-practices" class="doc-section">
          <h2><span class="sec-icon">💡</span> Best Practices per gli Sviluppatori</h2>
          <div class="tip-box">
            <h4>⚡ Integrazione CI/CD Raccomandata</h4>
            <p>Usa la CLI DKP o gli endpoint API nel tuo workflow di GitHub Actions per automatizzare la scansione di sicurezza e la notarizzazione ad ogni <code>git push main</code>.</p>
          </div>
          <div class="tip-box green">
            <h4>🔑 Sicurezza delle API Key</h4>
            <p>Non committare mai la tua <code>DKP-Api-Key</code> nei repository pubblici. Utilizza sempre variabili d'ambiente protette come <code>DKP_TOKEN</code>.</p>
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

.tip-box h4 {
  margin: 0 0 0.3rem;
  color: #ffffff;
}
</style>