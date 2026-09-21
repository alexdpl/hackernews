<!-- app/components/AppFooter.vue -->
<template>
  <footer class="app-footer">
    <div class="footer-container">
      <p class="footer-text">
     © 2026 <strong>DevKernelPulse</strong> — Proudly built with ❤️ by Alessandro De Paola & Gemini AI. Tutti i Diritti sono Riservati.
      </p>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background-color: #020420;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1.2rem 1.25rem;
  text-align: center;
  margin-top: auto;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-text {
  color: #a1a1aa;
  font-size: 0.85rem;
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.footer-text strong {
  color: #00dc82;
  font-weight: 600;
}
</style>