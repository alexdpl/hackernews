<!-- components/UserXpHistory.vue -->
<script setup>
import { ref, onMounted } from 'vue'

const history = ref([])
const loading = ref(true)

const fetchHistory = async () => {
  try {
    const res = await $fetch('/api/user/xp/history')
    if (res.success) {
      history.value = res.data
    }
  } catch (e) {
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchHistory()
  // Se guadagni XP mentre sei sulla pagina, aggiorna anche la lista!
  window.addEventListener('dkp:xp_updated', fetchHistory)
})
</script>

<template>
  <div class="bg-[#090d16] border border-slate-800 rounded-xl p-6 shadow-xl">
    <div class="flex items-center gap-3 border-b border-slate-800/80 pb-4 mb-4">
      <span class="text-2xl">📜</span>
      <h3 class="text-white font-bold text-lg">Storico Attività & Transazioni XP</h3>
    </div>

    <div v-if="loading" class="text-slate-500 animate-pulse text-sm">Caricamento protocolli...</div>
    
    <div v-else-if="history.length === 0" class="text-center py-6 text-slate-500 italic text-sm">
      Nessuna attività registrata di recente. Inizia a pubblicare o notarizzare!
    </div>

    <div v-else class="flex flex-col gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
      <div v-for="item in history" :key="item.id" class="flex justify-between items-center bg-[#020412]/50 border border-slate-800/50 p-3 rounded-lg hover:border-emerald-500/30 transition-colors">
        <div class="flex flex-col">
          <span class="text-slate-300 font-medium text-sm">{{ item.action }}</span>
          <!-- Aggiungi data se presente in item.createdAt -->
          <span class="text-slate-600 text-xs mt-1">Registrato nel DB</span> 
        </div>
        <div class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-black font-mono text-sm px-3 py-1 rounded-lg">
          +{{ item.points }} XP
        </div>
      </div>
    </div>
  </div>
</template>