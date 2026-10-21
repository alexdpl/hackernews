<!-- app/components/DkpPulseNexus.vue -->
<script setup lang="ts">
import { ref, onMounted, nextTick, computed, watch } from 'vue'

// (Opzionale: se hai un composable useAuthCore, assicurati che sia importato/auto-importato)
const auth = useAuthCore() || {}

// 🧠 1. Estrazione utente ultra-reattiva
const currentUser = computed(() => {
  if (isRef(auth.user)) return auth.user.value
  return auth.user || null
})

// 🧠 2. Controllo di login unificato
const isLogged = computed(() => {
  if (auth.isAuthenticated?.value || auth.isAuthenticated) return true
  if (currentUser.value?.id || currentUser.value?.username || currentUser.value?.email) return true

  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)dkp_session=([^;]*)/)
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(decodeURIComponent(match[1]))
        if (parsed && (parsed.username || parsed.id)) return true
      } catch (_) {}
    }
  }
  return false
})

// 🧠 3. Riconoscimento Username esatto
const userName = computed(() => {
  if (currentUser.value?.username) return currentUser.value.username
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)dkp_session=([^;]*)/)
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(decodeURIComponent(match[1]))
        if (parsed.username) return parsed.username
      } catch (_) {}
    }
  }
  return 'Socio'
})

// 👑 4. Riconoscimento Unico del Grado/Ruolo
const userRole = computed(() => {
  const role = currentUser.value?.role?.toLowerCase()
  if (role === 'admin' || userName.value.toLowerCase() === 'alexdpl') return 'ADMIN'
  return isLogged.value ? 'USER' : 'GUEST'
})

// L'XP base per la UI della chat (verrà sovrascritto dall'evento di sync globale in futuro)
const userXp = computed(() => currentUser.value?.xp || 0)

const isOpen = ref(false)
const inputQuery = ref('')
const isTyping = ref(false)
const chatBody = ref<HTMLElement | null>(null)

interface Message {
  id: number
  text: string
  sender: 'user' | 'nexus'
  time: string
  isSystem?: boolean
}

const messages = ref<Message[]>([])

// 🧠 5. Generazione Saluto Dinamico
const initWelcomeMessage = () => {
  let welcomeText = `Benvenuto su DKP Pulse Nexus v2.5-GOLD! Effettua il login per accedere al Kernel.`

  if (isLogged.value) {
    if (userRole.value === 'ADMIN') {
      welcomeText = `Bentornato, Amministratore ${userName.value}. Kernel Nexus v2.5-GOLD pronto ai tuoi comandi diretti.`
    } else {
      welcomeText = `Benvenuto nel Kernel, ${userName.value}! Connessione riservata stabilita. Come posso assisterti oggi?`
    }
  }

  messages.value = [{
    id: Date.now(),
    text: welcomeText,
    sender: 'nexus',
    time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    isSystem: true
  }]
}

watch(isLogged, () => {
  initWelcomeMessage()
}, { immediate: true })

const scrollToBottom = async () => {
  await nextTick()
  if (chatBody.value) {
    chatBody.value.scrollTop = chatBody.value.scrollHeight
  }
}

