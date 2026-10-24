<!-- app/pages/tools/neural-playground.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const auth = useAuthCore() || {}
const currentUser = auth.currentUser || ref({ id: 1 })
const isAuthenticated = auth.isAuthenticated || ref(true)

useHead({
  title: 'Neural Playground v2.5-GOLD + OpenUI — DKP Tools',
  meta: [{ name: 'description', content: 'Testing Prompt, DKP Trinity e OpenUI Live Preview Engine' }]
})

const dkpApiKey = ref('')
const selectedModel = ref('dkp-coder')
const systemPrompt = ref('Sei il Kernel Architect di DevKernelPulse ed esperto di OpenUI. Quando scrivi codice HTML o interfacce utente, avvolgile sempre in un blocco ```html ... ``` completo di Tailwind CSS in modo che possano essere renderizzate in tempo reale.')
const temperature = ref(0.7)
const maxTokens = ref(2048)
const activeTab = ref<'preview' | 'code'>('preview')

const showToast = ref(false)
const toastMessage = ref('')
function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => showToast.value = false, 3500)
}

// --- MOTORE CHAT NATIVO DKP (Senza dipendenze fragili da useChat) ---
const messages = ref<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([])
const input = ref('')
const isLoading = ref(false)
const stopSignal = ref(false)

function stop() {
  stopSignal.value = true
  isLoading.value = false
}

