<!-- app/components/Navbar.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// Integrazione Core Auth, Routing & DKP Translator v2.4
const { currentUser, isAuthenticated, logout, openAuthModal } = useAuthCore()
const { currentLang, activeLanguageObj, languages, setLanguage, initTranslator, t } = useDkpTranslator()

const router = useRouter()
const route = useRoute()

// DOM Ref per chiusura al click esterno
const navbarRef = ref<HTMLElement | null>(null)

// Gestore centralizzato Dropdown
const activeDropdown = ref<string | null>(null)
const isMobileMenuOpen = ref(false)

function toggleDropdown(name: string) {
  activeDropdown.value = activeDropdown.value === name ? null : name
}

function closeAllDropdowns() {
  activeDropdown.value = null
  isMobileMenuOpen.value = false
}

function goToApiConsole() {
  closeAllDropdowns()

  if (!isAuthenticated.value) {
    alert('🔒 Accesso Riservato: Devi essere loggato per accedere alla DKP API Console!')
    return
  }

  router.push('/api-console')
}

// Chiusura automatica dei dropdown al cambio pagina
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

// Menù a tendina News Unificato v2.4 (CLONATO 1:1 DA DKP TOOLS)
const newsCategories = [
  { name: 'News Feed', description: 'Ultimi aggiornamenti tech & ecosistema', icon: '📰', route: '/news' },
  { name: 'Ask DKP', description: 'Domande, supporto e discussioni', icon: '💬', route: '/ask' },
  { name: 'Show DKP', description: 'Showcase progetti della community', icon: '🚀', route: '/show' },
  { name: 'Tech Jobs Hub', description: 'Offerte di lavoro per sviluppatori', icon: '💼', route: '/jobs' }
]

// DKP Tools v2.4
const dkpTools = [
  { name: 'Neural Playground v2.3', description: 'Testing Prompt e Modelli IA', icon: '🧠', route: '/tools/neural-playground' },
  { name: 'Terminal Web Shell v2.3', description: 'Shell CLI In-Browser e SDK', icon: '💻', route: '/tools/terminal' },
  { name: 'AI Code Scanner v2.3 Pro', description: 'Audit & Analisi Vulnerabilità IA', icon: '🔍', route: '/tools/ai-scanner' },
  { name: 'Proof of Code (Vault) v2.3', description: 'Notarizzazione e Hash Crittografico', icon: '🛡️', route: '/tools/proof-of-code' },
  { name: 'DKP CLI Toolkit v2.4-Gold', description: 'CLI Nativi per Devs & Terminal', icon: '⚡', route: '/tools/cli-toolkit' }
]

// Controllo ruoli per accedere al Pannello Admin
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
  router.push('/')
}
</script>

