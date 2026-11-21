<script setup lang="ts">
import { ref, computed } from 'vue'
import DkpAdsWidget from '~/components/ads/DkpAdsWidget.vue'

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
    title: 'DKP Ai Nexus©, Sentinelle & Pulsebot (BEMYAGENT.md)',
    accentText: 'text-purple-400',
    accentBorder: 'border-purple-500/25',
    items: [
      {
        id: 'ai-1',
        question: 'Cos\'è DKP Ai Nexus© e come funziona la Sentinella Passiva Grammarly-Style?',
        answer: 'DKP Ai Nexus© è il modulo AI unificato negli editor di Blog e Nodes (che sostituisce i precedenti AI Studio e AI Copilot). Integra una Sentinella Passiva Grammarly-Style che rileva la lingua del contenuto (IT/EN), isola i blocchi di codice per evitare falsi positivi e segnala in tempo reale ripetizioni, punteggiatura, fence Markdown non chiusi e periodi troppo lunghi con correzione immediata.'
      },
      {
        id: 'ai-2',
        question: 'Che ruolo ha Pulsebot all\'interno del Sentinel Network?',
        answer: 'Pulsebot è la sentinella guardiana abbinata a BEMYAGENT.md incaricata di presidiare la salute tecnica dell\'ecosistema: verifica gli avvisi di build Nuxt/PostCSS, controlla che nessuna API key privata finisca nel client, verifica le dipendenze e valida l\'allineamento tra endpoint Pure SQL e test E2E Playwright.'
      },
      {
        id: 'ai-3',
        question: 'Come funziona l\'autenticazione API Gateway in DevKernelPulse v2.6-PURE-SQL?',
        answer: 'DevKernelPulse utilizza un sistema Zero-Trust basato su Bearer Token (es. dkp_live_...). Il server Nitro calcola in volo l\'hash crittografato SHA-256 e lo confronta tramite query parametrizzata Pure SQL con il campo key_hash su Neon PostgreSQL, eliminando ogni esposizione delle chiavi in chiaro.'
      }
    ]
  },
  {
    title: 'DKP Mail Nexus© 2.6 (Resend + Brevo)',
    accentText: 'text-sky-400',
    accentBorder: 'border-sky-500/25',
    items: [
      {
        id: 'mail-1',
        question: 'Perché DKP Mail Nexus© utilizza sia Resend sia Brevo?',
        answer: 'Per separare i carichi critici da quelli comunitari e massimizzare deliverability e quote gratuite: Resend gestisce le notifiche ad alta priorità del Sentinel Network, della Chat Pulse Nexus e gli alert di sicurezza; Brevo gestisce Newsletter con Double Opt-In, autoresponder e posta ordinaria. In caso di errore o limite di quota su un provider, l\'adapter IMailProvider attiva automaticamente il failover sull\'altro.'
      },
      {
        id: 'mail-2',
        question: 'Come vengono gestiti disiscrizioni e bounce delle email?',
        answer: 'L\'endpoint webhook /api/webhooks/brevo verifica la firma, controlla l\'idempotenza tramite la tabella processed_webhooks su PostgreSQL (evitando doppie elaborazioni) e aggiorna automaticamente email_subscribed e newsletter_optin su false in caso di hard_bounce, spam o unsubscribed.'
      }
    ]
  },
  {
    title: 'Ecosistema a 4 Pilastri & 10 Macro-Nodi',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500/25',
    items: [
      {
        id: 'eco-1',
        question: 'Come sono organizzati i Nodi nella v2.6-PURE-SQL?',
        answer: 'La gerarchia dei forum è stata ristrutturata semanticamente su 10 Macro-Nodi bilanciati: DKP Ecosystem & Core, Community & Social, Dev/Tech/Architecture, AI & LLM, Security & Vault, Cloud/Infra/DB, Tools & Analytics, Blockchain & Web3, Mobile Development e Programming Languages & Systems.'
      },
      {
        id: 'eco-2',
        question: 'Come funziona il sistema di Gamification (XP) e Rank?',
        answer: 'Pubblicando articoli nel DKP Editorial Hub (+150 XP), notarizzando codice nel Vault (+100 XP), condividendo discussioni nei Nodi (+50 XP) o commentando (+10 XP) accumuli Punti XP che aumentano il tuo livello, sbloccano badge verificati e ampliano le quote API mensili.'
      }
    ]
  },
  {
    title: 'Proof of Code Vault & Cloud Security',
    accentText: 'text-amber-400',
    accentBorder: 'border-amber-500/25',
    items: [
      {
        id: 'vlt-1',
        question: 'Cos\'è il Proof of Code Vault e come si verifica un certificato?',
        answer: 'Il Proof of Code Vault calcola un hash SHA-256 concatenato su dkp_vault_ledger per codice sorgente, thread del forum e articoli del blog. Chiunque può verificare l\'integrità e la data certa di un contenuto tramite l\'impronta SHA-256 a 64 caratteri sul nodo pubblico n/blockchain-vault.'
      },
      {
        id: 'sec-1',
        question: 'Come viene garantita la stabilità in produzione su Google Cloud Run?',
        answer: 'Ogni release viene compilata in container multi-stage isolati e validata da una pipeline CI/CD con test E2E Playwright reali su rotte API, SEO, SSR e rotte dinamiche, garantendo assenza di errori 500 e parità totale tra ambiente locale e produzione.'
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
  description: 'FAQ tecniche complete su DevKernelPulse v2.6: DKP Ai Nexus©, Mail Nexus©, Pulsebot, 10 Macro-Nodi, Pure SQL e Blockchain Vault.',
  type: 'website',
  canonicalPath: '/docs/faq'
})
</script>

<template>
  <DkpLayout
    title="Docs - FAQ Tecniche"
    subtitle="Risposte tecniche su DKP Ai Nexus©, Mail Nexus©, sicurezza e database Pure SQL"
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
            DKP Talks Hub
          </NuxtLink>
          <NuxtLink to="/tools" class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-sky-400 text-sky-400 font-extrabold text-xs rounded-xl transition-all no-underline">
            Developer Tools
          </NuxtLink>
          <NuxtLink to="/blog" class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-300 font-extrabold text-xs rounded-xl transition-all no-underline">
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
            Cerca risposte immediate su DKP Ai Nexus©, Sentinella Passiva, DKP Mail Nexus© (Resend + Brevo), 10 Macro-Nodi e Blockchain Vault.
          </p>

          <div class="max-w-xl mx-auto pt-2">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Filtra domande (es. Nexus, Resend, Brevo, Pulsebot, SHA-256, Nodi)..."
              class="w-full bg-[#020420] border border-slate-700 focus:border-emerald-400 text-white text-xs sm:text-sm px-4 py-3 rounded-xl outline-none font-mono"
            />
          </div>
        </header>

        <DkpAdsWidget placement="feedInline" layout="horizontal" :limit="3" :show-advertise-link="true" />

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
                  <span class="font-mono text-emerald-400 shrink-0">{{ activeId === item.id ? '−' : '+' }}</span>
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
  </DkpLayout>
</template>