<!-- app/layouts/default.vue -->
<script setup lang="ts">
// Layout Master DKP v2.5
// Navbar e AppFooter vengono caricati automaticamente da app/components/
</script>

<template>
  <div class="default-layout min-h-screen flex flex-col bg-[#020617] text-slate-100">
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
  background-color: #020617;
  color: #f8fafc;
  /* 🟢 Assicuriamo che non ci siano proprietà di overflow che rompono gli elementi sticky */
  overflow: visible;
}

.main-content {
  flex: 1;
  width: 100%;
  position: relative;
}
</style>