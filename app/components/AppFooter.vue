<!-- components/TheFooter.vue -->
<script setup lang="ts">
const currentYear = new Date().getFullYear()
const { getMainUrl, getMailUrl, getApiUrl } = useDomain()
</script>

<template>
  <footer class="dkp-footer">
    <div class="footer-container">
      
      <!-- COLONNA 1: BRAND & ECOSISTEMA -->
      <div class="footer-col brand-col">
        <div class="footer-brand">
          <span class="brand-badge">DK</span>
          <span class="brand-title">DevKernel<span class="pulse">Pulse</span></span>
        </div>
        <p class="brand-desc">
          Ecosistema SaaS modulare e suite di strumenti crittografici e IA proprietari per developer, security researcher e software architect.
        </p>
        <ul class="footer-links">
          <li>
            <NuxtLink :to="getMainUrl('/docs/ecosystem')" external>📖 Cos'è DKP & Guida Ecosistema</NuxtLink>
          </li>
		  <li>
            <NuxtLink :to="getMainUrl('/news')" external>☁️ Tech News Feed</NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/blog')" external>📰 DKP Blog & Release Notes</NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/jobs')" external>💼 DKP Jobs Hub Center</NuxtLink>
          </li>
		  <li>
            <NuxtLink :to="getMainUrl('/shop')" external>🛍️ DKP Shop & Licenze SaaS</NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/roadmap')" external>🚀 Roadmap Ecosistema 2026</NuxtLink>
          </li>
        </ul>
      </div>

      <!-- COLONNA 2: DKP TOOLS SUITE -->
      <div class="footer-col">
        <h4>🛠️ DKP TOOLS SUITE</h4>
        <ul class="footer-links">
          <li>
            <NuxtLink :to="getMainUrl('/tools')" external>🛠️ Panoramica DKP Tools</NuxtLink>
          </li>
		  <li>
            <NuxtLink :to="getMainUrl('/tools/ai-repo-scanner')" external>🤖 Analizza repository GitHub</NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/tools/proof-of-code')" external>🛡️ Proof of Code (Vault)</NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/tools/ai-scanner')" external>🔍 AI Code Scanner v2.3</NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/tools/terminal')" external>💻 Terminal Web Shell</NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/tools/neural-playground')" external>🧠 Neural Playground</NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/tools/cli-toolkit')" external>⚡ DKP CLI Toolkit <span class="new-tag">v2.4-GOLD</span></NuxtLink>
          </li>
        </ul>
      </div>

      <!-- COLONNA 3: DEVELOPERS & API -->
      <div class="footer-col">
        <h4>🔌 DEVELOPERS & API</h4>
        <ul class="footer-links">
          <li>
            <NuxtLink :to="getApiUrl('/user/dashboard?tab=api')" external class="highlight-link">🔑 DKP API Console</NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/docs/api')" external>📖 Documentazione API (OpenAPI)</NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/docs/sdk')" external>⚙️ SDK & Guida Integrazione</NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/status')" external>🟢 API Status & Latency</NuxtLink>
          </li>
          <li>
            <a href="https://github.com/alexdpl/hackernews" target="_blank" rel="noopener">🐙 GitHub Repository ↗</a>
          </li>
        </ul>
      </div>

      <!-- COLONNA 4: RISORSE, SHOP & LEGALE -->
      <div class="footer-col">
        <h4>📜 RISORSE & LEGALE</h4>
        <ul class="footer-links">
          <li>
            <NuxtLink :to="getMainUrl('/about')" external>👥 Chi Siamo</NuxtLink>
          </li>
		  <li>
            <NuxtLink :to="getMainUrl('/guidelines')" external>📃 Linee Guida</NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/legal/privacy')" external>🛡️ Privacy Policy</NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/legal/terms')" external>⚖️ Termini d'Uso</NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/legal/cookies')" external>🔒 Cookie Policy</NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/contact')" external>📧 Contatti</NuxtLink>
          </li>
        </ul>
      </div>

    </div>

    <!-- BOTTOM BAR WITH COPYRIGHT & NEXUS PILL -->
    <div class="footer-bottom">
      <div class="bottom-container">
        <p class="copyright-text">
          © {{ currentYear }} <span class="green-text">DevKernelPulse</span> — Built with ❤️ by Alessandro De Paola & Gemini AI. Tutti i diritti riservati.
        </p>
        
        <div class="nexus-pill">
          <span class="status-dot"></span>
          <span class="nexus-title">⚡ Pulse Nexus</span>
          <span class="nexus-version">v2.4</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.dkp-footer {
  background: #020420;
  border-top: 2px solid #00dc82;
  color: #94a3b8;
  font-family: ui-sans-serif, system-ui, sans-serif;
  margin-top: 5rem;
  padding-top: 3.5rem;
}

.footer-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr;
  gap: 2.5rem;
}

@media (max-width: 1024px) {
  .footer-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .footer-container {
    grid-template-columns: 1fr;
  }
}

.footer-col h4 {
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  margin: 0 0 1.25rem 0;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
}

.brand-badge {
  background: #00dc82;
  color: #020420;
  font-weight: 900;
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.brand-title {
  color: #ffffff;
  font-weight: 800;
  font-size: 1.15rem;
}

.brand-title .pulse {
  color: #00dc82;
}

.brand-desc {
  font-size: 0.83rem;
  line-height: 1.5;
  color: #64748b;
  margin-bottom: 1.25rem;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.footer-links a {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.footer-links a:hover {
  color: #00dc82;
  transform: translateX(2px);
}

.highlight-link {
  color: #38bdf8 !important;
}

.highlight-link:hover {
  color: #7dd3fc !important;
}

.new-tag {
  background: rgba(0, 220, 130, 0.15);
  border: 1px solid rgba(0, 220, 130, 0.4);
  color: #00dc82;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  margin-left: 0.3rem;
}

.footer-bottom {
  border-top: 1px solid #1e293b;
  margin-top: 3rem;
  padding: 1.25rem 0;
  background: #010214;
}

.bottom-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.copyright-text {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

.green-text {
  color: #00dc82;
  font-weight: 700;
}

.nexus-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #090d16;
  border: 1px solid rgba(0, 220, 130, 0.4);
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  box-shadow: 0 0 12px rgba(0, 220, 130, 0.1);
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #00dc82;
  border-radius: 50%;
  box-shadow: 0 0 8px #00dc82;
}

.nexus-title {
  color: #ffffff;
  font-weight: 800;
  font-size: 0.85rem;
}

.nexus-version {
  color: #00dc82;
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 700;
  background: rgba(0, 220, 130, 0.1);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}
</style>