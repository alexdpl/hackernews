<!-- app/layouts/default.vue -->
<template>
  <div class="app-layout">
    <AppHeader />
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background-color: #f6f6ef;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex-grow: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}
</style>