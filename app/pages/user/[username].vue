<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const rawUsername = computed(() => (route.params.username as string) || 'alexdpl')

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

const socialLinks = computed(() => [
  { label: 'GitHub', icon: '🐙', url: userData.value.githubUrl || (isAdmin.value ? 'https://github.com/alexdpl' : null) },
  { label: 'Twitter / X', icon: '🐦', url: userData.value.twitterUrl || (isAdmin.value ? 'https://x.com/alexdpl76' : null) },
  { label: 'LinkedIn', icon: '💼', url: userData.value.linkedinUrl || (isAdmin.value ? 'https://linkedin.com/in/alexdpl' : null) },
  { label: 'Reddit', icon: '👽', url: userData.value.redditUrl || (isAdmin.value ? 'https://reddit.com/user/alexdpl' : null) },
  { label: 'Discord', icon: '🎮', url: userData.value.discordUrl },
  { label: 'Telegram', icon: '✈️', url: userData.value.telegramUrl },
  { label: 'YouTube', icon: '📺', url: userData.value.youtubeUrl },
  { label: 'Sito Web', icon: '🌐', url: userData.value.websiteUrl || (isAdmin.value ? 'https://devkernelpulse.org' : null) },
  { label: 'Repository', icon: '📦', url: userData.value.repositoryUrl || (isAdmin.value ? 'https://github.com/alexdpl/devkernel-pulse' : null), primary: true }
].filter(item => Boolean(item.url)))

