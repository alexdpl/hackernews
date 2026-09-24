<!-- app/components/AppFooter.vue -->
<template>
  <footer class="dkp-footer">
    <div class="footer-container">
      
      <!-- Colonna 1: Brand & Mission -->
      <div class="footer-col brand-col">
        <div class="brand-logo">
          <span class="logo-box">DK</span>
          <span class="brand-text">DevKernel<span class="highlight">Pulse</span></span>
        </div>
        <p class="brand-desc">
          Ecosistema SaaS modulare e suite di strumenti crittografici e IA proprietari per developer e software architect.
        </p>
      </div>

      <!-- Colonna 2: Suite DKP Tools v2.0 -->
      <div class="footer-col">
        <h4>🛠️ DKP Tools Suite</h4>
        <ul class="footer-links">
          <li><NuxtLink to="/tools/proof-of-code">🛡️ Proof of Code (Vault)</NuxtLink></li>
          <li><NuxtLink to="/tools/ai-scanner">🔍 AI Code Scanner v2</NuxtLink></li>
          <li><NuxtLink to="/tools/terminal">💻 Terminal Web Shell</NuxtLink></li>
          <li><NuxtLink to="/tools/neural-playground">🧠 Neural Playground</NuxtLink></li>
        </ul>
      </div>

      <!-- Colonna 3: Piattaforma & Community -->
      <div class="footer-col">
        <h4>🌐 Ecosistema</h4>
        <ul class="footer-links">
          <li><NuxtLink to="/news">📰 Tech News</NuxtLink></li>
          <li><NuxtLink to="/ask">💬 Ask & Discussion</NuxtLink></li>
          <li><NuxtLink to="/show">🚀 Show Projects</NuxtLink></li>
          <li><NuxtLink to="/jobs">💼 Tech Jobs</NuxtLink></li>
        </ul>
      </div>

      <!-- Colonna 4: Risorse & Legale -->
      <div class="footer-col">
        <h4>📜 Risorse & Legale</h4>
        <ul class="footer-links">
          <li><NuxtLink to="/about">👥 Chi Siamo</NuxtLink></li>
          <li><NuxtLink to="/guidelines">⚡ Linee Guida</NuxtLink></li>
          <li><NuxtLink to="/terms">⚖️ Termini d'Uso</NuxtLink></li>
          <li><NuxtLink to="/privacy">🔒 Privacy & Cookie</NuxtLink></li>
        </ul>
      </div>

    </div>

    <!-- Bottom Bar Copyright -->
    <div class="footer-bottom">
      <div class="bottom-container">
        <p>© 2026 <strong>DevKernelPulse</strong> — Built with ❤️ by Alessandro De Paola & Gemini AI. Tutti i diritti riservati.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.dkp-footer {
  background-color: #020420;
  border-top: 2px solid #00dc82;
  color: #94a3b8;
  font-family: ui-sans-serif, system-ui, sans-serif;
  margin-top: auto;
  padding-top: 3rem;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 2.5rem 1.5rem;
  display: grid;
  grid-template-columns: 1.5fr repeat(3, 1fr);
  gap: 2.5rem;
}

@media (max-width: 850px) {
  .footer-container {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 500px) {
  .footer-container {
    grid-template-columns: 1fr;
  }
}

.brand-col {
  padding-right: 1rem;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
}

.logo-box {
  background: #00dc82;
  color: #020420;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.brand-text {
  color: #ffffff;
  font-weight: 700;
  font-size: 1.1rem;
}

.brand-text .highlight {
  color: #00dc82;
}

.brand-desc {
  font-size: 0.85rem;
  line-height: 1.5;
  color: #64748b;
}

.footer-col h4 {
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.footer-links a {
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.85rem;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: #00dc82;
}

.footer-bottom {
  background-color: #010214;
  border-top: 1px solid #1e293b;
  padding: 1.25rem 1.5rem;
  text-align: center;
  font-size: 0.8rem;
  color: #64748b;
}

.bottom-container strong {
  color: #00dc82;
}
</style>