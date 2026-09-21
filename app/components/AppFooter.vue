<!-- app/components/AppFooter.vue -->
<template>
  <footer class="app-footer">
    <div class="footer-container">
      <!-- Navigazione Pagine Istituzionali -->
      <nav class="footer-nav">
        <NuxtLink to="/about">Chi Siamo</NuxtLink>
        <span class="sep">•</span>
        <NuxtLink to="/guidelines">Linee Guida</NuxtLink>
        <span class="sep">•</span>
        <NuxtLink to="/terms">Termini d'Uso</NuxtLink>
        <span class="sep">•</span>
        <NuxtLink to="/privacy">Privacy & Cookie</NuxtLink>
      </nav>

      <!-- Firma e Crediti -->
      <p class="footer-text">
      © 2026 <strong>DevKernelPulse</strong> — Proudly built with ❤️ by Alesandro De Paola & Gemini AI. Tutti i Diritti sono Riservati.
      </p>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background-color: #020420;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1.5rem 1.25rem;
  text-align: center;
  margin-top: auto;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  align-items: center;
}

.footer-nav {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: center;
  font-size: 0.85rem;
}

.footer-nav a {
  color: #a1a1aa;
  text-decoration: none;
  transition: color 0.15s ease;
}

.footer-nav a:hover {
  color: #00dc82;
}

.sep {
  color: rgba(255, 255, 255, 0.2);
  font-size: 0.75rem;
}

.footer-text {
  color: #71717a;
  font-size: 0.8rem;
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.footer-text strong {
  color: #00dc82;
  font-weight: 600;
}
</style>