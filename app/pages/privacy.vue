<!-- app/pages/privacy.vue -->
<script setup lang="ts">
useSeoMeta({
  title: 'Privacy & Cookie - DevKernelPulse',
  description: 'Informativa sulla privacy e gestione dei cookie su DevKernelPulse.'
})
</script>

<template>
  <div class="page-container">
    <div class="content-card">
      <h1>Privacy & Cookie Policy</h1>
      <p class="lead">
        La tua privacy è fondamentale per noi. DevKernelPulse raccoglie esclusivamente i dati essenziali al funzionamento della piattaforma e dell'autenticazione utente.
      </p>

      <h2>Raccolta dei Dati</h2>
      <p>
        Memorizziamo unicamente le informazioni minime necessarie per gestire il profilo utente (username, preferenze di accesso tramite cookie di sessione sicuri) e i contenuti pubblicati.
      </p>

      <h2>Cookie Tecnici</h2>
      <p>
        Utilizziamo cookie tecnici strettamente necessari per mantenere attiva la sessione di login. Non effettuiamo profilazione commerciale invasiva o tracciamenti pubblicitari di terze parti.
      </p>
    </div>
  </div>
</template>

<style scoped>
.page-container { max-width: 800px; margin: 2.5rem auto; padding: 0 1rem; font-family: ui-sans-serif, system-ui, sans-serif; color: #020420; }
.content-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 2.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
h1 { font-size: 1.8rem; margin-bottom: 1rem; color: #020420; }
.lead { font-size: 1.1rem; color: #334155; line-height: 1.6; margin-bottom: 1.5rem; }
h2 { font-size: 1.3rem; margin-top: 2rem; margin-bottom: 0.75rem; color: #0f172a; }
p { color: #475569; line-height: 1.6; margin-bottom: 1rem; }
</style>