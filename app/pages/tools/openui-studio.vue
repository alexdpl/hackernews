<!-- app/pages/tools/openui-studio.vue -->
<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

const auth = useAuthCore() || {}
const currentUser = auth.currentUser || ref({ id: 1 })
const isAuthenticated = auth.isAuthenticated || ref(true)

useDkpSeo({
  title: 'OpenUI Studio AI & Neural Playground v2.6-PURE-SQL — DKP Tools',
  description: 'Genera interfacce Tailwind CSS in tempo reale con DKP Trinity AI, visualizza la live preview e notarizza il codice nel Vault Pure SQL.'
})

const dkpApiKey = ref('')
const selectedModel = ref('dkp-coder')
const systemPrompt = ref(
  'Sei il Kernel Architect di DevKernelPulse v2.6-PURE-SQL ed esperto di OpenUI. Quando scrivi codice HTML o interfacce utente, avvolgile sempre in un blocco ```html ... ``` completo di Tailwind CSS in modo che possano essere renderizzate in tempo reale.'
)
const temperature = ref(0.7)
const maxTokens = ref(2048)
const activeTab = ref<'preview' | 'code'>('preview')
const chatScrollRef = ref<HTMLElement | null>(null)
const isCodeCopied = ref(false)

const showToast = ref(false)
const toastMessage = ref('')
function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

function notifyXpUpdate() {
  if (import.meta.client && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('dkp:xp_updated'))
  }
}

function scrollChatToBottom() {
  nextTick(() => {
    if (chatScrollRef.value) {
      chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight
    }
  })
}

const promptPresets = [
  {
    label: '📊 Dashboard KPI',
    prompt: 'Crea una dashboard SaaS dark mode con 4 card KPI, barra di stato API e tabella transazioni recente usando Tailwind CSS.'
  },
  {
    label: '💳 Pricing Table',
    prompt: 'Genera una sezione Pricing a 3 colonne (Free, Developer Pro, Enterprise) stile DevKernelPulse con badge evidenziato.'
  },
  {
    label: '🛡️ Profile Card',
    prompt: 'Crea una Developer Profile Card futuristica con avatar, badge XP, stack tecnologico e pulsante GitHub.'
  }
]

// --- MOTORE CHAT NATIVO DKP ---
const messages = ref<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([])
const input = ref('')
const isLoading = ref(false)
const stopSignal = ref(false)

function stop() {
  stopSignal.value = true
  isLoading.value = false
}

function applyPreset(presetPrompt: string) {
  input.value = presetPrompt
}

