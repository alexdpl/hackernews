<!-- app/components/Navbar.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useDkpTheme } from '~/composables/useDkpTheme'

const { currentUser, isAuthenticated, logout, openAuthModal } = useAuthCore()
const { currentLang, activeLanguageObj, languages, setLanguage, initTranslator, t } = useDkpTranslator()
const { currentTheme, toggleTheme } = useDkpTheme()

const router = useRouter()
const route = useRoute()
const { getMainUrl, getApiUrl } = useDomain()

const navbarRef = ref<HTMLElement | null>(null)
const activeDropdown = ref<string | null>(null)
const isMobileMenuOpen = ref(false)
const isXpMenuOpen = ref(false)

// Telemetria Gamification & Sentinel
const globalXp = ref(0)
const globalLevel = ref(1)
const isXpAnimating = ref(false)
const sentinelStatus = ref<'ACTIVE' | 'ELEVATED'>('ACTIVE')
const sentinelAlertBanner = ref<string | null>(null)

const isNewsSectionActive = computed(() => {
  const p = route.path
  return (
    p === '/' ||
    p.startsWith('/news') ||
    p.startsWith('/feed') ||
    p.startsWith('/newest') ||
    p.startsWith('/blog') ||
    p.startsWith('/nodes') ||
    p.startsWith('/ask') ||
    p.startsWith('/show') ||
    p.startsWith('/jobs')
  )
})

const isToolsSectionActive = computed(() => route.path.startsWith('/tools'))
const isApiSectionActive = computed(
  () => route.path.startsWith('/docs') || route.path.startsWith('/shop') || route.path.startsWith('/status')
)

const isUserLoggedIn = computed(() => Boolean(isAuthenticated.value || currentUser.value?.id))

const isAdmin = computed(() => {
  if (!currentUser.value) return false
  const username = String(currentUser.value.username || '').toLowerCase()
  const role = String(currentUser.value.role || '').toLowerCase()
  return Boolean(currentUser.value.isAdmin || currentUser.value.is_admin || username === 'alexdpl' || role === 'admin')
})

watch(
  () => route.query.sentinel,
  (flag) => {
    if (flag === 'blocked_unauthenticated') {
      sentinelStatus.value = 'ELEVATED'
      sentinelAlertBanner.value = 'Sentinel Network: autenticazione Zero-Trust richiesta per accedere all’area riservata.'
    } else if (flag === 'insufficient_clearance') {
      sentinelStatus.value = 'ELEVATED'
      sentinelAlertBanner.value = 'Sentinel Network: privilegi ROOT insufficienti per la sezione amministrativa.'
    } else {
      sentinelAlertBanner.value = null
    }
  },
  { immediate: true }
)

function toggleDropdown(name: string) {
  activeDropdown.value = activeDropdown.value === name ? null : name
  if (activeDropdown.value) {
    isXpMenuOpen.value = false
    isMobileMenuOpen.value = false
  }
}

function toggleXpMenu() {
  isXpMenuOpen.value = !isXpMenuOpen.value
  if (isXpMenuOpen.value) {
    activeDropdown.value = null
    isMobileMenuOpen.value = false
  }
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  if (isMobileMenuOpen.value) {
    activeDropdown.value = null
    isXpMenuOpen.value = false
  }
}

function closeAllDropdowns() {
  activeDropdown.value = null
  isMobileMenuOpen.value = false
  isXpMenuOpen.value = false
}

watch(
  () => route.fullPath,
  () => {
    closeAllDropdowns()
  }
)

function selectLang(code: string) {
  setLanguage(code)
  activeDropdown.value = null
}

function handleClickOutside(event: MouseEvent) {
  if (navbarRef.value && !navbarRef.value.contains(event.target as Node)) {
    closeAllDropdowns()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeAllDropdowns()
  }
}

let lastXpSoundAt = 0
let lastXpFetchAt = 0
let xpAudioInstance: HTMLAudioElement | null = null
let translatorInitialized = false

const isAnyMenuOpen = computed(() => Boolean(activeDropdown.value || isMobileMenuOpen.value || isXpMenuOpen.value))

const playXpSound = () => {
  if (!import.meta.client) return
  const now = Date.now()
  if (now - lastXpSoundAt < 650) return
  lastXpSoundAt = now
  try {
    if (!xpAudioInstance) {
      xpAudioInstance = new Audio('/sounds/coin-up.mp3')
      xpAudioInstance.preload = 'none'
    }
    xpAudioInstance.volume = 0.25
    xpAudioInstance.currentTime = 0
    xpAudioInstance.play().catch(() => {})
  } catch {}
}

