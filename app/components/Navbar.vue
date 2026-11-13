<!-- app/components/Navbar.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useDkpTheme } from '~/composables/useDkpTheme' // Iniezione del Theme Manager

const { currentUser, isAuthenticated, logout, openAuthModal } = useAuthCore()
const { currentLang, activeLanguageObj, languages, setLanguage, initTranslator, t } = useDkpTranslator()
const { currentTheme, toggleTheme } = useDkpTheme()

const router = useRouter()
const route = useRoute()
const { getMainUrl, getApiUrl } = useDomain()

const navbarRef = ref<HTMLElement | null>(null)
const activeDropdown = ref<string | null>(null)
const isMobileMenuOpen = ref(false)
const isXpMenuOpen = ref(false) // Stato per il widget XP espandibile

// Reattività Gamification in Navbar
const globalXp = ref(0)
const globalLevel = ref(1)
const isXpAnimating = ref(false)

function toggleDropdown(name: string) {
  activeDropdown.value = activeDropdown.value === name ? null : name
  if (activeDropdown.value) isXpMenuOpen.value = false
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

watch(() => route.fullPath, () => {
  closeAllDropdowns()
})

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

const playXpSound = () => {
  try {
    const audio = new Audio('/sounds/coin-up.mp3')
    audio.volume = 0.3
    audio.play().catch(() => {})
  } catch {}
}

// Sync XP dall'endpoint unificato Pure SQL
const refreshXpData = async () => {
  try {
    const res: any = await $fetch('/api/user/gamification')
    if (res?.success && res?.data) {
      const newXp = res.data.xp ?? 0
      if (newXp > globalXp.value && globalXp.value > 0) {
        isXpAnimating.value = true
        playXpSound()
        setTimeout(() => { isXpAnimating.value = false }, 1500)
      }
      globalXp.value = newXp
      globalLevel.value = res.data.level
        ? (typeof res.data.level === 'number' ? res.data.level : 2)
        : 1
    }
  } catch (e) {
    console.warn('Errore sync XP Navbar:', e)
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
  if (typeof initTranslator === 'function') initTranslator()

  if (isAuthenticated.value || currentUser.value?.id) {
    refreshXpData()
  }

  window.addEventListener('dkp:xp_updated', refreshXpData)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('dkp:xp_updated', refreshXpData)
})

watch(isAuthenticated, (newVal) => {
  if (newVal) refreshXpData()
})

// Categorie e Feed unificati v2.6-PURE-SQL
const newsCategories = [
  { name: 'Hacker News AI', description: 'Notizie HN analizzate da Trinity AI', icon: '🤖', route: '/news' },
  { name: 'Global Tech Feed', description: 'Ultime notizie dal Web (Crawler)', icon: '🌍', route: '/feed' },
  { name: 'Blog Vault & Guide', description: 'Ultimi articoli editoriali e guide', icon: '📚', route: '/newest' },
  { name: 'DKP Blog Editorial Hub', description: 'Approfondimenti tecnici curati', icon: '✍️', route: '/blog' },
  { name: 'Node Talks Hub', description: 'Discussioni e thread tecnici verticali', icon: '💬', route: '/nodes' },
  { name: 'Ask DKP', description: 'Domande, supporto e architettura', icon: '💭', route: '/ask' },
  { name: 'Show DKP', description: 'Showcase progetti della community', icon: '🚀', route: '/show' },
  { name: 'Tech Jobs Hub', description: 'Offerte di lavoro per sviluppatori', icon: '💼', route: '/jobs' }
]

const dkpTools = [
  { name: 'OpenUI Studio AI', description: 'Generatore interfacce e preview live', icon: '🎨', route: '/tools/openui-studio', badge: 'v2.6' },
  { name: 'AI Repo Scanner', description: 'Analizza repository GitHub con IA', icon: '🤖', route: '/tools/ai-repo-scanner' },
  { name: 'Terminal Web Shell', description: 'Shell CLI in-browser e comandi SDK', icon: '💻', route: '/tools/terminal' },
  { name: 'AI Code Scanner', description: 'Audit & analisi vulnerabilità SAST', icon: '🔍', route: '/tools/ai-scanner' },
  { name: 'Proof of Code (Vault)', description: 'Notarizzazione e hash SHA-256', icon: '🛡️', route: '/tools/proof-of-code' },
  { name: 'DKP CLI Toolkit', description: 'Automazione terminale e pipeline CI', icon: '⚡', route: '/tools/cli-toolkit' }
]

const apiLinks = [
  { name: 'DKP API Console', description: 'Gestione Key, metriche e consumi', icon: '🔑', route: '/user/dashboard?tab=api', highlight: true },
  { name: 'Documentazione API', description: 'Endpoint REST v2.6 & esempi cURL', icon: '📖', route: '/docs/api' },
  { name: 'SDK & Integrazione', description: 'Pacchetti TypeScript, Python & Go', icon: '⚙️', route: '/docs/sdk' },
  { name: 'API Status & Latency', description: 'Monitoraggio Pure SQL & Sentinel', icon: '🟢', route: '/status' }
]

// Visibile esclusivamente all'account Admin (alexdpl / role admin)
const isAdmin = computed(() => {
  if (!currentUser.value) return false
  const username = currentUser.value.username?.toLowerCase()
  const role = currentUser.value.role?.toLowerCase()
  return username === 'alexdpl' || role === 'admin'
})

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
  class="bg-[#020420]/95 backdrop-blur-xl border-b-2 border-emerald-500 sticky top-0 z-50 px-4 sm:px-6 py-2.5 shadow-[0_4px_24px_rgba(0,220,130,0.08)] font-sans"
>
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-3">
      
      <!-- BRAND LOGO DKP v2.6-PURE-SQL -->
      <div class="flex items-center gap-2.5 shrink-0">
        <NuxtLink
          :to="getMainUrl('/')"
          external
          class="flex items-center gap-2.5 group text-white font-black text-lg sm:text-xl tracking-tight no-underline"
        >
          <img
            src="/dkp-logo.svg"
            alt="DevKernelPulse v2.6 Pure SQL"
            class="w-8 h-8 object-contain rounded-lg shadow-[0_0_12px_rgba(0,220,130,0.35)] group-hover:scale-105 transition-transform duration-200"
          />
          <span>DevKernel<span class="text-emerald-400">Pulse</span></span>
        </NuxtLink>
        <span class="hidden sm:inline-block text-[10px] font-mono font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
          v2.6-PURE-SQL
        </span>
      </div>

      <!-- NAVIGAZIONE PRINCIPALE DESKTOP -->
      <nav aria-label="Menu Principale" class="hidden lg:flex items-center gap-1.5 text-sm font-semibold">
        
        <!-- DROPDOWN NEWS & HUB -->
        <div class="relative">
          <button
            type="button"
            :aria-expanded="activeDropdown === 'news'"
            @click="toggleDropdown('news')"
            class="text-sky-400 hover:text-sky-300 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            :class="{ 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30': activeDropdown === 'news' }"
          >
            <span>☁️</span>
            <span>News &amp; Hub</span>
            <span class="text-[10px] text-slate-500 transition-transform duration-200" :class="{ 'rotate-180 text-emerald-400': activeDropdown === 'news' }">▼</span>
          </button>

          <Transition name="fade-slide">
            <div
              v-show="activeDropdown === 'news'"
              class="absolute left-0 mt-2.5 w-80 bg-[#090d16] border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-2 flex flex-col gap-1 z-50"
            >
              <NuxtLink
                v-for="item in newsCategories"
                :key="item.route"
                :to="getMainUrl(item.route)"
                external
                class="flex items-start gap-3 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/70 transition-all no-underline group"
                @click="closeAllDropdowns"
              >
                <span class="text-base mt-0.5 group-hover:scale-110 transition-transform">{{ item.icon }}</span>
                <div class="flex flex-col">
                  <strong class="text-xs text-slate-100 font-bold group-hover:text-emerald-400 transition-colors">{{ item.name }}</strong>
                  <small class="text-[11px] text-slate-500 leading-tight">{{ item.description }}</small>
                </div>
              </NuxtLink>
            </div>
          </Transition>
        </div>

        <!-- DROPDOWN TOOLS v2.6 -->
        <div class="relative">
          <button
            type="button"
            :aria-expanded="activeDropdown === 'tools'"
            @click="toggleDropdown('tools')"
            class="text-sky-400 hover:text-sky-300 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            :class="{ 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30': activeDropdown === 'tools' }"
          >
            <span>🛠️</span>
            <span>{{ t('tools') }}</span>
            <span class="text-[10px] text-slate-500 transition-transform duration-200" :class="{ 'rotate-180 text-emerald-400': activeDropdown === 'tools' }">▼</span>
          </button>

          <Transition name="fade-slide">
            <div
              v-show="activeDropdown === 'tools'"
              class="absolute left-0 mt-2.5 w-80 bg-[#090d16] border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-2 flex flex-col gap-1 z-50"
            >
              <NuxtLink
                v-for="tool in dkpTools"
                :key="tool.route"
                :to="getMainUrl(tool.route)"
                external
                class="flex items-start gap-3 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/70 transition-all no-underline group"
                @click="closeAllDropdowns"
              >
                <span class="text-base mt-0.5 group-hover:scale-110 transition-transform">{{ tool.icon }}</span>
                <div class="flex flex-col flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <strong class="text-xs text-slate-100 font-bold group-hover:text-emerald-400 transition-colors">{{ tool.name }}</strong>
                    <span v-if="tool.badge" class="text-[9px] font-mono font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                      {{ tool.badge }}
                    </span>
                  </div>
                  <small class="text-[11px] text-slate-500 leading-tight">{{ tool.description }}</small>
                </div>
              </NuxtLink>

              <div class="h-px bg-slate-800 my-1"></div>
              <NuxtLink
                :to="getMainUrl('/tools')"
                external
                class="text-center py-1.5 text-[11px] font-mono font-bold text-emerald-400 hover:text-emerald-300 no-underline"
                @click="closeAllDropdowns"
              >
                Esplora tutta la Suite DKP Tools →
              </NuxtLink>
            </div>
          </Transition>
        </div>

        <!-- DROPDOWN API -->
        <div class="relative">
          <button
            type="button"
            :aria-expanded="activeDropdown === 'api'"
            @click="toggleDropdown('api')"
            class="text-sky-400 hover:text-sky-300 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            :class="{ 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30': activeDropdown === 'api' }"
          >
            <span>🔌</span>
            <span>DKP API</span>
            <span class="text-[10px] text-slate-500 transition-transform duration-200" :class="{ 'rotate-180 text-emerald-400': activeDropdown === 'api' }">▼</span>
          </button>

          <Transition name="fade-slide">
            <div
              v-show="activeDropdown === 'api'"
              class="absolute left-0 mt-2.5 w-72 bg-[#090d16] border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-2 flex flex-col gap-1 z-50"
            >
              <NuxtLink
                v-for="apiItem in apiLinks"
                :key="apiItem.route"
                :to="getMainUrl(apiItem.route)"
                external
                class="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/70 transition-all no-underline group"
                :class="apiItem.highlight ? 'text-sky-400 hover:text-sky-300' : 'text-slate-300 hover:text-white'"
                @click="closeAllDropdowns"
              >
                <span class="text-base mt-0.5">{{ apiItem.icon }}</span>
                <div class="flex flex-col">
                  <strong class="text-xs font-bold">{{ apiItem.name }}</strong>
                  <small class="text-[11px] text-slate-500 leading-tight">{{ apiItem.description }}</small>
                </div>
              </NuxtLink>
            </div>
          </Transition>
        </div>

        <span class="text-slate-800 select-none">|</span>

        <NuxtLink
          :to="getMainUrl('/submit')"
          external
          class="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg font-extrabold no-underline transition-all"
        >
          ⚡ {{ t('submit') }}
        </NuxtLink>
      </nav>

      <!-- SEZIONE DESTRA: GAMIFICATION, LINGUA, UTENTE / ADMIN & MOBILE TOGGLE -->
      <div class="flex items-center gap-2.5">
        
        <!-- WIDGET GAMIFICATION ESPANDIBILE CON THEME TOGGLE -->
        <div v-if="isAuthenticated || currentUser?.id" class="relative">
          <button
            @click="toggleXpMenu"
            type="button"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-300 cursor-pointer"
            :class="isXpAnimating
              ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105'
              : 'bg-[#090d16] border-slate-700 hover:border-amber-500/60'"
            title="Punteggio DKP Gamification & Opzioni"
          >
            <span class="text-amber-400 text-xs sm:text-sm">⚡</span>
            <span class="font-black font-mono text-white text-xs">{{ globalXp }}</span>
            <span class="hidden sm:inline text-[9px] text-amber-400 font-mono font-bold uppercase ml-0.5">Lv.{{ globalLevel }}</span>
            <span class="text-[9px] text-slate-500 transition-transform duration-200 ml-1" :class="{ 'rotate-180 text-amber-400': isXpMenuOpen }">▼</span>
          </button>

          <Transition name="fade-slide">
            <div
              v-show="isXpMenuOpen"
              class="absolute right-0 mt-2.5 w-64 bg-[#090d16] border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-3 flex flex-col gap-3 z-50 font-mono"
            >
              <!-- Info Livello -->
              <div class="flex flex-col gap-1.5 border-b border-slate-800 pb-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Level {{ globalLevel }}</span>
                  <span class="text-[10px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">VIP DEV</span>
                </div>
                <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <!-- Progress bar simulata o collegata a xp/xpNextLevel -->
                  <div class="h-full bg-amber-400 w-[65%] rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                </div>
                <NuxtLink :to="getMainUrl('/user/dashboard')" class="text-center text-[10px] text-emerald-400 hover:text-emerald-300 mt-1 uppercase tracking-widest font-black transition-colors" @click="closeAllDropdowns">
                  Vai alla Dashboard XP →
                </NuxtLink>
              </div>

              <!-- Switch Tema (The Shift) -->
              <div class="flex items-center justify-between bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/50">
                <div class="flex flex-col">
                  <span class="text-xs font-bold text-slate-200 font-sans">Reading Mode</span>
                  <span class="text-[10px] text-slate-500">{{ currentTheme === 'sepia' ? 'White Sepia' : 'Dark Cyberpunk' }}</span>
                </div>
                
                <button
                  @click="toggleTheme"
                  class="relative w-14 h-7 rounded-full transition-colors duration-300 border cursor-pointer shrink-0"
                  :class="currentTheme === 'sepia' ? 'bg-[#d4c4a8] border-[#b85c38]' : 'bg-[#020420] border-slate-700'"
                >
                  <div
                    class="absolute top-[2px] left-[2px] w-5 h-5 rounded-full transition-transform duration-300 flex items-center justify-center shadow-md"
                    :class="currentTheme === 'sepia' ? 'translate-x-7 bg-[#f4ecd8]' : 'translate-x-0 bg-slate-800'"
                  >
                    <span v-if="currentTheme === 'sepia'" class="text-[12px] leading-none">📜</span>
                    <span v-else class="text-[12px] leading-none text-sky-400">⚡</span>
                  </div>
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- SELETTORE LINGUA (Desktop) -->
        <div class="relative hidden sm:block">
          <button
            type="button"
            :aria-expanded="activeDropdown === 'lang'"
            @click="toggleDropdown('lang')"
            class="bg-[#090d16] border border-slate-800 text-slate-300 hover:border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>{{ activeLanguageObj.flag }}</span>
            <span class="font-mono">{{ activeLanguageObj.code }}</span>
            <span class="text-[9px] text-slate-500 transition-transform duration-200" :class="{ 'rotate-180 text-emerald-400': activeDropdown === 'lang' }">▼</span>
          </button>

          <Transition name="fade-slide">
            <div
              v-show="activeDropdown === 'lang'"
              class="absolute right-0 mt-2.5 w-44 bg-[#090d16] border border-slate-800 rounded-2xl shadow-2xl p-1.5 flex flex-col gap-0.5 z-50"
            >
              <button
                v-for="lang in languages"
                :key="lang.code"
                type="button"
                @click="selectLang(lang.code)"
                class="flex items-center gap-2 p-2 rounded-xl text-xs text-left font-semibold text-slate-300 hover:bg-slate-800 transition-colors w-full cursor-pointer"
                :class="{ 'text-emerald-400 bg-emerald-500/10 font-bold': currentLang === lang.code }"
              >
                <span>{{ lang.flag }}</span>
                <span>{{ lang.code }} — {{ lang.label }}</span>
              </button>
            </div>
          </Transition>
        </div>

        <!-- AUTH BUTTON / USER & ADMIN DROPDOWN -->
        <button
          v-if="!isAuthenticated && !currentUser?.id"
          type="button"
          @click="handleLogin"
          class="bg-emerald-500 hover:bg-emerald-400 text-[#020420] font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
        >
          {{ t('login') }}
        </button>

        <div v-else class="relative">
          <button
            type="button"
            :aria-expanded="activeDropdown === 'user'"
            @click="toggleDropdown('user')"
            class="flex items-center gap-2 bg-[#090d16] border px-2.5 sm:px-3 py-1.5 rounded-full text-white text-xs font-bold transition-all cursor-pointer"
            :class="isAdmin
              ? 'border-emerald-500/50 hover:border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
              : 'border-slate-800 hover:border-sky-500/50'"
          >
            <div class="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] font-extrabold overflow-hidden shrink-0">
              <img v-if="currentUser?.avatar" :src="currentUser.avatar" alt="Avatar" class="w-full h-full object-cover" />
              <span v-else>{{ currentUser?.username?.charAt(0).toUpperCase() || 'U' }}</span>
            </div>
            <span class="text-slate-100 max-w-[100px] truncate">@{{ currentUser?.username }}</span>
            <span v-if="isAdmin" class="hidden md:inline-block text-[9px] font-mono font-extrabold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded">
              ROOT
            </span>
            <span class="text-[9px] text-slate-500 transition-transform duration-200" :class="{ 'rotate-180 text-emerald-400': activeDropdown === 'user' }">▼</span>
          </button>

          <Transition name="fade-slide">
            <div
              v-show="activeDropdown === 'user'"
              class="absolute right-0 mt-2.5 w-64 bg-[#090d16] border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-2 flex flex-col gap-0.5 z-50"
            >
              <!-- HEADER UTENTE -->
              <div class="px-2.5 py-2 flex flex-col border-b border-slate-800 mb-1">
                <span class="text-white font-extrabold text-xs">@{{ currentUser?.username }}</span>
                <span class="text-[10px] font-mono font-bold mt-0.5" :class="isAdmin ? 'text-emerald-400' : 'text-sky-400'">
                  {{ isAdmin ? '🛡️ Kernel Root Administrator' : '🌱 VIP Developer Member' }}
                </span>
              </div>

              <!-- DASHBOARD UTENTE -->
              <NuxtLink :to="getMainUrl('/user/dashboard')" external class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors no-underline" @click="closeAllDropdowns">
                <span>📊</span>
                <span>Dashboard Personale</span>
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/user/dashboard?tab=profile')" external class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors no-underline" @click="closeAllDropdowns">
                <span>⚙️</span>
                <span>Impostazioni Account</span>
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/user/dashboard?tab=content')" external class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors no-underline" @click="closeAllDropdowns">
                <span>📰</span>
                <span>I Miei Contenuti</span>
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/user/dashboard?tab=vault')" external class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors no-underline" @click="closeAllDropdowns">
                <span>🛡️</span>
                <span>I Miei Certificati Vault</span>
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/user/ads')" external class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors no-underline" @click="closeAllDropdowns">
                <span>📢</span>
                <span>Gestione Ads</span>
                <span class="ml-auto text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">PRO</span>
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/bounties')" external class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors no-underline" @click="closeAllDropdowns">
                <span>🎯</span>
                <span>Bounty Board &amp; $PULSE</span>
                <span class="ml-auto text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded">NEW</span>
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/user/dashboard?tab=api')" external class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-sky-400 hover:text-sky-300 hover:bg-slate-800/80 transition-colors no-underline" @click="closeAllDropdowns">
                <span>🔑</span>
                <span>DKP API Console</span>
              </NuxtLink>

              <NuxtLink :to="getApiUrl('/api-console')" external class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-sky-400 hover:text-sky-300 hover:bg-slate-800/80 transition-colors no-underline" @click="closeAllDropdowns">
                <span>⚡</span>
                <span>Consumo delle API</span>
              </NuxtLink>

              <div class="h-px bg-slate-800 my-1"></div>

              <NuxtLink :to="getMainUrl(`/user/${currentUser?.username || 'alexdpl'}`)" external class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors no-underline" @click="closeAllDropdowns">
                <span>🌐</span>
                <span>Vedi Profilo Pubblico</span>
              </NuxtLink>

              <!-- SEZIONE ADMIN ESCLUSIVA (Visibile solo ad alexdpl / admin) -->
              <template v-if="isAdmin">
                <div class="my-1.5 p-2 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/30 flex flex-col gap-1">
                  <span class="text-[9px] font-mono font-extrabold text-emerald-400 uppercase tracking-wider px-1">
                    🛡️ AMMINISTRAZIONE DKP v2.6
                  </span>
                  <NuxtLink
                    :to="getMainUrl('/admin')"
                    external
                    class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-emerald-300 font-bold hover:bg-emerald-500/15 transition-colors no-underline"
                    @click="closeAllDropdowns"
                  >
                    <span>🔒</span>
                    <span>Control Center Admin</span>
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
                class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/15 transition-colors w-full text-left font-bold cursor-pointer"
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
          class="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-[#090d16] border border-slate-800 hover:border-emerald-500/50 text-slate-200 transition-colors cursor-pointer"
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
        class="lg:hidden mt-3 pt-4 pb-3 border-t border-slate-800 flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
      >
        <!-- AZIONI RAPIDE MOBILE -->
        <div class="flex items-center justify-between gap-2 px-1">
          <NuxtLink
            :to="getMainUrl('/submit')"
            external
            class="flex-1 text-center py-2.5 bg-emerald-500 text-[#020420] font-extrabold text-xs rounded-xl no-underline"
            @click="closeAllDropdowns"
          >
            ⚡ {{ t('submit') }}
          </NuxtLink>

          <div class="flex items-center gap-1 bg-[#090d16] border border-slate-800 p-1 rounded-xl">
            <button
              v-for="lang in languages"
              :key="lang.code"
              type="button"
              @click="selectLang(lang.code)"
              class="px-2 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer"
              :class="currentLang === lang.code ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'"
            >
              {{ lang.flag }} {{ lang.code }}
            </button>
          </div>
        </div>

        <!-- NEWS & HUB MOBILE -->
        <div class="flex flex-col gap-1.5">
          <span class="text-[10px] font-mono font-extrabold text-sky-400 uppercase tracking-wider px-1">☁️ News &amp; Community Hub</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <NuxtLink
              v-for="item in newsCategories"
              :key="item.route"
              :to="getMainUrl(item.route)"
              external
              class="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#090d16] border border-slate-800/80 text-xs text-slate-200 font-bold no-underline"
              @click="closeAllDropdowns"
            >
              <span>{{ item.icon }}</span>
              <span>{{ item.name }}</span>
            </NuxtLink>
          </div>
        </div>

        <!-- DKP TOOLS MOBILE -->
        <div class="flex flex-col gap-1.5">
          <span class="text-[10px] font-mono font-extrabold text-emerald-400 uppercase tracking-wider px-1">🛠️ DKP Tools Suite v2.6</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <NuxtLink
              v-for="tool in dkpTools"
              :key="tool.route"
              :to="getMainUrl(tool.route)"
              external
              class="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#090d16] border border-slate-800/80 text-xs text-slate-200 font-bold no-underline"
              @click="closeAllDropdowns"
            >
              <span>{{ tool.icon }}</span>
              <span>{{ tool.name }}</span>
            </NuxtLink>
          </div>
        </div>

        <!-- API & DOCS MOBILE -->
        <div class="flex flex-col gap-1.5">
          <span class="text-[10px] font-mono font-extrabold text-purple-400 uppercase tracking-wider px-1">🔌 DKP API &amp; Docs</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <NuxtLink
              v-for="apiItem in apiLinks"
              :key="apiItem.route"
              :to="getMainUrl(apiItem.route)"
              external
              class="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#090d16] border border-slate-800/80 text-xs text-sky-400 font-bold no-underline"
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