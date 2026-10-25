<!-- app/pages/bounties/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'Bounty & Wallet | DevKernelPulse v2.5'
})

// --- 1. STATO GLOBALE (Simulato, da collegare poi all'API utente reale) ---
const userPulseBalance = ref(350)

// --- 2. LOGICA BOUNTY BOARD (Earning) ---
const { data: response, pending, error: bountyError } = await useFetch('/api/bounties')
const bounties = computed(() => response.value?.bounties || [])
const claimingId = ref<string | null>(null)

const claimBounty = async (id: string, reward: number) => {
  claimingId.value = id
  // Simulazione POST API per reclamare la taglia
  setTimeout(() => {
    alert(`🎯 Ottima scelta! Hai reclamato il task. Completa la issue su GitHub per ricevere i tuoi ${reward} $PULSE.`)
    claimingId.value = null
  }, 800)
}

// --- 3. LOGICA REWARDS STORE (Spending) ---
const storeItems = [
  { itemId: 'BADGE_PRO', name: 'Badge Pro Dorato', description: 'Aggiunge un badge esclusivo al tuo profilo.', cost: 50, icon: '✨' },
  { itemId: 'COLOR_NEON', name: 'Colore Nome Neon', description: 'Illumina il tuo nickname di verde neon.', cost: 30, icon: '🟢' },
  { itemId: 'BOOST_SHOWCASE', name: 'Boost Showcase', description: 'Metti in evidenza post e progetti per 24h.', cost: 100, icon: '🚀' }
]

const purchasing = ref(false)
const storeMessage = ref('')
const storeError = ref('')

async function purchaseItem(itemId: string) {
  purchasing.value = true
  storeMessage.value = ''
  storeError.value = ''

  try {
    const res = await $fetch('/api/wallet/spend', {
      method: 'POST',
      body: { itemId }
    })
    storeMessage.value = res.message
    userPulseBalance.value = res.newBalance // Aggiorna il saldo in tempo reale!
  } catch (err: any) {
    storeError.value = err.data?.statusMessage || 'Errore durante la transazione.'
  } finally {
    purchasing.value = false
  }
}
</script>

