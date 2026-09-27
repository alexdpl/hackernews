<!-- app/layouts/default.vue -->
<script setup lang="ts">
// Layout Master DKP v2.3
// Nessun import manuale necessario: Nuxt auto-importa DkpPulseNexus da app/components/
</script>

<template>
  <div class="default-layout">
    <!-- Navbar Master DKP -->
    <Navbar />
    
    <!-- Contenuto Principale delle Pagine -->
    <main class="main-content">
      <slot />
    </main>

    <!-- Footer DKP -->
    <AppFooter />

    <!-- CHAT FLUTTUANTE NEXUS (Auto-importato) -->
    <DkpPulseNexus />
  </div>
</template>

<style scoped>
.default-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #020420;
  color: #f8fafc;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
}

.main-content {
  flex: 1;
  width: 100%;
}
</style>