<!-- app/pages/user/[username].vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const rawUsername = computed(() => (route.params.username as string) || 'alexdpl')

useHead({
  title: `@${rawUsername.value} — DKP Developer Profile v2.6`,
  meta: [{ name: 'description', content: `Profilo sviluppatore ufficiale di @${rawUsername.value} su DevKernelPulse.` }]
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
const vaultCerts = computed(() => profileData.value?.vaultCerts || [])

const username = computed(() => userData.value.username || rawUsername.value)
const isAdmin = computed(() => String(userData.value.role || '').toUpperCase() === 'ADMIN' || username.value.toLowerCase() === 'alexdpl')

const bio = computed(() => {
  const dbBio = userData.value.bio
  if (isAdmin.value && (!dbBio || dbBio === 'Admin' || dbBio.length < 15)) {
    return 'Lead Engineer Architect & Core Creator of DevKernelPulse. Specializzato in architetture Cloud Native, database Neon Pure SQL e sistemi di notarizzazione on-chain SHA-256.'
  }
  return dbBio || 'DKP Kernel Developer & Sentinel Operator.'
})

const avatar = computed(() => userData.value.avatar || 'https://github.com/alexdpl.png')
const reputationTier = computed(() => userData.value.reputationTier || (isAdmin.value ? 'Architect' : 'Junior Kernel'))
const xp = computed(() => userData.value.xp ?? 12500)
const level = computed(() => userData.value.level ?? Math.floor(xp.value / 250) + 1)
const badges = computed(() => userData.value.badges || ['Kernel Admin', 'Top Debater'])

// Social e link utente
const github = computed(() => userData.value.github || userData.value.githubUrl || 'https://github.com/alexdpl')
const twitter = computed(() => userData.value.twitter || userData.value.twitterUrl || 'https://x.com/alexdpl76')
const linkedin = computed(() => userData.value.linkedin || 'https://linkedin.com/in/alexdpl')
const reddit = computed(() => userData.value.reddit || 'https://reddit.com/user/alexdpl')
const website = computed(() => userData.value.website || userData.value.websiteUrl || 'https://devkernelpulse.org')
const repository = computed(() => userData.value.repository || userData.value.repoUrl || 'https://github.com/alexdpl/devkernel-pulse')

async function loadUserProfile() {
  isLoading.value = true
  try {
    const res: any = await $fetch(`/api/user/profile?username=${rawUsername.value}&_t=${Date.now()}`)
    if (res?.success) {
      profileData.value = res.data
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
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 font-sans px-4 sm:px-6 py-10 sm:py-16 relative">
    
    <div v-if="showToast" class="fixed top-5 right-5 bg-slate-950 border border-cyan-500 text-cyan-400 px-6 py-3 rounded-xl shadow-xl font-mono text-sm z-50">
      {{ toastMessage }}
    </div>

    <div v-if="isLoading" class="max-w-4xl mx-auto py-20 text-center font-mono text-cyan-400">
      ⚡ Sincronizzazione profilo @{{ rawUsername }} con Neon Pure SQL...
    </div>

    <div v-else class="max-w-4xl mx-auto flex flex-col gap-8">
      
      <!-- HEADER PROFILO -->
      <div class="bg-[#080d1a] border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div class="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div class="relative">
            <img :src="avatar" alt="Avatar" class="w-28 h-28 rounded-2xl object-cover border-2 border-cyan-400/40 shadow-[0_0_25px_rgba(34,211,238,0.2)]" />
            <span class="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase font-mono shadow">
              ONLINE
            </span>
          </div>

          <div class="flex-1 flex flex-col gap-3 text-center md:text-left font-mono">
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 class="text-3xl font-black text-white tracking-tight font-sans">@{{ username }}</h1>
              
              <!-- KERNEL ADMIN BADGE ORO -->
              <span v-if="isAdmin" class="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-400 border border-yellow-500/50 px-3 py-0.5 rounded-full text-xs font-black tracking-wider uppercase shadow-[0_0_12px_rgba(234,179,8,0.25)]">
                [Kernel Admin]
              </span>

              <span class="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-3 py-0.5 rounded-full text-xs font-black tracking-wider uppercase">
                {{ reputationTier }}
              </span>
            </div>

            <p class="text-slate-300 text-sm leading-relaxed font-sans max-w-xl">
              {{ bio }}
            </p>

            <div v-if="badges?.length" class="flex flex-wrap justify-center md:justify-start gap-2 mt-1">
              <span 
                v-for="badge in badges" 
                :key="badge" 
                :class="[
                  'px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide flex items-center gap-1.5',
                  badge === 'Kernel Admin' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 font-extrabold' :
                  badge === 'Top Debater' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' :
                  'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                ]"
              >
                <span>🛡️</span> {{ badge }}
              </span>
            </div>
          </div>

          <button 
            type="button"
            @click="shareProfile"
            class="bg-slate-950 hover:bg-cyan-500/10 text-cyan-300 border border-cyan-400/40 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-extrabold transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>🔗 Condividi Profilo</span>
          </button>
        </div>

        <!-- 4 SOCIAL + SITO WEB + REPOSITORY -->
        <div class="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap justify-center sm:justify-start gap-3 relative z-10 font-mono">
          <a :href="github" target="_blank" rel="noopener noreferrer" class="bg-[#040814] border border-slate-800 hover:border-cyan-400 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
            <span>🐙</span> GitHub
          </a>
          <a :href="twitter" target="_blank" rel="noopener noreferrer" class="bg-[#040814] border border-slate-800 hover:border-sky-400 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
            <span>🐦</span> Twitter / X
          </a>
          <a :href="linkedin" target="_blank" rel="noopener noreferrer" class="bg-[#040814] border border-slate-800 hover:border-blue-500 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
            <span>💼</span> LinkedIn
          </a>
          <a :href="reddit" target="_blank" rel="noopener noreferrer" class="bg-[#040814] border border-slate-800 hover:border-orange-500 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
            <span>👽</span> Reddit
          </a>
          <a :href="website" target="_blank" rel="noopener noreferrer" class="bg-[#040814] border border-slate-800 hover:border-emerald-400 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
            <span>🌐 Sito Web</span>
          </a>
          <a :href="repository" target="_blank" rel="noopener noreferrer" class="bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 text-cyan-300 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
            <span>📦 Repository</span>
          </a>
          <span v-if="userData.email && userData.publicEmailVisible" class="bg-[#040814] border border-slate-800 text-slate-400 px-4 py-2 rounded-xl text-xs flex items-center gap-1.5">
            <span>📧</span> {{ userData.email }}
          </span>
        </div>
      </div>

      <!-- STATISTICHE & XP -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <span class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">PUNTI XP &amp; LIVELLO</span>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-cyan-400">{{ xp }}</span>
            <span class="text-xs text-slate-400 font-bold">LV.{{ level }}</span>
          </div>
        </div>

        <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <span class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">REPUTATION TIER</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-black text-purple-400">{{ reputationTier }}</span>
          </div>
        </div>

        <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <span class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">VAULT NOTARIZZATI</span>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-emerald-400">{{ stats.notarizedCodeCount }}</span>
            <span class="text-xs text-slate-400 font-bold">SHA-256</span>
          </div>
        </div>

        <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <span class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">DATABASE PURE SQL</span>
          <div class="flex items-center gap-2">
            <span class="text-sm font-extrabold text-emerald-400">NeonDB Connected</span>
            <span class="text-emerald-400">🟢</span>
          </div>
        </div>
      </div>

      <!-- NOTARIZZAZIONI BLOCKCHAIN VAULT -->
      <div v-if="vaultCerts.length > 0" class="bg-[#080d1a] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl font-mono">
        <h3 class="text-lg font-black text-white mb-4 flex items-center gap-2">
          <span>🛡️</span> Notarizzazioni On-Chain (SHA-256 Vault)
        </h3>
        <div class="flex flex-col gap-3">
          <div v-for="cert in vaultCerts" :key="cert.id" class="bg-[#040814] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-4">
            <div>
              <p class="text-xs sm:text-sm font-bold text-slate-200 m-0">{{ cert.title }}</p>
              <span class="text-[10px] text-cyan-400 font-mono">Hash: {{ cert.hash.substring(0, 32) }}...</span>
            </div>
            <span class="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-1 rounded shrink-0">
              Notarized
            </span>
          </div>
        </div>
      </div>

      <!-- ATTIVITÀ RECENTI -->
      <div class="bg-[#080d1a] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl font-mono">
        <h3 class="text-lg font-black text-white mb-6 flex items-center gap-2">
          <span>⚡</span> Attività &amp; Contributi Recenti nei Nodi
        </h3>
        <div v-if="recentActivity.length === 0" class="text-slate-500 text-xs italic">
          Nessuna attività registrata di recente.
        </div>
        <div v-else class="flex flex-col gap-3">
          <div v-for="(act, idx) in recentActivity" :key="idx" class="bg-[#040814] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <span class="text-lg">💬</span>
              <p class="text-xs sm:text-sm text-slate-200 font-medium m-0 font-sans">{{ act.title }}</p>
            </div>
            <span class="text-[11px] font-mono text-slate-500 shrink-0">{{ act.time }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>