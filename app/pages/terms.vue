<!-- app/pages/terms.vue -->
<script setup lang="ts">
useSeoMeta({
  title: 'Termini d\'Uso - DevKernelPulse',
  description: 'Termini e condizioni per l\'utilizzo della piattaforma DevKernelPulse.'
})
</script>

<template>
  <div class="page-container">
    <div class="content-card">
      <h1>Termini d'Uso</h1>
      <p class="lead">
        Utilizzando DevKernelPulse, accetti i presenti termini di servizio, formulati per garantire un ambiente sicuro e collaborativo.
      </p>

      <h2>Account e Sicurezza</h2>
      <p>
        Gli utenti sono responsabili della sicurezza del proprio account e delle azioni compiute tramite le credenziali di accesso o i sistemi di autenticazione social associati.
      </p>

      <h2>Proprietà dei Contenuti</h2>
      <p>
        I contenuti inviati dagli utenti rimangono di proprietà dei rispettivi autori, i quali concedono a DevKernelPulse il diritto di visualizzarli e distribuirli all'interno della piattaforma.
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