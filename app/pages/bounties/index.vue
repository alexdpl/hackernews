<!-- app/pages/bounties/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'Bounty Board | DevKernelPulse v2.5'
})

const { data: response, pending, error } = await useFetch('/api/bounties')
const bounties = computed(() => response.value?.bounties || [])

// Stato simulato dell'utente
const userPulseBalance = ref(350)
const claimingId = ref<string | null>(null)

const claimBounty = async (id: string, reward: number) => {
  claimingId.value = id
  // Simulazione POST API per reclamare la taglia
  setTimeout(() => {
    alert(`🎯 Ottima scelta, socio! Hai reclamato il task. Completa la issue su GitHub per ricevere i tuoi ${reward} $PULSE.`)
    claimingId.value = null
  }, 800)
}
</script>

<template>
  <div class="bounty-view cyberpunk-container p-4 max-w-5xl mx-auto min-h-screen">
    
    <!-- HEADER BOUNTY BOARD -->
    <div class="bounty-header flex justify-between items-center pb-4 mb-6 border-b border-gray-800 flex-wrap gap-4">
      <div>
        <h1 class="text-2xl font-black text-white flex items-center gap-3">
          Open Source Bounty Board
          <span class="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-1 rounded font-mono font-bold uppercase tracking-wider">
            Phase 1
          </span>
        </h1>
        <p class="text-gray-400 text-sm mt-1">
          Risolvi issue GitHub sui progetti partner e guadagna $PULSE per sbloccare feature esclusive.
        </p>
      </div>

      <!-- PORTAFOGLIO UTENTE -->
      <div class="wallet-badge flex items-center gap-2 px-4 py-2 bg-[#020420] border border-emerald-500/40 rounded-xl shadow-[0_0_15px_rgba(0,220,130,0.15)]">
        <span class="text-gray-400 text-xs font-bold uppercase tracking-wider">Il tuo Wallet</span>
        <span class="text-emerald-400 font-mono font-black text-lg">
          {{ userPulseBalance }} <span class="text-sm">$PULSE</span>
        </span>
      </div>
    </div>

    <!-- MESSAGGI STATO -->
    <div v-if="pending" class="text-emerald-400 font-mono flex items-center gap-2 mb-8">
      <span class="animate-spin">⚡</span> Sincronizzazione con la rete GitHub...
    </div>
    <div v-else-if="error" class="p-4 bg-red-900/40 text-red-300 rounded border border-red-700 mb-8">
      Errore di connessione ai nodi. Impossibile recuperare i Bounties.
    </div>
    <div v-else-if="bounties.length === 0" class="p-12 text-center text-gray-400 bg-gray-900/40 rounded-xl border border-gray-800">
      📭 Nessuna taglia attiva al momento.
    </div>

    <!-- LISTA TAGLIE -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div 
        v-for="bounty in bounties" 
        :key="bounty.github_issue_id"
        class="bounty-card flex flex-col justify-between p-5 bg-gray-900/60 rounded-xl border border-gray-800 hover:border-amber-500/50 transition-all hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(245,158,11,0.1)] relative overflow-hidden"
      >
        <!-- Decorazione Angolo -->
        <div class="absolute -top-6 -right-6 w-16 h-16 bg-amber-500/10 rounded-full blur-xl"></div>

        <div class="mb-4 relative z-10">
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs font-mono text-gray-400 flex items-center gap-1">
              📦 {{ bounty.repo_name }}
            </span>
            <span class="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-xs font-bold font-mono">
              +{{ bounty.reward_pulse }} $PULSE
            </span>
          </div>
          
          <a :href="bounty.url" target="_blank" class="block text-gray-100 font-bold text-lg leading-tight hover:text-amber-400 transition-colors">
            {{ bounty.title }}
          </a>
        </div>

        <div class="flex justify-between items-center mt-2 pt-4 border-t border-gray-800 relative z-10">
          <div class="flex gap-2">
            <span class="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Good First Issue</span>
          </div>
          
          <button 
            @click="claimBounty(bounty.github_issue_id, bounty.reward_pulse)"
            :disabled="claimingId === bounty.github_issue_id"
            class="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-extrabold rounded-lg hover:bg-amber-400 transition-all disabled:bg-gray-700 disabled:text-gray-400"
          >
            <span v-if="claimingId === bounty.github_issue_id">Reclamando...</span>
            <span v-else>Accetta Taglia 🎯</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.bounty-view {
  background-color: #0d1117;
}
.bounty-card {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>