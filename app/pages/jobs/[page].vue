<template>
  <div class="jobs-page-container">
    <!-- Lista dei lavori (se presenti) -->
    <div v-if="jobs && jobs.length > 0" class="jobs-list">
      <!-- Il tuo ciclo v-for per i lavori esistenti va qui -->
    </div>

    <!-- Stato Vuoto Ottimizzato -->
    <div v-else class="empty-jobs-banner">
      Nessuna offerta di lavoro disponibile al momento. 
      Gli annunci aziendali vengono inseriti e verificati periodicamente dall'amministrazione.
    </div>
  </div>
</template>

<style scoped>
.jobs-page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.empty-jobs-banner {
  text-align: center;
  padding: 40px 20px;
  color: #4b5563; /* Grigio scuro leggibile */
  background-color: #f9fafb;
  border: 1px dashed #e5e7eb;
  border-radius: 6px;
  font-size: 15px;
  margin-top: 20px;
}
</style>