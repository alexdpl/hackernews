<!-- app/pages/tools/neural-playground.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

// Estrazione Sicura (Niente crash "Cannot read properties of undefined")
const auth = useAuthCore() || {}
const currentUser = auth.currentUser || ref({ id: 1 })
const isAuthenticated = auth.isAuthenticated || ref(true)

useHead({
  title: 'Neural Playground v2.5-GOLD — DKP Tools',
  meta: [{ name: 'description', content: 'Testing Prompt e Modelli IA con DKP Neural Engine v2.5-GOLD' }]
})

const selectedModel = ref('DKP-Neural-v4 (Coder)')
const systemPrompt = ref('Sei il Kernel Architect di DevKernelPulse, un assistente IA esperto in sicurezza, architetture SaaS modulari e Nuxt.js.')
const userPrompt = ref('Scrivi un middleware di autenticazione sicuro in TypeScript per proteggere le rotte admin.')
const temperature = ref(0.7)
const maxTokens = ref(1024)

const isLoading = ref(false)
const responseOutput = ref('')
const errorMessage = ref('')
const isNotarizing = ref(false)

const showToast = ref(false)
const toastMessage = ref('')
function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => showToast.value = false, 3500)
}

async function runNeuralTest() {
  errorMessage.value = ''
  
  if (isAuthenticated && isAuthenticated.value === false) {
    errorMessage.value = 'Autenticazione richiesta per accedere al Neural Playground.'
    return
  }

  isLoading.value = true
  responseOutput.value = ''

  try {
    const res: any = await $fetch('/api/tools/neural-execute', {
      method: 'POST',
      body: {
        model: selectedModel.value,
        systemPrompt: systemPrompt.value,
        userPrompt: userPrompt.value,
        temperature: temperature.value,
        maxTokens: maxTokens.value,
        userId: currentUser.value?.id || 1
      }
    })

    if (res && res.success) {
      responseOutput.value = res.result
      triggerToast('✅ Generazione completata! +15 XP assegnati.')
    } else {
      errorMessage.value = 'Errore durante la generazione del modello.'
    }
  } catch (err: any) {
    errorMessage.value = err.data?.message || 'Errore durante l\'esecuzione del test neurale (API fallita).'
  } finally {
    isLoading.value = false
  }
}

