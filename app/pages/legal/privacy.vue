<!-- app/pages/legal/privacy.vue -->
<script setup lang="ts">
useDkpSeo({
  title: 'Privacy Policy & Cookie Session DKP',
  description: 'Informativa sul trattamento dei dati personali, gestione dkp_session cookies e sicurezza dei dati su Neon PostgreSQL.'
})
</script>

<template>
  <div class="legal-page-container">
    <div class="legal-card">
      <div class="legal-header">
        <span class="legal-badge">DATA PROTECTION</span>
        <h1>Informativa sulla <span class="highlight">Privacy & Cookie</span></h1>
        <p class="effective-date">Conforme al GDPR ed ai requisiti di sicurezza DKP Auth Core</p>
      </div>

      <div class="legal-body">
        <section>
          <h2>1. Raccolta e Tipologia dei Dati</h2>
          <p>
            DevKernelPulse raccoglie esclusivamente i dati necessari per erogare i propri servizi di autenticazione e sicurezza:
          </p>
          <ul>
            <li><strong>Dati di Registrazione:</strong> Username, indirizzo Email, Password hash e ruoli utente.</li>
            <li><strong>OAuth Social Data:</strong> Identificativi pubblici provenienti da GitHub, Google, GitLab e LinkedIn in fase di autenticazione rapida.</li>
            <li><strong>Dati di Notarizzazione:</strong> Hash dei file e metadati caricati nel Proof of Code Vault (nessun codice sorgente viene salvato in chiaro se non espressamente richiesto).</li>
          </ul>
        </section>

        <section>
          <h2>2. Gestione Cookie & Sessioni (`dkp_session`)</h2>
          <p>
            DevKernelPulse utilizza un unico cookie di sessione primario denominato <code>dkp_session</code> per garantire l'idratazione dello stato dell'utente sia lato server (SSR Nitro) che lato client (Nuxt 4).
          </p>
          <p>
            Non utilizziamo cookie di tracciamento di terze parti a fini pubblicitari.
          </p>
        </section>

        <section>
          <h2>3. Protezione dei Dati & Infrastruttura GCP / Neon</h2>
          <p>
            Tutti i dati sono memorizzati in modo sicuro sul database distribuito <strong>Neon PostgreSQL</strong> con cifratura TLS/SSL in transito e a riposo. Le API ed i server di produzione risiedono su <strong>GCP Compute Engine</strong> sotto rigorosi parametri di sicurezza HTTP (nosniff, frame-deny, XSS protection).
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.legal-page-container { max-width: 900px; margin: 2rem auto; padding: 0 1.5rem; color: #f8fafc; }
.legal-card { background: #090d16; border: 1px solid #1e293b; border-radius: 14px; padding: 2.5rem; }
.legal-header { border-bottom: 1px solid #1e293b; padding-bottom: 1.5rem; margin-bottom: 2rem; }
.legal-badge { background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.3); }
.legal-header h1 { font-size: 2rem; font-weight: 800; margin: 0.75rem 0 0.3rem; }
.highlight { color: #00dc82; }
.effective-date { color: #64748b; font-size: 0.85rem; margin: 0; }
.legal-body section { margin-bottom: 2rem; }
.legal-body h2 { font-size: 1.25rem; color: #38bdf8; margin-bottom: 0.75rem; }
.legal-body p { color: #cbd5e1; font-size: 0.95rem; line-height: 1.6; margin: 0 0 0.75rem; }
.legal-body code { background: #020420; color: #00dc82; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700; }
.legal-body ul { color: #cbd5e1; font-size: 0.95rem; line-height: 1.6; padding-left: 1.25rem; }
.legal-body li { margin-bottom: 0.4rem; }
</style>