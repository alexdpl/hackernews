<-- app/pages/docs/faq.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import DkpAdsWidget from '~/components/ads/DkpAdsWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

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
  accentText: string
  accentBorder: string
  items: FaqItem[]
}

const faqData: FaqCategory[] = [
  {
    title: 'Sentinel Network — Knowledge Dependabot (DocKeeper & ArchGuard)',
    accentText: 'text-purple-400',
    accentBorder: 'border-purple-500/25',
    items: [
      {
        id: 'ai-1',
        question: 'Cosa sono Sentinel DocKeeper e Sentinel ArchGuard (Knowledge Dependabot)?',
        answer: 'Sono due agenti autonomi del Sentinel Network dotati di ruoli e permessi dedicati su NeonDB. Sentinel DocKeeper analizza semanticamente i code block di Thread Forum e Articoli Blog rilevando librerie obsolete o runtime EOL (es. moment, request, node-fetch, lodash CommonJS, immagini Docker legacy) e pubblicando un auto-commento con la migrazione moderna. Sentinel ArchGuard verifica invece pattern architetturali, sicurezza SQL/DOM-XSS e allineamento alla documentazione ufficiale Nuxt/Nitro/Drizzle.'
      },
      {
        id: 'ai-2',
        question: 'Quali permessi hanno le Sentinelle nel database Neon PostgreSQL?',
        answer: 'I permessi sono governati dalla tabella Pure SQL sentinel_role_permissions e dai ruoli dedicati sentinel_dockeeper e sentinel_archguard. Ogni agente può leggere i contenuti, analizzare i code block e pubblicare auto-commenti su Thread e Blog, mentre la modifica strutturale del core DB è bloccata a livello di policy (can_modify_core_db = FALSE).'
      },
      {
        id: 'ai-3',
        question: 'Come funziona la Sentinella Passiva Grammarly-Style negli editor?',
        answer: 'Integrata negli editor di Blog e Nodes, analizza il testo in tempo reale rilevando la lingua (IT/EN), isolando i blocchi di codice per evitare falsi positivi e segnalando ripetizioni, punteggiatura, fence Markdown non chiusi e periodi troppo lunghi con correzione 1-click.'
      }
    ]
  },
  {
    title: 'DKP Blockchain Vault Ledger Unificato (Blog, Forum & Tools)',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500/25',
    items: [
      {
        id: 'vlt-1',
        question: 'Cosa viene registrato nel Blockchain Vault Ledger unificato su n/blockchain-vault?',
        answer: 'Il registro pubblico n/blockchain-vault (alimentato da /api/vault/ledger) unifica in una sola catena crittografica SHA-256 tre domini: gli articoli dell\'Editorial Blog, i thread notarizzati dei Nodi Forum (n/) e gli artefatti verificati nei Developer Tools. Ogni record espone Block Number, Hash SHA-256 a 64 caratteri, Previous Hash e Merkle Root.'
      },
      {
        id: 'vlt-2',
        question: 'Come posso verificare l\'autenticità di un hash SHA-256 sul Vault?',
        answer: 'Nella pagina /nodes/n/blockchain-vault è disponibile il Verificatore Crittografico Live: inserendo un\'impronta SHA-256 a 64 caratteri (oppure cliccando su "Verifica" accanto a qualsiasi certificato), il sistema interroga direttamente il ledger Pure SQL confermando blocco, autore, timestamp e integrità della catena.'
      }
    ]
  },
  {
    title: 'Albero Gerarchico DKP Talks & Admin Control Center',
    accentText: 'text-sky-400',
    accentBorder: 'border-sky-500/25',
    items: [
      {
        id: 'eco-1',
        question: 'Come funziona la navigazione ad albero in DKP Talks (/nodes)?',
        answer: 'La vista /nodes organizza la community in un Albero Gerarchico interattivo suddiviso in 10 Macro-Categorie semantiche con Nodi principali e Sub-Nodi espandibili, filtri rapidi e accesso immediato al registro n/blockchain-vault.'
      },
      {
        id: 'eco-2',
        question: 'Come funziona il sistema di Gamification (XP) e Rank?',
        answer: 'Pubblicando articoli nel DKP Editorial Hub (+150 XP), notarizzando codice nel Vault (+100 XP), condividendo discussioni nei Nodi (+25/+50 XP) o commentando (+10 XP) accumuli Punti XP che aumentano il tuo livello pubblico e sbloccano badge verificati.'
      }
    ]
  },
  {
    title: 'DKP Mail Nexus 2.6 & Sicurezza Pure SQL',
    accentText: 'text-amber-400',
    accentBorder: 'border-amber-500/25',
    items: [
      {
        id: 'mail-1',
        question: 'Perché DKP Mail Nexus utilizza sia Resend sia Brevo?',
        answer: 'Resend gestisce le notifiche critiche del Sentinel Network e gli alert di sicurezza, mentre Brevo gestisce Newsletter con Double Opt-In e comunicazioni comunitarie con failover automatico e webhook idempotenti su Neon DB.'
      },
      {
        id: 'sec-1',
        question: 'Come viene garantita la sicurezza in produzione su Google Cloud Run?',
        answer: 'Ogni endpoint utilizza query SQL parametrizzate Drizzle Pure SQL, sessioni firmate HMAC-SHA256, API key hashate in volo con SHA-256 e scansioni automatiche pre-deploy.'
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

useDkpSeo({
  title: 'Technical FAQ v2.6-PURE-SQL - DevKernelPulse',
  description: 'FAQ tecniche complete su DevKernelPulse v2.6: Sentinel DocKeeper & ArchGuard, Blockchain Vault Ledger unificato, Albero Nodi e Pure SQL.',
  type: 'website',
  canonicalPath: '/docs/faq'
})
</script>

<template>
  <DkpLayout
    title="Docs - FAQ Tecniche"
    subtitle="Risposte tecniche su Knowledge Dependabot, Blockchain Vault Ledger, Albero Nodi e Pure SQL"
    :show-sidebar-ads="true"
  >
    <div class="min-h-screen bg-[#020420] text-slate-100 px-4 sm:px-6 py-8 pb-16 font-sans rounded-2xl">
      <div class="max-w-5xl mx-auto flex flex-col gap-8">

        <!-- BARRA 4 PILASTRI ECOSISTEMA DKP v2.6 -->
        <nav aria-label="Navigazione Ecosistema DKP" class="flex flex-wrap gap-2.5 justify-center font-mono bg-[#090d16] border border-slate-800 p-3 rounded-2xl shadow-lg">
          <NuxtLink to="/news" class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-400 font-extrabold text-xs rounded-xl transition-all no-underline">
            DKP Tech Feed
          </NuxtLink>
          <NuxtLink to="/nodes" class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-purple-400 text-purple-400 font-extrabold text-xs rounded-xl transition-all no-underline">
            DKP Talks Tree
          </NuxtLink>
          <NuxtLink to="/nodes/n/blockchain-vault" class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-300 font-extrabold text-xs rounded-xl transition-all no-underline">
            Blockchain Vault
          </NuxtLink>
          <NuxtLink to="/blog" class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-sky-400 text-sky-300 font-extrabold text-xs rounded-xl transition-all no-underline">
            DKP Editorial Hub
          </NuxtLink>
        </nav>

        <!-- HERO + RICERCA -->
        <header class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-10 text-center shadow-2xl space-y-4">
          <span class="inline-block bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono text-xs font-extrabold px-3 py-1 rounded-full">
            KNOWLEDGE BASE &bull; v2.6-PURE-SQL
          </span>
          <h1 class="text-2xl sm:text-4xl font-black text-white m-0">
            Technical FAQ &amp; Architettura DKP
          </h1>
          <p class="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto m-0">
            Cerca risposte immediate su Sentinel DocKeeper, Sentinel ArchGuard, Blockchain Vault Ledger unificato, Albero DKP Talks e Mail Nexus.
          </p>

          <div class="max-w-xl mx-auto pt-2">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Filtra domande (es. DocKeeper, ArchGuard, Vault, SHA-256, Albero, Nodi)..."
              class="w-full bg-[#020420] border border-slate-700 focus:border-emerald-400 text-white text-xs sm:text-sm px-4 py-3 rounded-xl outline-none font-mono"
            />
          </div>
        </header>

        <!-- ACCORDION CATEGORIE FAQ -->
        <div class="space-y-6">
          <section
            v-for="cat in filteredFaqData"
            :key="cat.title"
            :class="['bg-[#090d16] border rounded-2xl p-5 sm:p-6 space-y-3 shadow-xl', cat.accentBorder]"
          >
            <h2 :class="['text-base sm:text-lg font-extrabold font-mono m-0 pb-2 border-b border-slate-800', cat.accentText]">
              {{ cat.title }}
            </h2>

            <div class="space-y-2.5">
              <div
                v-for="item in cat.items"
                :key="item.id"
                class="bg-[#020420] border border-slate-800 rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  @click="toggleFaq(item.id)"
                  class="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer bg-transparent border-none text-white font-bold text-xs sm:text-sm hover:text-emerald-400 transition-colors"
                >
                  <span>{{ item.question }}</span>
                  <span class="font-mono text-emerald-400 shrink-0">{{ activeId === item.id ? '-' : '+' }}</span>
                </button>
                <div v-if="activeId === item.id" class="px-4 pb-4 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/70 pt-3">
                  {{ item.answer }}
                </div>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
	<DkpAdsWidget
      placement="feedInline"
      layout="horizontal"
      :limit="3"
      :show-advertise-link="true"
    />
    <DkpAdStrip />
  </DkpLayout>
</template>