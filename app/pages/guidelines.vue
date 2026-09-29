<!-- app/pages/guidelines.vue -->
<template>
  <div class="guidelines-page-container">
    <div class="guidelines-card">
      
      <!-- BADGE CATEGORIA -->
      <div class="guidelines-badge">
        COMMUNITY & CODE OF CONDUCT
      </div>

      <!-- TITOLO E METADATI -->
      <h1 class="guidelines-title">
        Linee Guida della <span class="highlight-text">Community</span>
      </h1>
      <p class="guidelines-subtitle">
        Regole d'oro per mantenere DevKernelPulse un hub tecnico ad alto valore aggiunto | Versione Ecosistema v2.4-Gold
      </p>

      <hr class="guidelines-divider" />

      <!-- INTRODUZIONE -->
      <p class="intro-text">
        Per mantenere <strong>DevKernelPulse (DKP)</strong> uno spazio stimolante, pulito e ricco di contenuti tecnici di alto livello, chiediamo a tutti i membri di seguire poche e semplici regole d'oro.
      </p>

      <!-- SEZIONE 1: QUALITÀ E PERTINENZA -->
      <section class="guidelines-section">
        <h2>1. Qualità e Pertinenza Tech</h2>
        <p>
          Invia storie, link, domande (<em>Ask DKP</em>) e progetti (<em>Show DKP</em>) che interessino direttamente sviluppatori, sistemisti, devops, data scientist, ingegneri AI e fondatori di startup tech:
        </p>
        <ul class="styled-list">
          <li><strong>Contenuti ammessi:</strong> Architetture software, benchmark, analisi del codice, novità open source, post-mortem di incidenti tecnici e guide approfondite.</li>
          <li><strong>Contenuti vietati:</strong> Marketing aggressivo, link affiliate, promozioni commerciali superficiali, clickbait o comunicati stampa privi di sostanza tecnica.</li>
        </ul>
      </section>

      <!-- SEZIONE 2: DISCUSSIONI COSTUTTIVE -->
      <section class="guidelines-section">
        <h2>2. Discussioni Costruttive e Rigore Tecnico</h2>
        <p>
          Nei commenti e nei post, punta sempre all'eccellenza e alla precisione. L'argomentazione logica e il rispetto reciproco sono il pilastro della nostra crescita collettiva:
        </p>
        <ul class="styled-list">
          <li><strong>Discuti le idee, non le persone:</strong> Il dibattito acceso sulle scelte architetturali o sui linguaggi è benvenuto, gli attacchi personali (ad hominem) non sono tollerati.</li>
          <li><strong>Aporta valore:</strong> Se esprimi un disaccordo, spiega il <em>perché</em> fornendo esempi di codice, documentazione o casi d'uso reali.</li>
        </ul>
      </section>

      <!-- SEZIONE 3: TRASPARENZA JOB E SHOW DKP -->
      <section class="guidelines-section">
        <h2>3. Trasparenza nei Job e Show DKP</h2>
        <div class="rule-box">
          <div class="rule-item">
            <strong>💼 Offerte di Lavoro (Job Board):</strong>
            <span>Includi sempre lo stack tecnologico richiesto, il range salariale o di compensation (se applicabile) e la modalità di lavoro (Remote, Hybrid, Onsite).</span>
          </div>
          <div class="rule-item">
            <strong>🚀 Show DKP:</strong>
            <span>Se mostri un tuo progetto o una tua libreria open source, sii pronto a condividere dettagli tecnici, ricevere feedback costruttivi e spiegare le scelte di sviluppo.</span>
          </div>
        </div>
      </section>

      <!-- SEZIONE 4: USO RESPONSABILE DI AI & DKP TOOLS -->
      <section class="guidelines-section">
        <h2>4. Uso Responsabile di DKP Tools & Pulse Nexus</h2>
        <p>
          L'ecosistema DKP v2.4-Gold mette a disposizione strumenti avanzati in-browser (Pulse Nexus AI, DKP Web Shell, Neural Playground). Chiediamo di utilizzarli responsabilmente:
        </p>
        <ul class="styled-list">
          <li><strong>No Spam/Automazioni:</strong> È vietato abusare delle API di Pulse Nexus o del sistema di XP Gamification tramite bot o script automatici.</li>
          <li><strong>Sicurezza del Codice:</strong> Non inserire credenziali, chiavi API private o codice sensibile coperte da NDA durante i test negli strumenti di scansione.</li>
        </ul>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Linee Guida della Community - DevKernelPulse v2.4-Gold',
  meta: [
    { name: 'description', content: 'Linee guida, codice di condotta e regole di pubblicazione per la community di DevKernelPulse v2.4-Gold.' }
  ]
})
</script>

<style scoped>
.guidelines-page-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #f8fafc;
}

.guidelines-card {
  background: rgba(9, 13, 22, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
}

/* BADGE */
.guidelines-badge {
  display: inline-block;
  background: rgba(0, 220, 130, 0.12);
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.3);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  margin-bottom: 1.25rem;
  text-transform: uppercase;
}

/* TYPOGRAPHY */
.guidelines-title {
  font-size: 2.25rem;
  font-weight: 900;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.highlight-text {
  color: #00dc82;
}

.guidelines-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 1.5rem 0;
}

.guidelines-divider {
  border: 0;
  height: 1px;
  background: #1e293b;
  margin: 1.5rem 0 2rem 0;
}

.intro-text {
  font-size: 1rem;
  line-height: 1.65;
  color: #e2e8f0;
  margin-bottom: 2rem;
}

/* SECTIONS */
.guidelines-section {
  margin-bottom: 2rem;
}

.guidelines-section h2 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #38bdf8;
  margin-bottom: 0.75rem;
}

.guidelines-section p {
  font-size: 0.93rem;
  line-height: 1.65;
  color: #cbd5e1;
  margin: 0 0 0.75rem 0;
}

/* LISTS */
.styled-list {
  list-style: none;
  padding-left: 0;
  margin: 0.75rem 0 1.25rem 0;
}

.styled-list li {
  position: relative;
  padding-left: 1.5rem;
  margin-bottom: 0.6rem;
  font-size: 0.9rem;
  color: #cbd5e1;
  line-height: 1.55;
}

.styled-list li::before {
  content: "▹";
  position: absolute;
  left: 0;
  color: #00dc82;
  font-weight: bold;
}

/* RULE BOX */
.rule-box {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.75rem;
}

.rule-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.rule-item strong {
  font-size: 0.9rem;
  color: #00dc82;
}

.rule-item span {
  font-size: 0.85rem;
  color: #94a3b8;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .guidelines-card {
    padding: 1.5rem;
  }
  .guidelines-title {
    font-size: 1.65rem;
  }
}
</style>