<template>
  <header class="navbar-wrapper" ref="navbarRef">
    <div class="navbar-inner">
      
      <!-- BRAND LOGO -->
      <div class="brand-section">
        <NuxtLink to="/" class="brand-link">
          <span class="dk-badge">DK</span>
          <span class="brand-name">DevKernel<span class="pulse-highlight">Pulse</span></span>
        </NuxtLink>
        <span class="version-tag">v2.4-GOLD</span>
      </div>

      <!-- NAVIGAZIONE PRINCIPALE DESKTOP -->
      <nav class="nav-links desktop-only">

        <!-- 1. NEWS DROPDOWN -->
        <div class="dropdown-wrapper">
          <button 
            @click="toggleDropdown('news')" 
            class="tools-btn" 
            :class="{ active: activeDropdown === 'news' }"
          >
            ☁️ News <span class="arrow" :class="{ rotated: activeDropdown === 'news' }">▼</span>
          </button>
          
          <Transition name="fade-slide">
            <div v-show="activeDropdown === 'news'" class="menu-dropdown tools-menu">
              <NuxtLink 
                v-for="item in newsCategories" 
                :key="item.route" 
                :to="item.route" 
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

        <!-- 2. DKP TOOLS V2.4 -->
        <div class="dropdown-wrapper">
          <button 
            @click="toggleDropdown('tools')" 
            class="tools-btn" 
            :class="{ active: activeDropdown === 'tools' }"
          >
            🛠️ {{ t('tools') }} <span class="arrow" :class="{ rotated: activeDropdown === 'tools' }">▼</span>
          </button>
          
          <Transition name="fade-slide">
            <div v-show="activeDropdown === 'tools'" class="menu-dropdown tools-menu">
              <NuxtLink 
                v-for="tool in dkpTools" 
                :key="tool.route" 
                :to="tool.route" 
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
		
        <!-- 3. LINK DKP API -->
        <div class="dropdown-wrapper">
          <button 
            @click="toggleDropdown('api')" 
            class="tools-btn" 
            :class="{ active: activeDropdown === 'api' }"
          >
            🔌 DKP API <span class="arrow" :class="{ rotated: activeDropdown === 'api' }">▼</span>
          </button>
          
          <Transition name="fade-slide">
            <div v-show="activeDropdown === 'api'" class="menu-dropdown tools-menu">
              <a 
                href="#"
                class="menu-item"
                @click.prevent="goToApiConsole"
              >
                <span class="icon">⚡</span>
                <div class="item-text">
                  <strong>DKP API Console</strong>
                  <small>Gestione Key, Metriche e Consumi API</small>
                </div>
              </a>
            </div>
          </Transition>
        </div>
		
        <span class="slash">/</span>
        <!-- 4. SUBMIT LINK -->
        <NuxtLink to="/submit" class="submit-highlight">{{ t('submit') }}</NuxtLink>
        <span class="slash">/</span>
      </nav> 
	  
      <!-- SEZIONE DESTRA -->
      <div class="right-actions desktop-only">
        
        <!-- TRANSLATOR PRO (9 LINGUE) -->
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

        <!-- PULSANTE ACCEDI / PILL UTENTE LOGGATO -->
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

          <!-- MENU A TENDINA PROFILO UTENTE / ADMIN SNELLED V2.4-GOLD -->
          <Transition name="fade-slide">
            <div v-show="activeDropdown === 'user'" class="menu-dropdown profile-menu">
              
              <!-- HEADER UTENTE -->
              <div class="profile-header">
                <span class="user-display-name">@{{ currentUser?.username }}</span>
                <span class="user-role-badge" :class="{ admin: isAdmin }">
                  {{ isAdmin ? '🛡️ Administrator' : '🌱 VIP Developer' }}
                </span>
              </div>

              <div class="dropdown-divider"></div>

              <!-- VOCI UTENTE STANDARD -->
              <NuxtLink to="/user/dashboard" class="menu-item" @click="closeAllDropdowns">
                <span>📊</span> {{ t('dashboard') }}
              </NuxtLink>

              <NuxtLink to="/user/dashboard?tab=vault" class="menu-item" @click="closeAllDropdowns">
                <span>🛡️</span> {{ t('vault') }}
              </NuxtLink>

              <NuxtLink to="/user/dashboard?tab=profile" class="menu-item" @click="closeAllDropdowns">
                <span>⚙️</span> {{ t('settings') }}
              </NuxtLink>

              <NuxtLink to="/api-console" class="menu-item api-console-item" @click="closeAllDropdowns">
                <span>⚡</span> DKP API Console
              </NuxtLink>

              <NuxtLink :to="`/user/${currentUser?.username || 'alexdpl'}`" class="menu-item" @click="closeAllDropdowns">
                <span>🌐</span> Vedi Profilo Pubblico
              </NuxtLink>

              <!-- PANNELLO AMMINISTRAZIONE (ESCLUSIVAMENTE CONTROL CENTER) -->
              <template v-if="isAdmin">
                <div class="dropdown-divider"></div>
                <div class="dropdown-group">
                  <span class="dropdown-label">AMMINISTRAZIONE DKP</span>
                  
                  <NuxtLink to="/admin" class="menu-item admin-control-item" @click="closeAllDropdowns">
                    <span>🔒</span> Control Center Admin
                  </NuxtLink>
                </div>
              </template>

              <div class="dropdown-divider"></div>

              <!-- LOGOUT -->
              <button @click="handleLogout" class="menu-item logout-item">
                <span>🚪</span> {{ t('logout') }}
              </button>

            </div>
          </Transition>
        </div>

      </div> <!-- CHIUSURA CORRETTA DI RIGHT-ACTIONS -->

      <!-- BOTTONE TOGGLE HAMBURGER DKP MOBILE -->
      <button @click="isMobileMenuOpen = !isMobileMenuOpen" class="mobile-hamburger-btn mobile-only" aria-label="Toggle Menu">
        <span v-if="!isMobileMenuOpen">☰</span>
        <span v-else>✕</span>
      </button>

    </div>

    <!-- DRAWER DKP MOBILE RESPONSIVE -->
    <Transition name="fade-slide">
      <div v-show="isMobileMenuOpen" class="mobile-drawer mobile-only">
        <nav class="mobile-nav-list">
          <span class="mobile-section-title">📰 NEWS & COMMUNITY</span>
          <NuxtLink 
            v-for="item in newsCategories" 
            :key="item.route" 
            :to="item.route" 
            class="mobile-nav-link"
            @click="closeAllDropdowns"
          >
            {{ item.icon }} {{ item.name }}
          </NuxtLink>
          
          <div class="mobile-section-divider"></div>
          
          <NuxtLink to="/submit" class="mobile-nav-link highlight" @click="closeAllDropdowns">+ Submit Link</NuxtLink>
          <NuxtLink to="/blog" class="mobile-nav-link" @click="closeAllDropdowns">✍️ DKP Blog</NuxtLink>
          
          <div class="mobile-section-divider"></div>
          <span class="mobile-section-title">🛠️ DKP TOOLS V2.4</span>
          
          <NuxtLink v-for="tool in dkpTools" :key="tool.route" :to="tool.route" class="mobile-nav-link tool-link" @click="closeAllDropdowns">
            <span>{{ tool.icon }} {{ tool.name }}</span>
          </NuxtLink>

          <div class="mobile-section-divider"></div>
          
          <div v-if="isAuthenticated" class="mobile-user-block">
            <span class="m-user">👤 @{{ currentUser?.username }}</span>
            <NuxtLink to="/user/dashboard" class="mobile-nav-link" @click="closeAllDropdowns">📊 Dashboard & Vault</NuxtLink>
            
            <template v-if="isAdmin">
              <div class="mobile-section-divider"></div>
              <span class="mobile-section-title">🛡️ AMMINISTRAZIONE DKP</span>
              <NuxtLink to="/admin" class="mobile-nav-link admin" @click="closeAllDropdowns">🔒 Control Center Admin</NuxtLink>
            </template>

            <div class="mobile-section-divider"></div>
            <button @click="handleLogout" class="mobile-nav-link logout">🚪 Disconnetti</button>
          </div>
          
          <div v-else class="mobile-auth-block">
            <button @click="handleLogin" class="btn-accedi full-width">Accedi / Registrati</button>
          </div>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