const refreshXpData = async (force = false) => {
  const now = Date.now()
  if (!force && now - lastXpFetchAt < 15000) return
  lastXpFetchAt = now
  try {
    const res: any = await $fetch('/api/user/gamification')
    if (res?.success && res?.data) {
      const newXp = res.data.xp ?? 0
      if (newXp > globalXp.value && globalXp.value > 0) {
        isXpAnimating.value = true
        playXpSound()
        window.setTimeout(() => {
          isXpAnimating.value = false
        }, 1500)
      }
      globalXp.value = newXp
      globalLevel.value = res.data.level ? (typeof res.data.level === 'number' ? res.data.level : 2) : 1
    }
  } catch {
    // Non-bloccante sul rendering della navbar
  }
}

const onXpUpdatedEvent = () => {
  void refreshXpData(true)
}

watch(isAnyMenuOpen, (open) => {
  if (!import.meta.client) return
  if (open) {
    document.addEventListener('click', handleClickOutside, { passive: true })
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleKeydown)
  }
})

onMounted(() => {
  if (!translatorInitialized && typeof initTranslator === 'function') {
    translatorInitialized = true
    initTranslator()
  }

  if (isUserLoggedIn.value) {
    void refreshXpData(false)
  }

  window.addEventListener('dkp:xp_updated', onXpUpdatedEvent)
})

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleKeydown)
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('dkp:xp_updated', onXpUpdatedEvent)
  }
})

watch(isUserLoggedIn, (newVal) => {
  if (newVal) void refreshXpData(true)
})

// Voci Dropdown con tag colore DKP (cyan | emerald | violet | amber)
const newsCategories = [
  { name: 'Node Talks Hub (10 Macro-Nodi)', description: 'Forum gerarchico e sub-nodi verticali', icon: '💬', route: '/nodes', tone: 'violet' },
  { name: 'Hacker News AI', description: 'Notizie HN analizzate da Trinity AI', icon: '🤖', route: '/news', tone: 'cyan' },
  { name: 'Global Tech Feed', description: 'Ultime notizie dal Web (Crawler v2.6)', icon: '🌐', route: '/feed', tone: 'cyan' },
  { name: 'DKP Blog Editorial Hub', description: 'Approfondimenti tecnici & release', icon: '✍️', route: '/blog', tone: 'emerald' },
  { name: 'Blockchain Vault Ledger', description: 'Registro notarizzazioni SHA-256', icon: '🔐', route: '/nodes/n/blockchain-vault', tone: 'emerald' },
  { name: 'Show DKP (Maker Showcase)', description: 'Progetti e MVP della community', icon: '🚀', route: '/show', tone: 'amber' },
  { name: 'Ask DKP & Architettura', description: 'Q&A tecnico e code review', icon: '💭', route: '/ask', tone: 'violet' },
  { name: 'Tech Jobs Hub', description: 'Offerte di lavoro per sviluppatori', icon: '💼', route: '/jobs', tone: 'amber' }
]

const dkpTools = [
  { name: 'Sentinel Scan (SAST)', description: 'Audit CWE & Proof of Safety SHA-256', icon: '🛡️', route: '/tools/sentinel-scan', badge: 'SAAS', tone: 'violet' },
  { name: 'OpenUI Studio AI', description: 'Generatore interfacce e preview live', icon: '🎨', route: '/tools/openui-studio', badge: 'AI', tone: 'violet' },
  { name: 'AI Repo Scanner', description: 'Analizza repository GitHub con IA', icon: '🤖', route: '/tools/ai-repo-scanner', tone: 'cyan' },
  { name: 'Proof of Code (Vault)', description: 'Notarizzazione crittografica SHA-256', icon: '🔐', route: '/tools/proof-of-code', badge: '+100 XP', tone: 'emerald' },
  { name: 'AI Code Scanner', description: 'Audit & analisi vulnerabilità SAST', icon: '🔍', route: '/tools/ai-scanner', tone: 'cyan' },
  { name: 'Terminal Web Shell', description: 'Shell CLI in-browser e comandi SDK', icon: '💻', route: '/tools/terminal', tone: 'emerald' },
  { name: 'DKP CLI Toolkit', description: 'Automazione terminale e pipeline CI', icon: '⚡', route: '/tools/cli-toolkit', tone: 'amber' }
]

const apiLinks = [
  { name: 'Documentazione API v2.6', description: 'Endpoint REST, payload e cURL live', icon: '📖', route: '/docs/api', tone: 'cyan' },
  { name: 'Docs Ecosistema & BEMYAGENT', description: 'Architettura Pure SQL & Policy AI', icon: '📘', route: '/docs/ecosystem', tone: 'violet' },
  { name: 'SDK & Integrazione', description: 'Pacchetto @devkernelpulse/sdk v1.1.0', icon: '⚙️', route: '/docs/sdk', tone: 'emerald' },
  { name: 'API & Ads Shop', description: 'Piani SaaS, chiavi dkp_live_ e Ads', icon: '💳', route: '/shop', tone: 'amber' },
  { name: 'API Status & Latency', description: 'Telemetria NeonDB & Cloud Run', icon: '🟢', route: '/status', tone: 'emerald' }
]

