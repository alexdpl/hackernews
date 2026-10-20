<script setup lang="ts">
import { ref, computed } from 'vue'

const keyNameInput = ref('')
const selectedRole = ref('PRO')
const isCreating = ref(false)
const generatedSecretKey = ref('')
const showSecretModal = ref(false)
const toastMsg = ref('')
const errorMsg = ref('')

// Caricamento reattivo delle chiavi reali tramite useFetch
const { data: keysResponse, refresh, pending: isLoading } = await useFetch<any>('/api/user/keys', {
  key: 'user-api-keys-list',
  server: true
})

const keysList = computed(() => keysResponse.value?.data || [])

async function handleGenerateKey() {
  if (isCreating.value) return
  isCreating.value = true
  errorMsg.value = ''

  try {
    const res = await $fetch<any>('/api/user/keys/generate', {
      method: 'POST',
      body: {
        name: keyNameInput.value.trim() || 'Production App Key',
        role: selectedRole.value
      }
    })

    if (res?.success && res?.rawApiKey) {
      generatedSecretKey.value = res.rawApiKey
      showSecretModal.value = true
      keyNameInput.value = ''
      await refresh()
    }
  } catch (err: any) {
    errorMsg.value = err.data?.statusMessage || 'Errore durante la generazione della chiave API.'
  } finally {
    isCreating.value = false
  }
}

