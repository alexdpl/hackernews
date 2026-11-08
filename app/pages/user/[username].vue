<!-- app/pages/user/[username].vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const rawUsername = computed(() => (route.params.username as string) || 'alexdpl')

useDkpSeo({
  title: `@${rawUsername.value} — Developer Profile v2.5-GOLD`,
  description: `Profilo sviluppatore ufficiale di @${rawUsername.value} su DevKernelPulse. Visualizza reputazione DKP, badge, attività e codice notarizzato nel Vault.`
})

// Simulazione/Fetch Dati Profilo
const userProfile = ref({
  username: rawUsername.value,
  fullName: 'Alex DPL',
  bio: 'Lead Engineer Architect & Core Creator of DevKernelPulse. Building high-performance developer tools, AI workflows and serverless architectures.',
  avatar: 'https://github.com/alexdpl.png',
  github: 'https://github.com/alexdpl',
  twitter: 'https://x.com/alexdpl76',
  linkedin: 'https://linkedin.com/in/alexdpl',
  reddit: 'https://reddit.com/user/alexdpl',
  points: 10860,
  level: 2,
  rankTier: 'S-TIER ARCHITECT',
  verified: true,
  badges: ['Developer VIP Member', 'Early Pioneer', 'Core Creator', 'Vault Master'],
  stats: {
    scansCount: 42,
    notarizedCodeCount: 18,
    reputationScore: 98.4
  },
  recentActivity: [
    { type: 'vault', title: 'Notarizzato algoritmo JWT_Validator.ts', time: '2 ore fa' },
    { type: 'scan', title: 'Audit AI completato su repo nuxt/nuxt', time: '1 giorno fa' },
    { type: 'post', title: 'Pubblicato articolo su Telemetria SSE Live', time: '2 giorni fa' }
  ]
})

// Gestione Fallback Avatar per evitare immagini rotte
const avatarError = ref(false)
const userInitials = computed(() => {
  const name = userProfile.value.username || 'DKP'
  return name.slice(0, 2).toUpperCase()
})

// Toast Notification per la condivisione
const showToast = ref(false)
const toastMessage = ref('')

function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => showToast.value = false, 3500)
}