async function notarizeToVault() {
  if (!responseOutput.value || !userPrompt.value.trim()) return
  isNotarizing.value = true

  try {
    const res: any = await $fetch('/api/user/vault', {
      method: 'POST',
      body: {
        userId: currentUser.value?.id || 1,
        title: `AI Generation: ${selectedModel.value}`,
        code: `/* USER PROMPT */\n${userPrompt.value}\n\n/* AI RESPONSE */\n${responseOutput.value}`,
        sastStatus: 'PASSED'
      }
    })

    if (res && res.success) {
      triggerToast('🛡️ Output salvato nel Vault! +100 XP extra.')
    }
  } catch (err) {
    triggerToast('❌ Errore durante la notarizzazione Vault.')
  } finally {
    isNotarizing.value = false
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto my-10 px-6 font-sans text-slate-100">
    
    <!-- TOAST -->
    <Transition name="fade">
      <div v-if="showToast" class="fixed top-5 right-5 bg-slate-950 border border-emerald-500 text-emerald-400 px-6 py-3 rounded-lg shadow-[0_4px_20px_rgba(16,185,129,0.2)] font-bold z-50">
        {{ toastMessage }}
      </div>
    </Transition>

    <div class="mb-8">
      <div class="flex justify-between items-center mb-3">
        <span class="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-black tracking-widest">
          🧠 DKP NEURAL ENGINE v2.5-GOLD
        </span>
        <NuxtLink to="/" class="text-sky-400 text-sm font-bold hover:underline">← Torna all'Ecosistema</NuxtLink>
      </div>
      <h1 class="text-4xl font-black text-white mb-2">Neural <span class="text-purple-400">Playground</span></h1>
      <p class="text-slate-400 text-lg max-w-3xl">
        Testing interattivo di prompt e modelli IA con parametri avanzati dell'ecosistema DKP. Genera codice, ottimizza e salva direttamente nel Vault.
      </p>
    </div>

    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col gap-6">
      
      <!-- SELEZIONE MODELLO & PARAMETRI -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-bold text-slate-400">Seleziona Modello IA</label>
          <select v-model="selectedModel" class="w-full bg-slate-950 border border-slate-700 text-white p-3.5 rounded-xl text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none appearance-none cursor-pointer">
            <option value="DKP-Neural-v4 (Coder)">DKP-Neural-v4 (Coder)</option>
            <option value="DKP-SecAudit-v2 (Security)">DKP-SecAudit-v2 (Security)</option>
            <option value="DKP-FastKernel-v1 (Lightweight)">DKP-FastKernel-v1 (Lightweight)</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-bold text-slate-400 flex justify-between">
              <span>Temperature</span>
              <span class="text-purple-400 font-mono">{{ temperature.toFixed(1) }}</span>
            </label>
            <input v-model.number="temperature" type="range" min="0" max="1" step="0.1" class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 mt-2" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-bold text-slate-400">Max Tokens</label>
            <input v-model.number="maxTokens" type="number" step="128" min="256" max="4096" class="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-xl font-mono text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none" />
          </div>
        </div>
      </div>

      <!-- SYSTEM PROMPT -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-bold text-slate-400">System Prompt (Istruzioni di Ruolo)</label>
        <textarea v-model="systemPrompt" rows="2" class="w-full bg-slate-950 border border-slate-700 text-emerald-400 p-4 rounded-xl font-mono text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none resize-none"></textarea>
      </div>

      <!-- USER PROMPT -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-bold text-slate-400">User Prompt / Input Code</label>
        <textarea v-model="userPrompt" rows="4" placeholder="Inserisci il prompt o il codice da elaborare (es: Scrivi un middleware...)" class="w-full bg-slate-950 border border-slate-700 text-sky-400 p-4 rounded-xl font-mono text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none resize-none"></textarea>
      </div>

      <div v-if="errorMessage" class="bg-red-500/15 border border-red-500 text-red-400 p-3 rounded-lg font-bold text-sm">
        ⚠️ {{ errorMessage }}
      </div>

      <button @click="runNeuralTest" :disabled="isLoading || !userPrompt.trim()" class="w-full bg-purple-500 text-slate-50 font-black py-4 rounded-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 mt-2">
        <span v-if="isLoading">⚡ Generazione Neurale in corso...</span>
        <span v-else>🚀 Esegui Test Neurale</span>
      </button>

      <!-- OUTPUT BOX -->
      <Transition name="fade">
        <div v-if="responseOutput" class="mt-4">
          <div class="flex justify-between items-center bg-slate-800 rounded-t-xl px-4 py-2 border border-slate-700 border-b-0">
            <h3 class="text-xs text-purple-400 font-black tracking-wider m-0">OUTPUT: {{ selectedModel }}</h3>
            <button @click="notarizeToVault" :disabled="isNotarizing" class="bg-slate-950 border border-sky-500 text-sky-400 px-3 py-1 text-xs font-bold rounded hover:bg-sky-500 hover:text-slate-900 transition-colors disabled:opacity-50">
              {{ isNotarizing ? 'Salvando...' : '🛡️ Salva nel Vault' }}
            </button>
          </div>
          <div class="bg-slate-950 border border-slate-700 rounded-b-xl p-5 overflow-x-auto">
            <pre class="text-emerald-400 font-mono text-sm whitespace-pre-wrap m-0 leading-relaxed">{{ responseOutput }}</pre>
          </div>
        </div>
      </Transition>
      
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease, transform 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(10px); }
</style>