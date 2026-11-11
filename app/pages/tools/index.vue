<!-- app/pages/tools/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'Toolkit & Developer Tools v2.6-PURE-SQL — DevKernelPulse',
  meta: [
    { name: 'description', content: 'Suite ufficiale di strumenti professionali DKP: Neural Playground, AI Repo Scanner, Code Vault, CLI Toolkit e API Management.' }
  ]
})

interface DkpTool {
  id: string
  title: string
  category: string
  version: string
  status: 'active' | 'beta' | 'enterprise'
  icon: string
  description: string
  features: string[]
  badgeText: string
  linkText: string
  route: string
  isExternal?: boolean
}

const toolsList = ref<DkpTool[]>([
  {
    id: 'ai-repo-scanner',
    title: 'AI Repository Scanner',
    category: 'Code Quality & AI',
    version: 'v2.6-PURE-SQL',
    status: 'active',
    icon: '🤖',
    description: 'Analizza repository GitHub con intelligenza artificiale. Estrae lo stack tecnologico reale, calcola il Reputation Score e assegna XP sul DB.',
    features: [
      'Audit automatico dello stack tecnologico',
      'Calcolo Reputation Score dinamico',
      'Sistema di reward XP integrato in Neon DB'
    ],
    badgeText: 'S-TIER RANK',
    linkText: 'Analizza Repository',
    route: '/tools/ai-repo-scanner'
  },
  {
    id: 'neural-playground',
    title: 'Neural Playground',
    category: 'Code Quality & AI',
    version: 'v2.6-PURE-SQL',
    status: 'active',
    icon: '🧠',
    description: 'Ambiente di testing avanzato per Prompt Engineering e interazione diretta con i Modelli IA (LLM) configurati nel sistema.',
    features: [
      'Interfaccia chat multi-modello',
      'Tuning dei parametri (Temperature, Max Tokens)',
      'Notarizzazione istantanea degli output nel Vault'
    ],
    badgeText: 'AI TESTING',
    linkText: 'Apri Playground',
    route: '/tools/neural-playground'
  },
  {
    id: 'terminal-web-shell',
    title: 'Terminal Web Shell',
    category: 'DevOps & CLI',
    version: 'v2.6-PURE-SQL',
    status: 'active',
    icon: '💻',
    description: 'Shell CLI direttamente in-browser per gestire i servizi, avviare comandi di sistema e testare l\'SDK DKP con gamification.',
    features: [
      'Esecuzione comandi DKP OS nativi',
      'Integrazione con Neon DB e PING reale',
      'Output colorato e sblocco di comandi segreti'
    ],
    badgeText: 'IN-BROWSER',
    linkText: 'Avvia Terminale',
    route: '/tools/terminal'
  },
  {
    id: 'ai-code-scanner',
    title: 'AI Code Scanner Pro',
    category: 'Security & Monitoring',
    version: 'v2.6-PURE-SQL',
    status: 'enterprise',
    icon: '🔍',
    description: 'Audit statico e analisi delle vulnerabilità assistita da IA. Trova bug, leak di token e pattern insicuri negli snippet di codice.',
    features: [
      'Analisi statica SAST server-side',
      'Identificazione API Key esposte e SQL Injection',
      'Integrazione diretta con il Proof-of-Code Vault'
    ],
    badgeText: 'PRO SECURITY',
    linkText: 'Scansiona Codice',
    route: '/tools/ai-scanner'
  },
  {
    id: 'proof-of-code',
    title: 'Proof of Code (Vault)',
    category: 'Security & Monitoring',
    version: 'v2.6-PURE-SQL',
    status: 'active',
    icon: '🛡️',
    description: 'Sistema di notarizzazione per snippet di codice. Genera un hash crittografico SHA-256 e salva l\'impronta su Neon DB.',
    features: [
      'Hashing SHA-256 degli snippet sorgente',
      'Timestamp inalterabile di registrazione in Cloud',
      'Certificato di validità condivisibile nella dashboard'
    ],
    badgeText: 'CRYPTO VAULT',
    linkText: 'Apri Vault',
    route: '/tools/proof-of-code'
  },
  {
    id: 'code-vault-editor',
    title: 'Code Vault Blog Editor',
    category: 'Content Creation',
    version: 'v2.6-PURE-SQL',
    status: 'active',
    icon: '✍️',
    description: 'Editor Markdown professionale con supporto per tabelle HTML, toolbar stile Docs e Zen Mode Fullscreen collegato al DB.',
    features: [
      'Zen Mode a tutto schermo per la scrittura',
      'Mini-parser avanzato tabelle e tag',
      'Salvataggio bozze e pubblicazione diretta'
    ],
    badgeText: 'NEW EDITOR',
    linkText: 'Scrivi Articolo',
    route: '/user/dashboard?tab=content'
  },
  {
    id: 'api-management',
    title: 'API Key Management',
    category: 'Developer Services',
    version: 'v2.6-PURE-SQL',
    status: 'enterprise',
    icon: '🔑',
    description: 'Gestione granulare delle chiavi API personali con Rate Limiting Nitro integrato. Crea e revoca token in modo sicuro.',
    features: [
      'Generazione token crittografati',
      'Rate Limiting configurabile',
      'Statistiche e metriche d\'uso in tempo reale'
    ],
    badgeText: 'NITRO ENGINE',
    linkText: 'Gestisci API Keys',
    route: '/user/dashboard?tab=api'
  },
  {
    id: 'dkp-cli-toolkit',
    title: 'DKP CLI Toolkit',
    category: 'DevOps & CLI',
    version: 'v2.6-PURE-SQL',
    status: 'active',
    icon: '⚡',
    description: 'Strumento a riga di comando per gestire il deploy rapido, la migrazione dei DB Neon e l\'interazione remota con le API DKP.',
    features: [
      'Emulazione CLI interattiva avanzata',
      'Comandi diretti per audit remoti di repo',
      'Semplifica la notarizzazione via Cloud'
    ],
    badgeText: 'CLI TOOLKIT',
    linkText: 'Apri CLI Toolkit',
    route: '/tools/cli-toolkit'
  }
])

