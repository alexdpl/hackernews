<!-- app/pages/docs/faq.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'Domande Frequenti (FAQ) & Knowledge Base AI — DKP v2.6-PURE-SQL',
  meta: [
    { name: 'description', content: 'Tutte le risposte sull\'ecosistema DevKernelPulse v2.6-PURE-SQL: OpenUI Studio, DKP Trinity AI Models, Neon Pure SQL Gateway crittografato, Vault e Pulse Sentinel.' }
  ]
})

const activeId = ref<string | null>('ai-1')
const searchQuery = ref('')

function toggleFaq(id: string) {
  activeId.value = activeId.value === id ? null : id
}

interface FaqItem {
  id: string
  question: string
  answer: string
}

interface FaqCategory {
  title: string
  icon: string
  accentText: string
  accentBorder: string
  items: FaqItem[]
}

const faqData: FaqCategory[] = [
  {
    title: 'AI Gateway, OpenUI Studio & DKP Trinity',
    icon: '🧠',
    accentText: 'text-pink-400',
    accentBorder: 'border-pink-500/20',
    items: [
      {
        id: 'ai-1',
        question: 'Come funziona l\'autenticazione API Gateway in DevKernelPulse v2.6-PURE-SQL?',
        answer: 'DevKernelPulse utilizza un sistema Zero-Trust basato su Bearer Token (es. dkp_live_...). Il server Nitro in Nuxt 4 intercetta la richiesta, calcola in volo l\'hash crittografato (SHA-256 / scrypt KDF) e lo confronta tramite query parametrizzata Pure SQL con il campo key_hash su Neon PostgreSQL, eliminando l\'overhead di ORM pesanti e azzerando i rischi di leak delle chiavi in chiaro.'
      },
      {
        id: 'ai-2',
        question: 'Quali modelli IA alimentano OpenUI Studio e il Neural Playground?',
        answer: 'Il motore OpenUI Studio e il Neural Playground sfruttano l\'architettura DKP Trinity via OpenRouter: 1. DKP-Flash (dots-studio/dots-3-note-preview) ottimizzato per velocità e contesti ampi. 2. DKP-Coder (recursive/flint-v1.0) specializzato in logica di programmazione e refactoring Tailwind. 3. DKP-Pro (nvidia/nemotron-3-ultra-550b-a55b) modello Enterprise ad alte prestazioni per ragionamento multi-step.'
      },
      {
        id: 'ai-3',
        question: 'Cos\'è il Paywall Dinamico e come gestisce il Metering Pure SQL?',
        answer: 'Il sistema di metering monitora in tempo reale le chiamate sul database Neon tramite aggiornamenti atomici Pure SQL (usage_count + 1). Gli utenti FREE (Newbie) hanno accesso a quota base e al modello DKP-Flash, mentre i piani PRO, ENTERPRISE o i possessori di API Pass sbloccano i modelli Coder e Pro con limiti fino a 1.000.000 req/mese.'
      }
    ]
  },
  {
    title: 'Ecosistema a 4 Pilastri & Open Source',
    icon: '🚀',
    accentText: 'text-sky-400',
    accentBorder: 'border-sky-500/20',
    items: [
      {
        id: 'eco-1',
        question: 'Quali sono i 4 pilastri dell\'ecosistema DevKernelPulse (DKP)?',
        answer: 'DevKernelPulse unisce quattro ambienti integrati su un unico kernel Pure SQL: 1. DKP Tech Feed (/news) con crawler Hacker News tradotto e valutato da Trinity AI. 2. DKP Talks Hub (/nodes) per snippet e discussioni dev moderate da Sentinel. 3. Developer Tools (/tools) con OpenUI Studio, CLI e SDK. 4. DKP Editorial Hub (/blog) con articoli tecnici notarizzati nel Vault.'
      },
      {
        id: 'eco-2',
        question: 'Il progetto è interamente Open Source?',
        answer: 'Sì! Il core della piattaforma è open source. Promuoviamo la collaborazione della community attraverso il nostro Bounty Board: contribuendo su GitHub con fix, nuovi connettori o miglioramenti ai test E2E si ottengono ricompense in XP e token nativi $PULSE.'
      }
    ]
  },
  {
    title: 'Editorial Hub, Blog & Gamification',
    icon: '🎮',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500/20',
    items: [
      {
        id: 'gam-1',
        question: 'Come funziona il sistema di Gamification (XP) e Rank?',
        answer: 'Eseguendo azioni virtuose — pubblicando articoli nel DKP Editorial Hub (+150 XP), notarizzando codice nel Vault (+100 XP), condividendo nodi nel Talks Hub (+50 XP) o commentando (+10 XP) — accumuli Punti XP che fanno salire il tuo livello e il tuo Rank pubblico.'
      },
      {
        id: 'gam-2',
        question: 'Qual è il vantaggio pratico di salire di Livello?',
        answer: 'Salendo di livello sblocchi automaticamente quote API più elevate e gratuite (passando da 1.000 chiamate/mese del tier FREE alle 50.000 chiamate/mese del tier PRO), badge verificati accanto ai tuoi articoli e priorità nella coda di indicizzazione.'
      },
      {
        id: 'gam-3',
        question: 'Come pubblico un articolo e in quanto tempo appare nel feed?',
        answer: 'Puoi scrivere i tuoi articoli usando l\'editor Markdown avanzato nella Dashboard Utente oppure via terminale con il comando CLI "dkp blog:publish". Gli articoli approvati vengono indicizzati istantaneamente nel database Neon Pure SQL e compaiono subito in cima al DKP Editorial Hub.'
      }
    ]
  },
  {
    title: 'API Gateway, SDK & Limiti',
    icon: '🔌',
    accentText: 'text-purple-400',
    accentBorder: 'border-purple-500/20',
    items: [
      {
        id: 'api-1',
        question: 'Come posso generare una chiave API?',
        answer: 'Vai nella tua Dashboard Utente e apri il tab "DKP API Console" (oppure usa il comando "dkp keys:create"). Per motivi di sicurezza Zero-Trust, la chiave verrà mostrata in chiaro una sola volta al momento della creazione: assicurati di salvarla subito nel tuo file .env.'
      },
      {
        id: 'api-2',
        question: 'Quali sono i Rate Limit e le quote mensili?',
        answer: 'Il gateway applica limiti dinamici in base al tuo Tier: FREE (1.000 req/mese), PRO (50.000 req/mese), ENTERPRISE (1.000.000 req/mese). A ogni chiamata HTTP riceverai negli header (X-RateLimit-Remaining) il conteggio aggiornato in tempo reale dal nostro database Neon.'
      },
      {
        id: 'api-3',
        question: 'Posso revocare una chiave API se viene compromessa?',
        answer: 'Assolutamente sì. Dalla tua Dashboard puoi cliccare su "Revoca" in qualsiasi momento. La chiave verrà istantaneamente invalidata su tutto il cluster Pure SQL e non potrà più effettuare chiamate al gateway.'
      }
    ]
  },
  {
    title: 'Proof of Code Vault',
    icon: '🔐',
    accentText: 'text-amber-400',
    accentBorder: 'border-amber-500/20',
    items: [
      {
        id: 'vlt-1',
        question: 'Cos\'è il Proof of Code Vault?',
        answer: 'È un motore di notarizzazione crittografica. Incollando codice sorgente, smart contract o articoli tecnici, DKP calcola un hash SHA-256 univoco, esegue una scansione di sicurezza (SAST) e genera un certificato immutabile salvato su Neon DB per dimostrare paternità e integrità a una data certa.'
      },
      {
        id: 'vlt-2',
        question: 'Il codice sorgente che notarizzo è al sicuro?',
        answer: 'Sì. Una volta calcolato l\'hash crittografico (SHA-256), il sistema può validare il certificato confrontando l\'impronta digitale senza dover esporre codice proprietario riservato.'
      }
    ]
  },
  {
    title: 'Pulse Sentinel AI & Cloud Security',
    icon: '⚡',
    accentText: 'text-rose-400',
    accentBorder: 'border-rose-500/20',
    items: [
      {
        id: 'sec-1',
        question: 'Come è protetta la piattaforma?',
        answer: 'Utilizziamo "Pulse Sentinel AI v2.6", il nostro Firewall Web Application (WAF) euristico con query Pure SQL parametrizzate (immune a SQL Injection) integrato con Google Cloud Armor in europe-west4. Blocca proattivamente attacchi DDoS, bot malevoli, Prompt Injection e XSS in tempo reale.'
      },
      {
        id: 'sec-2',
        question: 'Cosa succede se il mio IP viene bloccato da Sentinel?',
        answer: 'Se il tuo traffico supera le soglie di sicurezza o invia payload malevoli, l\'IP viene inserito nella Blacklist Automatica di Sentinel. Se ritieni si tratti di un falso positivo durante test legittimi, puoi contattarci su GitHub o Discord per la verifica da parte degli Admin.'
      }
    ]
  }
]

