<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import DkpLayout from '~/components/DkpLayout.vue'

const route = useRoute()
const rawUsername = computed(() => String(route.params.username || 'alexdpl').trim())

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
const recentActivity = computed<any[]>(() => profileData.value?.recentActivity || [])
const vaultCerts = computed<any[]>(() => profileData.value?.vaultCerts || [])

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
const reputationTier = computed(() => userData.value.reputationTier || (isAdmin.value ? 'Architect' : 'Developer'))
const xp = computed(() => Number(userData.value.xp ?? 12500))
const level = computed(() => Math.floor(xp.value / 250) + 1)
const badges = computed<string[]>(() => {
  if (Array.isArray(userData.value.badges) && userData.value.badges.length > 0) return userData.value.badges
  return isAdmin.value
    ? ['Kernel Admin', 'Top Debater', 'Vault Master', 'Architect']
    : ['Verified Builder', 'Sentinel Contributor']
})

const cdnSlugMap: Record<string, string> = {
  github: 'github',
  twitter: 'x',
  x: 'x',
  linkedin: 'linkedin',
  reddit: 'reddit',
  discord: 'discord',
  telegram: 'telegram',
  youtube: 'youtube',
  facebook: 'facebook',
  google: 'google',
  gitlab: 'gitlab',
  twitch: 'twitch',
  mastodon: 'mastodon',
  threads: 'threads',
  instagram: 'instagram',
  website: 'googlechrome',
  repository: 'git'
}

function getCdnIconUrl(key: string): string {
  const slug = cdnSlugMap[String(key || '').toLowerCase()] || 'google'
  return `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`
}

const socialLinks = computed(() => {
  const baseLinks: Array<{ key: string; label: string; url: string; accent: string }> = [
    {
      key: 'github',
      label: 'GitHub',
      url: userData.value.githubUrl || (isAdmin.value ? 'https://github.com/alexdpl' : ''),
      accent: 'border-slate-700 hover:border-white/60 text-white'
    },
    {
      key: 'twitter',
      label: 'Twitter / X',
      url: userData.value.twitterUrl || (isAdmin.value ? 'https://x.com/alexdpl76' : ''),
      accent: 'border-sky-500/40 hover:border-sky-400 text-sky-200'
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      url: userData.value.linkedinUrl || (isAdmin.value ? 'https://linkedin.com/in/alexdpl' : ''),
      accent: 'border-blue-500/40 hover:border-blue-400 text-blue-200'
    },
    {
      key: 'reddit',
      label: 'Reddit',
      url: userData.value.redditUrl || (isAdmin.value ? 'https://reddit.com/user/alexdpl' : ''),
      accent: 'border-orange-500/40 hover:border-orange-400 text-orange-200'
    },
    {
      key: 'youtube',
      label: 'YouTube',
      url: userData.value.youtubeUrl || '',
      accent: 'border-rose-500/40 hover:border-rose-400 text-rose-200'
    },
    {
      key: 'discord',
      label: 'Discord',
      url: userData.value.discordUrl || '',
      accent: 'border-indigo-500/40 hover:border-indigo-400 text-indigo-200'
    },
    {
      key: 'telegram',
      label: 'Telegram',
      url: userData.value.telegramUrl || '',
      accent: 'border-cyan-500/40 hover:border-cyan-400 text-cyan-200'
    },
    {
      key: 'website',
      label: 'Sito Web',
      url: userData.value.websiteUrl || (isAdmin.value ? 'https://devkernelpulse.org' : ''),
      accent: 'border-emerald-500/40 hover:border-emerald-400 text-emerald-200'
    },
    {
      key: 'repository',
      label: 'Repository',
      url: userData.value.repositoryUrl || (isAdmin.value ? 'https://github.com/alexdpl/hackernews' : ''),
      accent: 'border-violet-500/40 hover:border-violet-400 text-violet-200'
    }
  ]

  const extra = Array.isArray(userData.value.customSocials) ? userData.value.customSocials : []
  const mappedExtra = extra.map((item: any, i: number) => ({
    key: String(item.platform || `extra-${i}`).toLowerCase(),
    label: String(item.label || item.platform || 'Link'),
    url: String(item.url || ''),
    accent: 'border-emerald-500/40 hover:border-emerald-400 text-emerald-200'
  }))

  return [...baseLinks, ...mappedExtra].filter((item) => Boolean(item.url && item.url.trim()))
})

async function loadUserProfile() {
  isLoading.value = true
  try {
    const res: any = await $fetch(`/api/user/profile?username=${encodeURIComponent(rawUsername.value)}&_t=${Date.now()}`)
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
    triggerToast('Link del profilo copiato negli appunti!')
  }
}

onMounted(loadUserProfile)
watch(rawUsername, loadUserProfile)
</script>