function shareProfile() {
  if (import.meta.client) {
    const fullUrl = window.location.href
    navigator.clipboard.writeText(fullUrl)
    triggerToast('🔗 Link del profilo copiato negli appunti!')
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 font-sans px-4 sm:px-6 py-10 sm:py-16 relative">
    
    <!-- TOAST NOTIFICATION -->
    <Transition name="fade">
      <div v-if="showToast" class="fixed top-20 sm:top-5 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-5 bg-slate-950 border border-emerald-500 text-emerald-400 px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.25)] font-bold text-sm z-50 whitespace-nowrap text-center">
        {{ toastMessage }}
      </div>
    </Transition>

    <div class="max-w-4xl mx-auto flex flex-col gap-8">
      
      <!-- HERO PROFILE CARD -->
      <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <!-- Background Glow Layer -->
        <div class="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          
          <!-- Avatar e Informazioni Principali -->
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            
            <!-- AVATAR CON FALLBACK ROBUSTO -->
            <div class="relative shrink-0">
              <img 
                v-if="userProfile.avatar && !avatarError" 
                :src="userProfile.avatar" 
                :alt="userProfile.username"
                @error="avatarError = true"
                class="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-emerald-400 p-1 bg-slate-950 object-cover shadow-[0_0_25px_rgba(16,185,129,0.25)]"
              />
              <div 
                v-else 
                class="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-emerald-400 bg-gradient-to-br from-emerald-500/20 to-purple-600/30 flex items-center justify-center text-emerald-400 font-black text-2xl sm:text-3xl shadow-[0_0_25px_rgba(16,185,129,0.25)]"
              >
                {{ userInitials }}
              </div>
              
              <!-- Badge Verificato -->
              <span v-if="userProfile.verified" class="absolute bottom-1 right-1 bg-emerald-500 text-slate-950 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#090d16]" title="Profilo Verificato DKP">
                ✓
              </span>
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  @{{ userProfile.username }}
                </h1>
                <span class="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-3 py-0.5 rounded-full text-xs font-black tracking-wider uppercase">
                  {{ userProfile.rankTier }}
                </span>
              </div>

              <p class="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
                {{ userProfile.bio }}
              </p>

              <!-- BADGES UTENTE -->
              <div class="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                <span 
                  v-for="badge in userProfile.badges" 
                  :key="badge"
                  class="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide flex items-center gap-1.5"
                >
                  <span>🛡️</span> {{ badge }}
                </span>
              </div>
            </div>
          </div>

          <!-- Pulsante Condividi Profilo -->
          <div class="shrink-0 w-full md:w-auto">
            <button 
              @click="shareProfile"
              class="w-full md:w-auto bg-slate-950 hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🔗 Condividi Profilo</span>
            </button>
          </div>

        </div>

        <!-- SOCIAL LINKS BAR -->
        <div class="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap justify-center sm:justify-start gap-3 relative z-10">
          <!-- GitHub -->
          <a v-if="userProfile.github" :href="userProfile.github" target="_blank" class="flex items-center gap-2.5 bg-[#020420] border border-slate-800 hover:border-emerald-400 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <svg class="w-4 h-4 fill-current text-slate-400" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            <span>GitHub</span>
          </a>

          <!-- Twitter / X -->
          <a v-if="userProfile.twitter" :href="userProfile.twitter" target="_blank" class="flex items-center gap-2.5 bg-[#020420] border border-slate-800 hover:border-sky-400 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <svg class="w-4 h-4 fill-current text-slate-400" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span>Twitter / X</span>
          </a>

          <!-- LinkedIn -->
          <a v-if="userProfile.linkedin" :href="userProfile.linkedin" target="_blank" class="flex items-center gap-2.5 bg-[#020420] border border-slate-800 hover:border-blue-500 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <svg class="w-4 h-4 fill-current text-blue-400" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.74a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/></svg>
            <span>LinkedIn</span>
          </a>

          <!-- Reddit -->
          <a v-if="userProfile.reddit" :href="userProfile.reddit" target="_blank" class="flex items-center gap-2.5 bg-[#020420] border border-slate-800 hover:border-orange-500 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)]">
            <svg class="w-4 h-4 fill-current text-orange-400" viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z"/></svg>
            <span>Reddit</span>
          </a>
        </div>
      </div>

      <!-- METRICHE & STATISTICHE DKP -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <span class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">PUNTI DKP TOTALI</span>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">{{ userProfile.points }}</span>
            <span class="text-xs text-slate-400 font-bold">LV.{{ userProfile.level }}</span>
          </div>
        </div>

        <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <span class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">REPUTATION SCORE</span>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">{{ userProfile.stats.reputationScore }}%</span>
          </div>
        </div>

        <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <span class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">VAULT NOTARIZZATI</span>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-sky-400">{{ userProfile.stats.notarizedCodeCount }}</span>
            <span class="text-xs text-slate-400 font-bold">snippets</span>
          </div>
        </div>

        <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <span class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">STATO CREDENZIALI</span>
          <div class="flex items-center gap-2">
            <span class="text-xl font-extrabold text-emerald-400">Verificato</span>
            <span class="text-emerald-400">🛡️</span>
          </div>
        </div>

      </div>

      <!-- ATTIVITÀ E CONTRIBUTI RECENTI -->
      <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <h3 class="text-lg font-black text-white mb-6 flex items-center gap-2">
          <span>⚡</span> Attività &amp; Contributi Recenti
        </h3>

        <div class="flex flex-col gap-4">
          <div 
            v-for="(act, idx) in userProfile.recentActivity" 
            :key="idx"
            class="bg-[#020420] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-4 transition-colors hover:border-slate-700"
          >
            <div class="flex items-center gap-3">
              <span class="text-lg">{{ act.type === 'vault' ? '🛡️' : act.type === 'scan' ? '🔍' : '✍️' }}</span>
              <p class="text-xs sm:text-sm text-slate-200 font-medium m-0">{{ act.title }}</p>
            </div>
            <span class="text-[11px] font-mono text-slate-500 shrink-0">{{ act.time }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease, transform 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>