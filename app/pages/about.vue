<!-- app/pages/about.vue -->
<template>
  <div class="info-page">
    <h1>Chi Siamo & Scopo del Progetto</h1>
    <p class="subtitle">La casa digitale per sviluppatori, maker e appassionati di tecnologia.</p>

    <section class="info-section">
      <h2>🚀 Cos'è DevKernelPulse?</h2>
      <p>
        <strong>DevKernelPulse</strong> nasce come piattaforma aperta d'informazione e confronto per la community tech.
        Ispirata al modello di Hacker News, la nostra missione è offrire uno spazio pulito, essenziale e privo di distrazioni
        dove condividere notizie, progetti open source, domande tecniche e opportunità di lavoro.
      </p>
    </section>

    <section class="info-section">
      <h2>💡 La Nostra Philosophie</h2>
      <ul>
        <li><strong>Contenuti di Qualità:</strong> Notizie reali curate e votate direttamente dagli utenti.</li>
        <li><strong>Nessun Algoritmo Oscuro:</strong> L'ordine dei post è dettato dalla community e dalla data di pubblicazione.</li>
        <li><strong>Trasparenza Tech:</strong> Piattaforma sviluppata in Nuxt 4, Nitro e Neon PostgreSQL.</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.info-page { max-width: 800px; margin: 2rem auto; padding: 1.5rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; font-family: ui-sans-serif, system-ui, sans-serif; }
h1 { color: #020420; font-size: 1.6rem; margin-bottom: 0.3rem; }
.subtitle { color: #64748b; font-size: 0.95rem; margin-bottom: 1.5rem; }
.info-section { margin-bottom: 1.5rem; }
h2 { color: #020420; font-size: 1.15rem; margin-bottom: 0.5rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.3rem; }
p, li { color: #334155; font-size: 0.9rem; line-height: 1.6; }
ul { padding-left: 1.2rem; }
</style>