<template>
  <div class="bounty-view p-4 max-w-6xl mx-auto min-h-screen">
    
    <!-- NAVBAR DI NAVIGAZIONE -->
    <nav class="tabs-navigation grid-nav mb-8 mt-2">
      <NuxtLink to="/user/dashboard?tab=profile" class="tab-item">⚙️ Profilo & Social</NuxtLink>
      <NuxtLink to="/user/dashboard?tab=content" class="tab-item">📰 I Miei Contenuti</NuxtLink>
      <NuxtLink to="/user/dashboard?tab=vault" class="tab-item">🛡️ Proof of Code Vault</NuxtLink>
      <NuxtLink to="/user/dashboard?tab=api" class="tab-item">🔑 DKP API Console</NuxtLink>
      <NuxtLink to="/user/dashboard?tab=gamification" class="tab-item">🏆 Gamification & XP</NuxtLink>
      <div class="tab-item bounty-link active-tab">🎯 Bounty & $PULSE Wallet</div>
    </nav>

    <!-- HUB CENTRALE: IL WALLET -->
    <div class="bg-gray-900/80 border border-emerald-500/30 rounded-3xl p-8 mb-10 shadow-[0_0_30px_rgba(16,185,129,0.05)] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
      <div class="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
      
      <div>
        <h1 class="text-3xl font-black text-white flex items-center gap-3">
          $PULSE Economy Hub
          <span class="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded font-mono font-bold uppercase">Live</span>
        </h1>
        <p class="text-gray-400 text-sm mt-2">Guadagna token risolvendo issue e spendili nello store per personalizzare il tuo profilo.</p>
      </div>

      <!-- SALDO GRANDE -->
      <div class="flex items-center gap-4 bg-[#020420] px-6 py-4 rounded-2xl border border-gray-800 shadow-inner z-10">
        <div class="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse">
          <span class="text-2xl font-black text-white">P</span>
        </div>
        <div class="text-left">
          <div class="text-xs text-gray-500 font-bold uppercase tracking-widest">Saldo Disponibile</div>
          <div class="text-4xl font-black text-emerald-400 tracking-tight">{{ userPulseBalance }}</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
      
      <!-- COLONNA SINISTRA: BOUNTY BOARD (EARNING) -->
      <div class="xl:col-span-7">
        <div class="flex items-center gap-3 mb-6">
          <span class="text-2xl">🛠️</span>
          <h2 class="text-xl font-bold text-white">Guadagna Token (Bounties)</h2>
        </div>

        <div v-if="pending" class="text-emerald-400 font-mono flex items-center gap-2">
          <span class="animate-spin">⚡</span> Sincronizzazione rete...
        </div>
        <div v-else-if="bountyError" class="p-4 bg-red-900/40 text-red-300 rounded border border-red-700">
          Errore di connessione ai nodi.
        </div>
        <div v-else-if="bounties.length === 0" class="p-12 text-center text-gray-400 bg-gray-900/40 rounded-xl border border-gray-800">
          📭 Nessuna taglia attiva al momento.
        </div>
        
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div v-for="bounty in bounties" :key="bounty.github_issue_id" class="bounty-card flex flex-col justify-between p-5 bg-gray-900/60 rounded-xl border border-gray-800 hover:border-amber-500/50 transition-all hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(245,158,11,0.1)]">
            <div class="mb-4">
              <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-mono text-gray-400">📦 {{ bounty.repo_name }}</span>
                <span class="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-xs font-bold font-mono">
                  +{{ bounty.reward_pulse }} $PULSE
                </span>
              </div>
              <a :href="bounty.url" target="_blank" class="block text-gray-100 font-bold text-base leading-tight hover:text-amber-400 transition-colors">
                {{ bounty.title }}
              </a>
            </div>
            <div class="flex justify-between items-center mt-2 pt-4 border-t border-gray-800">
              <span class="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Issue</span>
              <button @click="claimBounty(bounty.github_issue_id, bounty.reward_pulse)" :disabled="claimingId === bounty.github_issue_id" class="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-extrabold rounded-lg hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-400">
                {{ claimingId === bounty.github_issue_id ? 'Attendere...' : 'Accetta 🎯' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- COLONNA DESTRA: REWARDS STORE (SPENDING) -->
      <div class="xl:col-span-5 bg-[#0a0d18] border border-gray-800 rounded-2xl p-6 shadow-xl h-fit">
        <div class="flex items-center gap-3 mb-6">
          <span class="text-2xl">🛍️</span>
          <h2 class="text-xl font-bold text-white">Spendi Token (Store)</h2>
        </div>

        <div v-if="storeMessage" class="mb-4 p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-sm rounded-lg text-center">
          {{ storeMessage }}
        </div>
        <div v-if="storeError" class="mb-4 p-3 bg-rose-950/80 border border-rose-500 text-rose-200 text-sm rounded-lg text-center">
          {{ storeError }}
        </div>

        <div class="flex flex-col gap-4">
          <div v-for="item in storeItems" :key="item.itemId" class="bg-gray-900 border border-gray-800/80 rounded-xl p-4 flex gap-4 items-center hover:border-emerald-500/40 transition-colors">
            <div class="text-3xl bg-gray-950 p-3 rounded-lg border border-gray-800">{{ item.icon }}</div>
            <div class="flex-1">
              <h3 class="text-white font-bold text-sm">{{ item.name }}</h3>
              <p class="text-gray-400 text-xs mt-0.5">{{ item.description }}</p>
              <div class="mt-2 text-emerald-400 font-mono font-bold text-sm">⚡ {{ item.cost }} $PULSE</div>
            </div>
            <button 
              @click="purchaseItem(item.itemId)"
              :disabled="purchasing || userPulseBalance < item.cost"
              class="shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg disabled:bg-gray-800 disabled:text-gray-500 transition-colors"
            >
              {{ purchasing ? '...' : (userPulseBalance < item.cost ? 'Saldo KO' : 'Sblocca') }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.bounty-view {
  background-color: #020420;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.tabs-navigation { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 0.5rem; 
  border-bottom: 1px solid #1e293b; 
  padding-bottom: 0.75rem; 
}

.tab-item { 
  background: #090d16; 
  border: 1px solid #1e293b; 
  color: #94a3b8; 
  padding: 0.6rem 1rem; 
  border-radius: 8px; 
  font-weight: 700; 
  font-size: 0.88rem; 
  cursor: pointer; 
  flex: 1 1 auto; 
  text-align: center; 
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.tab-item:hover:not(.active-tab) {
  border-color: #334155;
  color: #ffffff;
}

.grid-nav { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; } 
@media (max-width: 768px) { .grid-nav { grid-template-columns: repeat(2, 1fr); } } 
@media (max-width: 480px) { .grid-nav { grid-template-columns: 1fr; } } 

.bounty-link { 
  background: rgba(16, 185, 129, 0.1); 
  border-color: rgba(16, 185, 129, 0.4); 
  color: #10B981; 
  font-weight: 800; 
} 

.active-tab {
  cursor: default;
  box-shadow: inset 0 0 10px rgba(16, 185, 129, 0.1);
}
</style>