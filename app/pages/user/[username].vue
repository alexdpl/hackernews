<!-- app/pages/user/[username].vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const rawUsername = computed(() => (route.params.username as string) || 'alexdpl')

useHead({
  title: `@${rawUsername.value} — Profilo Sviluppatore DKP Kernel v2.6`,
  meta: [
    { name: 'description', content: `Profilo sviluppatore ufficiale di @${rawUsername.value} su DevKernelPulse.` }
  ]
})

const profileData = ref<any>(null)
const isLoading = ref(true)
const avatarError = ref(false)

const showToast = ref(false)
const toastMessage = ref('')

function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3500)
}

const userData = computed(() => profileData.value?.user || profileData.value?.data?.user || profileData.value?.data || profileData.value || {})

const username = computed(() => userData.value.username || rawUsername.value)
const bio = computed(() => userData.value.bio || 'Lead Engineer Architect & Core Creator of DevKernelPulse.')
const avatar = computed(() => userData.value.avatar || 'https://github.com/alexdpl.png')
const rankTier = computed(() => userData.value.rankTier || userData.value.role || 'S-TIER ARCHITECT')
const xp = computed(() => userData.value.xp ?? 10860)
const level = computed(() => userData.value.level ?? 2)
const verified = computed(() => userData.value.verified ?? true)
const badges = computed(() => userData.value.badges || ['Developer VIP Member', 'Early Pioneer', 'Core Creator', 'Vault Master'])

const github = computed(() => userData.value.github || 'https://github.com/alexdpl')
const twitter = computed(() => userData.value.twitter || 'https://x.com/alexdpl76')
const linkedin = computed(() => userData.value.linkedin || 'https://linkedin.com/in/alexdpl')
const reddit = computed(() => userData.value.reddit || 'https://reddit.com/user/alexdpl')

const stats = computed(() => profileData.value?.stats || { reputationScore: 98.4, notarizedCodeCount: 18 })
const recentActivity = computed(() => profileData.value?.recentActivity || [
  { type: 'vault', title: 'Notarizzato algoritmo JWT_Validator.ts nel Vault', time: '2 ore fa' },
  { type: 'scan', title: 'Audit AI completato su repo nuxt/nuxt', time: '1 giorno fa' },
  { type: 'post', title: 'Pubblicato articolo su Telemetria SSE Live', time: '2 giorni fa' }
])

const activeBounties = computed(() => profileData.value?.activeBounties || [
  { id: 101, title: 'Refactor componente Captcha equazionale', reward: '500 XP', status: 'open' },
  { id: 102, title: 'Ottimizzazione indici SQL su Neon DB', reward: '1200 XP', status: 'open' }
])

const userInitials = computed(() => username.value.slice(0, 2).toUpperCase())

async function loadUserProfile() {
  isLoading.value = true
  avatarError.value = false
  try {
    const res: any = await $fetch(`/api/user/profile?username=${rawUsername.value}&_t=${Date.now()}`)
    if (res?.success) {
      profileData.value = res.data || res
    }
  } catch (err) {
    console.warn("Errore caricamento profilo", err)
  } finally {
    isLoading.value = false
  }
}

function shareProfile() {
  if (import.meta.client) {
    navigator.clipboard.writeText(window.location.href)
    triggerToast('🔗 Link del profilo copiato negli appunti!')
  }
}

