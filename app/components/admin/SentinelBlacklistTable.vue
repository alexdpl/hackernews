<script setup lang="ts">
import { ref, onMounted } from 'vue'

const bannedList = ref<any[]>([])
const isLoading = ref(false)
const manualIp = ref('')
const errorMsg = ref('')
const successMsg = ref('')

async function fetchBlacklist() {
  isLoading.value = true
  try {
    const res = await $fetch<any>('/api/admin/sentinel')
    if (res?.success && res?.sentinelState?.bannedIPsList) {
      bannedList.value = res.sentinelState.bannedIPsList
    } else {
      bannedList.value = []
    }
  } catch (err: any) {
    errorMsg.value = 'Errore nel recupero della blacklist dal database.'
  } finally {
    isLoading.value = false
  }
}

async function handleAction(actionName: string, ipValue: string, reasonText = 'Ban Manuale Admin') {
  errorMsg.value = ''
  successMsg.value = ''
  try {
    const res = await $fetch<any>('/api/admin/sentinel/action', {
      method: 'POST',
      body: { action: actionName, ip: ipValue, reason: reasonText }
    })
    if (res?.success) {
      successMsg.value = res.message
      setTimeout(() => { successMsg.value = '' }, 3500)
      await fetchBlacklist()
    }
  } catch (err: any) {
    errorMsg.value = err.data?.statusMessage || 'Errore durante l\'esecuzione dell\'azione.'
  }
}

async function submitBan() {
  if (!manualIp.value.trim()) return
  await handleAction('ban_ip', manualIp.value.trim())
  manualIp.value = ''
}

onMounted(() => {
  fetchBlacklist()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- TOAST MESSAGGI -->
    <div v-if="successMsg" class="bg-emerald-500/20 border border-emerald-500 text-emerald-300 px-4 py-3 rounded-xl font-bold text-xs shadow-lg">
      {{ successMsg }}
    </div>
    <div v-if="errorMsg" class="bg-rose-500/20 border border-rose-500 text-rose-300 px-4 py-3 rounded-xl font-bold text-xs shadow-lg">
      {{ errorMsg }}
    </div>

    <!-- FORM INSERIMENTO BAN -->
    <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h3 class="text-white font-bold text-base mb-1">Aggiungi Ban IP Manuale (Neon DB)</h3>
        <p class="text-xs text-slate-400">Inserisci un indirizzo IP da bloccare permanentemente a livello database.</p>
      </div>
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <input 
          v-model="manualIp" 
          type="text" 
          placeholder="es. 192.168.1.50" 
          class="bg-[#020420] border border-slate-800 px-3.5 py-2 rounded-xl text-slate-100 text-xs font-mono outline-none focus:border-rose-500 w-full sm:w-48" 
        />
        <button 
          @click="submitBan" 
          class="px-4 py-2 bg-rose-500/20 border border-rose-500 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
        >
          🚫 Ban IP
        </button>
      </div>
    </div>

    <!-- TABELLA IP BANNATI REALE -->
    <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <h3 class="text-white font-bold text-base">Blacklist Attiva ({{ bannedList.length }})</h3>
        <!-- CORRETTO: richiamiamo fetchBlacklist anziché refresh() -->
        <button @click="fetchBlacklist" class="px-3.5 py-2 bg-[#020420] border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
          🔄 Aggiorna Tabella
        </button>
      </div>

      <div v-if="isLoading" class="p-8 text-center text-slate-500 font-mono text-xs">
        Caricamento dati dal database Neon...
      </div>
      
      <div v-else-if="bannedList.length === 0" class="p-8 text-center text-slate-500 font-mono text-xs bg-[#020420] rounded-xl border border-slate-800">
        Nessun IP presente nella blacklist del database. Il sistema è pulito.
      </div>

      <div v-else class="flex flex-col gap-3">
        <div v-for="item in bannedList" :key="item.id" class="bg-[#020420] border border-slate-800/80 rounded-xl p-4 flex justify-between items-center gap-4">
          <div class="flex items-center gap-4">
            <span class="px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider bg-rose-500/30 text-rose-300 border border-rose-500">
              {{ item.severity || 'CRITICAL' }}
            </span>
            <div class="flex flex-col">
              <code class="text-sky-400 font-mono font-bold text-sm">{{ item.ip }}</code>
              <span class="text-xs text-slate-400 mt-0.5">Motivo: {{ item.reason }} • Data: {{ new Date(item.bannedAt).toLocaleString() }}</span>
            </div>
          </div>

          <button 
            @click="handleAction('unban_ip', item.ip)" 
            class="px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-[#020420] rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            ✅ Sblocca IP
          </button>
        </div>
      </div>
    </div>
  </div>
</template>