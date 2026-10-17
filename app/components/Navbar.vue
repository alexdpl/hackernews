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

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  if (typeof initTranslator === 'function') {
    initTranslator()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 🟢 CATEGORIE E FEED CON L'AGGIUNTA DEL BLOG EDITORIALE
const newsCategories = [
  { name: 'News Feed', description: 'Ultimi aggiornamenti tech & ecosistema', icon: '📰', route: '/news' },
  { name: 'Ask DKP', description: 'Domande, supporto e discussioni', icon: '💬', route: '/ask' },
  { name: 'Show DKP', description: 'Showcase progetti della community', icon: '🚀', route: '/show' },
  { name: 'Tech Jobs Hub', description: 'Offerte di lavoro per sviluppatori', icon: '💼', route: '/jobs' }, // 👈 Aggiunta la virgola mancante qui!
  { name: 'Blog Editorial Hub', description: 'Articoli e guide della community', icon: '✍️', route: '/blog' }
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
        <button v-if="!isAuthenticated" @click="handleLogin" class="bg-emerald-500 hover:bg-emerald-400 text-[#020420] font-extrabold text-xs px-4 py-1.5 rounded-lg transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]">
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
			  
			  <NuxtLink :to="getMainUrl('/bounties')" external class="flex items-center gap-2 p-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition-colors no-underline" @click="closeAllDropdowns">
                <span>🎯</span> Bounty Board & $PULSE
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
.navbar-wrapper {
  background: #020420;
  border-bottom: 2px solid #00dc82;
  position: sticky;
  top: 0;
  z-index: 1000;
  padding: 0.6rem 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 220, 130, 0.08);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.navbar-inner { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.brand-section { display: flex; align-items: center; gap: 0.6rem; }
.brand-link { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; color: #ffffff; font-weight: 800; font-size: 1.15rem; }
.dk-badge { background: #00dc82; color: #020420; font-size: 0.85rem; font-weight: 900; padding: 0.15rem 0.45rem; border-radius: 4px; }
.brand-name { letter-spacing: -0.3px; }
.pulse-highlight { color: #00dc82; }
.version-tag { font-size: 0.65rem; font-weight: 800; color: #00dc82; background: rgba(0, 220, 130, 0.1); border: 1px solid rgba(0, 220, 130, 0.3); padding: 0.15rem 0.4rem; border-radius: 4px; }
.nav-links { display: flex; align-items: center; gap: 0.6rem; font-size: 0.92rem; font-weight: 600; }
.submit-highlight { color: #00dc82 !important; font-weight: 700; text-decoration: none; }
.slash { color: #334155; font-weight: 400; }
.dropdown-wrapper { position: relative; display: inline-block; }
.tools-btn { background: transparent; border: none; color: #38bdf8; font-weight: 700; font-size: 0.9rem; cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 6px; display: flex; align-items: center; gap: 0.35rem; }
.tools-btn:hover, .tools-btn.active { color: #7dd3fc; background: rgba(56, 189, 248, 0.12); }
.arrow { font-size: 0.65rem; transition: transform 0.2s ease; color: #64748b; }
.arrow.rotated { transform: rotate(180deg); color: #00dc82; }
.right-actions { display: flex; align-items: center; gap: 1rem; }
.lang-btn { background: #090d16; border: 1px solid #1e293b; color: #cbd5e1; padding: 0.35rem 0.7rem; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; }
.btn-accedi { background: #00dc82; color: #020420; font-weight: 800; font-size: 0.85rem; border: none; padding: 0.45rem 1.1rem; border-radius: 6px; cursor: pointer; }
.user-pill-btn { display: flex; align-items: center; gap: 0.55rem; background: #090d16; border: 1px solid #1e293b; padding: 0.3rem 0.75rem; border-radius: 9999px; color: #ffffff; cursor: pointer; }
.pill-avatar { width: 24px; height: 24px; border-radius: 50%; background: rgba(0, 220, 130, 0.15); color: #00dc82; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; overflow: hidden; }
.pill-avatar img { width: 100%; height: 100%; object-fit: cover; }
.pill-username { font-size: 0.85rem; font-weight: 700; color: #cbd5e1; }
.menu-dropdown { position: absolute; top: calc(100% + 0.5rem); background: #090d16; border: 1px solid #1e293b; border-radius: 12px; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6); padding: 0.5rem; display: flex; flex-direction: column; gap: 0.2rem; z-index: 100; }
.tools-menu { left: 0; width: 270px; }
.lang-menu { right: 0; width: 180px; }
.profile-menu { right: 0; width: 250px; }
.profile-header { padding: 0.4rem 0.6rem; display: flex; flex-direction: column; gap: 0.15rem; }
.user-display-name { font-weight: 800; font-size: 0.92rem; color: #ffffff; }
.user-role-badge { font-size: 0.72rem; color: #38bdf8; font-weight: 700; }
.user-role-badge.admin { color: #00dc82; }
.dropdown-divider { height: 1px; background: #1e293b; margin: 0.35rem 0; }
.dropdown-group { display: flex; flex-direction: column; gap: 0.2rem; }
.dropdown-label { font-size: 0.65rem; font-weight: 800; color: #00dc82; padding: 0.35rem 0.6rem 0.15rem; letter-spacing: 0.05em; text-transform: uppercase; }
.menu-item { display: flex; align-items: center; gap: 0.65rem; padding: 0.55rem 0.65rem; color: #cbd5e1; text-decoration: none; font-size: 0.85rem; font-weight: 600; border-radius: 6px; background: transparent; border: none; width: 100%; text-align: left; cursor: pointer; }
.menu-item:hover { background: rgba(255, 255, 255, 0.05); color: #ffffff; }
.menu-item.api-console-item { color: #38bdf8; }
.menu-item.admin-control-item { color: #00dc82; font-weight: 700; }
.item-text strong { display: block; font-size: 0.85rem; color: #f8fafc; }
.item-text small { display: block; font-size: 0.7rem; color: #64748b; }
.logout-item { color: #ef4444; }
.logout-item:hover { background: rgba(239, 68, 68, 0.1); color: #f87171; }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.15s ease-out; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
