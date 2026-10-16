<!-- app/components/AppFooter.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const currentYear = ref('2026')

onMounted(() => {
  currentYear.value = new Date().getFullYear().toString()
})

const { getMainUrl } = useDomain()
</script>

<template>
  <footer class="bg-[#020420] border-t-2 border-emerald-500 text-slate-400 font-sans mt-20 pt-14">
    <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
      
      <!-- COLONNA 1: BRAND & ECOSISTEMA -->
      <div class="flex flex-col gap-4">
        <NuxtLink :to="getMainUrl('/')" class="flex items-center gap-3 group w-fit">
          <img 
            src="/dkp-logo.svg" 
            alt="DevKernelPulse v2.5 Gold" 
            class="w-8 h-8 object-contain rounded-lg shadow-[0_0_12px_rgba(0,220,130,0.4)] group-hover:scale-105 transition-transform"
          />
          <span class="text-white font-extrabold text-xl tracking-tight">
            DevKernel<span class="text-emerald-400">Pulse</span>
          </span>
		  <span class="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">v2.5</span>
        </NuxtLink>

        <p class="text-xs leading-relaxed text-slate-500">
          Ecosistema SaaS modulare e suite di strumenti crittografici e IA proprietari per developer, security researcher e software architect.
        </p>

        <ul class="flex flex-col gap-2.5 mt-1">
          <li>
            <NuxtLink :to="getMainUrl('/docs/ecosystem')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              📖 Cos'è DKP & Guida Ecosistema
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/news')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              ☁️ Tech News Feed
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/blog')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              ✍️ DKP Blog Editorial Hub 
              <span class="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-extrabold px-1.5 py-0.5 rounded ml-1">v2.5</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/jobs')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              💼 DKP Jobs Hub Center
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/shop')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🛍️ DKP Shop & Licenze SaaS
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/roadmap')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🚀 Roadmap Ecosistema 2026
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- COLONNA 2: DKP TOOLS SUITE -->
      <div class="flex flex-col gap-4">
        <h4 class="text-white text-xs font-extrabold tracking-wider uppercase">🛠️ DKP TOOLS SUITE</h4>
        <ul class="flex flex-col gap-2.5">
          <li>
            <NuxtLink :to="getMainUrl('/tools')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🛠️ Panoramica DKP Tools
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/tools/ai-repo-scanner')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🤖 Analizza repository GitHub
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/tools/proof-of-code')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🛡️ Proof of Code (Vault)
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/tools/ai-scanner')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🔍 AI Code Scanner
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/tools/terminal')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              💻 Terminal Web Shell
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/tools/neural-playground')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🧠 Neural Playground
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/tools/cli-toolkit')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              ⚡ DKP CLI Toolkit
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- COLONNA 3: DEVELOPERS & API -->
      <div class="flex flex-col gap-4">
        <h4 class="text-white text-xs font-extrabold tracking-wider uppercase">🔌 DEVELOPERS & API</h4>
        <ul class="flex flex-col gap-2.5">
          <li>
            <NuxtLink :to="getMainUrl('/user/dashboard?tab=api')" external class="text-sky-400 hover:text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🔑 DKP API Console
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/docs/api')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              📖 Documentazione DKP API
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/docs/cli-automation')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🧬 DKP CLI & Local Automation
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/docs/sdk')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              ⚙️ SDK & Guida Integrazione
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/status')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🟢 API Status & Latency
            </NuxtLink>
          </li>
          <li>
            <a href="https://github.com/alexdpl/hackernews" target="_blank" rel="noopener" class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🐙 GitHub Repository ↗
            </a>
          </li>
        </ul>
      </div>

      <!-- COLONNA 4: RISORSE & LEGALE -->
      <div class="flex flex-col gap-4">
        <h4 class="text-white text-xs font-extrabold tracking-wider uppercase">📜 RISORSE & LEGALE</h4>
        <ul class="flex flex-col gap-2.5">
          <li>
            <NuxtLink :to="getMainUrl('/about')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              👥 Chi Siamo
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/guidelines')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              📃 Linee Guida
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/legal/privacy')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🛡️ Privacy Policy
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/legal/terms')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              ⚖️ Termini d'Uso
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/legal/cookies')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🔒 Cookie Policy
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/contact')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              📧 Contatti
            </NuxtLink>
          </li>
        </ul>
      </div>

    </div>

    <!-- BOTTOM BAR WITH COPYRIGHT & NEXUS PILL -->
    <div class="border-t border-slate-800/80 mt-12 py-5 bg-[#010214]">
      <div class="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p class="text-xs text-slate-500 text-center sm:text-left">
          © {{ currentYear }} <span class="text-emerald-400 font-bold">DevKernelPulse</span> — Built with ❤️ by Alessandro De Paola & Gemini AI. Tutti i diritti riservati.
        </p>

        <div class="flex items-center gap-2 bg-[#090d16] border border-emerald-500/40 px-3.5 py-1.5 rounded-full shadow-[0_0_12px_rgba(0,220,130,0.15)]">
          <span class="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#00dc82]"></span>
          <span class="text-white font-extrabold text-xs">⚡ Pulse Nexus</span>
          <span class="text-emerald-400 font-mono text-[11px] font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">v2.5</span>
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