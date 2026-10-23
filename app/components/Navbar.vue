<!-- app/components/Navbar.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const { currentUser, isAuthenticated, logout, openAuthModal } = useAuthCore()
const { currentLang, activeLanguageObj, languages, setLanguage, initTranslator, t } = useDkpTranslator()

const router = useRouter()
const route = useRoute()
const { getMainUrl, getMailUrl, getApiUrl } = useDomain()

const navbarRef = ref<HTMLElement | null>(null)
const activeDropdown = ref<string | null>(null)
const isMobileMenuOpen = ref(false)

// 🚀 FASE 3: Reattività Gamification in Navbar
const globalXp = ref(0)
const globalLevel = ref(1)
const isXpAnimating = ref(false)

function toggleDropdown(name: string) {
  activeDropdown.value = activeDropdown.value === name ? null : name
}

function closeAllDropdowns() {
  activeDropdown.value = null
  isMobileMenuOpen.value = false
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

// 🚀 FASE 3: Funzione di ricarica XP
const refreshXpData = async () => {
  if (!isAuthenticated.value && !currentUser.value?.id) return
  try {
    const res: any = await $fetch('/api/user/xp/sync')
    if (res && res.success) {
      if (res.data.totalXp > globalXp.value && globalXp.value > 0) {
        isXpAnimating.value = true
        playXpSound()
        setTimeout(() => { isXpAnimating.value = false }, 1500)
      }
      globalXp.value = res.data.totalXp
      globalLevel.value = res.data.level
    }
  } catch (e) {
    console.warn('Errore sync XP Navbar:', e)
  }
}

const playXpSound = () => {
  try {
    const audio = new Audio('/sounds/coin-up.mp3')
    audio.volume = 0.3
    audio.play().catch(() => {})
  } catch (e) {}
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  if (typeof initTranslator === 'function') initTranslator()
  
  if (isAuthenticated.value || currentUser.value?.id) {
    refreshXpData()
  }

  window.addEventListener('dkp:xp_updated', refreshXpData)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('dkp:xp_updated', refreshXpData)
})

watch(isAuthenticated, (newVal) => {
  if (newVal) refreshXpData()
})

// 🟢 CATEGORIE E FEED CORRETTI CON ROTTE UNIFICATE v2.5-GOLD
const newsCategories = [
  { name: 'Global Tech Feed', description: 'Ultime notizie dal Web (Crawler)', icon: '🌍', route: '/' },
  { name: 'Blog Vault & Guide', description: 'Articoli e approfondimenti editoriali', icon: '📚', route: '/newest' },
  { name: 'Ask DKP', description: 'Domande, supporto e discussioni', icon: '💬', route: '/ask' },
  { name: 'Show DKP', description: 'Showcase progetti della community', icon: '🚀', route: '/show' },
  { name: 'Tech Jobs Hub', description: 'Offerte di lavoro per sviluppatori', icon: '💼', route: '/jobs' }
]