async function handleRevokeKey(keyId: number) {
  if (!confirm('Sei sicuro di voler revocare questa API Key? Le applicazioni collegate smetteranno di funzionare.')) return

  try {
    const res = await $fetch<any>('/api/user/keys/revoke', {
      method: 'POST',
      body: { id: keyId }
    })

    if (res?.success) {
      toastMsg.value = res.message
      setTimeout(() => { toastMsg.value = '' }, 3500)
      await refresh()
    }
  } catch (err: any) {
    errorMsg.value = err.data?.statusMessage || 'Errore durante la revoca della chiave.'
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  toastMsg.value = '📋 Chiave copiata negli appunti!'
  setTimeout(() => { toastMsg.value = '' }, 3000)
}
</script>

<template>
  <div class="flex flex-col gap-6 max-w-6xl mx-auto p-4 sm:p-6">
    <!-- TOAST NOTIFICHE -->
    <Transition name="fade">
      <div v-if="toastMsg" class="bg-emerald-500/20 border border-emerald-500 text-emerald-300 px-5 py-3.5 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2">
        ⚡ {{ toastMsg }}
      </div>
    </Transition>
    <Transition name="fade">
      <div v-if="errorMsg" class="bg-rose-500/20 border border-rose-500 text-rose-300 px-5 py-3.5 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2">
        ❌ {{ errorMsg }}
      </div>
    </Transition>

    <!-- HEADER CONSOLE API -->
    <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h2 class="text-2xl font-black text-white">🔑 Console API Keys</h2>
          <span class="bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded text-xs font-black uppercase">NEON REAL DB</span>
        </div>
        <p class="text-slate-400 text-xs sm:text-sm">Gestisci le tue credenziali di accesso per chiamare i servizi DKP API in produzione.</p>
      </div>

      <button @click="refresh()" class="px-4 py-2.5 bg-[#020420] border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500 rounded-xl text-xs font-bold transition-all cursor-pointer">
        🔄 Aggiorna Lista
      </button>
    </div>

    <!-- FORM GENERAZIONE CHIAVE -->
    <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-end gap-4">
      <div class="flex flex-col gap-1.5 flex-grow w-full">
        <label class="text-xs font-bold text-slate-300 uppercase tracking-wider">Nome Applicazione / Descrizione</label>
        <input 
          v-model="keyNameInput" 
          type="text" 
          placeholder="es. Backend Mobile App / Production Bot" 
          class="bg-[#020420] border border-slate-800 px-4 py-3 rounded-xl text-slate-100 text-xs font-mono outline-none focus:border-cyan-500 transition-all"
        />
      </div>

      <div class="flex flex-col gap-1.5 w-full sm:w-48">
        <label class="text-xs font-bold text-slate-300 uppercase tracking-wider">Tier / Licenza</label>
        <select v-model="selectedRole" class="bg-[#020420] border border-slate-800 px-4 py-3 rounded-xl text-slate-100 text-xs font-mono outline-none focus:border-cyan-500 transition-all">
          <option value="PRO">PRO Tier (1000 req/m)</option>
          <option value="ENTERPRISE">ENTERPRISE Tier (Unlimited)</option>
          <option value="DEVELOPER">FREE Tier (100 req/m)</option>
        </select>
      </div>

      <button 
        @click="handleGenerateKey" 
        :disabled="isCreating"
        class="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-[#020420] font-black rounded-xl text-xs hover:brightness-110 transition-all cursor-pointer whitespace-nowrap shadow-lg disabled:opacity-50"
      >
        ➕ Genera Nuova API Key
      </button>
    </div>

    <!-- TABELLA CHIAVI ATTIVE SU DB NEON -->
    <div class="bg-[#090d16] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <div v-if="isLoading" class="p-8 text-center text-slate-500 font-mono text-xs">
        Caricamento chiavi API dal database Neon...
      </div>

      <div v-else-if="keysList.length === 0" class="p-12 text-center text-slate-500 font-mono text-xs bg-[#020420]">
        Nessuna API Key attiva registrata. Genera la tua prima chiave qui sopra.
      </div>

      <table v-else class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-[#020420] text-slate-400 font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-800">
            <th class="p-4">NOME APPLICAZIONE</th>
            <th class="p-4">CHIAVE MASCHERATA</th>
            <th class="p-4">TIER</th>
            <th class="p-4">UTILIZZO REALE</th>
            <th class="p-4">STATO</th>
            <th class="p-4">CREATA IL</th>
            <th class="p-4 text-right">AZIONI</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="key in keysList" :key="key.id" class="border-b border-slate-800/80 hover:bg-slate-900/40 transition-colors">
            <td class="p-4 font-bold text-white text-sm">{{ key.name }}</td>
            <td class="p-4 font-mono text-xs text-sky-400">{{ key.keyMasked }}</td>
            <td class="p-4">
              <span class="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2.5 py-1 rounded text-[10px] font-black uppercase">
                {{ key.role }}
              </span>
            </td>
            <td class="p-4 font-mono text-xs text-slate-300">{{ key.usageCount || 0 }} req</td>
            <td class="p-4">
              <span :class="['px-2.5 py-1 rounded text-[10px] font-black uppercase', key.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30']">
                {{ key.status }}
              </span>
            </td>
            <td class="p-4 text-xs font-mono text-slate-400">{{ new Date(key.createdAt).toLocaleDateString() }}</td>
            <td class="p-4 text-right flex items-center justify-end gap-2">
              <button @click="copyToClipboard(key.keyMasked)" class="px-3 py-1.5 bg-[#020420] border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer">
                📋 Copia
              </button>
              <button v-if="key.status === 'ACTIVE'" @click="handleRevokeKey(key.id)" class="px-3 py-1.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer">
                🚫 Revoca
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODALE MOSTRA SEGRETO GENERATO -->
    <div v-if="showSecretModal" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div class="bg-[#090d16] border border-emerald-500/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4">
        <div class="flex items-center gap-3 text-emerald-400 font-bold text-lg">
          <span>⚠️</span> Salva la tua API Key ora!
        </div>
        <p class="text-xs text-slate-300 leading-relaxed">
          Questa è l'unica volta in cui la chiave segreta in chiaro verrà mostrata. Copiala e salvala in un posto sicuro.
        </p>
        <div class="bg-[#020420] border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-2">
          <code class="text-emerald-400 font-mono text-xs break-all">{{ generatedSecretKey }}</code>
          <button @click="copyToClipboard(generatedSecretKey)" class="px-3 py-1.5 bg-emerald-500 text-[#020420] rounded-lg font-black text-xs hover:brightness-110 transition-all cursor-pointer whitespace-nowrap">
            Copia
          </button>
        </div>
        <button @click="showSecretModal = false" class="mt-2 w-full py-2.5 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition-all cursor-pointer">
          Ho salvato la chiave, chiudi.
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>