const searchQuery = ref('')
const selectedCategory = ref('all')

const filteredTools = computed(() => {
  return toolsList.value.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === 'all' || tool.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-50 px-4 sm:px-6 py-10 sm:py-16 font-sans">
    <div class="max-w-6xl mx-auto flex flex-col gap-10">
      
      <!-- HERO HEADER CON 3 BOTTONI ECOSYSTEM E BADGE V2.6 -->
      <header class="bg-[#090d16] border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
        <!-- Glow background effect -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div class="mb-5 relative z-10">
          <span class="inline-flex bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-4 py-1.5 rounded-full text-xs font-extrabold tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            🛠️ DKP DEVELOPER ECOSYSTEM SUITE v2.6-PURE-SQL
          </span>
        </div>
        
        <h1 class="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight relative z-10 font-sans">
          Strumenti Professionali & <span class="text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">Utility v2.6</span>
        </h1>
        
        <p class="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed mb-6 relative z-10 font-sans">
          Una suite integrata di strumenti avanzati per l'audit del codice, AI testing, gestione API e creazione contenuti.
        </p>

        <!-- PULSANTI PRINCIPALI DELL'ECOSISTEMA (3 BOTTONI HOME INDEX) -->
        <div class="flex flex-wrap gap-3 justify-center mb-8 relative z-10 font-mono">
          <NuxtLink to="/news" class="px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 font-extrabold text-xs rounded-xl hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            🌍 Esplora DKP Tech Feed
          </NuxtLink>

          <NuxtLink to="/nodes" class="px-5 py-2.5 bg-[#020420] border border-slate-700 hover:border-purple-400 text-purple-400 font-extrabold text-xs rounded-xl transition-all shadow-lg">
            💬 DKP Talks Hub
          </NuxtLink>

          <NuxtLink to="/tools" class="px-5 py-2.5 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            🛠️ Developer Tools
          </NuxtLink>
        </div>

        <!-- SEARCH & FILTER BAR -->
        <div class="flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto justify-center relative z-10">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cerca uno strumento (es. Scanner, Playground, CLI...)" 
            class="flex-1 w-full sm:min-w-[300px] bg-[#020420] border border-slate-800 text-white px-5 py-3.5 rounded-xl text-sm outline-none focus:border-emerald-400 transition-colors shadow-inner placeholder-slate-500"
          />
          <select 
            v-model="selectedCategory" 
            class="w-full sm:w-auto bg-[#020420] border border-slate-800 text-slate-300 px-5 py-3.5 rounded-xl text-sm outline-none focus:border-emerald-400 cursor-pointer appearance-none shadow-inner"
            style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right 1rem top 50%; background-size: 0.65rem auto; padding-right: 2.5rem;"
          >
            <option value="all">Tutte le Categorie</option>
            <option value="Security & Monitoring">🔒 Security & Monitoring</option>
            <option value="Developer Services">🔑 Developer Services</option>
            <option value="Code Quality & AI">🧠 Code Quality & AI</option>
            <option value="Content Creation">✍️ Content Creation</option>
            <option value="DevOps & CLI">⚡ DevOps & CLI</option>
          </select>
        </div>
      </header>

      <!-- GRID DEI TOOLS -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="tool in filteredTools" 
          :key="tool.id" 
          class="bg-[#090d16] border border-slate-800 rounded-2xl p-7 flex flex-col justify-between shadow-xl transition-all duration-300 hover:border-emerald-500/50 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(16,185,129,0.1)] group relative overflow-hidden"
        >
          
          <div class="flex items-center gap-4 mb-5">
            <div class="w-12 h-12 shrink-0 bg-[#020420] border border-slate-800 rounded-xl flex items-center justify-center text-2xl group-hover:border-emerald-500/40 transition-colors shadow-inner">
              <span>{{ tool.icon }}</span>
            </div>
            
            <div class="flex-1 flex flex-col gap-1 overflow-hidden">
              <span class="text-[10px] sm:text-[11px] font-extrabold text-sky-400 uppercase tracking-widest truncate">
                {{ tool.category }}
              </span>
              <span class="text-[10px] text-slate-500 font-mono truncate">
                {{ tool.version }}
              </span>
            </div>

            <div 
              :class="[
                'text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-md tracking-wider border shrink-0',
                tool.status === 'enterprise' 
                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              ]"
            >
              {{ tool.badgeText }}
            </div>
          </div>

          <h2 class="text-xl font-extrabold text-white mb-2 group-hover:text-emerald-400 transition-colors font-sans">
            {{ tool.title }}
          </h2>
          
          <p class="text-slate-400 text-sm leading-relaxed mb-6 flex-1 font-sans">
            {{ tool.description }}
          </p>

          <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 mb-6 shadow-inner">
            <h4 class="m-0 mb-3 text-slate-300 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <span>🔥</span> Funzionalità Chiave:
            </h4>
            <ul class="flex flex-col gap-2 m-0 p-0 list-none">
              <li v-for="(feat, idx) in tool.features" :key="idx" class="text-[11px] sm:text-xs text-slate-400 flex items-start gap-2 leading-snug font-sans">
                <span class="text-emerald-400 font-bold shrink-0 mt-0.5">▸</span> 
                <span>{{ feat }}</span>
              </li>
            </ul>
          </div>

          <div class="flex justify-end mt-auto font-mono">
            <NuxtLink 
              :to="tool.route" 
              class="w-full sm:w-auto text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all hover:bg-emerald-400 hover:text-slate-950 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
            >
              <span>{{ tool.linkText }}</span>
              <span>➔</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <div v-if="filteredTools.length === 0" class="text-center py-16 bg-[#090d16] border border-slate-800 rounded-2xl">
        <span class="text-4xl block mb-4">🔍</span>
        <p class="text-slate-400 font-mono text-sm">Nessuno strumento trovato corrispondente alla ricerca.</p>
      </div>

    </div>
  </div>
</template>