const filteredFaqData = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return faqData

  return faqData
    .map(cat => ({
      ...cat,
      items: cat.items.filter(
        item =>
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q)
      )
    }))
    .filter(cat => cat.items.length > 0)
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 sm:px-6 py-10 pb-20 font-sans">
    <div class="max-w-5xl mx-auto flex flex-col gap-8">

      <!-- BARRA 4 PILASTRI ECOSISTEMA DKP v2.6 -->
      <nav aria-label="Navigazione Ecosistema DKP" class="flex flex-wrap gap-2.5 justify-center font-mono bg-[#090d16] border border-slate-800 p-3 rounded-2xl shadow-lg">
        <NuxtLink
          to="/news"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-400 font-extrabold text-xs rounded-xl transition-all"
        >
          🌍 DKP Tech Feed
        </NuxtLink>

        <NuxtLink
          to="/nodes"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-purple-400 text-purple-400 font-extrabold text-xs rounded-xl transition-all"
        >
          💬 DKP Talks Hub
        </NuxtLink>

        <NuxtLink
          to="/tools"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-sky-400 text-sky-400 font-extrabold text-xs rounded-xl transition-all"
        >
          🛠️ Developer Tools
        </NuxtLink>

        <NuxtLink
          to="/blog"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-300 font-extrabold text-xs rounded-xl transition-all"
        >
          ✍️ DKP Editorial Hub
        </NuxtLink>
      </nav>

      <!-- HERO SECTION -->
      <header class="bg-[#090d16] border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-36 bg-emerald-500/10 blur-[110px] rounded-full pointer-events-none"></div>

        <div class="mb-4 relative z-10">
          <span class="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 px-4 py-1.5 rounded-full text-xs font-mono font-extrabold tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            📚 DOCUMENTAZIONE UFFICIALE v2.6-PURE-SQL
          </span>
        </div>

        <h1 class="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight leading-tight relative z-10">
          Domande Frequenti &amp; <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">AI Knowledge Base</span>
        </h1>

        <p class="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-7 relative z-10">
          Tutto ciò che devi sapere sull'ecosistema <strong class="text-white">DevKernelPulse v2.6-PURE-SQL</strong>: dall'architettura serverless Neon PostgreSQL ai modelli DKP Trinity AI, Vault e Pulse Sentinel.
        </p>

        <!-- SEARCH INPUT RAPIDO -->
        <div class="max-w-xl mx-auto relative z-10">
          <div class="flex items-center bg-[#020420] border border-slate-800 focus-within:border-emerald-400 rounded-xl px-4 py-3 shadow-inner transition-colors">
            <span class="mr-2.5 text-base">🔍</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cerca nelle FAQ (es. Pure SQL, Trinity, API Key, Vault, XP)..."
              class="w-full bg-transparent text-sm text-white outline-none placeholder-slate-500"
            />
            <button
              v-if="searchQuery"
              type="button"
              @click="searchQuery = ''"
              class="text-rose-400 hover:text-rose-300 font-black text-lg px-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>
      </header>

      <!-- EMPTY SEARCH STATE -->
      <div v-if="filteredFaqData.length === 0" class="text-center py-14 bg-[#090d16] border border-slate-800 rounded-2xl flex flex-col items-center gap-3">
        <span class="text-4xl">🔎</span>
        <h3 class="text-lg font-bold text-white">Nessuna risposta trovata per "{{ searchQuery }}"</h3>
        <button
          type="button"
          @click="searchQuery = ''"
          class="px-4 py-2 bg-emerald-500 text-slate-950 font-mono font-extrabold text-xs rounded-xl hover:bg-emerald-400 transition-all cursor-pointer"
        >
          Mostra tutte le FAQ
        </button>
      </div>

      <!-- FAQ CATEGORIES LIST -->
      <div v-else class="flex flex-col gap-8">
        <section v-for="category in filteredFaqData" :key="category.title" class="flex flex-col gap-3">
          <h2 :class="['text-lg sm:text-xl font-extrabold flex items-center gap-2.5 pb-3 border-b', category.accentText, category.accentBorder]">
            <span>{{ category.icon }}</span>
            <span>{{ category.title }}</span>
          </h2>
          
          <div class="flex flex-col gap-3">
            <div 
              v-for="item in category.items" 
              :key="item.id" 
              :class="[
                'bg-[#090d16] border rounded-2xl overflow-hidden transition-all',
                activeId === item.id ? 'border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.08)]' : 'border-slate-800 hover:border-slate-700'
              ]"
            >
              <button
                type="button"
                class="w-full flex justify-between items-center gap-4 bg-transparent border-none px-5 py-4 text-left text-white font-bold text-sm sm:text-base cursor-pointer hover:bg-white/[0.02] transition-colors"
                @click="toggleFaq(item.id)"
              >
                <span>{{ item.question }}</span>
                <span :class="['text-xs font-mono transition-transform duration-300 shrink-0', activeId === item.id ? 'rotate-180 text-emerald-400' : 'text-slate-500']">
                  ▼
                </span>
              </button>
              
              <div
                v-show="activeId === item.id"
                class="px-5 pb-5 pt-3 text-slate-300 text-xs sm:text-sm leading-relaxed border-t border-slate-800/70 bg-[#020420]/40"
              >
                {{ item.answer }}
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- FOOTER CALL TO ACTION -->
      <div class="bg-gradient-to-br from-[#090d16] via-[#0b1324] to-[#020420] border border-emerald-500/30 rounded-3xl p-8 text-center flex flex-col items-center gap-5 shadow-xl">
        <div>
          <h3 class="text-xl sm:text-2xl font-black text-white mb-2">Non hai trovato quello che cercavi?</h3>
          <p class="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Esplora la documentazione tecnica per sviluppatori oppure apri una discussione nel DKP Talks Hub per confrontarti con la community.
          </p>
        </div>
        <div class="flex flex-wrap justify-center gap-3 font-mono text-xs">
          <NuxtLink to="/docs/api" class="px-5 py-2.5 bg-[#020420] border border-slate-700 hover:border-sky-400 text-sky-400 font-extrabold rounded-xl transition-all">
            🔌 API Reference v2.6
          </NuxtLink>
          <NuxtLink to="/docs/sdk" class="px-5 py-2.5 bg-[#020420] border border-slate-700 hover:border-purple-400 text-purple-400 font-extrabold rounded-xl transition-all">
            📦 SDK &amp; CLI Center
          </NuxtLink>
          <a href="https://github.com/alexdpl/hackernews" target="_blank" rel="noopener noreferrer" class="px-5 py-2.5 bg-[#020420] border border-slate-700 hover:border-slate-500 text-slate-200 font-extrabold rounded-xl transition-all">
            🐙 GitHub Repository
          </a>
          <NuxtLink to="/shop" class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)]">
            🚀 Esplora Shop API Pass
          </NuxtLink>
        </div>
      </div>

    </div>
  </div>
</template>