const handleSend = async () => {
  if (!inputQuery.value.trim() || isTyping.value) return 

  const userText = inputQuery.value.trim()
  const now = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

  messages.value.push({
    id: Date.now(),
    text: userText,
    sender: 'user',
    time: now
  })

  inputQuery.value = ''
  isTyping.value = true
  scrollToBottom()

  try {
    // Chiamata all'Intelligenza Artificiale
    const res: any = await $fetch('/api/nexus/send', {
      method: 'POST',
      body: { 
        message: userText,
        userId: currentUser.value?.id || 1,
        username: userName.value,
        role: userRole.value
      }
    }).catch(() => null)

    const aiResponse = res?.message?.text || "Non riesco a connettermi al Kernel neurale in questo momento. Riprova più tardi."
    
    // Per testare la gamification, se res.message.xpEarned non esiste, diamo 10 XP di default al login
    const xpEarned = res?.message?.xpEarned || 10 
    
    messages.value.push({
      id: Date.now(),
      text: aiResponse,
      sender: 'nexus',
      time: res?.message?.timestamp || new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    })

    // 🚀 INTEGRAZIONE FASE 2: SCRITTURA XP SU DATABASE NEON
    if (isLogged.value && xpEarned > 0) {
      try {
        await $fetch('/api/user/xp/award', {
          method: 'POST',
          body: { 
            amount: xpEarned, 
            actionType: 'CHAT_NEXUS', 
            description: `Interazione con Pulse Nexus Companion` 
          }
        })
        
        // Spara l'evento globale per aggiornare Status Page e Badge!
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('dkp:xp_updated'))
        }

        messages.value.push({
          id: Date.now() + 1,
          text: `✨ Hai guadagnato +${xpEarned} DKP XP! Status globale aggiornato.`,
          sender: 'nexus',
          time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        })
      } catch (err) {
        console.error("Fallito salvataggio transazione XP:", err)
      }
    }

  } catch (error) {
    messages.value.push({
      id: Date.now(),
      text: "⚠️ Errore critico di connessione al DKP Nexus.",
      sender: 'nexus',
      time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      isSystem: true
    })
  } finally {
    isTyping.value = false
    scrollToBottom()
  }
}

