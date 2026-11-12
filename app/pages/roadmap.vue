<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'Roadmap Ecosistema 2026-2027 v2.6-PURE-SQL — DevKernelPulse',
  meta: [
    { name: 'description', content: 'Piano ufficiale di sviluppo dell\'ecosistema DKP v2.6: SDK Pubblica @devkernelpulse/sdk, Firewall Live SSE, OpenUI Studio e Visione Futura 2027.' }
  ]
})

interface RoadmapMilestone {
  id: string
  quarter: string
  phaseTitle: string
  version: string
  status: 'completed' | 'in-progress' | 'upcoming'
  progress: number
  description: string
  features: string[]
}

const milestones = ref<RoadmapMilestone[]>([
  {
    id: 'q1-2026',
    quarter: 'Q1 2026',
    phaseTitle: 'Architettura Core & Admin Control Center',
    version: 'v2.4-GOLD',
    status: 'completed',
    progress: 100,
    description: 'Consolidamento completo dell\'area riservata Admin su moduli unificati con rotte relative.',
    features: [
      'Standardizzazione Navbar Admin Grid a 8 Moduli',
      'Persistenza Sessione Admin & Cookie dkp_session',
      'Modulo DKP Shop SaaS & Gestione Licenze',
      'Sitemap XML Dinamica con Sync Automatica'
    ]
  },
  {
    id: 'q2-2026',
    quarter: 'Q2 2026',
    phaseTitle: 'AI Repo Scanner & Reputazione S-TIER GOLD',
    version: 'v2.4-GOLD',
    status: 'completed',
    progress: 100,
    description: 'Lancio ufficiale del motore AI Link & Repository Scanner con calcolo dello score XP.',
    features: [
      'AI Repo Scanner per audit GitHub & Stack Detection',
      'Sistema di Rank Reputazione DKP (S/A/B Tier)',
      'Integrazione Agente Pulse Nexus context-aware'
    ]
  },
  {
    id: 'q3-2026',
    quarter: 'Q3 2026',
    phaseTitle: 'Firewall Live SSE & Blog Vault',
    version: 'v2.5-GOLD',
    status: 'completed',
    progress: 100,
    description: 'Rilascio delle tecnologie di sicurezza in tempo reale e Blog Engine Pro.',
    features: [
      'Firewall di Sicurezza con streaming Live SSE',
      'Blog Engine Pro con Code Vault e Tabelle Markdown',
      'API Key Management con Rate Limiting Nitro Enterprise'
    ]
  },
  {
    id: 'q4-2026',
    quarter: 'Q4 2026',
    phaseTitle: 'Neural Gateway, Trinity & DKP Nodes v2.6-PURE-SQL',
    version: 'v2.6-PURE-SQL',
    status: 'completed',
    progress: 100,
    description: 'Infrastruttura AI decentralizzata, moderazione automatica Nodes tramite Gemini 2.0 e Paywall Dinamico basato su PURE-SQL.',
    features: [
      'OpenUI Studio: Generazione Tailwind Live',
      'DKP Trinity Engine (Dots-3, North Mini-Code, Nemotron-3)',
      'Pulse Sentinel SAST & DKP Nodes Moderation',
      'Proof of Code Vault con hash SHA-256 deterministico'
    ]
  },
  {
    id: 'q1-2027',
    quarter: 'Q1 2027',
    phaseTitle: 'DKP Public SDK & Developer Ecosystem',
    version: 'v3.0-BETA',
    status: 'completed',
    progress: 100,
    description: 'Rilascio ufficiale del pacchetto NPM @devkernelpulse/sdk. Permette a chiunque di integrare Vault, AI e NewsRoom nelle proprie app.',
    features: [
      'Rilascio pacchetto npm ufficiale @devkernelpulse/sdk',
      'Documentazione interattiva API Hub con snippet TS/JS',
      'Integrazione client-side sicura con token crittografati',
      'Supporto per framework moderni (Vue, React, Svelte, Vanilla)'
    ]
  },
  {
    id: 'q2-2027',
    quarter: 'Q2 2027',
    phaseTitle: 'Autonomous Neural Agents & Auto-Patching',
    version: 'v3.2',
    status: 'in-progress',
    progress: 15,
    description: 'Evoluzione del Neural Playground in un agente autonomo capace di PR su GitHub.',
    features: [
      'Agentic AI per auto-remediation delle vulnerabilità via PR',
      'Canary Endpoints per ban istantaneo scanner malevoli',
      'Sandbox in container WASM per esecuzione untrusted'
    ]
  },
  {
    id: 'q3-2027',
    quarter: 'Q3 2027',
    phaseTitle: 'Multi-Tenant Enterprise Cloud & Web3',
    version: 'v4.0-VISION',
    status: 'upcoming',
    progress: 0,
    description: 'Soluzione enterprise per grandi aziende e settlement Smart Contract per Bounty Open Source.',
    features: [
      'Chiavi API Effimere a tempo (15m - 1h) per CI/CD',
      'Federazione Multi-Tenant per Kubernetes',
      'Web3 Settlement per Bounty in $PULSE su PR merged'
    ]
  }
])

const { data: apiRoadmap } = await useFetch('/api/roadmap', {
  default: () => ({ overallCompletion: null })
})

const overallCompletion = computed(() => {
  if (typeof apiRoadmap.value?.overallCompletion === 'number') {
    return apiRoadmap.value.overallCompletion
  }
  const completedCount = milestones.value.filter(m => m.status === 'completed').length
  const inProgressSum = milestones.value.filter(m => m.status === 'in-progress').reduce((acc, m) => acc + m.progress, 0)
  const totalWeight = (completedCount * 100) + inProgressSum
  return Math.round(totalWeight / milestones.value.length)
})

