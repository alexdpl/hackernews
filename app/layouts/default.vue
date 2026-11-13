<!-- app/layouts/default.vue -->
<script setup lang="ts">
// Layout Master DKP v2.6
// Navbar e AppFooter vengono caricati automaticamente da app/components/
</script>

<template>
  <div class="default-layout min-h-screen flex flex-col transition-colors duration-500">
    <!-- Navbar Master DKP -->
    <Navbar />

    <!-- Contenuto Principale delle Pagine (UNICO SLOT) -->
    <main class="main-content flex-1 w-full">
      <slot />
    </main>

    <!-- Footer DKP -->
    <AppFooter />
  </div>
</template>

<style scoped>
.default-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  /* Utilizziamo le variabili globali definite in main.css */
  background-color: var(--bg-kernel);
  color: var(--text-main);
  /* Assicuriamo che non ci siano proprietà di overflow che rompono gli elementi sticky */
  overflow: visible;
}

.main-content {
  flex: 1;
  width: 100%;
  position: relative;
}
</style>