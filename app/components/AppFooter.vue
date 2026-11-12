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
        <NuxtLink :to="getMainUrl('/')" class="flex items-center gap-2.5 group w-fit flex-wrap">
          <img 
            src="/dkp-logo.svg" 
            alt="DevKernelPulse v2.6 Pure SQL" 
            class="w-8 h-8 object-contain rounded-lg shadow-[0_0_12px_rgba(0,220,130,0.4)] group-hover:scale-105 transition-transform"
          />
          <span class="text-white font-extrabold text-xl tracking-tight">
            DevKernel<span class="text-emerald-400">Pulse</span>
          </span>
          <span class="text-[10px] font-mono font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
            v2.6-PURE-SQL
          </span>
        </NuxtLink>

        <p class="text-xs leading-relaxed text-slate-500">
          Ecosistema SaaS modulare Pure SQL e suite di strumenti crittografici e IA proprietari per developer, security researcher e software architect.
        </p>

        <ul class="flex flex-col gap-2.5 mt-1 list-none p-0 m-0">
          <li>
            <NuxtLink :to="getMainUrl('/docs/ecosystem')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              📖 Cos'è DKP &amp; Guida Ecosistema
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/news')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🤖 Hacker News AI Feed
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/feed')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🌍 Global Tech News Feed
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/newest')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              📚 Blog Vault News &amp; Guide
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/blog')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              ✍️ DKP Blog Editorial Hub
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/nodes')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              💬 DKP Node Talks Hub
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/jobs')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              💼 DKP Jobs Hub Center
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/shop')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🛍️ DKP Shop &amp; API Pass
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
        <h4 class="text-white text-xs font-extrabold tracking-wider uppercase m-0">🛠️ DKP TOOLS SUITE</h4>
        <ul class="flex flex-col gap-2.5 list-none p-0 m-0">
          <li>
            <NuxtLink :to="getMainUrl('/tools')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🛠️ Panoramica DKP Tools
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/tools/openui-studio')" external class="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🎨 OpenUI Studio AI
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
            <NuxtLink :to="getMainUrl('/tools/cli-toolkit')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              ⚡ DKP CLI Toolkit
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- COLONNA 3: DEVELOPERS & API -->
      <div class="flex flex-col gap-4">
        <h4 class="text-white text-xs font-extrabold tracking-wider uppercase m-0">🔌 DEVELOPERS &amp; API</h4>
        <ul class="flex flex-col gap-2.5 list-none p-0 m-0">
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
              🧬 DKP CLI &amp; Local Automation
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/docs/sdk')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              ⚙️ SDK &amp; Guida Integrazione
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/docs/faq')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🧠 Domande Frequenti (FAQ)
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/status')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🟢 API Status &amp; Latency
            </NuxtLink>
          </li>
          <li>
            <a href="https://github.com/alexdpl/hackernews" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🐙 GitHub Repository ↗
            </a>
          </li>
        </ul>
      </div>

      <!-- COLONNA 4: RISORSE & LEGALE -->
      <div class="flex flex-col gap-4">
        <h4 class="text-white text-xs font-extrabold tracking-wider uppercase m-0">📜 RISORSE &amp; LEGALE</h4>
        <ul class="flex flex-col gap-2.5 list-none p-0 m-0">
          <li>
            <NuxtLink :to="getMainUrl('/about')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              👥 Chi Siamo
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/guidelines')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              📃 Linee Guida Community
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/legal/privacy')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🛡️ Privacy Policy (GDPR)
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/legal/terms')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              ⚖️ Termini d'Uso &amp; Copyright
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/cookie-policy')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              🍪 Cookie Policy
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="getMainUrl('/contact')" external class="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all hover:translate-x-1">
              📧 Contatti &amp; Supporto
            </NuxtLink>
          </li>
        </ul>
      </div>

    </div>

    <!-- BOTTOM BAR WITH COPYRIGHT & NEXUS PILL -->
    <div class="border-t border-slate-800/80 mt-12 py-5 bg-[#010214]">
      <div class="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p class="text-xs text-slate-500 text-center sm:text-left m-0">
          © {{ currentYear }} <span class="text-emerald-400 font-bold">DevKernelPulse</span> — Built with ❤️ by Alessandro De Paola &amp; Gemini AI. Tutti i diritti riservati.
        </p>

        <div class="flex items-center gap-2 bg-[#090d16] border border-emerald-500/40 px-3.5 py-1.5 rounded-full shadow-[0_0_12px_rgba(0,220,130,0.15)]">
          <span class="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#00dc82]"></span>
          <span class="text-white font-extrabold text-xs">⚡ Pulse Nexus &amp; Sentinel</span>
          <span class="text-emerald-400 font-mono text-[11px] font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">v2.6-PURE-SQL</span>
        </div>
      </div>
    </div>
  </footer>
</template>