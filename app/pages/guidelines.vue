<!-- app/pages/guidelines.vue -->
<template>
  <div class="info-page">
    <h1>Linee Guida della Community</h1>
    <p class="subtitle">Regole fondamentali per mantenere discussioni costruttive ed educati.</p>

    <section class="info-section">
      <h2>📌 Inviare un Contenuto</h2>
      <ul>
        <li><strong>Titoli Chiari:</strong> Utilizza il titolo originale dell'articolo o uno sintetico senza clickbait.</li>
        <li><strong>Pertinenza Tech:</strong> Condividi notizie legate a programmazione, scienza, startup, ingegneria e tecnologia.</li>
        <li><strong>Uso delle Categorie:</strong> Scegli con cura tra <em>Story</em>, <em>Ask</em>, <em>Show</em> e <em>Job</em>.</li>
      </ul>
    </section>

    <section class="info-section">
      <h2>💬 Commentare</h2>
      <ul>
        <li>Sii sempre rispettoso ed evita attacchi personali o toni aggressivi.</li>
        <li>Argomenta le tue opinioni fornendo spiegazioni e dettagli tecnici ove possibile.</li>
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