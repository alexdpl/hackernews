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
  <footer class="bg-[#020617] border-t border-emerald-500/40 text-slate-400 font-sans mt-24 pt-14">
    <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
      <!-- SEZIONE 1: BRAND & ECOSISTEMA (VERDE NEON) -->
      <section aria-label="Brand ed Ecosistema" class="flex flex-col gap-4">
        <NuxtLink :to="getMainUrl('/')" class="flex items-center gap-2.5 group w-fit no-underline">
          <img
            src="/dkp-logo.svg"
            alt="DevKernelPulse v2.6 Pure SQL"
            class="w-8 h-8 object-contain rounded-lg shadow-[0_0_12px_rgba(16,185,129,0.4)] group-hover:scale-105 transition-transform"
          />
          <span class="text-white font-extrabold text-xl tracking-tight">
            DevKernel<span class="text-emerald-400">Pulse</span>
          </span>
        </NuxtLink>

        <p class="text-xs leading-relaxed text-slate-400 m-0">
          Ecosistema SaaS modulare Pure SQL e suite di strumenti crittografici e IA proprietari per developer, security researcher e software architect.
        </p>

        <nav aria-label="Navigazione Ecosistema">
          <ul class="flex flex-col gap-2.5 list-none p-0 m-0">
            <li>
              <NuxtLink :to="getMainUrl('/docs/ecosystem')" external class="text-slate-300 hover:text-emerald-400 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
                <span>📘</span> Ecosistema &amp; BEMYAGENT.md
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="getMainUrl('/nodes')" external class="text-slate-300 hover:text-emerald-400 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
                <span>💬</span> Node Talks Hub (10 Macro-Nodi)
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="getMainUrl('/nodes/n/blockchain-vault')" external class="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
                <span>🔐</span> Blockchain Vault Ledger
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="getMainUrl('/news')" external class="text-slate-300 hover:text-emerald-400 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
                <span>🤖</span> Hacker News AI Feed
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="getMainUrl('/blog')" external class="text-slate-300 hover:text-emerald-400 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
                <span>✍️</span> Blog Editorial Hub
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="getMainUrl('/jobs')" external class="text-slate-300 hover:text-emerald-400 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
                <span>💼</span> Tech Jobs Hub
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="getMainUrl('/shop')" external class="text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
                <span>💳</span> API &amp; Ads Shop
              </NuxtLink>
            </li>
          </ul>
        </nav>
      </section>

      <!-- SEZIONE 2: DKP TOOLS SUITE (VIOLET AI) -->
      <nav aria-label="DKP Tools Suite" class="flex flex-col gap-4">
        <h4 class="text-violet-300 text-xs font-mono font-extrabold tracking-widest uppercase m-0">
          🛠️ DKP TOOLS SUITE
        </h4>
        <ul class="flex flex-col gap-2.5 list-none p-0 m-0">
          <li>
            <NuxtLink :to="getMainUrl('/tools')" external class="text-slate-300 hover:text-violet-300 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>🧰</span> Panoramica DKP Tools
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/tools/sentinel-scan')" external class="text-violet-300 hover:text-violet-200 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>🛡️</span> Sentinel Scan (SAST)
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/tools/openui-studio')" external class="text-violet-300 hover:text-violet-200 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>🎨</span> OpenUI Studio AI
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/tools/ai-repo-scanner')" external class="text-slate-300 hover:text-violet-300 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>🤖</span> Analizza Repository GitHub
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/tools/proof-of-code')" external class="text-emerald-300 hover:text-emerald-200 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>🔐</span> Proof of Code (Vault)
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/tools/ai-scanner')" external class="text-slate-300 hover:text-violet-300 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>🔍</span> AI Code Scanner
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/tools/terminal')" external class="text-slate-300 hover:text-violet-300 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>💻</span> Terminal Web Shell
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/tools/cli-toolkit')" external class="text-slate-300 hover:text-violet-300 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>⚡</span> DKP CLI Toolkit
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <!-- SEZIONE 3: DEVELOPERS & API (CYAN) -->
      <nav aria-label="Developers e API" class="flex flex-col gap-4">
        <h4 class="text-cyan-300 text-xs font-mono font-extrabold tracking-widest uppercase m-0">
          🔌 DEVELOPERS &amp; API
        </h4>
        <ul class="flex flex-col gap-2.5 list-none p-0 m-0">
          <li>
            <NuxtLink :to="getMainUrl('/user/dashboard?tab=api')" external class="text-cyan-300 hover:text-cyan-200 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>🔑</span> DKP API Console
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/docs/api')" external class="text-slate-300 hover:text-cyan-300 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>📖</span> Documentazione API v2.6
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/docs/ecosystem')" external class="text-slate-300 hover:text-cyan-300 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>📘</span> Documentazione Ecosistema
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/docs/sdk')" external class="text-slate-300 hover:text-cyan-300 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>⚙️</span> SDK &amp; Guida Integrazione
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/docs/cli-automation')" external class="text-slate-300 hover:text-cyan-300 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>🧬</span> DKP CLI &amp; Local Automation
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/docs/faq')" external class="text-slate-300 hover:text-cyan-300 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>🧠</span> Domande Frequenti (FAQ)
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/status')" external class="text-emerald-300 hover:text-emerald-200 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>🟢</span> API Status &amp; Latency
            </NuxtLink>
          </li>
          <li>
            <a href="https://github.com/alexdpl/devkernelpulse" target="_blank" rel="noopener noreferrer" class="text-slate-300 hover:text-cyan-300 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>🐙</span> GitHub Repository ↗
            </a>
          </li>
        </ul>
      </nav>

      <!-- SEZIONE 4: RISORSE & LEGALE (ORO) -->
      <nav aria-label="Risorse e Informazioni Legali" class="flex flex-col gap-4">
        <h4 class="text-amber-300 text-xs font-mono font-extrabold tracking-widest uppercase m-0">
          📜 RISORSE &amp; LEGALE
        </h4>
        <ul class="flex flex-col gap-2.5 list-none p-0 m-0">
          <li>
            <NuxtLink :to="getMainUrl('/features')" external class="text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>✨</span> Funzionalità Ecosistema
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/about')" external class="text-slate-300 hover:text-amber-300 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>👥</span> Chi Siamo
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/guidelines')" external class="text-slate-300 hover:text-amber-300 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>📄</span> Linee Guida Community
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/legal/privacy')" external class="text-slate-300 hover:text-amber-300 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>🛡️</span> Privacy Policy (GDPR)
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/legal/terms')" external class="text-slate-300 hover:text-amber-300 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>⚖️</span> Termini d'Uso &amp; Copyright
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/cookie-policy')" external class="text-slate-300 hover:text-amber-300 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>🍪</span> Cookie Policy
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/roadmap')" external class="text-slate-300 hover:text-amber-300 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>🚀</span> Roadmap Ecosistema 2026
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/contact')" external class="text-slate-300 hover:text-amber-300 text-xs font-semibold flex items-center gap-2 transition-all hover:translate-x-1 no-underline">
              <span>📧</span> Contatti &amp; Supporto
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </div>

    <!-- BOTTOM BAR SEMANTICA -->
    <div class="border-t border-slate-800/80 mt-12 py-6 bg-[#010410]">
      <div class="max-w-7xl mx-auto px-6 sm:px-32 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p class="text-xs text-slate-400 text-center sm:text-left leading-relaxed m-0">
          &copy; {{ currentYear }} <span class="text-emerald-400 font-bold">DevKernelPulse</span> &mdash; Built by Alessandro De Paola &amp; Gemini AI.
        </p>
        <div class="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Kernel v2.6-PURE-SQL &bull; Sentinel Network&copy;</span>
        </div>
      </div>
    </div>
  </footer>
</template>