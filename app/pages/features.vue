<!-- app/pages/features.vue -->
<template>
  <div class="features-page">
    <div class="features-container">
      <div class="header-section">
        <span class="badge-tag">DKP Ecosystem</span>
        <h1>Caratteristiche Uniche al Mondo</h1>
        <p>Esplora le tecnologie proprietarie che rendono <strong>DevKernelPulse</strong> l'ecosistema definitivo per sviluppatori e ingegneri di tutto il globo.</p>
      </div>

      <div class="features-grid">
        <div class="feature-card">
          <div class="card-icon">🛡️</div>
          <h3>Proof of Code</h3>
          <p>Il sistema di certificazione integrato che collega direttamente l'identità dello sviluppatore ai repository GitHub reali, tracciando commit, pull request e issue per calcolare il Karma ufficiale.</p>
        </div>

        <div class="feature-card">
          <div class="card-icon">⚡</div>
          <h3>AI Scanner</h3>
          <p>Un analizzatore intelligente capace di esaminare URL, sorgenti e notizie tecnologiche in tempo reale, estraendo insight avanzati e valutandone l'impatto sul panorama tech.</p>
        </div>

        <div class="feature-card">
          <div class="card-icon">💻</div>
          <h3>DKP Terminal</h3>
          <p>Interfaccia di comando immersiva in stile cyberpunk integrata nativamente nell'applicazione per l'interazione rapida con le funzioni di sistema e navigazione accelerata.</p>
        </div>

        <div class="feature-card">
          <div class="card-icon">🧠</div>
          <h3>Neural Code Playground</h3>
          <p>L'ambiente di esecuzione e testing interattivo dove gli sviluppatori possono testare snippet di codice (Rust, TypeScript, Python, Go) ricevendo istantaneamente audit e ottimizzazioni neurali.</p>
        </div>

        <div class="feature-card">
          <div class="card-icon">🌐</div>
          <h3>DKP Global Engine (Translator)</h3>
          <p>Motore e selettore di traduzione nativo ad alte prestazioni (supporto per Italiano, Inglese, Spagnolo, Francese, Tedesco e Cinese) progettato per azzerare i tempi di caricamento e unire la community tech globale senza barriere linguistiche.</p>
        </div>
      </div>

      <div class="copyright-box">
        <p>© 2026 <strong>DevKernelPulse</strong>. Tutti i diritti riservati. Progettato e sviluppato da Alessandro De Paola & Gemini AI. Qualsiasi riproduzione o utilizzo non autorizzato delle tecnologie proprietarie è severamente vietato.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.features-page {
  padding: 3rem 1.5rem;
  background-color: #fcfcfc;
  min-height: 80vh;
}

.features-container {
  max-width: 1100px;
  margin: 0 auto;
}

.header-section {
  text-align: center;
  margin-bottom: 3rem;
}

.badge-tag {
  background: rgba(0, 220, 130, 0.15);
  color: #00a862;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  border: 1px solid rgba(0, 220, 130, 0.3);
}

.header-section h1 {
  font-size: 2.2rem;
  color: #020420;
  font-weight: 800;
  margin-top: 1rem;
}

.header-section p {
  color: #64748b;
  font-size: 1.05rem;
  max-width: 650px;
  margin: 0.5rem auto 0;
}

.features-grid {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  display: grid;
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.feature-card {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 2rem;
  color: #ffffff;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, border-color 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  border-color: #00dc82;
}

.card-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #00dc82;
  margin-bottom: 0.75rem;
}

.feature-card p {
  color: #94a3b8;
  font-size: 0.95rem;
  line-height: 1.6;
}

.copyright-box {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  color: #64748b;
  font-size: 0.85rem;
  line-height: 1.5;
}

.copyright-box strong {
  color: #cbd5e1;
}
</style>