async function onSubmit(e?: Event) {
  if (e) e.preventDefault()

  if (isAuthenticated.value === false) {
    triggerToast('⚠️ Autenticazione richiesta per OpenUI Studio.')
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

  input.value = ''
  const userMsgId = Math.random().toString(36).substring(7)
  messages.value.push({ id: userMsgId, role: 'user', content: promptText })
  scrollChatToBottom()

  isLoading.value = true
  stopSignal.value = false

  const aiMsgId = Math.random().toString(36).substring(7)
  messages.value.push({ id: aiMsgId, role: 'assistant', content: '' })
  const aiMessageIndex = messages.value.length - 1

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dkpApiKey.value.trim()}`
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
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const textContent = JSON.parse(line.slice(2))
              messages.value[aiMessageIndex].content += textContent
            } catch {
              messages.value[aiMessageIndex].content += line.slice(2).replace(/^"(.*)"$/, '$1')
            }
          } else if (line.trim() && !line.startsWith('d:') && !line.startsWith('e:')) {
            messages.value[aiMessageIndex].content += line
          }
        }
        scrollChatToBottom()
      }
    }
  } catch (err: any) {
    console.error('[DKP OpenUI Studio Error]:', err)
    messages.value[aiMessageIndex].content = `\n[Errore di connessione al Gateway: ${err.message}]`
    triggerToast(`❌ Errore: ${err.message}`)
  } finally {
    isLoading.value = false
    scrollChatToBottom()
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
    return (
      '<!DOCTYPE html><html><head>' +
      tailwindScript +
      '</head><body class="bg-slate-950 text-slate-400 p-8 text-center font-sans flex flex-col items-center justify-center min-h-screen"><h3 class="text-white font-bold text-lg">In attesa di codice OpenUI v2.6...</h3><p class="text-sm mt-2 max-w-sm">Chiedi a DKP-Coder di generare una card, una landing o una dashboard Tailwind.</p></body></html>'
    )
  }

  if (code.toLowerCase().includes('<!doctype') || code.toLowerCase().includes('<html')) {
    return code
  }

  return (
    '<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    tailwindScript +
    '</head><body class="bg-slate-950 text-slate-100 p-6 font-sans">' +
    code +
    '</body></html>'
  )
})

function copyExtractedCode() {
  if (!extractedCode.value) return
  navigator.clipboard.writeText(extractedCode.value)
  isCodeCopied.value = true
  triggerToast('📋 Codice HTML/Tailwind copiato negli appunti!')
  setTimeout(() => {
    isCodeCopied.value = false
  }, 2000)
}

function downloadHtmlFile() {
  if (!extractedCode.value) return
  const blob = new Blob([renderedHtmlContent.value], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `dkp-openui-${Date.now()}.html`
  link.click()
  URL.revokeObjectURL(url)
  triggerToast('⬇️ File HTML OpenUI esportato!')
}

const isNotarizing = ref(false)
const lastUserMessage = computed(() => messages.value.filter(m => m.role === 'user').pop()?.content || '')

async function notarizeToVault() {
  if (!lastAiMessage.value || isNotarizing.value) return
  isNotarizing.value = true

  try {
    const res: any = await $fetch('/api/user/vault', {
      method: 'POST',
      body: {
        userId: currentUser.value?.id || 1,
        title: `OpenUI Studio v2.6: ${selectedModel.value}`,
        code: `/* USER PROMPT */\n${lastUserMessage.value}\n\n/* AI RESPONSE / OPENUI */\n${lastAiMessage.value}`,
        sastStatus: 'PASSED'
      }
    })

    if (res && res.success) {
      notifyXpUpdate()
      triggerToast('🛡️ Output e UI salvati nel Vault Pure SQL! +100 XP.')
    }
  } catch {
    triggerToast('❌ Errore durante la notarizzazione Vault.')
  } finally {
    isNotarizing.value = false
  }
}
</script>

<template>
  <div class="max-w-[1600px] mx-auto my-6 px-4 font-sans text-slate-100 min-h-[calc(100vh-100px)] lg:h-[calc(100vh-100px)] flex flex-col">
    
    <!-- TOAST -->
    <Transition name="fade">
      <div
        v-if="showToast"
        role="status"
        class="fixed top-20 sm:top-5 right-5 bg-slate-950 border border-emerald-500 text-emerald-400 px-6 py-3 rounded-xl shadow-2xl font-bold text-sm z-50"
      >
        {{ toastMessage }}
      </div>
    </Transition>

    <!-- HEADER -->
    <div class="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 flex-shrink-0">
      <div>
        <div class="flex items-center gap-2">
          <span class="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-3.5 py-1 rounded-full text-[11px] font-mono font-black tracking-widest uppercase">
            🎨 DKP NEURAL ENGINE v2.6-PURE-SQL + OPENUI
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-black text-white mt-1.5 tracking-tight">
          OpenUI Studio &amp; <span class="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">Neural Playground</span>
        </h1>
      </div>
      <NuxtLink to="/tools" class="text-sky-400 text-xs sm:text-sm font-bold hover:text-sky-300 hover:underline transition-colors no-underline">
        ← Torna al Toolkit
      </NuxtLink>
    </div>

    <!-- MAIN GRID 3 COLONNE -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
      
      <!-- COLONNA 1: CONFIGURAZIONE & MODELLI -->
      <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 overflow-y-auto custom-scrollbar">
        <h2 class="text-xs font-black uppercase text-slate-400 tracking-wider m-0">1. Configurazione Gateway v2.6</h2>
        
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-bold text-emerald-400 flex items-center gap-1"><span>🔑</span> DKP API Key</label>
          <input
            v-model="dkpApiKey"
            type="password"
            placeholder="dkp_live_..."
            class="bg-slate-950 border border-slate-700/80 text-white p-3 rounded-xl text-xs sm:text-sm focus:border-emerald-400 outline-none font-mono shadow-inner placeholder:text-slate-600"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-bold text-slate-400 flex items-center gap-1"><span>🤖</span> DKP Trinity Model</label>
          <select
            v-model="selectedModel"
            class="bg-slate-950 border border-slate-700/80 text-white p-3 rounded-xl text-xs sm:text-sm focus:border-purple-400 outline-none cursor-pointer shadow-inner"
          >
            <option value="dkp-flash">⚡ DKP-Flash — Veloce</option>
            <option value="dkp-coder">💻 DKP-Coder — UI &amp; Code</option>
            <option value="dkp-pro">🧠 DKP-Pro — Architettura Avanzata</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-400 flex justify-between items-center">
              <span>Temp</span>
              <span class="text-purple-400 font-mono">{{ temperature.toFixed(1) }}</span>
            </label>
            <input v-model.number="temperature" type="range" min="0" max="1" step="0.1" class="w-full h-1.5 bg-slate-800 rounded-lg accent-purple-500 mt-2 cursor-pointer" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-400">Max Tokens</label>
            <input v-model.number="maxTokens" type="number" step="128" min="256" max="4096" class="bg-slate-950 border border-slate-700/80 text-white p-2.5 rounded-xl font-mono text-xs focus:border-purple-400 outline-none shadow-inner" />
          </div>
        </div>

        <!-- PROMPT PRESETS -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-bold text-slate-400">⚡ Template Rapidi OpenUI</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="preset in promptPresets"
              :key="preset.label"
              type="button"
              @click="applyPreset(preset.prompt)"
              class="text-[11px] font-mono bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-purple-300 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-1.5 flex-1 min-h-[120px]">
          <label class="text-xs font-bold text-slate-400">System Prompt (OpenUI Enabled)</label>
          <textarea
            v-model="systemPrompt"
            class="w-full h-full min-h-[110px] bg-slate-950 border border-slate-700/80 text-sky-400 p-3 rounded-xl font-mono text-xs focus:border-purple-400 outline-none resize-none shadow-inner leading-relaxed"
          ></textarea>
        </div>
      </div>

      <!-- COLONNA 2: CHAT TERMINAL STREAMING -->
      <div class="bg-[#060a12] border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative min-h-[420px]">
        <div class="bg-[#090d16] border-b border-slate-800 px-4 py-3 flex justify-between items-center z-10 flex-shrink-0">
          <span class="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Chat &amp; Prompt Stream
          </span>
          <button
            type="button"
            @click="notarizeToVault"
            :disabled="isNotarizing || !lastAiMessage"
            class="bg-slate-950 border border-emerald-500/40 text-emerald-400 px-3 py-1.5 text-xs font-bold rounded-xl hover:bg-emerald-500/10 transition-colors disabled:opacity-40 cursor-pointer shadow-sm"
          >
            {{ isNotarizing ? 'Notarizzazione...' : '🛡️ Salva nel Vault' }}
          </button>
        </div>

        <div ref="chatScrollRef" class="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
          <div v-if="messages.length === 0" class="m-auto text-center text-slate-500 text-sm max-w-xs px-4">
            <span class="text-3xl mb-2 block">💬</span>
            Chiedi a <strong class="text-slate-300">DKP-Coder</strong> di creare una card, una tabella o una dashboard con Tailwind per vederla apparire nella Preview OpenUI a destra.
          </div>

          <div
            v-for="message in messages"
            :key="message.id"
            :class="['flex gap-3 max-w-[95%]', message.role === 'user' ? 'ml-auto flex-row-reverse' : '']"
          >
            <div :class="['w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 border shadow-sm', message.role === 'user' ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' : 'bg-purple-500/20 border-purple-500/40 text-purple-300']">
              {{ message.role === 'user' ? '🧑‍💻' : '🤖' }}
            </div>
            <div :class="['p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap font-mono shadow-inner', message.role === 'user' ? 'bg-slate-800 text-sky-100 rounded-tr-sm' : 'bg-slate-900 border border-slate-800 text-emerald-400 rounded-tl-sm']">
              {{ message.content }}
            </div>
          </div>

          <div v-if="isLoading" class="flex items-center gap-2 text-purple-400 font-bold text-xs bg-slate-900/60 p-3 rounded-xl w-max border border-purple-500/30 shadow-sm">
            <span>⚡ Generazione in corso...</span>
            <button type="button" @click="stop" class="ml-2 text-[10px] bg-red-500/20 text-red-400 px-2.5 py-1 rounded-lg border border-red-500/30 font-bold cursor-pointer hover:bg-red-500/30 transition-colors">
              Ferma
            </button>
          </div>
        </div>

        <form @submit="onSubmit" class="p-3 bg-[#090d16] border-t border-slate-800 flex-shrink-0">
          <div class="relative flex items-center">
            <textarea
              v-model="input"
              @keydown.enter.exact.prevent="onSubmit"
              placeholder="Es: Crea una card utente con Tailwind... (Invio per inviare)"
              class="w-full bg-slate-950 border border-slate-700/80 text-white pl-4 pr-14 py-3 rounded-2xl outline-none resize-none text-xs focus:border-purple-400 shadow-inner placeholder:text-slate-600 leading-relaxed"
              rows="2"
            ></textarea>
            <button
              type="submit"
              :disabled="isLoading || !input?.trim()"
              class="absolute right-2.5 bg-purple-500 text-white font-black p-2.5 rounded-xl hover:bg-purple-400 disabled:opacity-40 text-xs transition-all shadow-md cursor-pointer"
            >
              ➔
            </button>
          </div>
        </form>
      </div>

      <!-- COLONNA 3: OPENUI LIVE PREVIEW -->
      <div class="bg-[#090d16] border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden min-h-[420px]">
        
        <!-- Tabs Anteprima vs Codice Puro + Export -->
        <div class="bg-slate-950 border-b border-slate-800 px-4 py-3 flex flex-wrap justify-between items-center gap-2 flex-shrink-0">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-black text-purple-400 uppercase tracking-wider">⚡ OpenUI Studio</span>
            <template v-if="extractedCode">
              <button
                type="button"
                @click="copyExtractedCode"
                class="text-[11px] font-mono px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
                title="Copia codice HTML"
              >
                {{ isCodeCopied ? '✔' : '📋' }}
              </button>
              <button
                type="button"
                @click="downloadHtmlFile"
                class="text-[11px] font-mono px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-sky-400 transition-colors cursor-pointer"
                title="Esporta file .html"
              >
                ⬇️
              </button>
            </template>
          </div>

          <div class="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              @click="activeTab = 'preview'"
              :class="['px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer', activeTab === 'preview' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-white']"
            >
              Preview Live
            </button>
            <button
              type="button"
              @click="activeTab = 'code'"
              :class="['px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer', activeTab === 'code' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-white']"
            >
              Codice
            </button>
          </div>
        </div>

        <!-- Contenuto Preview / Codice -->
        <div class="flex-1 overflow-hidden bg-slate-950 flex flex-col relative">
          
          <!-- TAB 1: IFRAME LIVE PREVIEW -->
          <div v-show="activeTab === 'preview'" class="w-full h-full bg-slate-950 overflow-hidden relative">
            <iframe
              :srcdoc="renderedHtmlContent"
              sandbox="allow-scripts"
              title="OpenUI Live Preview"
              class="w-full h-full border-0"
            ></iframe>
          </div>

          <!-- TAB 2: CODICE RAW FORMATTATO -->
          <div v-show="activeTab === 'code'" class="w-full h-full p-4 overflow-auto custom-scrollbar">
            <pre class="text-emerald-400 font-mono text-xs whitespace-pre-wrap leading-relaxed">{{ extractedCode || '// Nessun blocco di codice rilevato nella risposta dell\'IA.\n// Chiedi a DKP-Coder di generare un componente HTML/Tailwind.' }}</pre>
          </div>

        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #334155;
}
</style>