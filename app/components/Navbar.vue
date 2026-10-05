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

const newsCategories = [
  { name: 'News Feed', description: 'Ultimi aggiornamenti tech & ecosistema', icon: '📰', route: '/news' },
  { name: 'Ask DKP', description: 'Domande, supporto e discussioni', icon: '💬', route: '/ask' },
  { name: 'Show DKP', description: 'Showcase progetti della community', icon: '🚀', route: '/show' },
  { name: 'Tech Jobs Hub', description: 'Offerte di lavoro per sviluppatori', icon: '💼', route: '/jobs' }
]

const dkpTools = [
  { name: 'AI Repository v2.4-Gold', description: 'Analizza repository GitHub', icon: '🤖', route: '/tools/ai-repo-scanner' },
  { name: 'Neural Playground v2.3', description: 'Testing Prompt e Modelli IA', icon: '🧠', route: '/tools/neural-playground' },
  { name: 'Terminal Web Shell v2.3', description: 'Shell CLI In-Browser e SDK', icon: '💻', route: '/tools/terminal' },
  { name: 'AI Code Scanner v2.3 Pro', description: 'Audit & Analisi Vulnerabilità IA', icon: '🔍', route: '/tools/ai-scanner' },
  { name: 'Proof of Code (Vault) v2.3', description: 'Notarizzazione e Hash Crittografico', icon: '🛡️', route: '/tools/proof-of-code' },
  { name: 'DKP CLI Toolkit v2.4-Gold', description: 'CLI Nativi per Devs & Terminal', icon: '⚡', route: '/tools/cli-toolkit' }
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
  <header class="navbar-wrapper" ref="navbarRef">
    <div class="navbar-inner">
      
      <!-- BRAND LOGO -->
      <div class="brand-section">
        <NuxtLink :to="getMainUrl('/')" external class="brand-link">
          <span class="dk-badge">DK</span>
          <span class="brand-name">DevKernel<span class="pulse-highlight">Pulse</span></span>
        </NuxtLink>
        <span class="version-tag">v2.4-GOLD</span>
      </div>

      <!-- NAVIGAZIONE PRINCIPALE DESKTOP -->
      <nav class="nav-links desktop-only">
        <div class="dropdown-wrapper">
          <button @click="toggleDropdown('news')" class="tools-btn" :class="{ active: activeDropdown === 'news' }">
            ☁️ News <span class="arrow" :class="{ rotated: activeDropdown === 'news' }">▼</span>
          </button>
          <Transition name="fade-slide">
            <div v-show="activeDropdown === 'news'" class="menu-dropdown tools-menu">
              <NuxtLink 
                v-for="item in newsCategories" 
                :key="item.route" 
                :to="getMainUrl(item.route)" 
                external
                class="menu-item"
                @click="closeAllDropdowns"
              >
                <span class="icon">{{ item.icon }}</span>
                <div class="item-text">
                  <strong>{{ item.name }}</strong>
                  <small>{{ item.description }}</small>
                </div>
              </NuxtLink>
            </div>
          </Transition>
        </div>

        <div class="dropdown-wrapper">
          <button @click="toggleDropdown('tools')" class="tools-btn" :class="{ active: activeDropdown === 'tools' }">
            🛠️ {{ t('tools') }} <span class="arrow" :class="{ rotated: activeDropdown === 'tools' }">▼</span>
          </button>
          <Transition name="fade-slide">
            <div v-show="activeDropdown === 'tools'" class="menu-dropdown tools-menu">
              <NuxtLink 
                v-for="tool in dkpTools" 
                :key="tool.route" 
                :to="getMainUrl(tool.route)" 
                external
                class="menu-item"
                @click="closeAllDropdowns"
              >
                <span class="icon">{{ tool.icon }}</span>
                <div class="item-text">
                  <strong>{{ tool.name }}</strong>
                  <small>{{ tool.description }}</small>
                </div>
              </NuxtLink>
            </div>
          </Transition>
        </div>

        <div class="dropdown-wrapper">
          <button @click="toggleDropdown('api')" class="tools-btn" :class="{ active: activeDropdown === 'api' }">
            🔌 DKP API <span class="arrow" :class="{ rotated: activeDropdown === 'api' }">▼</span>
          </button>
          <Transition name="fade-slide">
            <div v-show="activeDropdown === 'api'" class="menu-dropdown tools-menu">
              <NuxtLink 
                :to="getMainUrl('/user/dashboard?tab=api')" 
                external
                class="menu-item"
                @click="closeAllDropdowns"
              >
                <span class="icon">🔑</span>
                <div class="item-text">
                  <strong>DKP API Console</strong>
                  <small>Gestione Key, Metriche e Consumi API</small>
                </div>
              </NuxtLink>
            </div>
          </Transition>
        </div>

        <span class="slash">/</span>
        <NuxtLink :to="getMainUrl('/submit')" external class="submit-highlight">{{ t('submit') }}</NuxtLink>
        <span class="slash">/</span>
      </nav>

      <!-- SEZIONE DESTRA DROPDOWN UTENTE -->
      <div class="right-actions desktop-only">
        <div class="dropdown-wrapper">
          <button @click="toggleDropdown('lang')" class="lang-btn" :class="{ active: activeDropdown === 'lang' }">
            🌐 {{ activeLanguageObj.flag }} {{ activeLanguageObj.code }} <span class="arrow" :class="{ rotated: activeDropdown === 'lang' }">▼</span>
          </button>
          <Transition name="fade-slide">
            <div v-show="activeDropdown === 'lang'" class="menu-dropdown lang-menu">
              <button 
                v-for="lang in languages" 
                :key="lang.code" 
                @click="selectLang(lang.code)" 
                class="menu-item lang-item" 
                :class="{ selected: currentLang === lang.code }"
              >
                <span class="flag">{{ lang.flag }}</span> {{ lang.code }} - {{ lang.label }}
              </button>
            </div>
          </Transition>
        </div>

        <button v-if="!isAuthenticated" @click="handleLogin" class="btn-accedi">
          {{ t('login') }}
        </button>

        <div v-else class="dropdown-wrapper">
          <button @click="toggleDropdown('user')" class="user-pill-btn" :class="{ active: activeDropdown === 'user' }">
            <div class="pill-avatar">
              <img v-if="currentUser?.avatar" :src="currentUser.avatar" alt="Avatar" />
              <span v-else>{{ currentUser?.username?.charAt(0).toUpperCase() || 'U' }}</span>
            </div>
            <span class="pill-username">@{{ currentUser?.username }}</span>
            <span class="arrow" :class="{ rotated: activeDropdown === 'user' }">▼</span>
          </button>

          <Transition name="fade-slide">
            <div v-show="activeDropdown === 'user'" class="menu-dropdown profile-menu">
              <div class="profile-header">
                <span class="user-display-name">@{{ currentUser?.username }}</span>
                <span class="user-role-badge" :class="{ admin: isAdmin }">
                  {{ isAdmin ? '🛡️ Administrator' : '🌱 VIP Developer' }}
                </span>
              </div>

              <div class="dropdown-divider"></div>

              <!-- LINK UTENTE USANDO getMainUrl ED external -->
              <NuxtLink :to="getMainUrl('/user/dashboard')" external class="menu-item" @click="closeAllDropdowns">
                <span>📊</span> Dashboard Personale
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/user/dashboard?tab=profile')" external class="menu-item" @click="closeAllDropdowns">
                <span>⚙️</span> Impostazioni Account
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/user/dashboard?tab=content')" external class="menu-item" @click="closeAllDropdowns">
                <span>📰</span> I Miei Contenuti
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/user/dashboard?tab=vault')" external class="menu-item" @click="closeAllDropdowns">
                <span>🛡️</span> I Miei Certificati Vault
              </NuxtLink>

              <NuxtLink :to="getMainUrl('/user/dashboard?tab=api')" external class="menu-item api-console-item" @click="closeAllDropdowns">
                <span>🔑</span> DKP API Console
              </NuxtLink>
			  
			  <NuxtLink :to="getApiUrl('/api-console')" external class="menu-item api-console-item" @click="closeAllDropdowns">
                <span>⚡</span>Consumo delle API
              </NuxtLink>

              <div class="dropdown-divider"></div>

              <NuxtLink :to="getMainUrl(`/user/${currentUser?.username || 'alexdpl'}`)" external class="menu-item" @click="closeAllDropdowns">
                <span>🌐</span> Vedi Profilo Pubblico
              </NuxtLink>

              <template v-if="isAdmin">
                <div class="dropdown-divider"></div>
                <div class="dropdown-group">
                  <span class="dropdown-label">AMMINISTRAZIONE DKP</span>
                  <NuxtLink :to="getMainUrl('/admin')" external class="menu-item admin-control-item" @click="closeAllDropdowns">
                    <span>🔒</span> Control Center Admin
                  </NuxtLink>
                </div>
              </template>

              <div class="dropdown-divider"></div>

              <button @click="handleLogout" class="menu-item logout-item">
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

