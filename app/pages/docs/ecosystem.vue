<!-- app/pages/docs/ecosystem.vue -->
<script setup lang="ts">
import { ref } from 'vue'

useDkpSeo({
  title: 'Guida Ecosistema & Architettura v2.5-GOLD — DKP Docs',
  description: 'Documentazione ufficiale sull\'architettura di DevKernelPulse v2.5-GOLD, DKP Nodes, Sentinella Gemini, Integrazione OpenRouter AI, OpenUI Studio e Gamification XP.'
})

const activeSection = ref('architettura')
const sections = [
  { id: 'architettura', title: '🏗️ Architettura DKP', icon: '⚡' },
  { id: 'moduli', title: '🛠️ Moduli, Nodes & OpenUI', icon: '🧩' },
  { id: 'cli-toolkit', title: '⚡ DKP CLI Toolkit', icon: '💻' },
  { id: 'gamification', title: '🏆 Gamification & XP System', icon: '🎮' },
  { id: 'best-practices', title: '💡 Best Practices & Growth', icon: '🚀' }
]

function scrollToSection(id: string) {
  activeSection.value = id
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 py-12 font-sans">
    <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
      
      <!-- SIDEBAR NAVIGAZIONE DOCS -->
      <aside class="lg:sticky lg:top-20 h-fit bg-[#090d16] border border-slate-800 rounded-2xl p-5 flex flex-col gap-5 shadow-xl">
        <div>
          <span class="bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded border border-emerald-500/30">
            DKP DOCS
          </span>
          <h3 class="text-white font-bold text-lg mt-2">Ecosistema v2.5-GOLD</h3>
        </div>

        <nav class="flex flex-col gap-1 font-mono text-xs">
          <button 
            v-for="item in sections" 
            :key="item.id" 
            @click="scrollToSection(item.id)"
            :class="['text-left px-3 py-2.5 rounded-xl font-bold transition-all cursor-pointer', activeSection === item.id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40']"
          >
            {{ item.title }}
          </button>
        </nav>

        <div class="pt-3 border-t border-slate-800/80">
          <NuxtLink to="/docs/api" class="block text-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all shadow-md">
            🔌 Documentazione API ↗
          </NuxtLink>
        </div>
      </aside>

      <!-- CONTENUTO PRINCIPALE -->
      <main class="flex flex-col gap-8">
        
        <!-- HERO DOCS -->
        <header class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-3 shadow-xl">
          <div class="text-xs font-mono font-semibold text-sky-400">
            Docs / Ecosistema &amp; Architettura v2.5-GOLD
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            DevKernelPulse Knowledge Base
          </h1>
          <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Guida completa all'architettura modulare DKP v2.5-GOLD: dal motore Proof-of-Code Vault su Neon DB ai DKP Nodes, la Sentinella SAST con Gemini 2.0 Flash, l'OpenUI Live Engine e il sistema di reputazione XP.
          </p>
        </header>

        <!-- SEZIONE 1: ARCHITETTURA -->
        <section id="architettura" class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
          <h2 class="text-xl font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <span>🏗️</span> Architettura di Sistema DKP v2.5-GOLD
          </h2>
          <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
            <strong class="text-white">DevKernelPulse (DKP)</strong> è costruito secondo un paradigma reattivo ad alte prestazioni, alimentato da <strong class="text-emerald-400">Nuxt 4 (Vue 3, Nitro Engine)</strong>, database serverless <strong class="text-sky-400">Neon PostgreSQL</strong> con ORM <strong class="text-slate-200">Drizzle</strong>, e un'infrastruttura AI decentralizzata tramite OpenRouter.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5">
              <h4 class="text-sm font-bold text-emerald-400">🌐 Edge Processing &amp; AI Gateway</h4>
              <p class="text-xs text-slate-400 leading-relaxed">
                Gateway Nitro H3 con crittografia SHA-256 nativa in-flight, gestione dinamica delle API Keys DKP per metering e rate-limiting in tempo reale.
              </p>
            </div>
            <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5">
              <h4 class="text-sm font-bold text-emerald-400">🛡️ Pulse Sentinel &amp; SAST Engine</h4>
              <p class="text-xs text-slate-400 leading-relaxed">
                Sentinella integrata su <strong class="text-slate-200">Google Gemini 2.0 Flash</strong> per l'analisi statica del codice, la moderazione istantanea dei DKP Nodes e la prevenzione injection.
              </p>
            </div>
            <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5">
              <h4 class="text-sm font-bold text-emerald-400">🧠 OpenRouter Trinity Pipeline</h4>
              <p class="text-xs text-slate-400 leading-relaxed">
                Integrazione unificata multi-LLM (Vercel AI SDK) con supporto streaming in tempo reale per DKP Flash, DKP Coder e DKP Pro.
              </p>
            </div>
            <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5">
              <h4 class="text-sm font-bold text-emerald-400">🗄️ Neon Serverless DB &amp; Drizzle</h4>
              <p class="text-xs text-slate-400 leading-relaxed">
                Persistenza dati ultra-veloce, gestione atomica dei contatori <code class="text-sky-400 bg-slate-900 px-1 py-0.5 rounded font-mono">usage_count</code>, transazioni di Gamification XP e tabelle <code class="text-sky-400 bg-slate-900 px-1 py-0.5 rounded font-mono">api_keys</code> / <code class="text-sky-400 bg-slate-900 px-1 py-0.5 rounded font-mono">vault</code>.
              </p>
            </div>
          </div>
        </section>

        <!-- SEZIONE 2: MODULI & STRUMENTI -->
        <section id="moduli" class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
          <h2 class="text-xl font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <span>🛠️</span> Moduli Proprietari DKP v2.5-GOLD
          </h2>
          <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
            La piattaforma offre una suite completa di strumenti integrati per la sicurezza, la produttività dello sviluppatore e il rendering UI in tempo reale:
          </p>

          <div class="flex flex-col gap-4 mt-2">
            
            <div class="bg-[#020420] border border-slate-800 border-l-4 border-l-blue-500 rounded-xl p-5 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <span class="text-base">🛡️</span>
                <h3 class="text-sm font-bold text-white">Pulse Sentinel SAST &amp; DKP Nodes Moderation</h3>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">
                Sistema di moderazione intelligente alimentato da <strong class="text-slate-200">dots-studio/dots-3-note</strong> (<code class="text-sky-400 font-mono">dots-studio/dots-3-note</code>). Analizza i post della community nei DKP Nodes e scansiona il codice prevenendo vulnerabilità prima della pubblicazione.
              </p>
            </div>

            <div class="bg-[#020420] border border-slate-800 border-l-4 border-l-amber-500 rounded-xl p-5 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <span class="text-base">🔑</span>
                <h3 class="text-sm font-bold text-white">API Key Enterprise Management &amp; Paywall</h3>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">
                Gestione chiavi crittografate (salvataggio tramite <code class="text-sky-400 font-mono">key_hash</code>). Valida le chiamate, gestisce il metering atomico su Neon DB e applica il Paywall Dinamico tra i tier FREE, PRO e ENTERPRISE.
              </p>
            </div>

            <div class="bg-[#020420] border border-slate-800 rounded-xl p-5 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <span class="text-base">🎨</span>
                <h3 class="text-sm font-bold text-white">OpenUI Studio &amp; Live Rendering</h3>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">
                Motore visivo reattivo integrato nel Playground. Genera componenti Tailwind CSS, interfacce e layout inviando prompt naturali e li renderizza istantaneamente in un sandbox iframe protetto.
              </p>
            </div>

            <div class="bg-[#020420] border border-slate-800 rounded-xl p-5 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <span class="text-base">🧠</span>
                <h3 class="text-sm font-bold text-white">Neural Playground &amp; DKP Trinity Engine</h3>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">
                Sandbox interattiva per il testing e la generazione AI in streaming. Alimentata dalla nuova suite di modelli OpenRouter:
              </p>
              <ul class="flex flex-col gap-1.5 mt-2 ml-4 font-mono text-xs text-slate-300 list-disc">
                <li>⚡ <strong class="text-white">DKP-Flash:</strong> <code class="text-sky-400">dots-studio/dots-3-note</code> — Risposta istantanea e moderazione.</li>
                <li>💻 <strong class="text-white">DKP-Coder:</strong> <code class="text-sky-400">cohere/north-mini-code</code> — Specializzato in blocchi di codice e componenti OpenUI.</li>
                <li>🧠 <strong class="text-white">DKP-Pro:</strong> <code class="text-sky-400">nvidia/nemotron-3-ultra-550b</code> — Architetture avanzate con output e possibilità che sviluppi varianti.</li>
              </ul>
            </div>

            <div class="bg-[#020420] border border-slate-800 border-l-4 border-l-emerald-500 rounded-xl p-5 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <span class="text-base">📜</span>
                <h3 class="text-sm font-bold text-white">Proof-of-Code Vault v2.5</h3>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">
                Permette di generare un'impronta digitale immutabile (SHA-256) del tuo sorgente o output OpenUI, notarizzandolo direttamente sul database Neon con reward XP immediato.
              </p>
            </div>

          </div>
        </section>

        <!-- SEZIONE 3: DKP CLI TOOLKIT -->
        <section id="cli-toolkit" class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
          <h2 class="text-xl font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <span>⚡</span> DKP CLI Toolkit v2.5-GOLD
          </h2>
          <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
            L'interfaccia a riga di comando nativa per sviluppatori. Consente di interrogare l'ecosistema DKP direttamente dai terminali locali e di interagire con le API di produzione.
          </p>

          <div class="bg-[#020420] border border-slate-800 rounded-xl overflow-hidden mt-2 font-mono">
            <div class="bg-[#0d1322] px-4 py-2 border-b border-slate-800 flex justify-between items-center text-xs text-slate-500">
              <span>Terminal / Bash</span>
              <span class="bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px]">
                v2.5-GOLD
              </span>
            </div>
            <pre class="p-4 sm:p-5 text-xs text-emerald-400 leading-relaxed overflow-x-auto"><code><span class="text-slate-500 italic"># Installazione globale tramite NPM</span>
npm install -g @devkernelpulse/cli

<span class="text-slate-500 italic"># Autenticazione con API Key crittografata</span>
dkp auth login --key dkp_live_xxx

<span class="text-slate-500 italic"># Generazione UI da Terminale tramite Trinity (Dots-3 Engine)</span>
dkp ui generate "Dashboard Tailwind Dark"

<span class="text-slate-500 italic"># Notarizzazione istantanea sul Vault Cloud</span>
dkp vault notarize https://miosito.com

<span class="text-slate-500 italic"># Verifica stato API Gateway &amp; Sentinel</span>
dkp status</code></pre>
          </div>
        </section>

        <!-- SEZIONE 4: GAMIFICATION & XP -->
        <section id="gamification" class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
          <h2 class="text-xl font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <span>🏆</span> Gamification &amp; XP Reputation Engine
          </h2>
          <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Ogni interazione su DevKernelPulse genera <strong class="text-emerald-400">Experience Points (XP)</strong> registrati in tempo reale nella tabella <code class="text-sky-400 font-mono">api_keys</code> e <code class="text-sky-400 font-mono">users</code> su Neon DB, incrementando il tuo rank sviluppatore.
          </p>

          <div class="overflow-x-auto border border-slate-800 rounded-xl mt-2">
            <table class="w-full text-left font-mono text-xs">
              <thead class="bg-[#020420] text-white border-b border-slate-800">
                <tr>
                  <th class="p-3">Azione Utente</th>
                  <th class="p-3">Guadagno XP</th>
                  <th class="p-3">Target Backend / Funzione</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-slate-300">
                <tr class="hover:bg-slate-800/30 transition-colors">
                  <td class="p-3"><strong class="text-white">Notarizzazione Vault (Web o CLI)</strong></td>
                  <td class="p-3"><span class="bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold px-2 py-0.5 rounded text-[11px]">+100 XP</span></td>
                  <td class="p-3"><code class="text-sky-400">/api/user/vault</code></td>
                </tr>
                <tr class="hover:bg-slate-800/30 transition-colors">
                  <td class="p-3"><strong class="text-white">Pubblicazione Post / Node Moderato</strong></td>
                  <td class="p-3"><span class="bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold px-2 py-0.5 rounded text-[11px]">+50 XP</span></td>
                  <td class="p-3"><code class="text-sky-400">/api/nodes / Pulse Sentinel</code></td>
                </tr>
                <tr class="hover:bg-slate-800/30 transition-colors">
                  <td class="p-3"><strong class="text-white">Generazione OpenUI / DKP-Coder</strong></td>
                  <td class="p-3"><span class="bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold px-2 py-0.5 rounded text-[11px]">+30 XP</span></td>
                  <td class="p-3"><code class="text-sky-400">/api/ai/chat.post.ts</code></td>
                </tr>
                <tr class="hover:bg-slate-800/30 transition-colors">
                  <td class="p-3"><strong class="text-white">Esecuzione Neural Playground (Trinity)</strong></td>
                  <td class="p-3"><span class="bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold px-2 py-0.5 rounded text-[11px]">+15 XP</span></td>
                  <td class="p-3"><code class="text-sky-400">streamText (Gemini / Nemotron)</code></td>
                </tr>
                <tr class="hover:bg-slate-800/30 transition-colors">
                  <td class="p-3"><strong class="text-white">Comandi Web Terminal Shell</strong></td>
                  <td class="p-3"><span class="bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold px-2 py-0.5 rounded text-[11px]">+5 XP / +50 XP</span></td>
                  <td class="p-3"><code class="text-sky-400">/api/tools/terminal-exec</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- SEZIONE 5: BEST PRACTICES -->
        <section id="best-practices" class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
          <h2 class="text-xl font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <span>💡</span> Best Practices per gli Sviluppatori
          </h2>
          
          <div class="flex flex-col gap-4">
            <div class="bg-[#020420] border-l-4 border-l-sky-400 border border-slate-800 p-4 rounded-r-xl flex flex-col gap-1">
              <h4 class="text-sm font-bold text-white">⚡ Model Routing Intelligente</h4>
              <p class="text-xs text-slate-400 leading-relaxed">
                Usa <strong class="text-slate-200">DKP-Flash</strong> (Gemini 2.0) per query veloci o analisi di testo, <strong class="text-slate-200">DKP-Coder</strong> (Dots-3) per generare componenti Tailwind/Vue in OpenUI, e <strong class="text-slate-200">DKP-Pro</strong> (Nemotron-3) per richiedere 3 varianti di architetture complesse.
              </p>
            </div>

            <div class="bg-[#020420] border-l-4 border-l-emerald-400 border border-slate-800 p-4 rounded-r-xl flex flex-col gap-1">
              <h4 class="text-sm font-bold text-white">🔑 Sicurezza e Crittografia API</h4>
              <p class="text-xs text-slate-400 leading-relaxed">
                Le chiavi DKP (es. <code class="text-sky-400 font-mono">dkp_live_...</code>) non vengono mai memorizzate in chiaro. Il sistema salva e confronta in tempo reale unicamente l'hash crittografato (SHA-256) per la massima sicurezza aziendale.
              </p>
            </div>

            <div class="bg-[#020420] border-l-4 border-l-purple-500 border border-slate-800 p-4 rounded-r-xl flex flex-col gap-1">
              <h4 class="text-sm font-bold text-white">🛡️ Moderazione Nodes &amp; Pulse Sentinel</h4>
              <p class="text-xs text-slate-400 leading-relaxed">
                Tutti i contributi pubblicati nei DKP Nodes passano automaticamente la scansione della Sentinella Gemini prima di essere visibili nel feed principale.
              </p>
            </div>
          </div>
        </section>

      </main>

    </div>
  </div>
</template>