/* ==========================================================================
   1. NAVBAR WRAPPER & CONTAINER
   ========================================================================== */
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

.navbar-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* ==========================================================================
   2. BRANDING & LOGO
   ========================================================================== */
.brand-section {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #ffffff;
  font-weight: 800;
  font-size: 1.15rem;
}

.dk-badge {
  background: #00dc82;
  color: #020420;
  font-size: 0.85rem;
  font-weight: 900;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  letter-spacing: -0.5px;
}

.brand-name { 
  letter-spacing: -0.3px; 
}

.pulse-highlight { 
  color: #00dc82; 
}

.version-tag {
  font-size: 0.65rem;
  font-weight: 800;
  color: #00dc82;
  background: rgba(0, 220, 130, 0.1);
  border: 1px solid rgba(0, 220, 130, 0.3);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  letter-spacing: 0.03em;
}

/* ==========================================================================
   3. NAV LINKS & DROPDOWN TRIGGERS
   ========================================================================== */
.nav-links {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.92rem;
  font-weight: 600;
}

.nav-link-item {
  color: #cbd5e1;
  text-decoration: none;
  transition: color 0.15s ease;
  padding: 0.2rem 0.4rem;
}

.nav-link-item:hover,
.nav-link-item.router-link-active { 
  color: #00dc82; 
}

.submit-highlight {
  color: #00dc82 !important;
  font-weight: 700;
  text-decoration: none;
}

.slash {
  color: #334155;
  font-weight: 400;
  user-select: none;
}

.dropdown-wrapper { 
  position: relative; 
  display: inline-block;
}

.tools-btn {
  background: transparent;
  border: none;
  color: #38bdf8;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.15s ease;
}

.tools-btn:hover,
.tools-btn.active {
  color: #7dd3fc;
  background: rgba(56, 189, 248, 0.12);
}

.arrow {
  font-size: 0.65rem;
  transition: transform 0.2s ease;
  color: #64748b;
}

.arrow.rotated { 
  transform: rotate(180deg); 
  color: #00dc82;
}

/* ==========================================================================
   4. RIGHT ACTIONS & USER PILL
   ========================================================================== */
.right-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.lang-btn {
  background: #090d16;
  border: 1px solid #1e293b;
  color: #cbd5e1;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.15s ease;
}

.lang-btn:hover,
.lang-btn.active {
  border-color: #00dc82;
  color: #ffffff;
}