const clearChat = () => {
  initWelcomeMessage()
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
    
    <!-- CHAT POPUP WINDOW -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform scale-95 opacity-0 translate-y-8"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 translate-y-8"
    >
      <div v-if="isOpen" class="w-[380px] max-w-[calc(100vw-3rem)] h-[550px] max-h-[calc(100vh-7rem)] mb-4 bg-[#090d16]/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_20px_rgba(0,220,130,0.1)] flex flex-col overflow-hidden relative">
        
        <!-- HEADER CHAT -->
        <div class="bg-gradient-to-r from-[#020412] to-[#090d16] border-b border-slate-800 p-4 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_#00dc82]"></span>
            </div>
            <div>
              <h3 class="text-white font-extrabold text-sm flex items-center gap-2">
                DKP Pulse Nexus 
                <span class="bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[10px] px-1.5 py-0.5 rounded tracking-wide">v2.5</span>
              </h3>
              <p class="text-sky-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">Assistente AI & Code Companion</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- XP Indicator (Optional placeholder if not synced here) -->
            <button @click="clearChat" class="text-slate-400 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors" title="Reset Conversazione">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
            <button @click="isOpen = false" class="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors" title="Chiudi">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>

        <!-- FEED MESSAGGI -->
        <div ref="chatBody" class="flex-1 overflow-y-auto p-4 space-y-4 bg-[#020412]/40 custom-scrollbar flex flex-col">
          
          <!-- OVERLAY PER I GUEST (Marketing Tactic) -->
          <div v-if="!isLogged" class="mx-auto my-2 w-full">
            <div class="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-3.5 rounded-xl text-center text-sm font-medium shadow-lg">
              🔒 <strong>Accesso Rifiutato.</strong><br/>
              Il Kernel Neurale è riservato. Effettua il login per sbloccare l'AI Companion.
            </div>
          </div>

          <!-- LISTA MESSAGGI -->
          <div v-for="msg in messages" :key="msg.id" :class="['flex w-full', msg.sender === 'user' ? 'justify-end' : 'justify-start']">
            
            <!-- Messaggio Utente -->
            <div v-if="msg.sender === 'user'" class="bg-emerald-500/20 border border-emerald-500/30 text-emerald-50 px-4 py-3 rounded-2xl rounded-tr-sm max-w-[85%] shadow-lg">
              <div class="flex items-center justify-between gap-4 mb-1.5">
                <span class="text-[10px] font-bold opacity-80 uppercase tracking-wider text-emerald-200">{{ userName }}</span>
                <span :class="userRole === 'ADMIN' ? 'bg-amber-400 text-amber-950' : 'bg-emerald-500/50 text-emerald-950'" class="text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider">
                  {{ userRole }}
                </span>
              </div>
              <p class="text-sm leading-relaxed">{{ msg.text }}</p>
              <span class="text-[10px] text-emerald-400/60 mt-1.5 block text-right font-mono">{{ msg.time }}</span>
            </div>

            <!-- Messaggio Sistema (XP) -->
            <div v-else-if="msg.isSystem" class="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2.5 rounded-xl w-full text-center shadow-lg">
              <p class="text-[13px] font-bold">{{ msg.text }}</p>
              <span class="text-[10px] text-amber-500/50 mt-1 block font-mono">{{ msg.time }}</span>
            </div>

            <!-- Messaggio Nexus AI -->
            <div v-else class="bg-slate-800/60 border border-slate-700 text-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%] shadow-lg">
              <div class="flex items-center justify-between gap-4 mb-1.5">
                <span class="text-[10px] font-bold opacity-80 uppercase tracking-wider text-sky-200">⚡ Pulse Nexus</span>
                <span class="text-[9px] font-black text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded">AI</span>
              </div>
              <p class="text-sm leading-relaxed">{{ msg.text }}</p>
              <span class="text-[10px] text-slate-500 mt-1.5 block font-mono">{{ msg.time }}</span>
            </div>
          </div>

          <!-- Indicatore Typing -->
          <div v-if="isTyping" class="flex justify-start">
            <div class="bg-slate-800/60 border border-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-2 items-center shadow-lg">
              <div class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
              <div class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style="animation-delay: 0.15s"></div>
              <div class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>
              <span class="text-xs font-mono text-emerald-400/70 ml-2">Elaborazione...</span>
            </div>
          </div>
        </div>

        <!-- FORM DI INVIO -->
        <form @submit.prevent="handleSend" class="p-4 border-t border-slate-800 bg-[#090d16] relative">
          <div class="absolute inset-0 bg-emerald-500/5 blur-xl pointer-events-none transition-opacity duration-300" :class="inputQuery ? 'opacity-100' : 'opacity-0'"></div>
          <div class="flex gap-2 relative z-10">
            <input 
              v-model="inputQuery" 
              type="text" 
              :placeholder="isLogged ? `Comunica col Kernel, ${userName}...` : 'Fai il login per interagire...'" 
              :disabled="isTyping || !isLogged"
              class="flex-1 bg-[#020412] border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(0,220,130,0.15)] transition-all disabled:opacity-50"
            />
            <button 
              type="submit" 
              :disabled="!inputQuery.trim() || isTyping || !isLogged"
              class="bg-emerald-500 text-[#020412] w-12 rounded-xl flex items-center justify-center hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all shadow-[0_4px_15px_rgba(0,220,130,0.2)] hover:shadow-[0_6px_20px_rgba(0,220,130,0.4)]"
            >
              <svg class="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
            </button>
          </div>
        </form>
      </div>
    </Transition>

    <!-- FLOATING LAUNCHER BUTTON -->
    <button 
      @click="isOpen = !isOpen" 
      class="group flex items-center gap-3 bg-[#090d16]/90 backdrop-blur-md border border-slate-700 text-white px-5 py-3.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(0,220,130,0.1)] hover:border-emerald-500 hover:-translate-y-1 transition-all duration-300 relative z-50"
      :class="{ 'border-emerald-500 bg-[#020420] scale-95': isOpen }"
      title="Apri DKP Pulse Nexus AI"
    >
      <div class="absolute inset-0 bg-emerald-500/10 rounded-full blur-md group-hover:bg-emerald-500/30 transition-all opacity-0 group-hover:opacity-100"></div>
      
      <!-- Punto di notifica lampeggiante -->
      <span class="absolute top-0 right-0 -mt-1 -mr-1 flex h-3.5 w-3.5">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#090d16]"></span>
      </span>

      <span class="relative z-10 text-xl">🤖</span>
      <span class="relative z-10 font-extrabold text-sm tracking-wide text-slate-200 group-hover:text-emerald-400 transition-colors hidden sm:flex items-center gap-2">
        Nexus <span class="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">v2.5</span>
      </span>
    </button>
  </div>
</template>

<style scoped>
/* Unico CSS rimasto per la scrollbar custom che Tailwind non gestisce nativamente bene su tutti i browser */
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(30, 41, 59, 0.8); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(51, 65, 85, 0.9); }
</style>