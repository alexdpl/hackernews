<!-- app/pages/privacy.vue -->
<template>
  <div class="info-page">
    <h1>Informativa sulla Privacy & Cookie</h1>
    <p class="subtitle">Informativa sulla gestione dei dati personali.</p>

    <section class="info-section">
      <h2>🔒 Dati Raccoglibili</h2>
      <p>
        Rispettiamo la tua privacy. Non effettuiamo profilazione né tracciamenti commerciali. 
        Gli unici dati memorizzati temporaneamente sono necessari per prevenire voti doppi o abusi (come l'indirizzo IP).
      </p>
    </section>

    <section class="info-section">
      <h2>🍪 Cookie</h2>
      <p>Questa piattaforma utilizza unicamente cookie tecnici o storage locale strettamente necessari al funzionamento del sito.</p>
    </section>
  </div>
</template>

<style scoped>
.info-page { max-width: 800px; margin: 2rem auto; padding: 1.5rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; font-family: ui-sans-serif, system-ui, sans-serif; }
h1 { color: #020420; font-size: 1.6rem; margin-bottom: 0.3rem; }
.subtitle { color: #64748b; font-size: 0.95rem; margin-bottom: 1.5rem; }
.info-section { margin-bottom: 1.5rem; }
h2 { color: #020420; font-size: 1.15rem; margin-bottom: 0.5rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.3rem; }
p { color: #334155; font-size: 0.9rem; line-height: 1.6; }
</style>