.btn-accedi {
  background: #00dc82;
  color: #020420;
  font-weight: 800;
  font-size: 0.85rem;
  border: none;
  padding: 0.45rem 1.1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-accedi:hover {
  background: #00bf71;
  box-shadow: 0 0 12px rgba(0, 220, 130, 0.3);
}

.user-pill-btn {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: #090d16;
  border: 1px solid #1e293b;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-pill-btn:hover,
.user-pill-btn.active {
  border-color: #00dc82;
  box-shadow: 0 0 10px rgba(0, 220, 130, 0.2);
}

.pill-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  overflow: hidden;
}

.pill-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pill-username {
  font-size: 0.85rem;
  font-weight: 700;
  color: #cbd5e1;
}

/* ==========================================================================
   5. DROPDOWN MENUS (TOOLS, LANG & PROFILE V2.4-GOLD)
   ========================================================================== */
.menu-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  z-index: 100;
}

.tools-menu { left: 0; width: 270px; }
.lang-menu { right: 0; width: 180px; max-height: 280px; overflow-y: auto; }
.profile-menu { right: 0; width: 250px; }

/* HEADER DROPDOWN UTENTE */
.profile-header {
  padding: 0.4rem 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.user-display-name {
  font-weight: 800;
  font-size: 0.92rem;
  color: #ffffff;
}

.user-role-badge {
  font-size: 0.72rem;
  color: #38bdf8;
  font-weight: 700;
}

.user-role-badge.admin {
  color: #00dc82;
}

.dropdown-divider {
  height: 1px;
  background: #1e293b;
  margin: 0.35rem 0;
}

.dropdown-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.dropdown-label {
  font-size: 0.65rem;
  font-weight: 800;
  color: #00dc82;
  padding: 0.35rem 0.6rem 0.15rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* ITEM GENERICI MENU */
.menu-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.65rem;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 6px;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  transform: translateX(2px);
}

.menu-item.api-console-item {
  color: #38bdf8;
}

.menu-item.api-console-item:hover {
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
}

.menu-item.admin-control-item {
  color: #00dc82;
  font-weight: 700;
}

.menu-item.admin-control-item:hover {
  background: rgba(0, 220, 130, 0.12);
  color: #00dc82;
}

.lang-item { 
  font-size: 0.8rem; 
  padding: 0.45rem 0.65rem; 
}

.lang-item.selected {
  color: #00dc82;
  font-weight: 800;
  background: rgba(0, 220, 130, 0.1);
}

.item-text strong { 
  display: block; 
  font-size: 0.85rem; 
  color: #f8fafc; 
}

.item-text small { 
  display: block; 
  font-size: 0.7rem; 
  color: #64748b; 
}

.logout-item { 
  color: #ef4444; 
}

.logout-item:hover { 
  background: rgba(239, 68, 68, 0.1); 
  color: #f87171; 
}

/* ==========================================================================
   6. RESPONSIVE MOBILE DRAWER
   ========================================================================== */
.mobile-only { display: none; }

@media (max-width: 900px) {
  .desktop-only { display: none !important; }
  .mobile-only { display: block; }

  .mobile-hamburger-btn {
    background: #090d16;
    border: 1px solid #1e293b;
    color: #00dc82;
    font-size: 1.4rem;
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
    cursor: pointer;
  }

  .mobile-drawer {
    background: #090d16;
    border-top: 1px solid #1e293b;
    padding: 1.25rem;
    margin-top: 0.6rem;
    border-radius: 8px;
  }

  .mobile-nav-list { display: flex; flex-direction: column; gap: 0.75rem; }
  .mobile-nav-link { color: #cbd5e1; text-decoration: none; font-size: 0.95rem; font-weight: 700; background: transparent; border: none; text-align: left; cursor: pointer; }
  .mobile-nav-link.highlight { color: #00dc82; }
  .mobile-nav-link.admin { color: #00dc82; font-weight: 800; }
  .mobile-nav-link.logout { color: #ef4444; }
  .mobile-section-divider { height: 1px; background: #1e293b; margin: 0.5rem 0; }
  .mobile-section-title { color: #64748b; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
  .full-width { width: 100%; margin-top: 0.5rem; }
  .m-user { color: #38bdf8; font-weight: 800; font-size: 0.9rem; }
}

/* ==========================================================================
   7. TRANSITIONS
   ========================================================================== */
.fade-slide-enter-active,
.fade-slide-leave-active { 
  transition: all 0.15s ease-out; 
}

.fade-slide-enter-from,
.fade-slide-leave-to { 
  opacity: 0; 
  transform: translateY(-6px); 
}
</style>