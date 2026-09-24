<!-- app/layouts/default.vue -->
<template>
  <div class="default-layout">
    <!-- Usiamo ESPLICITAMENTE Navbar.vue -->
    <Navbar />
    
    <main class="main-content">
      <slot />
    </main>

    <!-- Usiamo ESPLICITAMENTE AppFooter.vue -->
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
}

.main-content {
  flex: 1;
}
</style>