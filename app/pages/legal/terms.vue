<!-- app/pages/legal/terms.vue -->
<script setup lang="ts">
useDkpSeo({
  title: 'Termini di Servizio & Copyright DKP',
  description: 'Condizioni generali d\'uso, copyright dell\'ecosistema DevKernelPulse, norme anti-abuso e licenza DKP Auth.'
})
</script>

<template>
  <div class="legal-page-container">
    <div class="legal-card">
      <div class="legal-header">
        <span class="legal-badge">LEGAL & COMPLIANCE</span>
        <h1>Termini di Servizio & <span class="highlight">Copyright Proprietario</span></h1>
        <p class="effective-date">Ultimo aggiornamento: Settembre 2026 | Versione Ecosistema v2.0</p>
      </div>

      <div class="legal-body">
        <section>
          <h2>1. Accettazione dei Termini</h2>
          <p>
            Accedendo ed utilizzando la piattaforma <strong>DevKernelPulse (DKP)</strong>, i DKP Tools v2.0 e il sistema di autenticazione DKP Auth Core, l'utente dichiara di aver letto, compreso ed accettato integralmente i presenti Termini di Servizio.
          </p>
        </section>

        <section>
          <h2>2. Ownership, Copyright & Diritti d'Autore</h2>
          <p>
            L'intero ecosistema DevKernelPulse — inclusi a titolo esemplificativo ma non esaustivo: il codice sorgente, il marchio DKP, la suite di strumenti <em>Neural Playground, Terminal Web Shell, AI Code Scanner v2, Proof of Code Vault</em>, le interfacce utente e la struttura del database — è protetto dalle leggi internazionali sul Copyright ed è di proprietà esclusiva di <strong>DevKernelPulse</strong>.
          </p>
          <ul>
            <li>È severamente vietata la riproduzione, duplicazione, decompilazione o reverse engineering dei software proprietari.</li>
            <li>È vietata la ridistribuzione dei pacchetti digitali `.ZIP` presenti nello Shop senza regolare licenza acquistata.</li>
          </ul>
        </section>

        <section>
          <h2>3. DKP Auth Core & Sicurezza degli Account</h2>
          <p>
            L'autenticazione è gestita tramite il modulo <strong>DKP Auth Core</strong>. L'utente è il solo responsabile della custodia delle proprie credenziali di accesso e delle sessioni attive. In caso di uso fraudolento o tentativi di bruteforce, l'account verrà sospeso con revoca istantanea delle chiavi API Vault.
          </p>
        </section>

        <section>
          <h2>4. Politica d'Uso Corretto (Fair Use) ed Abuso dei Tools</h2>
          <p>
            I DKP Tools sono messi a disposizione per scopi di sviluppo, audit e notarizzazione legit. Sono espressamente vietate le seguenti condotte:
          </p>
          <ul>
            <li>Automazione massiva priva di API Key ufficiale tramite bot o script non autorizzati.</li>
            <li>Utilizzo di AI Code Scanner per individuare ed esfiltrare vulnerabilità a fini malevoli.</li>
            <li>Attacchi DoS / DDoS o sovraccarico inteso sui server GCP Compute Engine di DKP.</li>
          </ul>
        </section>

        <section>
          <h2>5. Limitazione di Responsabilità</h2>
          <p>
            I DKP Tools e i certificati notarizzati Proof of Code sono forniti "così come sono" (AS-IS). DevKernelPulse non garantisce l'assenza totale di errori ed esclude qualsiasi responsabilità per danni indiretti derivanti dall'uso non corretto dei propri strumenti.
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
.legal-badge { background: rgba(0, 220, 130, 0.15); color: #00dc82; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 4px; border: 1px solid rgba(0, 220, 130, 0.3); }
.legal-header h1 { font-size: 2rem; font-weight: 800; margin: 0.75rem 0 0.3rem; }
.highlight { color: #00dc82; }
.effective-date { color: #64748b; font-size: 0.85rem; margin: 0; }
.legal-body section { margin-bottom: 2rem; }
.legal-body h2 { font-size: 1.25rem; color: #38bdf8; margin-bottom: 0.75rem; }
.legal-body p { color: #cbd5e1; font-size: 0.95rem; line-height: 1.6; margin: 0 0 0.75rem; }
.legal-body ul { color: #cbd5e1; font-size: 0.95rem; line-height: 1.6; padding-left: 1.25rem; }
.legal-body li { margin-bottom: 0.4rem; }
</style>