async function loadUserProfile() {
  isLoading.value = true
  try {
    const res: any = await $fetch(`/api/user/profile?username=${rawUsername.value}&_t=${Date.now()}`)
    if (res?.success) profileData.value = res.data
  } catch (err) {
    console.warn('Errore caricamento profilo', err)
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

onMounted(loadUserProfile)
</script>

<template>
  <DkpLayout
    :title="`@${username}`"
    :subtitle="`Developer Profile | ${reputationTier} | v2.6 Pure SQL`"
    :seo-title="`@${username} — DKP Developer Profile v2.6`"
    :seo-description="`Profilo ufficiale di @${username} su DevKernelPulse.org: certificati Vault SHA-256, repository e contributi.`"
  >
    <div v-if="showToast" class="fixed top-5 right-5 bg-dkp-card border border-dkp-accent text-dkp-accent px-6 py-3 rounded-xl shadow-xl font-mono text-sm z-50">
      {{ toastMessage }}
    </div>

    <div v-if="isLoading" class="bg-dkp-card border border-dkp-border rounded-lg p-12 text-center font-mono text-dkp-accent">
      ⚡ Sincronizzazione profilo @{{ rawUsername }} con Neon Pure SQL...
    </div>

    <div v-else class="flex flex-col gap-6">
      <!-- HEADER PROFILO -->
      <div class="bg-dkp-card border border-dkp-border rounded-lg p-6 sm:p-8 card-glow relative overflow-hidden">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="relative shrink-0">
            <img :src="avatar" alt="Avatar" class="w-24 h-24 rounded-xl object-cover border-2 border-dkp-accent/50" />
            <span class="absolute -bottom-2 -right-2 bg-dkp-pass text-dkp-bg text-[10px] font-black px-2 py-0.5 rounded-full uppercase font-mono">
              ONLINE
            </span>
          </div>

          <div class="flex-1 flex flex-col gap-2.5 text-center md:text-left font-mono">
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h2 class="text-2xl font-bold text-dkp-text m-0 font-display">@{{ username }}</h2>
              <span v-if="isAdmin" class="bg-amber-500/15 text-amber-400 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">
                [Kernel Admin]
              </span>
              <span class="bg-violet-500/15 text-violet-300 border border-violet-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">
                {{ reputationTier }}
              </span>
            </div>

            <p class="text-dkp-muted text-sm leading-relaxed font-display m-0 max-w-2xl">
              {{ bio }}
            </p>

            <div class="flex flex-wrap justify-center md:justify-start gap-2 mt-1">
              <span
                v-for="badge in badges"
                :key="badge"
                class="px-2.5 py-1 rounded text-[11px] font-bold bg-dkp-bg border border-dkp-border text-dkp-accent flex items-center gap-1"
              >
                <span>🛡️</span> {{ badge }}
              </span>
            </div>
          </div>

          <button
            type="button"
            @click="shareProfile"
            class="bg-dkp-bg hover:bg-dkp-accent/10 text-dkp-accent border border-dkp-accent/50 px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shrink-0"
          >
            🔗 Condividi
          </button>
        </div>

        <!-- SOCIAL & REPOSITORY -->
        <div v-if="socialLinks.length > 0" class="mt-6 pt-5 border-t border-dkp-border flex flex-wrap justify-center md:justify-start gap-2.5 font-mono">
          <a
            v-for="s in socialLinks"
            :key="s.label"
            :href="s.url"
            target="_blank"
            rel="noopener noreferrer"
            :class="[
              'px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 no-underline border',
              s.primary
                ? 'bg-dkp-accent/15 border-dkp-accent/50 text-dkp-accent hover:bg-dkp-accent hover:text-dkp-bg'
                : 'bg-dkp-bg border-dkp-border text-dkp-text hover:border-dkp-accent'
            ]"
          >
            <span>{{ s.icon }}</span> {{ s.label }} ↗
          </a>
        </div>
      </div>

      <!-- KPI METRICS -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div class="bg-dkp-card border border-dkp-border rounded-lg p-5 card-glow">
          <span class="text-[10px] text-dkp-muted uppercase font-bold block mb-1">PUNTI XP &amp; LIVELLO</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-dkp-accent">{{ xp }}</span>
            <span class="text-xs text-dkp-muted">LV.{{ level }}</span>
          </div>
        </div>
        <div class="bg-dkp-card border border-dkp-border rounded-lg p-5 card-glow">
          <span class="text-[10px] text-dkp-muted uppercase font-bold block mb-1">REPUTATION TIER</span>
          <span class="text-xl font-bold text-violet-400">{{ reputationTier }}</span>
        </div>
        <div class="bg-dkp-card border border-dkp-border rounded-lg p-5 card-glow">
          <span class="text-[10px] text-dkp-muted uppercase font-bold block mb-1">VAULT NOTARIZZATI</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-dkp-pass">{{ stats.notarizedCodeCount }}</span>
            <span class="text-xs text-dkp-muted">SHA-256</span>
          </div>
        </div>
        <div class="bg-dkp-card border border-dkp-border rounded-lg p-5 card-glow">
          <span class="text-[10px] text-dkp-muted uppercase font-bold block mb-1">ENGINE STATUS</span>
          <span class="text-sm font-bold text-dkp-pass">Pure SQL Active 🟢</span>
        </div>
      </div>

      <!-- VAULT CERTIFICATES -->
      <div v-if="vaultCerts.length > 0" class="bg-dkp-card border border-dkp-border rounded-lg p-6 card-glow font-mono">
        <h3 class="text-base font-bold text-dkp-text mb-4 m-0">🛡️ Notarizzazioni On-Chain (SHA-256 Vault)</h3>
        <div class="space-y-3">
          <div v-for="cert in vaultCerts" :key="cert.id" class="bg-dkp-bg border border-dkp-border p-4 rounded-lg flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-bold text-dkp-text m-0 font-display">{{ cert.title }}</p>
              <span class="text-[11px] text-dkp-accent">SHA-256: {{ cert.hash?.substring(0, 36) }}...</span>
            </div>
            <span class="text-[10px] bg-dkp-pass/15 text-dkp-pass border border-dkp-pass/40 px-2.5 py-1 rounded uppercase font-bold">Verified</span>
          </div>
        </div>
      </div>

      <!-- RECENT ACTIVITY -->
      <div class="bg-dkp-card border border-dkp-border rounded-lg p-6 card-glow font-mono">
        <h3 class="text-base font-bold text-dkp-text mb-4 m-0">⚡ Contributi Recenti nei Nodi</h3>
        <div v-if="recentActivity.length === 0" class="text-dkp-muted text-xs">Nessuna attività pubblica recente.</div>
        <div v-else class="space-y-3">
          <div v-for="(act, idx) in recentActivity" :key="idx" class="bg-dkp-bg border border-dkp-border p-4 rounded-lg flex items-center justify-between gap-4">
            <NuxtLink :to="act.id ? `/nodes/post/${act.id}` : '/nodes'" class="text-sm text-dkp-text hover:text-dkp-accent no-underline font-display">
              💬 {{ act.title }}
            </NuxtLink>
            <span class="text-xs text-dkp-muted shrink-0">{{ act.time }}</span>
          </div>
        </div>
      </div>
    </div>
  </DkpLayout>
</template>