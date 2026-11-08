<!-- app/pages/bounties/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useDkpSeo({
  title: 'Bounty Board & $PULSE Economy Hub — DevKernelPulse v2.5-GOLD',
  description: 'Guadagna token $PULSE risolvendo issue open-source, notarizzando audit ed esplorando il Rewards Store ufficiale.'
})

// --- 1. STATO GLOBALE WALLET ---
const userPulseBalance = ref(350)
const showToast = ref(false)
const toastMessage = ref('')

function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => showToast.value = false, 3500)
}

// --- 2. LOGICA BOUNTY BOARD (Earning) ---
const { data: response, pending, error: bountyError } = await useFetch('/api/bounties').catch(() => ({ data: ref(null), pending: ref(false), error: ref(true) }))

// Fallback dinamico con Bounties avanzati per test & demo
const fallbackBounties = [
  {
    github_issue_id: 'issue-101',
    repo_name: 'devkernelpulse/nitro-engine',
    title: 'Ottimizzazione Latenza SSE & Streaming Telemetria Live',
    reward_pulse: 150,
    difficulty: 'Hard',
    url: 'https://github.com/alexdpl/devkernelpulse/issues/101',
    tags: ['Nuxt 3', 'SSE', 'Nitro']
  },
  {
    github_issue_id: 'issue-88',
    repo_name: 'devkernelpulse/vault-sdk',
    title: 'Aggiunta Supporto Notarizzazione Hash SHA3-256 nel Vault',
    reward_pulse: 90,
    difficulty: 'Medium',
    url: 'https://github.com/alexdpl/devkernelpulse/issues/88',
    tags: ['Crypto', 'TypeScript', 'SAST']
  },
  {
    github_issue_id: 'issue-74',
    repo_name: 'devkernelpulse/ai-scanner',
    title: 'Fix Parsificazione AST per File Vue SFC in Nuxt 4',
    reward_pulse: 50,
    difficulty: 'Easy',
    url: 'https://github.com/alexdpl/devkernelpulse/issues/74',
    tags: ['Vue 3', 'AST', 'Parser']
  },
  {
    github_issue_id: 'issue-112',
    repo_name: 'devkernelpulse/dkp-cli',
    title: 'Implementazione CLI Command per Audit di Sicurezza Automatica',
    reward_pulse: 120,
    difficulty: 'Medium',
    url: 'https://github.com/alexdpl/devkernelpulse/issues/112',
    tags: ['Node.js', 'CLI', 'Security']
  }
]

const bounties = computed(() => {
  const raw = response.value?.bounties
  return (raw && raw.length > 0) ? raw : fallbackBounties
})

// Filtri Bounty
const selectedDifficulty = ref<'All' | 'Easy' | 'Medium' | 'Hard'>('All')
const bountySearchQuery = ref('')

const filteredBounties = computed(() => {
  return bounties.value.filter((b: any) => {
    const matchesDiff = selectedDifficulty.value === 'All' || b.difficulty === selectedDifficulty.value
    const matchesQuery = b.title.toLowerCase().includes(bountySearchQuery.value.toLowerCase()) ||
                         b.repo_name.toLowerCase().includes(bountySearchQuery.value.toLowerCase())
    return matchesDiff && matchesQuery
  })
})

const claimingId = ref<string | null>(null)

const claimBounty = async (id: string, reward: number, title: string) => {
  claimingId.value = id
  setTimeout(() => {
    triggerToast(`🎯 Task Reclamato! Completa la issue "${title.slice(0, 25)}..." per ricevere ${reward} $PULSE.`)
    claimingId.value = null
  }, 700)
}

// --- 3. LOGICA REWARDS STORE (Spending) ---
const storeItems = [
  { itemId: 'BADGE_PRO', name: 'Badge Pro VIP Dorato', description: 'Aggiunge un badge VIP luccicante permanente sul profilo.', cost: 50, icon: '✨', category: 'Badge' },
  { itemId: 'COLOR_NEON', name: 'Colore Nome Emerald Neon', description: 'Illumina il tuo username di verde neon nella community.', cost: 30, icon: '🟢', category: 'Style' },
  { itemId: 'BOOST_SHOWCASE', name: 'Boost Project Showcase (24h)', description: 'Metti in primo piano il tuo articolo o repository nella home.', cost: 100, icon: '🚀', category: 'Boost' },
  { itemId: 'AI_SCAN_PASS', name: 'AI Security Pass (50 Scans)', description: 'Sblocca 50 scansioni di vulnerabilità avanzate col motore SAST.', cost: 150, icon: '🤖', category: 'Dev Tools' },
  { itemId: 'SDK_LICENSE', name: 'Licenza DKP SDK Enterprise', description: 'Accesso prioritario senza rate-limit alle API pubbliche.', cost: 300, icon: '🔑', category: 'Dev Tools' }
]

const purchasing = ref(false)
const storeMessage = ref('')
const storeError = ref('')

