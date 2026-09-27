<!-- app/layouts/default.vue -->
<script setup lang="ts">
// Layout Master DKP v2.4
// Nuxt auto-importa Navbar, AppFooter e DkpPulseNexus da app/components/
</script>

<template>
  <div class="default-layout">
    <!-- Navbar Master DKP -->
    <Navbar />

    <!-- Contenuto Principale delle Pagine (UNICO SLOT) -->
    <main class="main-content">
      <slot />
    </main>

    <!-- Footer DKP -->
    <AppFooter />

    <!-- CHAT FLUTTUANTE NEXUS -->
    <DkpPulseNexus />
  </div>
</template>

<style scoped>
.default-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #020617;
  color: #f8fafc;
}

.main-content {
  flex: 1;
  width: 100%;
}
</style>