const dkpTools = [
  { name: 'AI Repository v2.5', description: 'Analizza repository GitHub', icon: '🤖', route: '/tools/ai-repo-scanner' },
  { name: 'Neural Playground v2.5', description: 'Testing Prompt e Modelli IA', icon: '🧠', route: '/tools/neural-playground' },
  { name: 'Terminal Web Shell v2.5', description: 'Shell CLI In-Browser e SDK', icon: '💻', route: '/tools/terminal' },
  { name: 'AI Code Scanner v2.5', description: 'Audit & Analisi Vulnerabilità IA', icon: '🔍', route: '/tools/ai-scanner' },
  { name: 'Proof of Code (Vault) v2.5', description: 'Notarizzazione e Hash Crittografico', icon: '🛡️', route: '/tools/proof-of-code' },
  { name: 'DKP CLI Toolkit v2.5', description: 'CLI Nativi per Devs & Terminal', icon: '⚡', route: '/tools/cli-toolkit' }
]

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
  <header ref="navbarRef" class="bg-[#020420] border-b-2 border-emerald-500 sticky top-0 z-50 px-6 py-2.5 shadow-[0_4px_20px_rgba(0,220,130,0.08)] font-sans">
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
      
      <!-- BRAND LOGO DKP v2.5-GOLD -->
      <div class="flex items-center gap-2.5">
        <NuxtLink :to="getMainUrl('/')" external class="flex items-center gap-2.5 group text-white font-extrabold text-xl tracking-tight no-underline">
          <img 
            :src="'/dkp-logo.svg'" 
            alt="DevKernelPulse v2.5 Gold" 
            class="w-8 h-8 object-contain rounded-lg shadow-[0_0_12px_rgba(0,220,130,0.35)] group-hover:scale-105 transition-all duration-200"
          />
          <span>DevKernel<span class="text-emerald-400">Pulse</span></span>
        </NuxtLink>
        <span class="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">v2.5</span>
      </div>

      <!-- NAVIGAZIONE PRINCIPALE DESKTOP -->
      <nav class="hidden md:flex items-center gap-3 text-sm font-semibold">
        <!-- DROPDOWN NEWS -->
        <div class="relative">
          <button 
            @click="toggleDropdown('news')" 
            class="text-sky-400 hover:text-sky-300 font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors"
            :class="{ 'bg-sky-500/10 text-sky-300': activeDropdown === 'news' }"
          >
            ☁️ News <span class="text-[10px] text-slate-500 transition-transform duration-200" :class="{ 'rotate-180 text-emerald-400': activeDropdown === 'news' }">▼</span>
          </button>
          
          <Transition name="fade-slide">
            <div v-show="activeDropdown === 'news'" class="absolute left-0 mt-2 w-64 bg-[#090d16] border border-slate-800 rounded-xl shadow-2xl p-2 flex flex-col gap-1 z-50">
              <NuxtLink 
                v-for="item in newsCategories" 
                :key="item.route" 
                :to="getMainUrl(item.route)" 
                external
                class="flex items-start gap-3 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all no-underline"
                @click="closeAllDropdowns"
              >
                <span class="text-base mt-0.5">{{ item.icon }}</span>
                <div class="flex flex-col">
                  <strong class="text-xs text-slate-100 font-bold">{{ item.name }}</strong>
                  <small class="text-[10px] text-slate-500 leading-tight">{{ item.description }}</small>
                </div>
              </NuxtLink>
            </div>
          </Transition>
        </div>

        <!-- DROPDOWN TOOLS -->
        <div class="relative">
          <button 
            @click="toggleDropdown('tools')" 
            class="text-sky-400 hover:text-sky-300 font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors"
            :class="{ 'bg-sky-500/10 text-sky-300': activeDropdown === 'tools' }"
          >
            🛠️ {{ t('tools') }} <span class="text-[10px] text-slate-500 transition-transform duration-200" :class="{ 'rotate-180 text-emerald-400': activeDropdown === 'tools' }">▼</span>
          </button>
          
          <Transition name="fade-slide">
            <div v-show="activeDropdown === 'tools'" class="absolute left-0 mt-2 w-72 bg-[#090d16] border border-slate-800 rounded-xl shadow-2xl p-2 flex flex-col gap-1 z-50">
              <NuxtLink 
                v-for="tool in dkpTools" 
                :key="tool.route" 
                :to="getMainUrl(tool.route)" 
                external
                class="flex items-start gap-3 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all no-underline"
                @click="closeAllDropdowns"
              >
                <span class="text-base mt-0.5">{{ tool.icon }}</span>
                <div class="flex flex-col">
                  <strong class="text-xs text-slate-100 font-bold">{{ tool.name }}</strong>
                  <small class="text-[10px] text-slate-500 leading-tight">{{ tool.description }}</small>
                </div>
              </NuxtLink>
            </div>
          </Transition>
        </div>

        <!-- DROPDOWN API -->
        <div class="relative">
          <button 
            @click="toggleDropdown('api')" 
            class="text-sky-400 hover:text-sky-300 font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors"
            :class="{ 'bg-sky-500/10 text-sky-300': activeDropdown === 'api' }"
          >
            🔌 DKP API <span class="text-[10px] text-slate-500 transition-transform duration-200" :class="{ 'rotate-180 text-emerald-400': activeDropdown === 'api' }">▼</span>
          </button>
          
          <Transition name="fade-slide">
            <div v-show="activeDropdown === 'api'" class="absolute left-0 mt-2 w-64 bg-[#090d16] border border-slate-800 rounded-xl shadow-2xl p-2 flex flex-col gap-1 z-50">
              <NuxtLink 
                :to="getMainUrl('/user/dashboard?tab=api')" 
                external
                class="flex items-start gap-3 p-2 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-slate-800/50 transition-all no-underline"
                @click="closeAllDropdowns"
              >
                <span class="text-base mt-0.5">🔑</span>
                <div class="flex flex-col">
                  <strong class="text-xs font-bold">DKP API Console</strong>
                  <small class="text-[10px] text-slate-500 leading-tight">Gestione Key, Metriche e Consumi API</small>
                </div>
              </NuxtLink>
            </div>
          </Transition>
        </div>

        <span class="text-slate-700">/</span>
        <NuxtLink :to="getMainUrl('/submit')" external class="text-emerald-400 hover:text-emerald-300 font-bold no-underline transition-colors">{{ t('submit') }}</NuxtLink>
        <span class="text-slate-700">/</span>
      </nav>

      <!-- SEZIONE DESTRA DROPDOWN UTENTE & LINGUA -->
      <div class="hidden md:flex items-center gap-3">
        
        <!-- 🚀 FASE 3: BADGE GAMIFICATION (Sempre visibile se loggato) -->
        <div 
          v-if="isAuthenticated || currentUser?.id"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-300 cursor-default"
          :class="isXpAnimating ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-110' : 'bg-[#090d16] border-slate-700 hover:border-amber-500/50'"
          title="Punteggio DKP Gamification"
        >
          <span class="text-amber-400 text-sm">⚡</span>
          <span class="font-black font-mono text-white text-xs">{{ globalXp }}</span>
          <span class="text-[9px] text-amber-500/80 font-bold uppercase ml-0.5 mt-0.5">Lv.{{ globalLevel }}</span>
        </div>

        <!-- LINGUA -->
        <div class="relative">
          <button 
            @click="toggleDropdown('lang')" 
            class="bg-[#090d16] border border-slate-800 text-slate-300 hover:border-slate-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            🌐 {{ activeLanguageObj.flag }} {{ activeLanguageObj.code }} <span class="text-[9px] text-slate-500 transition-transform duration-200" :class="{ 'rotate-180 text-emerald-400': activeDropdown === 'lang' }">▼</span>
          </button>

          <Transition name="fade-slide">
            <div v-show="activeDropdown === 'lang'" class="absolute right-0 mt-2 w-44 bg-[#090d16] border border-slate-800 rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5 z-50">
              <button 
                v-for="lang in languages" 
                :key="lang.code" 
                @click="selectLang(lang.code)" 
                class="flex items-center gap-2 p-2 rounded-lg text-xs text-left font-semibold text-slate-300 hover:bg-slate-800 transition-colors w-full"
                :class="{ 'text-emerald-400 bg-emerald-500/10 font-bold': currentLang === lang.code }"
              >
                <span>{{ lang.flag }}</span> {{ lang.code }} - {{ lang.label }}
              </button>
            </div>
          </Transition>
        </div>

        <!-- AUTH BUTTON / USER PILL -->
        <button v-if="!isAuthenticated && !currentUser?.id" @click="handleLogin" class="bg-emerald-500 hover:bg-emerald-400 text-[#020420] font-extrabold text-xs px-4 py-1.5 rounded-lg transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]">
          {{ t('login') }}
        </button>

        <div v-else class="relative">
          <button 
            @click="toggleDropdown('user')" 
            class="flex items-center gap-2 bg-[#090d16] border border-slate-800 hover:border-emerald-500/50 px-3 py-1 rounded-full text-white text-xs font-bold transition-all"
          >
            <div class="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] font-extrabold overflow-hidden">
              <img v-if="currentUser?.avatar" :src="currentUser.avatar" alt="Avatar" class="w-full h-full object-cover" />
              <span v-else>{{ currentUser?.username?.charAt(0).toUpperCase() || 'U' }}</span>
            </div>
            <span class="text-slate-200">@{{ currentUser?.username }}</span>
            <span class="text-[9px] text-slate-500 transition-transform duration-200" :class="{ 'rotate-180 text-emerald-400': activeDropdown === 'user' }">▼</span>
          </button>

          <Transition name="fade-slide">
            <div v-show="activeDropdown === 'user'" class="absolute right-0 mt-2 w-60 bg-[#090d16] border border-slate-800 rounded-xl shadow-2xl p-2 flex flex-col gap-1 z-50">
              <div class="px-2 py-1.5 flex flex-col border-b border-slate-800 mb-1">
                <span class="text-white font-bold text-xs">@{{ currentUser?.username }}</span>
                <span class="text-[10px] font-semibold" :class="isAdmin ? 'text-emerald-400' : 'text-sky-400'">
                  {{ isAdmin ? '🛡️ Administrator' : '🌱 VIP Developer' }}
                </span>
              </div>

              <NuxtLink :to="getMainUrl('/user/dashboard')" external class="flex items-center gap-2 p-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition-colors no-underline" @click="closeAllDropdowns">
                <span>📊</span> Dashboard Personale
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/user/dashboard?tab=profile')" external class="flex items-center gap-2 p-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition-colors no-underline" @click="closeAllDropdowns">
                <span>⚙️</span> Impostazioni Account
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/user/dashboard?tab=content')" external class="flex items-center gap-2 p-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition-colors no-underline" @click="closeAllDropdowns">
                <span>📰</span> I Miei Contenuti
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/user/dashboard?tab=vault')" external class="flex items-center gap-2 p-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition-colors no-underline" @click="closeAllDropdowns">
                <span>🛡️</span> I Miei Certificati Vault
              </NuxtLink>
			  
			  <NuxtLink :to="getMainUrl('/user/ads')" external class="flex items-center gap-2 p-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition-colors no-underline" @click="closeAllDropdowns">
			  <span>📢</span>Gestione Ads<span class="ml-auto text-[0.65rem] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">PRO</span>
              </NuxtLink>
			  
              <NuxtLink :to="getMainUrl('/bounties')" external class="flex items-center gap-2 p-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition-colors no-underline" @click="closeAllDropdowns">
                <span>🎯</span> Bounty Board & $PULSE<span class="ml-auto text-[0.65rem] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">NEW</span>
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/user/dashboard?tab=api')" external class="flex items-center gap-2 p-1.5 rounded-lg text-xs text-sky-400 hover:bg-slate-800 transition-colors no-underline" @click="closeAllDropdowns">
                <span>🔑</span> DKP API Console
              </NuxtLink>
              
              <NuxtLink :to="getApiUrl('/api-console')" external class="flex items-center gap-2 p-1.5 rounded-lg text-xs text-sky-400 hover:bg-slate-800 transition-colors no-underline" @click="closeAllDropdowns">
                <span>⚡</span> Consumo delle API
              </NuxtLink>

              <div class="h-px bg-slate-800 my-1"></div>

              <NuxtLink :to="getMainUrl(`/user/${currentUser?.username || 'alexdpl'}`)" external class="flex items-center gap-2 p-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition-colors no-underline" @click="closeAllDropdowns">
                <span>🌐</span> Vedi Profilo Pubblico
              </NuxtLink>

              <template v-if="isAdmin">
                <div class="h-px bg-slate-800 my-1"></div>
                <span class="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider px-1.5 pt-1">AMMINISTRAZIONE DKP</span>
                <NuxtLink :to="getMainUrl('/admin')" external class="flex items-center gap-2 p-1.5 rounded-lg text-xs text-emerald-400 font-bold hover:bg-slate-800 transition-colors no-underline" @click="closeAllDropdowns">
                  <span>🔒</span> Control Center Admin
                </NuxtLink>
                <NuxtLink :to="getMainUrl('/admin/diagnostic')" external class="flex items-center gap-2 p-1.5 rounded-lg text-xs text-emerald-400 font-bold hover:bg-slate-800 transition-colors no-underline" @click="closeAllDropdowns">
                  <span>🩺</span> DKP Doctor
                </NuxtLink>
              </template>

              <div class="h-px bg-slate-800 my-1"></div>

              <button @click="handleLogout" class="flex items-center gap-2 p-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors w-full text-left font-semibold">
                <span>🚪</span> Disconnetti
              </button>
            </div>
          </Transition>
        </div>
      </div>

    </div>
  </header>
</template>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.15s ease-out; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>