async function purchaseItem(item: any) {
  if (userPulseBalance.value < item.cost) {
    return triggerToast(`❌ Saldo insufficiente! Ti mancano ${item.cost - userPulseBalance.value} $PULSE.`)
  }

  purchasing.value = true
  storeMessage.value = ''
  storeError.value = ''

  try {
    const res: any = await $fetch('/api/wallet/spend', {
      method: 'POST',
      body: { itemId: item.itemId }
    }).catch(() => null)

    if (res && res.success) {
      userPulseBalance.value = res.newBalance
      triggerToast(`🎉 Acquistato "${item.name}" con successo!`)
    } else {
      // Fallback simulazione client-side in assenza di backend endpoint
      userPulseBalance.value -= item.cost
      triggerToast(`🎉 Acquistato "${item.name}"! Nuovo saldo: ${userPulseBalance.value} $PULSE`)
    }
  } catch (err: any) {
    triggerToast('❌ Errore durante la transazione.')
  } finally {
    purchasing.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 font-sans px-4 sm:px-6 py-8 sm:py-12 relative">
    
    <!-- TOAST NOTIFICATION -->
    <Transition name="fade">
      <div v-if="showToast" class="fixed top-20 sm:top-5 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-5 bg-slate-950 border border-emerald-500 text-emerald-400 px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.25)] font-bold text-sm z-50 whitespace-nowrap text-center">
        {{ toastMessage }}
      </div>
    </Transition>

    <div class="max-w-6xl mx-auto flex flex-col gap-6">
      
      <!-- NAVIGATION TABS BAR -->
      <nav class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-[#090d16] p-2 border border-slate-800 rounded-2xl shadow-xl">
        <NuxtLink to="/user/dashboard?tab=profile" class="py-2.5 px-3 rounded-xl font-extrabold text-xs text-slate-400 hover:text-white border border-transparent text-center truncate">
          ⚙️ Profilo &amp; Social
        </NuxtLink>
        <NuxtLink to="/user/dashboard?tab=content" class="py-2.5 px-3 rounded-xl font-extrabold text-xs text-slate-400 hover:text-white border border-transparent text-center truncate">
          📰 I Miei Contenuti
        </NuxtLink>
        <NuxtLink to="/user/dashboard?tab=vault" class="py-2.5 px-3 rounded-xl font-extrabold text-xs text-slate-400 hover:text-white border border-transparent text-center truncate">
          🛡️ Proof of Code Vault
        </NuxtLink>
        <NuxtLink to="/user/dashboard?tab=api" class="py-2.5 px-3 rounded-xl font-extrabold text-xs text-slate-400 hover:text-white border border-transparent text-center truncate">
          🔑 DKP API Console
        </NuxtLink>
        <NuxtLink to="/user/dashboard?tab=gamification" class="py-2.5 px-3 rounded-xl font-extrabold text-xs text-slate-400 hover:text-white border border-transparent text-center truncate">
          🏆 Gamification &amp; XP
        </NuxtLink>
        <div class="py-2.5 px-3 rounded-xl font-extrabold text-xs bg-amber-500/15 text-amber-400 border border-amber-500/40 text-center truncate shadow-sm">
          🎯 Bounty &amp; $PULSE Wallet
        </div>
      </nav>

      <!-- HERO WALLET CARD -->
      <div class="bg-[#090d16] border border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div class="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="relative z-10 text-center md:text-left">
          <div class="flex items-center justify-center md:justify-start gap-3">
            <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight">
              $PULSE Economy Hub
            </h1>
            <span class="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider">Live Network</span>
          </div>
          <p class="text-slate-400 text-xs sm:text-sm mt-2 max-w-xl leading-relaxed">
            Guadagna token risolvendo issue open-source dell'ecosistema DKP e spendili nel Rewards Store per sbloccare perk e badge esclusivi.
          </p>
        </div>

        <!-- SALDO GRANDE CON ANIMAZIONE -->
        <div class="flex items-center gap-4 bg-[#020420] px-6 py-4 rounded-2xl border border-slate-800 shadow-inner shrink-0 relative z-10">
          <div class="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse">
            <span class="text-2xl font-black text-slate-950">P</span>
          </div>
          <div class="text-left">
            <div class="text-[10px] text-slate-500 font-black uppercase tracking-widest">Saldo Disponibile</div>
            <div class="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              {{ userPulseBalance }} <span class="text-xs text-slate-400 font-bold">$PULSE</span>
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN GRID: BOUNTY BOARD & REWARDS STORE -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        <!-- COLONNA SINISTRA: BOUNTY BOARD (EARNING) -->
        <div class="xl:col-span-7 flex flex-col gap-6">
          
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-2xl">🛠️</span>
              <h2 class="text-xl font-black text-white">Guadagna Token (Bounties)</h2>
            </div>
            
            <div class="text-xs text-slate-400 font-mono">
              Taglie Attive: <strong class="text-emerald-400">{{ filteredBounties.length }}</strong>
            </div>
          </div>

          <!-- BARRA RICERCA E FILTRI -->
          <div class="flex flex-col sm:flex-row gap-3 bg-[#090d16] p-3 border border-slate-800 rounded-2xl">
            <input 
              v-model="bountySearchQuery"
              type="text"
              placeholder="Cerca per repository o titolo..."
              class="flex-1 bg-[#020420] border border-slate-700/80 text-white p-2.5 rounded-xl text-xs outline-none focus:border-emerald-400"
            />
            <div class="flex gap-1">
              <button 
                v-for="diff in ['All', 'Easy', 'Medium', 'Hard'] as const" 
                :key="diff"
                @click="selectedDifficulty = diff"
                class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                :class="selectedDifficulty === diff ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-white'"
              >
                {{ diff }}
              </button>
            </div>
          </div>

          <!-- STATI DI CARICAMENTO / ERRORE -->
          <div v-if="pending" class="text-emerald-400 font-mono flex items-center justify-center p-12 bg-[#090d16] rounded-3xl border border-slate-800">
            <span class="animate-spin mr-2">⚡</span> Sincronizzazione rete Bounties...
          </div>
          
          <div v-else-if="bountyError" class="p-6 bg-red-950/40 text-red-300 rounded-3xl border border-red-800 text-center text-sm font-bold">
            ❌ Errore durante il caricamento delle issue di rete.
          </div>

          <div v-else-if="filteredBounties.length === 0" class="p-12 text-center text-slate-500 bg-[#090d16] rounded-3xl border border-slate-800 italic text-sm">
            📭 Nessuna taglia trovata con i filtri selezionati.
          </div>
          
          <!-- LISTA CARDS BOUNTY -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              v-for="bounty in filteredBounties" 
              :key="bounty.github_issue_id" 
              class="bg-[#090d16] border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-xl hover:shadow-[0_8px_25px_rgba(245,158,11,0.15)] group"
            >
              <div class="flex flex-col gap-3">
                <div class="flex justify-between items-start gap-2">
                  <span class="text-[11px] font-mono text-slate-400 truncate">📦 {{ bounty.repo_name }}</span>
                  <span class="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-black font-mono shrink-0">
                    +{{ bounty.reward_pulse }} $PULSE
                  </span>
                </div>

                <a 
                  :href="bounty.url" 
                  target="_blank" 
                  class="text-white font-extrabold text-sm leading-snug group-hover:text-amber-400 transition-colors"
                >
                  {{ bounty.title }}
                </a>

                <!-- TAGS & DIFFICOLTÀ -->
                <div class="flex flex-wrap gap-1.5 mt-1">
                  <span 
                    class="text-[10px] font-black px-2 py-0.5 rounded border uppercase"
                    :class="bounty.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : bounty.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'"
                  >
                    {{ bounty.difficulty }}
                  </span>
                  <span v-for="tag in bounty.tags" :key="tag" class="bg-[#020420] text-sky-400 border border-slate-800 text-[10px] px-2 py-0.5 rounded font-mono">
                    #{{ tag }}
                  </span>
                </div>
              </div>

              <div class="flex justify-between items-center mt-5 pt-4 border-t border-slate-800/80">
                <span class="text-[10px] uppercase font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">Issue GitHub</span>
                <button 
                  @click="claimBounty(bounty.github_issue_id, bounty.reward_pulse, bounty.title)" 
                  :disabled="claimingId === bounty.github_issue_id" 
                  class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                >
                  {{ claimingId === bounty.github_issue_id ? 'In corso...' : 'Accetta 🎯' }}
                </button>
              </div>
            </div>
          </div>

        </div>

        <!-- COLONNA DESTRA: REWARDS STORE (SPENDING) -->
        <div class="xl:col-span-5 bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 h-fit">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🛍️</span>
            <h2 class="text-xl font-black text-white">Spendi Token (Store)</h2>
          </div>

          <div class="flex flex-col gap-4">
            <div 
              v-for="item in storeItems" 
              :key="item.itemId" 
              class="bg-[#020420] border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-4 flex items-center gap-4 transition-colors"
            >
              <div class="text-2xl sm:text-3xl bg-[#090d16] p-3 rounded-xl border border-slate-800 shrink-0">
                {{ item.icon }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="text-white font-extrabold text-sm truncate">{{ item.name }}</h3>
                </div>
                <p class="text-slate-400 text-xs mt-0.5 leading-relaxed">{{ item.description }}</p>
                <div class="mt-2 text-emerald-400 font-mono font-black text-xs">
                  ⚡ {{ item.cost }} $PULSE
                </div>
              </div>
              <button 
                @click="purchaseItem(item)"
                :disabled="purchasing || userPulseBalance < item.cost"
                class="shrink-0 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl disabled:bg-slate-800 disabled:text-slate-600 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                {{ userPulseBalance < item.cost ? 'Saldo KO' : 'Sblocca' }}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { 
  transition: opacity 0.4s ease, transform 0.4s ease; 
}
.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
  transform: translateY(-10px); 
}
</style>