onMounted(() => {
  loadUserProfile()
  if (import.meta.client) {
    window.addEventListener('dkp:profile_updated', loadUserProfile)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('dkp:profile_updated', loadUserProfile)
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 font-sans px-4 sm:px-6 py-10 sm:py-16 relative">
    
    <div v-if="showToast" class="fixed top-5 right-5 bg-slate-950 border border-emerald-500 text-emerald-400 px-6 py-3 rounded-xl shadow-xl font-mono text-sm z-50">
      {{ toastMessage }}
    </div>

    <div v-if="isLoading" class="max-w-4xl mx-auto py-20 text-center font-mono text-emerald-400">
      ⚡ Caricamento profilo @{{ rawUsername }}...
    </div>

    <div v-else class="max-w-4xl mx-auto flex flex-col gap-8">
      
      <div class="bg-[#080d1a] border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div class="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div class="relative shrink-0">
              <img 
                v-if="avatar && !avatarError" 
                :src="avatar" 
                :alt="username"
                @error="avatarError = true"
                class="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-emerald-400 p-1 bg-slate-950 object-cover shadow-[0_0_25px_rgba(0,220,130,0.25)]"
              />
              <div v-else class="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-emerald-400 bg-gradient-to-br from-emerald-500/20 to-purple-600/30 flex items-center justify-center text-emerald-400 font-black text-2xl shadow-xl">
                {{ userInitials }}
              </div>
              
              <span v-if="verified" class="absolute bottom-1 right-1 bg-emerald-400 text-slate-950 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#080d1a] shadow-[0_0_10px_rgba(0,220,130,0.6)]" title="Verificato DKP">
                ✓
              </span>
            </div>

            <div class="flex flex-col gap-2 font-mono">
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
                  @{{ username }}
                </h1>
                <span class="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-3 py-0.5 rounded-full text-xs font-black tracking-wider uppercase">
                  {{ rankTier }}
                </span>
              </div>

              <p class="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl font-sans mt-1">
                {{ bio }}
              </p>

              <div v-if="badges?.length" class="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                <span v-for="badge in badges" :key="badge" class="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide flex items-center gap-1.5">
                  <span>🛡️</span> {{ badge }}
                </span>
              </div>
            </div>
          </div>

          <button 
            type="button"
            @click="shareProfile"
            class="w-full md:w-auto bg-slate-950 hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-extrabold transition-all hover:shadow-[0_0_20px_rgba(0,220,130,0.3)] flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>🔗 Condividi Profilo</span>
          </button>
        </div>

        <div class="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap justify-center sm:justify-start gap-3 relative z-10 font-mono">
          <a :href="github" target="_blank" rel="noopener noreferrer" class="bg-[#040814] border border-slate-800 hover:border-emerald-400 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">GitHub</a>
          <a :href="twitter" target="_blank" rel="noopener noreferrer" class="bg-[#040814] border border-slate-800 hover:border-sky-400 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">Twitter / X</a>
          <a :href="linkedin" target="_blank" rel="noopener noreferrer" class="bg-[#040814] border border-slate-800 hover:border-blue-500 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">LinkedIn</a>
          <a :href="reddit" target="_blank" rel="noopener noreferrer" class="bg-[#040814] border border-slate-800 hover:border-orange-500 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">Reddit</a>
        </div>
      </div>

      <!-- METRICHE & STATISTICHE -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <span class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">PUNTI DKP TOTALI</span>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-emerald-400">{{ xp }}</span>
            <span class="text-xs text-slate-400 font-bold">LV.{{ level }}</span>
          </div>
        </div>

        <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <span class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">REPUTATION SCORE</span>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-purple-400">{{ stats.reputationScore }}%</span>
          </div>
        </div>

        <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <span class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">VAULT NOTARIZZATI</span>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-sky-400">{{ stats.notarizedCodeCount }}</span>
            <span class="text-xs text-slate-400 font-bold">snippets</span>
          </div>
        </div>

        <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <span class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">STATO CREDENZIALI</span>
          <div class="flex items-center gap-2">
            <span class="text-lg font-extrabold text-emerald-400">Verificato</span>
            <span class="text-emerald-400">🛡️</span>
          </div>
        </div>
      </div>

      <!-- ATTIVITÀ RECENTI -->
      <div class="bg-[#080d1a] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl font-mono">
        <h3 class="text-lg font-black text-white mb-6 flex items-center gap-2">
          <span>⚡</span> Attività &amp; Contributi Recenti
        </h3>
        <div class="flex flex-col gap-3">
          <div v-for="(act, idx) in recentActivity" :key="idx" class="bg-[#040814] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <span class="text-lg">🛡️</span>
              <p class="text-xs sm:text-sm text-slate-200 font-medium m-0 font-sans">{{ act.title }}</p>
            </div>
            <span class="text-[11px] font-mono text-slate-500 shrink-0">{{ act.time }}</span>
          </div>
        </div>
      </div>

      <!-- BOUNTIES ATTIVE -->
      <div class="bg-[#080d1a] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl font-mono">
        <h3 class="text-lg font-black text-white mb-4 flex items-center gap-2">
          <span>🎯</span> Bounty Assegnate
        </h3>
        <div class="flex flex-col gap-3">
          <div v-for="bounty in activeBounties" :key="bounty.id" class="bg-[#040814] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-4">
            <span class="text-xs text-slate-200 font-sans font-bold">{{ bounty.title }}</span>
            <span class="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded text-xs font-bold">{{ bounty.reward }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>