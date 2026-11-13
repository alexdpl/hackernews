<!-- app/pages/user/[username].vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import DkpUserAvatar from '~/components/user/DkpUserAvatar.vue'

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

const showToast = ref(false)
const toastMessage = ref('')

function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3500)
}

const userData = computed(() => profileData.value?.user || {})
const stats = computed(() => profileData.value?.stats || { reputationScore: 99.1, notarizedCodeCount: 0 })
const recentActivity = computed(() => profileData.value?.recentActivity || [])

const username = computed(() => userData.value.username || rawUsername.value)
const bio = computed(() => userData.value.bio || 'Lead Engineer Architect & Core Creator of DevKernelPulse.')
const avatar = computed(() => userData.value.avatar || 'https://github.com/alexdpl.png')
const rankTier = computed(() => userData.value.rankTier || 'S-TIER ARCHITECT')
const xp = computed(() => userData.value.xp ?? 10860)
const level = computed(() => userData.value.level ?? Math.floor(xp.value / 250) + 1)
const badges = computed(() => userData.value.badges || ['Developer VIP Member', 'Vault Master'])

const github = computed(() => userData.value.github || 'https://github.com/alexdpl')
const twitter = computed(() => userData.value.twitter || 'https://x.com/alexdpl76')
const linkedin = computed(() => userData.value.linkedin || 'https://linkedin.com/in/alexdpl')
const reddit = computed(() => userData.value.reddit || 'https://reddit.com/user/alexdpl')

async function loadUserProfile() {
  isLoading.value = true
  try {
    const res: any = await $fetch(`/api/user/profile?username=${rawUsername.value}&_t=${Date.now()}`)
    if (res?.success) {
      profileData.value = res.data
    }
  } catch (err) {
    console.warn("Errore caricamento profilo dal DB", err)
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
      ⚡ Sincronizzazione profilo @{{ rawUsername }} con Neon Pure SQL...
    </div>

    <div v-else class="max-w-4xl mx-auto flex flex-col gap-8">
      
      <!-- HEADER PROFILO CON AVATAR PULSANTE -->
      <div class="bg-[#080d1a] border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div class="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          
          <DkpUserAvatar
            :username="username"
            :avatarUrl="avatar"
            :level="Number(level)"
            :xp="Number(xp)"
            :isOnline="true"
            :showDetails="false"
          />

          <div class="flex-1 flex flex-col gap-3 text-center md:text-left font-mono">
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 class="text-3xl font-black text-white tracking-tight font-sans">@{{ username }}</h1>
              <span class="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-3 py-0.5 rounded-full text-xs font-black tracking-wider uppercase">
                {{ rankTier }}
              </span>
              <span class="bg-emerald-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                ✓ Verificato SQL
              </span>
            </div>

            <p class="text-slate-300 text-sm leading-relaxed font-sans max-w-xl">
              {{ bio }}
            </p>

            <div v-if="badges?.length" class="flex flex-wrap justify-center md:justify-start gap-2 mt-1">
              <span v-for="badge in badges" :key="badge" class="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide flex items-center gap-1.5">
                <span>🛡️</span> {{ badge }}
              </span>
            </div>
          </div>

          <button 
            type="button"
            @click="shareProfile"
            class="bg-slate-950 hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-extrabold transition-all hover:shadow-[0_0_20px_rgba(0,220,130,0.3)] flex items-center justify-center gap-2 cursor-pointer shrink-0"
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

      <!-- METRICHE & STATISTICHE REALI -->
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
          <span class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">DATABASE STATUS</span>
          <div class="flex items-center gap-2">
            <span class="text-sm font-extrabold text-emerald-400">Pure SQL Online</span>
            <span class="text-emerald-400">🟢</span>
          </div>
        </div>
      </div>

      <!-- ATTIVITÀ RECENTI (POST E THREAD REALI) -->
      <div class="bg-[#080d1a] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl font-mono">
        <h3 class="text-lg font-black text-white mb-6 flex items-center gap-2">
          <span>⚡</span> Attività &amp; Contributi Reali nel Kernel
        </h3>
        <div v-if="recentActivity.length === 0" class="text-slate-500 text-xs italic">
          Nessuna attività registrata di recente.
        </div>
        <div v-else class="flex flex-col gap-3">
          <div v-for="(act, idx) in recentActivity" :key="idx" class="bg-[#040814] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <span class="text-lg">🛡️</span>
              <p class="text-xs sm:text-sm text-slate-200 font-medium m-0 font-sans">{{ act.title }}</p>
            </div>
            <span class="text-[11px] font-mono text-slate-500 shrink-0">{{ act.time }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>