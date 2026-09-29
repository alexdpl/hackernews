<!-- app/pages/cookie-policy.vue -->
<template>
  <div class="legal-page-container">
    <div class="legal-card">
      
      <!-- BADGE CATEGORIA -->
      <div class="legal-badge">
        LEGAL & COMPLIANCE
      </div>

      <!-- TITOLO E METADATI -->
      <h1 class="legal-title">
        Cookie Policy & <span class="highlight-text">Gestione Dati</span>
      </h1>
      <p class="legal-subtitle">
        Ultimo aggiornamento: Settembre 2026 | Versione Ecosistema v2.4-Gold
      </p>

      <hr class="legal-divider" />

      <!-- SEZIONE 1 -->
      <section class="policy-section">
        <h2>1. Filosofia Zero-Profilazione</h2>
        <p>
          La tua privacy è un pilastro fondamentale dell'architettura di <strong>DevKernelPulse (DKP v2.4-Gold)</strong>. 
          Raccogliamo ed elaboriamo esclusivamente il minimo indispensabile dei dati tecnici necessari al corretto funzionamento della piattaforma, dell'autenticazione e dei servizi integrati nel DKP Auth Core.
        </p>
      </section>

      <!-- SEZIONE 2 -->
      <section class="policy-section">
        <h2>2. Cookie Tecnici Strettamente Necessari</h2>
        <p>
          Utilizziamo unicamente cookie tecnici di prima parte. Questi cookie sono indispensabili per mantenere attiva la sessione utente e proteggere l'infrastruttura da accessi non autorizzati:
        </p>
        
        <div class="cookie-table-wrapper">
          <table class="cookie-table">
            <thead>
              <tr>
                <th>Nome Cookie</th>
                <th>Tipologia</th>
                <th>Scopo & Funzione</th>
                <th>Durata</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code class="code-badge">dkp_session</code></td>
                <td>Tecnico / Essenziale</td>
                <td>Mantiene lo stato di autenticazione sicuro dell'utente (HTTP-Only / Secure) nel DKP Auth Core.</td>
                <td>Sessione / 30 Giorni</td>
              </tr>
              <tr>
                <td><code class="code-badge">dkp_lang</code></td>
                <td>Preferenza</td>
                <td>Memorizza la lingua selezionata dall'utente per l'interfaccia (es. IT/EN).</td>
                <td>1 Anno</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- SEZIONE 3 -->
      <section class="policy-section">
        <h2>3. Archiviazione Locale & State Persistence</h2>
        <p>
          Per ottimizzare le prestazioni e ridurre la latenza di rete verso il database Neon Kernel, utilizziamo lo storage del browser (<code>LocalStorage</code> / <code>SessionStorage</code>) esclusivamente per memorizzare:
        </p>
        <ul class="styled-list">
          <li>Stato della cache XP e livello Gamification (es. badge <em>Kernel Initiate</em>).</li>
          <li>Stato di apertura/chiusura dell'agente virtuale <strong>Pulse Nexus</strong>.</li>
          <li>Preferenze di layout della DKP Web Shell e del Playground.</li>
        </ul>
      </section>

      <!-- SEZIONE 4 -->
      <section class="policy-section">
        <h2>4. Assenza di Cookie di Terze Parti</h2>
        <p>
          <strong>DevKernelPulse non utilizza cookie di profilazione commerciale, né tracciatori pubblicitari di terze parti.</strong> 
          Non vendiamo, cediamo o condividiamo i tuoi dati di navigazione con broker pubblicitari o network esterni.
        </p>
      </section>

      <!-- SEZIONE 5 -->
      <section class="policy-section">
        <h2>5. Gestione e Disabilitazione dei Cookie</h2>
        <p>
          Puoi disabilitare o cancellare i cookie in qualsiasi momento attraverso le impostazioni del tuo browser. Tuttavia, la disattivazione del cookie essenziale <code>dkp_session</code> impedirà l'accesso alle aree riservate della piattaforma e ai DKP Tools v2.3.
        </p>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Cookie Policy - DevKernelPulse v2.3',
  meta: [
    { name: 'description', content: 'Informativa sui cookie e la gestione della privacy per la piattaforma DevKernelPulse v2.3.' }
  ]
})
</script>

<style scoped>
.legal-page-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #f8fafc;
}

.legal-card {
  background: rgba(9, 13, 22, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
}

/* BADGE */
.legal-badge {
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
.legal-title {
  font-size: 2.25rem;
  font-weight: 900;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.highlight-text {
  color: #00dc82;
}

.legal-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 1.5rem 0;
}

.legal-divider {
  border: 0;
  height: 1px;
  background: #1e293b;
  margin: 1.5rem 0 2rem 0;
}

/* SECTIONS */
.policy-section {
  margin-bottom: 2rem;
}

.policy-section h2 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #38bdf8;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.policy-section p {
  font-size: 0.93rem;
  line-height: 1.65;
  color: #cbd5e1;
  margin: 0 0 1rem 0;
}

/* LISTS */
.styled-list {
  list-style: none;
  padding-left: 0;
  margin: 0.75rem 0;
}

.styled-list li {
  position: relative;
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #cbd5e1;
}

.styled-list li::before {
  content: "▹";
  position: absolute;
  left: 0;
  color: #00dc82;
  font-weight: bold;
}

/* TABLE */
.cookie-table-wrapper {
  overflow-x: auto;
  margin-top: 1rem;
  border: 1px solid #1e293b;
  border-radius: 8px;
}

.cookie-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.85rem;
}

.cookie-table th {
  background: #020420;
  color: #94a3b8;
  padding: 0.75rem 1rem;
  font-weight: 700;
  border-bottom: 1px solid #1e293b;
}

.cookie-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #0f172a;
  color: #e2e8f0;
}

.cookie-table tr:last-child td {
  border-bottom: none;
}

.code-badge {
  background: #020420;
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.2);
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
}

@media (max-width: 640px) {
  .legal-card {
    padding: 1.5rem;
  }
  .legal-title {
    font-size: 1.65rem;
  }
}
</style>