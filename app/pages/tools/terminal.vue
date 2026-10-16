<!-- app/pages/tools/terminal.vue -->
<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

// 1. Estrazione Sicura
const auth = useAuthCore() || {}
const currentUser = auth.currentUser || ref({ username: 'alexdpl' })
const isAuthenticated = auth.isAuthenticated || ref(true)

const currentUserId = computed(() => currentUser.value?.id || 1)
const usernameDisplay = computed(() => currentUser.value?.username || 'guest')

useHead({
  title: 'Terminal Web Shell v2.5-GOLD — DKP Tools',
  meta: [{ name: 'description', content: 'Shell CLI in-browser e simulazione SDK DKP v2.5-GOLD' }]
})

const commandInput = ref('')
const terminalContainer = ref<HTMLElement | null>(null)
const isLoading = ref(false)

const history = ref<Array<{ cmd: string; res: string; isErr?: boolean }>>([
  { cmd: 'dkp system start', res: 'DKP Kernel v2.5-GOLD Engine initialized.\nNeon DB Connection: ESTABLISHED.\nAPI Gateway: ONLINE.\n\nDigita "help" per iniziare.' }
])

// Scroller automatico verso il basso del terminale
function scrollToBottom() {
  nextTick(() => {
    if (terminalContainer.value) {
      terminalContainer.value.scrollTop = terminalContainer.value.scrollHeight
    }
  })
}

async function executeCommand() {
  const cmd = commandInput.value.trim()
  if (!cmd || isLoading.value) return

  if (cmd.toLowerCase() === 'clear') {
    history.value = []
    commandInput.value = ''
    return
  }

  const currentCmd = cmd
  commandInput.value = ''
  isLoading.value = true
  
  // Aggiungi subito il comando in output (per feedback visivo immediato)
  history.value.push({ cmd: currentCmd, res: '🔄 Esecuzione in corso...' })
  const lastIndex = history.value.length - 1
  scrollToBottom()

  try {
    const res: any = await $fetch('/api/tools/terminal-exec', {
      method: 'POST',
      body: { command: currentCmd, userId: currentUserId.value }
    })
    
    // Aggiorna l'ultimo elemento history con la vera risposta
    history.value[lastIndex].res = res.output || 'OK'
    history.value[lastIndex].isErr = res.isError
  } catch (err: any) {
    history.value[lastIndex].res = err.data?.message || 'Comando non valido o API irraggiungibile.'
    history.value[lastIndex].isErr = true
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto my-10 px-6 font-sans text-slate-100">
    
    <div class="mb-8">
      <div class="flex justify-between items-center mb-3">
        <span class="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase">
          💻 DKP WEB SHELL v2.5-GOLD
        </span>
        <NuxtLink to="/" class="text-sky-400 text-sm font-bold hover:underline">← Torna all'Ecosistema</NuxtLink>
      </div>
      <h1 class="text-4xl font-black text-white mb-2">Terminal <span class="text-indigo-400">Web Shell</span></h1>
      <p class="text-slate-400 text-lg">
        Shell CLI interattiva per l'esecuzione rapida di comandi, esplorazione SDK e accumulo punti XP via console.
      </p>
    </div>

    <!-- TERMINAL EMULATOR -->
    <div class="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/10">
      
      <!-- Top Bar -->
      <div class="bg-slate-900 border-b border-slate-800 p-3 px-5 flex items-center justify-between">
        <div class="flex gap-2">
          <div class="w-3.5 h-3.5 rounded-full bg-red-500"></div>
          <div class="w-3.5 h-3.5 rounded-full bg-yellow-500"></div>
          <div class="w-3.5 h-3.5 rounded-full bg-emerald-500"></div>
        </div>
        <span class="text-xs text-slate-500 font-mono tracking-wide">dkp-sh — @{{ usernameDisplay }}</span>
      </div>

      <!-- Terminal Body -->
      <div ref="terminalContainer" class="p-6 min-h-[400px] max-h-[600px] overflow-y-auto font-mono text-[0.92rem] flex flex-col gap-4 custom-scrollbar" @click="() => { const input = $refs.cmdInput; if(input) (input as HTMLInputElement).focus() }">
        
        <!-- Storico Comandi -->
        <div v-for="(item, idx) in history" :key="idx" class="flex flex-col gap-1">
          <!-- Prompt Line -->
          <div class="flex gap-2 text-white">
            <span class="text-emerald-400 font-bold whitespace-nowrap">dkp@kernel:~$</span>
            <span class="text-sky-300 break-all">{{ item.cmd }}</span>
          </div>
          <!-- Response Line -->
          <div 
            class="pl-4 leading-relaxed whitespace-pre-wrap break-words"
            :class="item.isErr ? 'text-red-400 font-bold' : 'text-slate-400'"
          >
            {{ item.res }}
          </div>
        </div>

        <!-- Current Input Line -->
        <div class="flex items-center gap-2 mt-2">
          <span class="text-emerald-400 font-bold whitespace-nowrap">dkp@kernel:~$</span>
          <input 
            ref="cmdInput"
            v-model="commandInput" 
            @keyup.enter="executeCommand" 
            :disabled="isLoading"
            type="text" 
            placeholder="Scrivi 'help', 'dkp info' o prova l'easter egg..."
            class="flex-1 bg-transparent border-none text-sky-300 outline-none w-full font-mono placeholder:text-slate-700" 
            autofocus
            autocomplete="off"
            spellcheck="false"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #020617; } /* slate-950 */
.custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; } /* slate-800 */
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; } /* slate-700 */
</style>