const activeFilter = ref<'all' | 'completed' | 'in-progress' | 'upcoming'>('all')

const filteredMilestones = computed(() => {
  if (activeFilter.value === 'all') return milestones.value
  return milestones.value.filter(m => m.status === activeFilter.value)
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 py-12">
    <div class="max-w-5xl mx-auto flex flex-col gap-10">
      
      <!-- HERO ROADMAP -->
      <header class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-10 text-center flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden">
        <div class="inline-flex items-center gap-2 bg-[#020420] border border-emerald-500/40 px-3.5 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-[10px] sm:text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            🚀 DKP ECOSYSTEM ROADMAP 2026-2027 • v2.6-PURE-SQL
          </span>
        </div>

        <h1 class="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
          Piano di Sviluppo &amp; <span class="text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">Vision v3.0</span>
        </h1>

        <p class="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed font-sans">
          Trasparenza totale sullo stato di avanzamento delle funzionalità, integrazioni IA, lancio SDK ufficiale e la nuova visione strategica basata sullo standard v2.6 PURE-SQL.
        </p>

        <!-- CARTELLO PROGRESSO GLOBALE -->
        <div class="bg-[#020420] border border-slate-800 rounded-xl p-5 w-full max-w-xl flex flex-col gap-2.5 shadow-md">
          <div class="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-300 font-sans">
            <span>Stato Avanzamento Globale Ecosistema:</span>
            <strong class="text-emerald-400 font-mono text-base">{{ overallCompletion }}%</strong>
          </div>
          <div class="h-2 bg-slate-800 rounded-full overflow-hidden w-full">
            <div 
              class="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-500" 
              :style="{ width: overallCompletion + '%' }"
            ></div>
          </div>
        </div>
      </header>

      <!-- BARRA FILTRI -->
      <div class="flex justify-center">
        <div class="flex gap-2 flex-wrap justify-center font-mono text-xs">
          <button 
            type="button" 
            @click="activeFilter = 'all'" 
            :class="['px-4 py-2 rounded-full font-bold border transition-all cursor-pointer', activeFilter === 'all' ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400' : 'bg-[#090d16] border-slate-800 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400']"
          >
            Tutte le Fasi
          </button>
          <button 
            type="button" 
            @click="activeFilter = 'completed'" 
            :class="['px-4 py-2 rounded-full font-bold border transition-all cursor-pointer', activeFilter === 'completed' ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400' : 'bg-[#090d16] border-slate-800 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400']"
          >
            🟢 Completati (Lanciati)
          </button>
          <button 
            type="button" 
            @click="activeFilter = 'in-progress'" 
            :class="['px-4 py-2 rounded-full font-bold border transition-all cursor-pointer', activeFilter === 'in-progress' ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400' : 'bg-[#090d16] border-slate-800 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400']"
          >
            ⚡ In Corso
          </button>
          <button 
            type="button" 
            @click="activeFilter = 'upcoming'" 
            :class="['px-4 py-2 rounded-full font-bold border transition-all cursor-pointer', activeFilter === 'upcoming' ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400' : 'bg-[#090d16] border-slate-800 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400']"
          >
            🔮 Visione Futura
          </button>
        </div>
      </div>

      <!-- TIMELINE LIST -->
      <div class="relative pl-8 sm:pl-10 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800 flex flex-col gap-8">
        
        <div v-for="item in filteredMilestones" :key="item.id" class="relative group">
          
          <!-- TIMELINE MARKER DOT -->
          <div class="absolute -left-8 sm:-left-10 top-6 -translate-x-1/2 z-10">
            <span 
              :class="[
                'block w-4 h-4 rounded-full border-4 bg-[#020420] transition-all',
                item.status === 'completed' ? 'border-emerald-400 bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]' : '',
                item.status === 'in-progress' ? 'border-amber-400 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]' : '',
                item.status === 'upcoming' ? 'border-sky-400 bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.8)]' : ''
              ]"
            ></span>
          </div>

          <!-- MILESTONE CARD -->
          <article class="bg-[#090d16] border border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 sm:p-8 shadow-xl transition-all hover:-translate-y-0.5 flex flex-col gap-4">
            
            <div class="flex justify-between items-center flex-wrap gap-3 font-mono">
              <div class="flex items-center gap-2.5">
                <span class="text-base font-extrabold text-white">{{ item.quarter }}</span>
                <span class="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded text-[11px] font-bold">
                  {{ item.version }}
                </span>
              </div>

              <div 
                :class="[
                  'text-xs font-bold px-3 py-1 rounded-lg border',
                  item.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : '',
                  item.status === 'in-progress' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : '',
                  item.status === 'upcoming' ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' : ''
                ]"
              >
                <template v-if="item.status === 'completed'">🟢 COMPLETATO (100%)</template>
                <template v-else-if="item.status === 'in-progress'">⚡ IN CORSO ({{ item.progress }}%)</template>
                <template v-else>🔮 IN ARRIVO</template>
              </div>
            </div>

            <h2 class="text-xl sm:text-2xl font-bold text-white font-sans">{{ item.phaseTitle }}</h2>
            <p class="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">{{ item.description }}</p>

            <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-2 mt-2">
              <h4 class="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">📋 Deliverables &amp; Moduli:</h4>
              <ul class="flex flex-col gap-2 text-xs sm:text-sm text-slate-300">
                <li v-for="(feat, idx) in item.features" :key="idx" class="flex items-center gap-2 font-sans">
                  <span class="text-emerald-400 font-bold font-mono">▹</span>
                  <span>{{ feat }}</span>
                </li>
              </ul>
            </div>

          </article>
        </div>

      </div>

    </div>
  </div>
</template>