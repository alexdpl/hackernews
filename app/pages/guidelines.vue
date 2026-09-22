<!-- app/pages/guidelines.vue -->
<script setup lang="ts">
useSeoMeta({
  title: 'Linee Guida - DevKernelPulse',
  description: 'Regole e standard di qualità per la pubblicazione e la discussione su DevKernelPulse.'
})
</script>

<template>
  <div class="page-container">
    <div class="content-card">
      <h1>Linee Guida della Community</h1>
      <p class="lead">
        Per mantenere DevKernelPulse uno spazio stimolante, pulito e ricco di contenuti tecnici di alto livello, chiediamo a tutti i membri di seguire poche e semplici regole d'oro.
      </p>

      <h2>1. Qualità e Pertinenza Tech</h2>
      <p>
        Invia storie, link, domande (Ask HN) e show case che interessino direttamente sviluppatori, sistemisti, data scientist e fondatori di startup. Evita contenuti promozionali superficiali o clickbait commerciali.
      </p>

      <h2>2. Discussioni Costruttive</h2>
      <p>
        Nei commenti e nei post, punta sempre al rigore tecnico. Discuti le idee, non le persone. L'argomentazione logica e il rispetto reciproco sono il pilastro della nostra crescita collettiva.
      </p>

      <h2>3. Trasparenza nei Job e Show</h2>
      <p>
        Se pubblichi un'offerta di lavoro, includi sempre stack tecnologico e dettagli chiari. Se mostri un tuo progetto (Show DKP), sii pronto a ricevere feedback tecnici e a condividere l'esperienza di sviluppo.
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