function handleLogin() {
  closeAllDropdowns()
  if (typeof openAuthModal === 'function') {
    openAuthModal()
  } else {
    router.push('/login')
  }
}

async function handleLogout() {
  closeAllDropdowns()
  await logout()
  window.location.href = getMainUrl('/')
}
</script>

<template>
  <header
    ref="navbarRef"
    class="bg-[#020617]/95 backdrop-blur-xl border-b border-emerald-500/40 sticky top-0 z-50 px-4 sm:px-6 py-2.5 shadow-[0_6px_30px_rgba(2,6,23,0.85)] font-sans"
  >
    <!-- ALERT BAR SENTINEL NETWORK (attiva solo su tentativi di accesso non autorizzati) -->
    <div
      v-if="sentinelAlertBanner"
      class="max-w-7xl mx-auto mb-2 px-3.5 py-2 rounded-xl bg-violet-950/70 border border-violet-500/50 text-violet-200 text-xs font-mono flex items-center justify-between gap-3"
    >
      <div class="flex items-center gap-2">
        <span class="text-amber-400">🛡️</span>
        <span>{{ sentinelAlertBanner }}</span>
      </div>
      <button
        type="button"
        @click="sentinelAlertBanner = null"
        class="text-violet-300 hover:text-white font-bold cursor-pointer bg-transparent border-none"
      >
        ✕
      </button>
    </div>

    <div class="max-w-7xl mx-auto flex items-center justify-between gap-3">
      <!-- BRAND LOGO DKP v2.6-PURE-SQL -->
      <div class="flex items-center gap-2.5 shrink-0">
        <NuxtLink
          :to="getMainUrl('/')"
          external
          class="flex items-center gap-2.5 group text-white font-black text-lg sm:text-xl tracking-tight no-underline whitespace-nowrap"
        >
          <img
            src="/dkp-logo.svg"
            alt="DevKernelPulse v2.6 Pure SQL"
            class="w-8 h-8 object-contain rounded-lg shadow-[0_0_14px_rgba(16,185,129,0.4)] group-hover:scale-105 transition-transform duration-200"
          />
          <span>DevKernel<span class="text-emerald-400">Pulse</span></span>
        </NuxtLink>
        <span class="hidden xl:inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-extrabold tracking-wider whitespace-nowrap">
          v2.6
        </span>
      </div>

      <!-- NAVIGAZIONE PRINCIPALE DESKTOP (SINGLE-LINE ARIOSA) -->
      <nav aria-label="Menu Principale" class="hidden lg:flex items-center gap-1.5 text-sm font-semibold">
        <!-- 1. DROPDOWN NEWS & HUB (CYAN PRIMARY) -->
        <div class="relative">
          <button
            type="button"
            :aria-expanded="activeDropdown === 'news'"
            @click="toggleDropdown('news')"
            class="whitespace-nowrap px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer border"
            :aria-current="isNewsSectionActive ? 'page' : undefined"
            :class="
              activeDropdown === 'news' || isNewsSectionActive
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/50 shadow-[0_0_16px_rgba(34,211,238,0.16)]'
                : 'text-cyan-300/90 hover:text-cyan-200 hover:bg-cyan-500/10 border-transparent'
            "
          >
            <span>🌐</span>
            <span>News &amp; Hub</span>
            <span
              class="text-[10px] text-cyan-400/70 transition-transform duration-200"
              :class="{ 'rotate-180 text-cyan-300': activeDropdown === 'news' }"
            >▼</span>
          </button>

          <Transition name="fade-slide">
            <div
              v-show="activeDropdown === 'news'"
              class="absolute left-0 mt-3 w-[360px] bg-[#080e1e]/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.9)] p-3 flex flex-col gap-1.5 z-50"
            >
              <div class="px-2.5 pb-1.5 border-b border-slate-800/80 flex items-center justify-between">
                <span class="text-[10px] font-mono font-extrabold text-cyan-400 uppercase tracking-widest">
                  DKP Community &amp; Streams
                </span>
                <span class="text-[10px] font-mono text-slate-400">10 Macro-Nodi</span>
              </div>

              <NuxtLink
                v-for="item in newsCategories"
                :key="item.route"
                :to="getMainUrl(item.route)"
                external
                class="flex items-start gap-3 p-2.5 rounded-xl text-slate-200 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/25 transition-all no-underline group"
                @click="closeAllDropdowns"
              >
                <span class="text-base mt-0.5 group-hover:scale-110 transition-transform">{{ item.icon }}</span>
                <div class="flex flex-col min-w-0">
                  <strong
                    class="text-xs font-bold transition-colors"
                    :class="{
                      'text-cyan-200 group-hover:text-cyan-300': item.tone === 'cyan',
                      'text-emerald-200 group-hover:text-emerald-300': item.tone === 'emerald',
                      'text-violet-200 group-hover:text-violet-300': item.tone === 'violet',
                      'text-amber-200 group-hover:text-amber-300': item.tone === 'amber'
                    }"
                  >
                    {{ item.name }}
                  </strong>
                  <small class="text-[11px] text-slate-400 leading-snug">{{ item.description }}</small>
                </div>
              </NuxtLink>
            </div>
          </Transition>
        </div>

        <!-- 2. DROPDOWN DKP TOOLS (VERDE NEON / VIOLET AI) -->
        <div class="relative">
          <button
            type="button"
            :aria-expanded="activeDropdown === 'tools'"
            @click="toggleDropdown('tools')"
            class="whitespace-nowrap px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer border"
            :aria-current="isToolsSectionActive ? 'page' : undefined"
            :class="
              activeDropdown === 'tools' || isToolsSectionActive
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/50 shadow-[0_0_16px_rgba(16,185,129,0.16)]'
                : 'text-slate-200 hover:text-emerald-300 hover:bg-emerald-500/10 border-transparent'
            "
          >
            <span>🛠️</span>
            <span>{{ t('tools') }}</span>
            <span
              class="text-[10px] text-emerald-400/70 transition-transform duration-200"
              :class="{ 'rotate-180 text-emerald-300': activeDropdown === 'tools' }"
            >▼</span>
          </button>

          <Transition name="fade-slide">
            <div
              v-show="activeDropdown === 'tools'"
              class="absolute left-0 mt-3 w-[360px] bg-[#080e1e]/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.9)] p-3 flex flex-col gap-1.5 z-50"
            >
              <div class="px-2.5 pb-1.5 border-b border-slate-800/80 flex items-center justify-between">
                <span class="text-[10px] font-mono font-extrabold text-emerald-400 uppercase tracking-widest">
                  Security, Vault &amp; AI Suite
                </span>
                <span class="text-[10px] font-mono text-violet-400">Sentinel Ready</span>
              </div>

              <NuxtLink
                v-for="tool in dkpTools"
                :key="tool.route"
                :to="getMainUrl(tool.route)"
                external
                class="flex items-start gap-3 p-2.5 rounded-xl text-slate-200 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/25 transition-all no-underline group"
                @click="closeAllDropdowns"
              >
                <span class="text-base mt-0.5 group-hover:scale-110 transition-transform">{{ tool.icon }}</span>
                <div class="flex flex-col flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <strong class="text-xs text-slate-100 font-bold group-hover:text-emerald-300 transition-colors">
                      {{ tool.name }}
                    </strong>
                    <span
                      v-if="tool.badge"
                      class="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border"
                      :class="
                        tool.tone === 'violet'
                          ? 'bg-violet-500/15 text-violet-300 border-violet-500/35'
                          : tool.tone === 'amber'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                      "
                    >
                      {{ tool.badge }}
                    </span>
                  </div>
                  <small class="text-[11px] text-slate-400 leading-snug">{{ tool.description }}</small>
                </div>
              </NuxtLink>

              <NuxtLink
                :to="getMainUrl('/tools')"
                external
                class="mt-1 text-center py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-mono font-extrabold text-emerald-300 no-underline transition-colors"
                @click="closeAllDropdowns"
              >
                Esplora tutta la Suite DKP Tools →
              </NuxtLink>
            </div>
          </Transition>
        </div>

        <!-- 3. DROPDOWN DKP API & DOCS (VIOLET / CYAN) -->
        <div class="relative">
          <button
            type="button"
            :aria-expanded="activeDropdown === 'api'"
            @click="toggleDropdown('api')"
            class="whitespace-nowrap px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer border"
            :aria-current="isApiSectionActive ? 'page' : undefined"
            :class="
              activeDropdown === 'api' || isApiSectionActive
                ? 'bg-violet-500/15 text-violet-300 border-violet-400/50 shadow-[0_0_16px_rgba(139,92,246,0.18)]'
                : 'text-slate-200 hover:text-violet-300 hover:bg-violet-500/10 border-transparent'
            "
          >
            <span>🔌</span>
            <span>DKP API</span>
            <span
              class="text-[10px] text-violet-400/70 transition-transform duration-200"
              :class="{ 'rotate-180 text-violet-300': activeDropdown === 'api' }"
            >▼</span>
          </button>

          <Transition name="fade-slide">
            <div
              v-show="activeDropdown === 'api'"
              class="absolute left-0 mt-3 w-[340px] bg-[#080e1e]/95 backdrop-blur-xl border border-violet-500/30 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.9)] p-3 flex flex-col gap-1.5 z-50"
            >
              <div class="px-2.5 pb-1.5 border-b border-slate-800/80 flex items-center justify-between">
                <span class="text-[10px] font-mono font-extrabold text-violet-400 uppercase tracking-widest">
                  Gateway, SDK &amp; Docs
                </span>
                <span class="text-[10px] font-mono text-cyan-400">Pure SQL</span>
              </div>

              <NuxtLink
                v-for="apiItem in apiLinks"
                :key="apiItem.route"
                :to="getMainUrl(apiItem.route)"
                external
                class="flex items-start gap-3 p-2.5 rounded-xl hover:bg-violet-500/10 border border-transparent hover:border-violet-500/25 transition-all no-underline group"
                @click="closeAllDropdowns"
              >
                <span class="text-base mt-0.5 group-hover:scale-110 transition-transform">{{ apiItem.icon }}</span>
                <div class="flex flex-col">
                  <strong
                    class="text-xs font-bold transition-colors"
                    :class="{
                      'text-cyan-300': apiItem.tone === 'cyan',
                      'text-violet-300': apiItem.tone === 'violet',
                      'text-emerald-300': apiItem.tone === 'emerald',
                      'text-amber-300': apiItem.tone === 'amber'
                    }"
                  >
                    {{ apiItem.name }}
                  </strong>
                  <small class="text-[11px] text-slate-400 leading-snug">{{ apiItem.description }}</small>
                </div>
              </NuxtLink>
            </div>
          </Transition>
        </div>

        <span class="text-slate-800 select-none mx-0.5">|</span>

        <!-- 4. CTA SUBMIT SINGLE-LINE (VERDE NEON) -->
        <NuxtLink
          :to="getMainUrl('/submit')"
          external
          class="whitespace-nowrap inline-flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/35 px-3 py-1.5 rounded-xl font-extrabold text-xs no-underline transition-all"
        >
          <span>⚡</span>
          <span>{{ t('submit') }}</span>
        </NuxtLink>
      </nav>

      <!-- SEZIONE DESTRA: GAMIFICATION (ORO), LINGUA (CYAN), UTENTE & SENTINELLE -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- WIDGET GAMIFICATION (ORO) — VISIBILE CON DATI REALI SE LOGGATO -->
        <div class="relative">
          <button
            @click="toggleXpMenu"
            type="button"
            class="whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all duration-300 cursor-pointer"
            :class="
              isXpAnimating
                ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.5)] scale-105'
                : 'bg-[#091022] border-amber-500/35 hover:border-amber-400'
            "
            title="Punteggio DKP Gamification & Reading Mode"
          >
            <span class="text-amber-400 text-xs">⚡</span>
            <span class="font-black font-mono text-white text-xs">{{ globalXp }}</span>
            <span class="hidden sm:inline text-[10px] text-amber-400 font-mono font-extrabold uppercase">
              Lv.{{ globalLevel }}
            </span>
            <span
              class="text-[9px] text-amber-400/70 transition-transform duration-200"
              :class="{ 'rotate-180 text-amber-300': isXpMenuOpen }"
            >▼</span>
          </button>

          <Transition name="fade-slide">
            <div
              v-show="isXpMenuOpen"
              class="absolute right-0 mt-3 w-72 bg-[#080e1e]/95 backdrop-blur-xl border border-amber-500/35 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.92)] p-3.5 flex flex-col gap-3 z-50 font-mono"
            >
              <div class="flex flex-col gap-2 border-b border-slate-800 pb-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                    Level {{ globalLevel }} &bull; {{ globalXp }} XP
                  </span>
                  <span class="text-[10px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                    {{ isAdmin ? 'ROOT DEV' : isUserLoggedIn ? 'VERIFIED' : 'GUEST' }}
                  </span>
                </div>
                <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-amber-500 to-emerald-400 w-[68%] rounded-full"></div>
                </div>
                <NuxtLink
                  v-if="isUserLoggedIn"
                  :to="getMainUrl('/user/dashboard')"
                  class="text-center text-[11px] text-emerald-400 hover:text-emerald-300 mt-1 uppercase tracking-widest font-black transition-colors no-underline"
                  @click="closeAllDropdowns"
                >
                  Apri Dashboard XP →
                </NuxtLink>
                <button
                  v-else
                  type="button"
                  @click="handleLogin"
                  class="text-center text-[11px] text-cyan-300 hover:text-cyan-200 mt-1 uppercase tracking-widest font-black bg-transparent border-none cursor-pointer"
                >
                  Accedi per salvare gli XP →
                </button>
              </div>

              <!-- Reading Mode Toggle -->
              <div class="flex items-center justify-between bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                <div class="flex flex-col">
                  <span class="text-xs font-bold text-slate-100 font-sans">Reading Mode</span>
                  <span class="text-[10px] text-slate-400">
                    {{ currentTheme === 'sepia' ? 'Warm Paper Sepia' : 'Obsidian Cyber Dark' }}
                  </span>
                </div>

                <button
                  type="button"
                  @click="toggleTheme"
                  class="relative w-14 h-7 rounded-full transition-colors duration-300 border cursor-pointer shrink-0"
                  :class="currentTheme === 'sepia' ? 'bg-[#d4c4a8] border-[#b85c38]' : 'bg-[#020617] border-cyan-500/40'"
                >
                  <div
                    class="absolute top-[2px] left-[2px] w-5 h-5 rounded-full transition-transform duration-300 flex items-center justify-center shadow-md"
                    :class="currentTheme === 'sepia' ? 'translate-x-7 bg-[#f4ecd8]' : 'translate-x-0 bg-slate-800'"
                  >
                    <span v-if="currentTheme === 'sepia'" class="text-[12px] leading-none">📜</span>
                    <span v-else class="text-[12px] leading-none text-cyan-400">⚡</span>
                  </div>
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- SELETTORE LINGUA DESKTOP (CYAN) -->
        <div class="relative hidden sm:block">
          <button
            type="button"
            :aria-expanded="activeDropdown === 'lang'"
            @click="toggleDropdown('lang')"
            class="whitespace-nowrap bg-[#091022] border border-cyan-500/30 text-slate-200 hover:border-cyan-400 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>{{ activeLanguageObj.flag }}</span>
            <span class="font-mono text-cyan-300">{{ activeLanguageObj.code }}</span>
            <span
              class="text-[9px] text-cyan-400/70 transition-transform duration-200"
              :class="{ 'rotate-180 text-cyan-300': activeDropdown === 'lang' }"
            >▼</span>
          </button>

          <Transition name="fade-slide">
            <div
              v-show="activeDropdown === 'lang'"
              class="absolute right-0 mt-3 w-48 bg-[#080e1e]/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 z-50"
            >
              <button
                v-for="lang in languages"
                :key="lang.code"
                type="button"
                @click="selectLang(lang.code)"
                class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-left font-semibold text-slate-200 hover:bg-cyan-500/10 transition-colors w-full cursor-pointer"
                :class="{ 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 font-bold': currentLang === lang.code }"
              >
                <span>{{ lang.flag }}</span>
                <span>{{ lang.code }} — {{ lang.label }}</span>
              </button>
            </div>
          </Transition>
        </div>

        <!-- BOTTONE LOGIN CON BADGE SENTINELLE -->
        <button
          v-if="!isUserLoggedIn"
          type="button"
          @click="handleLogin"
          class="whitespace-nowrap inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-[#020617] font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all shadow-[0_0_18px_rgba(16,185,129,0.32)] cursor-pointer"
        >
          <span>🛡️</span>
          <span>{{ t('login') }}</span>
        </button>

        <!-- MENU UTENTE VALIDATO + SENTINELLE INTEGRATE (ANTI-OVERLAP NEXUS) -->
        <div v-else class="relative">
          <button
            type="button"
            :aria-expanded="activeDropdown === 'user'"
            @click="toggleDropdown('user')"
            class="whitespace-nowrap flex items-center gap-2 bg-[#091022] border px-2.5 sm:px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all cursor-pointer"
            :class="
              isAdmin
                ? 'border-amber-500/50 hover:border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.18)]'
                : 'border-emerald-500/40 hover:border-emerald-400'
            "
          >
            <div class="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 flex items-center justify-center text-[10px] font-extrabold overflow-hidden shrink-0">
              <img v-if="currentUser?.avatar" :src="currentUser.avatar" alt="Avatar" class="w-full h-full object-cover" />
              <span v-else>{{ currentUser?.username?.charAt(0).toUpperCase() || 'U' }}</span>
            </div>
            <span class="text-slate-100 max-w-[96px] truncate">@{{ currentUser?.username }}</span>
            <span
              v-if="isAdmin"
              class="hidden md:inline-block text-[9px] font-mono font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded"
            >
              ROOT
            </span>
            <span
              class="text-[9px] text-slate-400 transition-transform duration-200"
              :class="{ 'rotate-180 text-emerald-400': activeDropdown === 'user' }"
            >▼</span>
          </button>

          <Transition name="fade-slide">
            <div
              v-show="activeDropdown === 'user'"
              class="absolute right-0 mt-3 w-72 max-h-[calc(100vh-5.5rem)] overflow-y-auto bg-[#080e1e]/95 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-[0_24px_65px_rgba(0,0,0,0.95)] p-3 pb-10 flex flex-col gap-1 z-50"
            >
              <!-- HEADER UTENTE & STATO SENTINEL ZERO-TRUST -->
              <div class="px-2.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 mb-1 flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-white font-extrabold text-xs">@{{ currentUser?.username }}</span>
                  <span
                    class="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border"
                    :class="
                      isAdmin
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                    "
                  >
                    {{ isAdmin ? 'ROOT ADMIN' : 'VERIFIED DEV' }}
                  </span>
                </div>

                <!-- TELEMETRIA SENTINEL NETWORK NEL MENU UTENTE -->
                <div class="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-800/80">
                  <span class="text-violet-300 flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Sentinel Guard
                  </span>
                  <span class="text-emerald-400 font-bold">{{ sentinelStatus }} &bull; Pure SQL</span>
                </div>
              </div>

              <!-- AREA RISERVATA UTENTE VALIDATO -->
              <span class="px-2.5 pt-1 text-[9px] font-mono font-extrabold text-cyan-400 uppercase tracking-widest">
                Area Riservata
              </span>

              <NuxtLink :to="getMainUrl('/user/dashboard')" external class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-200 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors no-underline" @click="closeAllDropdowns">
                <span>📊</span>
                <span>Dashboard Personale</span>
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/user/dashboard?tab=profile')" external class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-200 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors no-underline" @click="closeAllDropdowns">
                <span>⚙️</span>
                <span>Impostazioni Account</span>
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/user/dashboard?tab=content')" external class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-200 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors no-underline" @click="closeAllDropdowns">
                <span>📰</span>
                <span>I Miei Contenuti</span>
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/user/dashboard?tab=vault')" external class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-emerald-300 hover:bg-emerald-500/10 transition-colors no-underline" @click="closeAllDropdowns">
                <span>🔐</span>
                <span>I Miei Certificati Vault</span>
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/user/ads')" external class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-200 hover:text-amber-300 hover:bg-amber-500/10 transition-colors no-underline" @click="closeAllDropdowns">
                <span>📢</span>
                <span>Gestione Ads</span>
                <span class="ml-auto text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/35 px-1.5 py-0.5 rounded">PRO</span>
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/bounties')" external class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-200 hover:text-violet-300 hover:bg-violet-500/10 transition-colors no-underline" @click="closeAllDropdowns">
                <span>🎯</span>
                <span>Bounty Board &amp; $PULSE</span>
                <span class="ml-auto text-[9px] font-mono font-bold bg-violet-500/15 text-violet-300 border border-violet-500/35 px-1.5 py-0.5 rounded">NEW</span>
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/user/dashboard?tab=api')" external class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-cyan-300 hover:bg-cyan-500/10 transition-colors no-underline" @click="closeAllDropdowns">
                <span>🔑</span>
                <span>DKP API Console</span>
              </NuxtLink>

              <NuxtLink :to="getApiUrl('/api-console')" external class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-cyan-300 hover:bg-cyan-500/10 transition-colors no-underline" @click="closeAllDropdowns">
                <span>⚡</span>
                <span>Consumo delle API</span>
              </NuxtLink>

              <NuxtLink :to="getMainUrl(`/user/${currentUser?.username || 'alexdpl'}`)" external class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors no-underline" @click="closeAllDropdowns">
                <span>🌐</span>
                <span>Vedi Profilo Pubblico</span>
              </NuxtLink>

              <!-- SEZIONE ADMIN & SENTINELLE (SOLO ADMIN VALIDATI) -->
              <template v-if="isAdmin">
                <div class="my-1.5 p-2.5 rounded-xl bg-amber-500/[0.07] border border-amber-500/35 flex flex-col gap-1">
                  <span class="text-[9px] font-mono font-extrabold text-amber-400 uppercase tracking-wider px-1">
                    👑 AMMINISTRAZIONE &amp; SENTINELLE
                  </span>
                  <NuxtLink
                    :to="getMainUrl('/admin')"
                    external
                    class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-amber-200 font-bold hover:bg-amber-500/15 transition-colors no-underline"
                    @click="closeAllDropdowns"
                  >
                    <span>🔒</span>
                    <span>Control Center Admin</span>
                  </NuxtLink>
                  <NuxtLink
                    :to="getMainUrl('/admin/sentinels')"
                    external
                    class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-violet-300 font-bold hover:bg-violet-500/15 transition-colors no-underline"
                    @click="closeAllDropdowns"
                  >
                    <span>🛡️</span>
                    <span>Sentinel Network Console</span>
                  </NuxtLink>
                  <NuxtLink
                    :to="getMainUrl('/admin/nodes')"
                    external
                    class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-cyan-300 font-bold hover:bg-cyan-500/15 transition-colors no-underline"
                    @click="closeAllDropdowns"
                  >
                    <span>🌳</span>
                    <span>Albero 10 Macro-Nodi</span>
                  </NuxtLink>
                  <NuxtLink
                    :to="getMainUrl('/admin/diagnostic')"
                    external
                    class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-emerald-300 font-bold hover:bg-emerald-500/15 transition-colors no-underline"
                    @click="closeAllDropdowns"
                  >
                    <span>🩺</span>
                    <span>DKP Doctor (Pure SQL)</span>
                  </NuxtLink>
                </div>
              </template>

              <div class="h-px bg-slate-800 my-1"></div>

              <button
                type="button"
                @click="handleLogout"
                class="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-colors w-full text-left font-extrabold cursor-pointer"
              >
                <span>🚪</span>
                <span>Disconnetti</span>
              </button>
            </div>
          </Transition>
        </div>

        <!-- HAMBURGER BUTTON MOBILE -->
        <button
          type="button"
          aria-label="Apri menu navigazione"
          :aria-expanded="isMobileMenuOpen"
          @click="toggleMobileMenu"
          class="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-[#091022] border border-cyan-500/35 hover:border-emerald-400 text-slate-200 transition-colors cursor-pointer"
        >
          <span v-if="!isMobileMenuOpen" class="text-lg">☰</span>
          <span v-else class="text-base text-emerald-400 font-bold">✕</span>
        </button>
      </div>
    </div>

    <!-- DRAWER MENU MOBILE -->
    <Transition name="fade-slide">
      <div
        v-show="isMobileMenuOpen"
        class="lg:hidden mt-3 pt-4 pb-6 border-t border-slate-800 flex flex-col gap-4 max-h-[82vh] overflow-y-auto"
      >
        <!-- AZIONI RAPIDE MOBILE -->
        <div class="flex flex-wrap items-center justify-between gap-2 px-1">
          <NuxtLink
            :to="getMainUrl('/submit')"
            external
            class="flex-1 text-center py-2.5 bg-emerald-500 text-[#020617] font-extrabold text-xs rounded-xl no-underline"
            @click="closeAllDropdowns"
          >
            ⚡ {{ t('submit') }}
          </NuxtLink>

          <div class="flex flex-wrap items-center gap-1 bg-[#091022] border border-slate-800 p-1 rounded-xl">
            <button
              v-for="lang in languages"
              :key="lang.code"
              type="button"
              @click="selectLang(lang.code)"
              class="px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer"
              :class="currentLang === lang.code ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'"
            >
              {{ lang.flag }} {{ lang.code }}
            </button>
          </div>
        </div>

        <!-- NEWS & HUB MOBILE -->
        <div class="flex flex-col gap-1.5">
          <span class="text-[10px] font-mono font-extrabold text-cyan-400 uppercase tracking-wider px-1">
            🌐 News &amp; Community Hub
          </span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <NuxtLink
              v-for="item in newsCategories"
              :key="item.route"
              :to="getMainUrl(item.route)"
              external
              class="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#091022] border border-slate-800 text-xs text-slate-200 font-bold no-underline"
              @click="closeAllDropdowns"
            >
              <span>{{ item.icon }}</span>
              <span>{{ item.name }}</span>
            </NuxtLink>
          </div>
        </div>

        <!-- DKP TOOLS MOBILE -->
        <div class="flex flex-col gap-1.5">
          <span class="text-[10px] font-mono font-extrabold text-emerald-400 uppercase tracking-wider px-1">
            🛠️ DKP Tools Suite v2.6
          </span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <NuxtLink
              v-for="tool in dkpTools"
              :key="tool.route"
              :to="getMainUrl(tool.route)"
              external
              class="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#091022] border border-slate-800 text-xs text-slate-200 font-bold no-underline"
              @click="closeAllDropdowns"
            >
              <span>{{ tool.icon }}</span>
              <span>{{ tool.name }}</span>
            </NuxtLink>
          </div>
        </div>

        <!-- API & DOCS MOBILE -->
        <div class="flex flex-col gap-1.5">
          <span class="text-[10px] font-mono font-extrabold text-violet-400 uppercase tracking-wider px-1">
            🔌 DKP API &amp; Docs
          </span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <NuxtLink
              v-for="apiItem in apiLinks"
              :key="apiItem.route"
              :to="getMainUrl(apiItem.route)"
              external
              class="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#091022] border border-slate-800 text-xs text-cyan-300 font-bold no-underline"
              @click="closeAllDropdowns"
            >
              <span>{{ apiItem.icon }}</span>
              <span>{{ apiItem.name }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.16s ease-out;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>