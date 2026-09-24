<!-- app/layouts/default.vue -->
<template>
  <div class="default-layout">
    <!-- Navbar Unica Master DKP -->
    <Navbar />
    
    <!-- Contenuto Principale della Pagina -->
    <main class="main-content">
      <slot />
    </main>

    <!-- Footer dell'Ecosistema DKP -->
    <AppFooter />
  </div>
</template>

<style scoped>
.default-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #020420;
  color: #f8fafc;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.main-content {
  flex: 1;
  width: 100%;
}
</style>