async function onSubmit(e?: Event) {
  if (e) e.preventDefault()

  if (isAuthenticated.value === false) {
    triggerToast('⚠️ Autenticazione richiesta per il Playground.')
    return
  }

  if (!dkpApiKey.value.trim()) {
    triggerToast('⚠️ Inserisci la tua API Key DKP.')
    return
  }

  const promptText = input.value?.trim()
  if (!promptText) {
    triggerToast('⚠️ Scrivi un prompt prima di inviare.')
    return
  }

  // 1. Pulisci l'input e aggiungi il messaggio dell'utente
  input.value = ''
  const userMsgId = Math.random().toString(36).substring(7)
  messages.value.push({ id: userMsgId, role: 'user', content: promptText })

  isLoading.value = true
  stopSignal.value = false

  // 2. Crea il segnaposto per la risposta dell'IA in streaming
  const aiMsgId = Math.random().toString(36).substring(7)
  messages.value.push({ id: aiMsgId, role: 'assistant', content: '' })
  const aiMessageIndex = messages.value.length - 1

  try {
    // 3. Chiamata al nostro gateway backend protetto
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dkpApiKey.value.trim()}`
      },
      body: JSON.stringify({
        messages: messages.value.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        model: selectedModel.value,
        systemPrompt: systemPrompt.value,
        temperature: temperature.value,
        maxTokens: maxTokens.value
      })
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson.statusMessage || `Errore HTTP ${res.status}`)
    }

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()

    if (reader) {
      while (!stopSignal.value) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        
        // Parsing intelligente dei chunk di streaming Vercel/H3
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              // Rimuove il prefisso "0:" e decodifica la stringa JSON
              const textContent = JSON.parse(line.slice(2))
              messages.value[aiMessageIndex].content += textContent
            } catch {
              messages.value[aiMessageIndex].content += line.slice(2).replace(/^"(.*)"$/, '$1')
            }
          } else if (line.trim() && !line.startsWith('d:') && !line.startsWith('e:')) {
            messages.value[aiMessageIndex].content += line
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[DKP Chat Error]:', err)
    messages.value[aiMessageIndex].content = `\n[Errore di connessione al Gateway: ${err.message}]`
    triggerToast(`❌ Errore: ${err.message}`)
  } finally {
    isLoading.value = false
  }
}


// --- OPENUI EXTRACTION ENGINE ---
const lastAiMessage = computed(() => messages.value.filter(m => m.role === 'assistant').pop()?.content || '')

const extractedCode = computed(() => {
  const content = lastAiMessage.value
  if (!content) return ''
  
  const match = content.match(/```(?:html|xml|vue)?\s*([\s\S]*?)```/)
  if (match && match[1]) {
    return match[1].trim()
  }
  
  if (content.includes('<html') || content.includes('<div') || content.includes('<!DOCTYPE')) {
    return content
  }
  
  return ''
})

const renderedHtmlContent = computed(() => {
  const code = extractedCode.value
  const tailwindScript = '<script src="https://cdn.tailwindcss.com"><' + '/script>'

  if (!code) {
    return '<!DOCTYPE html><html><head>' + tailwindScript + '</head><body class="bg-slate-950 text-slate-400 p-8 text-center font-sans"><h3>In attesa di codice OpenUI...</h3><p class="text-sm mt-2">Chiedi a DKP-Coder di generare una card o una dashboard.</p></body></html>'
  }

  if (code.toLowerCase().includes('<!doctype') || code.toLowerCase().includes('<html')) {
    return code
  }

  return '<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' + tailwindScript + '</head><body class="bg-slate-950 text-slate-100 p-6 font-sans">' + code + '</body></html>'
})

const isNotarizing = ref(false)
const lastUserMessage = computed(() => messages.value.filter(m => m.role === 'user').pop()?.content || '')

async function notarizeToVault() {
  if (!lastAiMessage.value) return
  isNotarizing.value = true

  try {
    const res: any = await $fetch('/api/user/vault', {
      method: 'POST',
      body: {
        userId: currentUser.value?.id || 1,
        title: `OpenUI Generation: ${selectedModel.value}`,
        code: `/* USER PROMPT */\n${lastUserMessage.value}\n\n/* AI RESPONSE / OPENUI */\n${lastAiMessage.value}`,
        sastStatus: 'PASSED'
      }
    })

    if (res && res.success) {
      triggerToast('🛡️ Output e UI salvati nel Vault! +100 XP.')
    }
  } catch (err) {
    triggerToast('❌ Errore durante la notarizzazione Vault.')
  } finally {
    isNotarizing.value = false
  }
}
</script>

<template>
  <div class="max-w-[1600px] mx-auto my-6 px-4 font-sans text-slate-100 h-[calc(100vh-100px)] flex flex-col">
    
    <!-- TOAST -->
    <Transition name="fade">
      <div v-if="showToast" class="fixed top-5 right-5 bg-slate-950 border border-emerald-500 text-emerald-400 px-6 py-3 rounded-lg shadow-2xl font-bold z-50">
        {{ toastMessage }}
      </div>
    </Transition>

    <!-- HEADER -->
    <div class="mb-4 flex justify-between items-center flex-shrink-0">
      <div>
        <div class="flex items-center gap-2">
          <span class="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-black tracking-widest">
            🧠 DKP NEURAL ENGINE v2.5-GOLD + OPENUI
          </span>
        </div>
        <h1 class="text-3xl font-black text-white mt-1">Neural Playground &amp; <span class="text-purple-400">OpenUI Studio</span></h1>
      </div>
      <NuxtLink to="/" class="text-sky-400 text-sm font-bold hover:underline">← Torna all'Ecosistema</NuxtLink>
    </div>

    <!-- MAIN GRID 3 COLONNE -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
      
      <!-- COLONNA 1: CONFIGURAZIONE & MODELLI -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4 overflow-y-auto">
        <h2 class="text-sm font-black uppercase text-slate-400 tracking-wider">1. Configurazione Gateway</h2>
        
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-bold text-emerald-400">🔑 DKP API Key</label>
          <input v-model="dkpApiKey" type="password" placeholder="dkp_live_..." class="bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl text-sm focus:border-emerald-400 outline-none font-mono" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-bold text-slate-400">🤖 DKP Trinity Model</label>
          <select v-model="selectedModel" class="bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl text-sm focus:border-purple-400 outline-none cursor-pointer">
            <option value="dkp-flash">⚡ DKP-Flash - Veloce</option>
            <option value="dkp-coder">💻 DKP-Coder - CodIx</option>
            <option value="dkp-pro">🧠 DKP-Pro - Avanzato</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-400 flex justify-between">
              <span>Temp</span>
              <span class="text-purple-400 font-mono">{{ temperature.toFixed(1) }}</span>
            </label>
            <input v-model.number="temperature" type="range" min="0" max="1" step="0.1" class="w-full h-1.5 bg-slate-700 rounded accent-purple-500 mt-2" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-400">Max Tokens</label>
            <input v-model.number="maxTokens" type="number" step="128" min="256" max="4096" class="bg-slate-950 border border-slate-700 text-white p-2 rounded-xl font-mono text-xs focus:border-purple-400 outline-none" />
          </div>
        </div>

        <div class="flex flex-col gap-1.5 flex-1">
          <label class="text-xs font-bold text-slate-400">System Prompt (OpenUI Enabled)</label>
          <textarea v-model="systemPrompt" class="w-full h-full min-h-[100px] bg-slate-950 border border-slate-700 text-sky-400 p-3 rounded-xl font-mono text-xs focus:border-purple-400 outline-none resize-none"></textarea>
        </div>
      </div>

      <!-- COLONNA 2: CHAT TERMINAL STREAMING -->
      <div class="bg-[#060a12] border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden relative">
        <div class="bg-slate-900 border-b border-slate-800 px-4 py-3 flex justify-between items-center z-10 flex-shrink-0">
          <span class="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Chat &amp; Prompt Stream
          </span>
          <button 
            @click="notarizeToVault" 
            :disabled="isNotarizing || !lastAiMessage" 
            class="bg-slate-950 border border-emerald-500/40 text-emerald-400 px-3 py-1 text-xs font-bold rounded-lg hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
          >
            🛡️ Salva nel Vault
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div v-if="messages.length === 0" class="m-auto text-center text-slate-500 text-sm max-w-xs">
            <span class="text-3xl mb-2 block">💬</span>
            Chiedi a <strong>DKP-Coder</strong> di creare una card, una tabella o una dashboard con Tailwind per vederla apparire nella Preview OpenUI a destra.
          </div>

          <div v-for="message in messages" :key="message.id" :class="['flex gap-3 max-w-[95%]', message.role === 'user' ? 'ml-auto flex-row-reverse' : '']">
            <div :class="['w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 border', message.role === 'user' ? 'bg-sky-500/20 border-sky-500/40' : 'bg-purple-500/20 border-purple-500/40']">
              {{ message.role === 'user' ? '🧑‍💻' : '🤖' }}
            </div>
            <div :class="['p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap font-mono', message.role === 'user' ? 'bg-slate-800 text-sky-100 rounded-tr-sm' : 'bg-slate-900 border border-slate-800 text-emerald-400 rounded-tl-sm shadow']">
              {{ message.content }}
            </div>
          </div>

          <div v-if="isLoading" class="flex items-center gap-2 text-purple-400 font-bold text-xs bg-slate-900/50 p-2.5 rounded-lg w-max border border-purple-500/20">
            ⚡ Generazione in corso...
            <button @click="stop" class="ml-2 text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30">Ferma</button>
          </div>
        </div>

        <form @submit="onSubmit" class="p-3 bg-slate-900 border-t border-slate-800 flex-shrink-0">
          <div class="relative">
            <textarea 
              v-model="input" 
              @keydown.enter.exact.prevent="onSubmit"
              placeholder="Es: Crea una card utente con Tailwind... (Invio per inviare)" 
              class="w-full bg-slate-950 border border-slate-700 text-white pl-3 pr-12 py-3 rounded-xl outline-none resize-none text-xs focus:border-purple-400"
              rows="2"
            ></textarea>
            <button type="submit" :disabled="isLoading || !input?.trim()" class="absolute right-2.5 top-2.5 bottom-2.5 bg-purple-500 text-white font-black px-3 rounded-lg hover:bg-purple-400 disabled:opacity-50 text-xs">➔</button>
          </div>
        </form>
      </div>

      <!-- COLONNA 3: OPENUI LIVE PREVIEW -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        
        <!-- Tabs Anteprima vs Codice Puro -->
        <div class="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex justify-between items-center flex-shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-xs font-black text-purple-400">⚡ OpenUI Studio</span>
          </div>
          <div class="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button @click="activeTab = 'preview'" :class="['px-3 py-1 text-xs font-bold rounded-md transition-colors', activeTab === 'preview' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white']">Preview Live</button>
            <button @click="activeTab = 'code'" :class="['px-3 py-1 text-xs font-bold rounded-md transition-colors', activeTab === 'code' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white']">Codice Sorgente</button>
          </div>
        </div>

        <!-- Contenuto Preview / Codice -->
        <div class="flex-1 overflow-hidden bg-slate-950 flex flex-col relative">
          
          <!-- TAB 1: IFRAME LIVE PREVIEW -->
          <div v-show="activeTab === 'preview'" class="w-full h-full bg-white rounded-b-2xl overflow-hidden relative">
            <iframe 
              :srcdoc="renderedHtmlContent" 
              sandbox="allow-scripts" 
              class="w-full h-full border-0"
            ></iframe>
          </div>

          <!-- TAB 2: CODICE RAW FORMATTATO -->
          <div v-show="activeTab === 'code'" class="w-full h-full p-4 overflow-auto">
            <pre class="text-emerald-400 font-mono text-xs whitespace-pre-wrap leading-relaxed">{{ extractedCode || '// Nessun blocco di codice rilevato nella risposta dell\'IA.\n// Chiedi a DKP-Coder di generare un componente HTML/Tailwind.' }}</pre>
          </div>

        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #060a12; }
::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
</style>