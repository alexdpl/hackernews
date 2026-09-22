<!-- app/pages/about.vue -->
<script setup lang="ts">
useSeoMeta({
  title: 'Chi Siamo - DevKernelPulse',
  description: 'Scopri la missione di DevKernelPulse, il punto di riferimento per gli sviluppatori in Italia.'
})
</script>

<template>
  <div class="page-container">
    <div class="content-card">
      <h1>Chi Siamo • <span class="brand">DevKernelPulse</span></h1>
      <p class="lead">
        <strong>DevKernelPulse (DKP)</strong> nasce con una missione audace e cristallina: diventare il punto di incontro definitivo, indipendente e tecnicamente avanzato per la community di sviluppatori, ingegneri software e maker in Italia.
      </p>

      <h2>La Nostra Filosofia</h2>
      <p>
        Nel panorama tech odierno saturo di rumore digitale e social network generalisti, DKP recupera il valore autentico del dibattito tecnico: <strong>qualità del codice, architetture scalabili, open source e innovazione reale</strong>. Niente metriche di vanità, solo contenuti di valore che fanno pulsare il cuore del kernel tecnologico italiano.
      </p>

      <h2>Chi c'è dietro il progetto</h2>
      <p>
        Creato con passione da <strong>Alessandro De Paola</strong> in stretta sinergia con l'intelligenza artificiale avanzata (Gemini AI), DKP dimostra come la fusione tra visione umana e automazione intelligente possa dare vita a un ecosistema software moderno, fulmineo e curato nei minimi dettagli.
      </p>

      <div class="cta-box">
        <h3>Unisciti alla rivoluzione tech italiana 🚀</h3>
        <p>Condividi i tuoi progetti, discuti le ultime novità sui framework o trova il tuo prossimo impiego nel settore.</p>
        <NuxtLink to="/submit" class="cta-btn">Invia il tuo primo link</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  max-width: 800px;
  margin: 2.5rem auto;
  padding: 0 1rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
  color: #020420;
}
.content-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 2.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
}
h1 {
  font-size: 1.8rem;
  margin-bottom: 1rem;
}
.brand {
  color: #00dc82;
  background: #020420;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}
.lead {
  font-size: 1.1rem;
  color: #334155;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}
h2 {
  font-size: 1.3rem;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  color: #0f172a;
}
p {
  color: #475569;
  line-height: 1.6;
  margin-bottom: 1rem;
}
.cta-box {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-left: 4px solid #00dc82;
  padding: 1.5rem;
  border-radius: 6px;
  margin-top: 2rem;
  text-align: center;
}
.cta-box h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #020420;
}
.cta-btn {
  display: inline-block;
  margin-top: 1rem;
  background: #020420;
  color: #00dc82;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 700;
  text-decoration: none;
}
.cta-btn:hover {
  opacity: 0.9;
}
</style>