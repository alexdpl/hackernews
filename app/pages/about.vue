<!-- app/pages/about.vue -->
<template>
  <div class="about-page-container">
    <div class="about-card">
      
      <!-- BADGE CATEGORIA -->
      <div class="about-badge">
        ECOSYSTEM & MISSION
      </div>

      <!-- TITOLO E METADATI -->
      <h1 class="about-title">
        Chi Siamo • <span class="highlight-text">DevKernelPulse</span>
      </h1>
      <p class="about-subtitle">
        Piattaforma indipendente, fulminea e guidata dall'IA per sviluppatori e maker | Versione Ecosistema v2.4-Gold
      </p>

      <hr class="about-divider" />

      <!-- SEZIONE 1: MISSIONE -->
      <section class="about-section">
        <h2>1. La Missione DKP</h2>
        <p>
          <strong>DevKernelPulse (DKP)</strong> nasce con una missione audace e cristallina: diventare il punto di incontro definitivo, indipendente e tecnicamente avanzato per la community di sviluppatori, ingegneri software, architetti cloud e maker in Italia.
        </p>
      </section>

      <!-- SEZIONE 2: FILOSOFIA -->
      <section class="about-section">
        <h2>2. La Nostra Filosofia</h2>
        <p>
          Nel panorama tech odierno saturo di rumore digitale e social network generalisti, DKP recupera il valore autentico del dibattito tecnico:
        </p>
        <ul class="styled-list">
          <li><strong>Qualità del Codice:</strong> Focus su best practice, pattern architetturali e codice pulito.</li>
          <li><strong>Architetture Scalabili:</strong> Approfondimenti su microservizi, serverless e Kernel DB.</li>
          <li><strong>Open Source & Innovazione Reale:</strong> Valorizzazione dei progetti indipendenti e delle tecnologie emergenti.</li>
        </ul>
        <p>
          Niente metriche di vanità, solo contenuti ad alto valore che fanno pulsare il cuore del kernel tecnologico italiano.
        </p>
      </section>

      <!-- SEZIONE 3: ECOSISTEMA V2.3 -->
      <section class="about-section">
        <h2>3. L'Ecosistema Tecnologico v2.4-Gold</h2>
        <p>
          La versione 2.4-Gold di DevKernelPulse integra uno stack all'avanguardia progettato per offrire reattività e interattività estreme:
        </p>
        
        <div class="tech-grid">
          <div class="tech-card">
            <div class="tech-icon">⚡</div>
            <div class="tech-info">
              <strong>DKP Auth Core</strong>
              <span>Autenticazione proprietaria ad alte prestazioni con sessioni resilienti.</span>
            </div>
          </div>

          <div class="tech-card">
            <div class="tech-icon">🛠️</div>
            <div class="tech-info">
              <strong>DKP Tools Suite</strong>
              <span>Strumenti integrati in-browser per la diagnosi, scansione del codice e Web Shell.</span>
            </div>
          </div>

          <div class="tech-card">
            <div class="tech-icon">🤖</div>
            <div class="tech-info">
              <strong>Pulse Nexus Agent</strong>
              <span>Assistente AI integrato con gamification in tempo reale e tracciamento XP.</span>
            </div>
          </div>

          <div class="tech-card">
            <div class="tech-icon">🗄️</div>
            <div class="tech-info">
              <strong>Neon Kernel DB</strong>
              <span>Database Serverless Postgres per memorizzazione e sincronizzazione ultra-veloce.</span>
            </div>
          </div>
        </div>
      </section>

      <!-- SEZIONE 4: CHI C'È DIETRO IL PROGETTO -->
      <section class="about-section">
        <h2>4. Chi c'è dietro il progetto</h2>
        <div class="creator-box">
          <div class="creator-header">
            <span class="creator-avatar">👨‍💻</span>
            <div>
              <strong class="creator-name">Alessandro De Paola</strong>
              <span class="creator-role">Founder Creator & Lead Engineer Architect</span>
            </div>
          </div>
          <p class="creator-desc">
            Creato con passione da <strong>Alessandro De Paola</strong> in stretta sinergia con l'intelligenza artificiale avanzata (<strong>Gemini AI</strong>), DKP dimostra come la fusione tra visione umana, ingegneria del software e automazione intelligente possa dare vita a un ecosistema moderno, fulmineo e curato nei minimi dettagli.
          </p>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Chi Siamo - DevKernelPulse v2.4-Gold',
  meta: [
    { name: 'description', content: 'Scopri la missione, la filosofia e la tecnologia alla base di DevKernelPulse v2.3.' }
  ]
})
</script>

<style scoped>
.about-page-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #f8fafc;
}

.about-card {
  background: rgba(9, 13, 22, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
}

/* BADGE */
.about-badge {
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
.about-title {
  font-size: 2.25rem;
  font-weight: 900;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.highlight-text {
  color: #00dc82;
}

.about-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 1.5rem 0;
}

.about-divider {
  border: 0;
  height: 1px;
  background: #1e293b;
  margin: 1.5rem 0 2rem 0;
}

/* SECTIONS */
.about-section {
  margin-bottom: 2rem;
}

.about-section h2 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #38bdf8;
  margin-bottom: 0.75rem;
}

.about-section p {
  font-size: 0.93rem;
  line-height: 1.65;
  color: #cbd5e1;
  margin: 0 0 1rem 0;
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
  line-height: 1.5;
}

.styled-list li::before {
  content: "▹";
  position: absolute;
  left: 0;
  color: #00dc82;
  font-weight: bold;
}

/* TECH GRID */
.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.tech-card {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  transition: border-color 0.2s ease;
}

.tech-card:hover {
  border-color: rgba(0, 220, 130, 0.4);
}

.tech-icon {
  font-size: 1.4rem;
  line-height: 1;
}

.tech-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tech-info strong {
  font-size: 0.88rem;
  color: #f8fafc;
}

.tech-info span {
  font-size: 0.78rem;
  color: #94a3b8;
  line-height: 1.4;
}

/* CREATOR BOX */
.creator-box {
  background: #020420;
  border: 1px solid #1e293b;
  border-left: 4px solid #00dc82;
  border-radius: 10px;
  padding: 1.25rem;
  margin-top: 0.75rem;
}

.creator-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.creator-avatar {
  font-size: 1.6rem;
}

.creator-name {
  display: block;
  font-size: 0.95rem;
  color: #ffffff;
}

.creator-role {
  display: block;
  font-size: 0.75rem;
  color: #00dc82;
  font-weight: 700;
}

.creator-desc {
  font-size: 0.88rem !important;
  color: #94a3b8 !important;
  margin: 0 !important;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .about-card {
    padding: 1.5rem;
  }
  .about-title {
    font-size: 1.65rem;
  }
  .tech-grid {
    grid-template-columns: 1fr;
  }
}
</style>