<template>
  <DkpLayout
    :title="`@${username}`"
    :subtitle="`Developer Profile | ${reputationTier} | v2.6 Pure SQL`"
    :seo-title="`@${username} — DKP Developer Profile v2.6`"
    :seo-description="`Profilo ufficiale di @${username} su DevKernelPulse.org: certificati Vault SHA-256, social, repository e contributi.`"
    :show-sidebar-ads="true"
  >
    <div v-if="showToast" class="fixed bottom-5 right-5 z-50 bg-emerald-500 text-slate-950 font-mono text-xs font-extrabold px-4 py-3 rounded-xl shadow-lg">
       {{ toastMessage }}
    </div>

    <div v-if="isLoading" class="bg-dkp-card border border-dkp-border rounded-2xl p-10 text-center font-mono text-xs text-cyan-300 animate-pulse">
       Caricamento identit&agrave; Developer @{{ rawUsername }}...
    </div>

    <div v-else class="space-y-6">
      <!-- Card Principale Profilo Unificata & Colorata -->
      <section class="bg-gradient-to-br from-[#071124] via-[#050914] to-[#04131c] border border-cyan-500/25 rounded-2xl p-6 sm:p-8 card-glow space-y-6">
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <!-- Avatar con stato ONLINE verde -->
            <div class="relative shrink-0">
              <img
                :src="avatar"
                :alt="`@${username}`"
                class="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-400/70 shadow-md"
              />
              <span class="mt-2 flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 font-mono text-[10px] font-extrabold tracking-wider">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                ONLINE
              </span>
            </div>

            <div class="space-y-2.5">
              <div class="flex flex-wrap items-center gap-2.5">
                <h1 class="text-2xl sm:text-3xl font-extrabold text-white m-0 tracking-tight">
                  @{{ username }}
                </h1>

                <!-- Badge Utente Verificato -->
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 font-mono text-[11px] font-extrabold">
                   UTENTE VERIFICATO
                </span>

                <span v-if="isAdmin" class="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/50 font-mono text-[11px] font-extrabold">
                  [KERNEL ADMIN]
                </span>

                <span class="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-200 border border-violet-400/50 font-mono text-[11px] font-extrabold uppercase">
                  {{ reputationTier }}
                </span>
              </div>

              <p class="text-slate-200 text-sm sm:text-base leading-relaxed m-0 max-w-2xl">
                {{ bio }}
              </p>

              <!-- Badge Ruolo & Traguardi -->
              <div class="flex flex-wrap items-center gap-2 pt-1">
                <span
                  v-for="b in badges"
                  :key="b"
                  class="px-3 py-1 rounded-xl bg-[#020617]/90 border border-cyan-500/30 text-cyan-200 font-mono text-xs font-bold"
                >
                   {{ b }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap sm:flex-col gap-2.5 shrink-0">
            <button
              type="button"
              @click="shareProfile"
              class="px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 font-mono text-xs font-extrabold cursor-pointer transition-colors"
            >
               Condividi
            </button>
            <NuxtLink
              to="/user/dashboard?tab=profile"
              class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-extrabold no-underline text-center transition-colors"
            >
               Modifica in Dashboard
            </NuxtLink>
          </div>
        </div>

        <!-- Link Social & Risorse con Icone CDN -->
        <div class="pt-4 border-t border-slate-800/90 space-y-3">
          <div class="font-mono text-[11px] uppercase tracking-wider text-slate-400 font-bold">
            Canali Social, Community &amp; Risorse Verificate
          </div>
          <div class="flex flex-wrap gap-2.5">
            <a
              v-for="link in socialLinks"
              :key="`${link.key}-${link.url}`"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              :class="[
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#020617]/90 border font-mono text-xs font-bold no-underline transition-all',
                link.accent
              ]"
            >
              <img
                :src="getCdnIconUrl(link.key)"
                :alt="link.label"
                class="w-4 h-4 shrink-0 invert opacity-95"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
              <span>{{ link.label }}</span>
              <span class="text-slate-400"></span>
            </a>
          </div>
        </div>
      </section>

      <!-- Griglia Metriche Accattivante -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-[#050914] border border-cyan-500/30 rounded-2xl p-5 space-y-1">
          <div class="font-mono text-[11px] uppercase text-cyan-300 font-bold">Punti XP &amp; Livello</div>
          <div class="text-2xl font-extrabold text-white font-mono">
            {{ xp.toLocaleString('it-IT') }}
            <span class="text-sm text-emerald-400 font-bold ml-1">LV.{{ level }}</span>
          </div>
        </div>

        <div class="bg-[#050914] border border-violet-500/30 rounded-2xl p-5 space-y-1">
          <div class="font-mono text-[11px] uppercase text-violet-300 font-bold">Reputation Tier</div>
          <div class="text-2xl font-extrabold text-violet-200 font-mono">{{ reputationTier }}</div>
        </div>

        <div class="bg-[#050914] border border-amber-500/30 rounded-2xl p-5 space-y-1">
          <div class="font-mono text-[11px] uppercase text-amber-300 font-bold">Reputation Score</div>
          <div class="text-2xl font-extrabold text-amber-200 font-mono">{{ stats.reputationScore }}%</div>
        </div>

        <div class="bg-[#050914] border border-emerald-500/40 rounded-2xl p-5 space-y-1">
          <div class="font-mono text-[11px] uppercase text-emerald-300 font-bold">Stato Rete &amp; Vault</div>
          <div class="flex items-center gap-2 pt-1">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-base font-extrabold text-emerald-300 font-mono">VERIFIED &bull; ONLINE</span>
          </div>
        </div>
      </section>
    </div>
  </DkpLayout>
</template>