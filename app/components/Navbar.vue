<!-- app/components/Navbar.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// Integrazione Core Auth, Routing & DKP Translator v2.0
const { currentUser, isAuthenticated, logout, openAuthModal } = useAuthCore()
const { currentLang, activeLanguageObj, languages, setLanguage, initTranslator, t } = useDkpTranslator()

const router = useRouter()
const route = useRoute()

// DOM Ref per chiusura al click esterno
const navbarRef = ref<HTMLElement | null>(null)

// Gestore centralizzato Dropdown (Estensibile per futuri moduli SaaS)
const activeDropdown = ref<string | null>(null)
const isMobileMenuOpen = ref(false)

function toggleDropdown(name: string) {
  activeDropdown.value = activeDropdown.value === name ? null : name
}

function closeAllDropdowns() {
  activeDropdown.value = null
  isMobileMenuOpen.value = false
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

// Menù a tendina News Unificato
const newsMenuItems = [
  { name: 'News Feed', description: 'Ultimi aggiornamenti tech & ecosistema', icon: '📰', route: '/feed' },
  { name: 'Ask Community', description: 'Domande, supporto e discussioni', icon: '💬', route: '/ask' },
  { name: 'Show DKP', description: 'Showcase progetti della community', icon: '⚡', route: '/show' },
  { name: 'Tech Jobs', description: 'Offerte di lavoro per sviluppatori', icon: '💼', route: '/jobs' }
]

// 4 DKP Tools v2.0
const dkpTools = [
  { name: 'Neural Playground', description: 'Testing Prompt e Modelli IA', icon: '🧠', route: '/tools/neural-playground' },
  { name: 'Terminal Web Shell', description: 'Shell CLI In-Browser e SDK', icon: '💻', route: '/tools/terminal' },
  { name: 'AI Code Scanner v2', description: 'Audit & Analisi Vulnerabilità IA', icon: '🔍', route: '/tools/ai-scanner' },
  { name: 'Proof of Code (Vault)', description: 'Notarizzazione e Hash Crittografico', icon: '🛡️', route: '/tools/proof-of-code' }
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
        <span class="version-tag">v2.0</span>
      </div>

      <!-- NAVIGAZIONE PRINCIPALE DESKTOP -->
      <nav class="nav-links desktop-only">
        
        <!-- 1. NEWS DROPDOWN -->
        <div class="dropdown-wrapper">
          <button @click="toggleDropdown('news')" class="nav-dropdown-btn" :class="{ active: activeDropdown === 'news' }">
            {{ t('news') }} <span class="arrow">▼</span>
          </button>
          
          <Transition name="fade-slide">
            <div v-show="activeDropdown === 'news'" class="menu-dropdown news-menu">
              <NuxtLink 
                v-for="item in newsMenuItems" 
                :key="item.route" 
                :to="item.route" 
                class="menu-item"
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

        <span class="slash">/</span>

        <!-- 2. DKP TOOLS V2.0 -->
        <div class="dropdown-wrapper">
          <button @click="toggleDropdown('tools')" class="tools-btn" :class="{ active: activeDropdown === 'tools' }">
            🛠️ {{ t('tools') }} <span class="arrow">▼</span>
          </button>
          
          <Transition name="fade-slide">
            <div v-show="activeDropdown === 'tools'" class="menu-dropdown tools-menu">
              <NuxtLink 
                v-for="tool in dkpTools" 
                :key="tool.route" 
                :to="tool.route" 
                class="menu-item"
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

        <span class="slash">/</span>

        <!-- 3. SUBMIT LINK -->
        <NuxtLink to="/submit" class="submit-highlight">{{ t('submit') }}</NuxtLink>

        <span class="slash">/</span>

        <!-- 4. DKP BLOG -->
        <NuxtLink to="/blog" class="nav-link-item">{{ t('blog') }}</NuxtLink>

      </nav>

      <!-- SEZIONE DESTRA -->
      <div class="right-actions desktop-only">
        
        <!-- TRANSLATOR PRO (9 LINGUE) -->
        <div class="dropdown-wrapper">
          <button @click="toggleDropdown('lang')" class="lang-btn" :class="{ active: activeDropdown === 'lang' }">
            🌐 {{ activeLanguageObj.flag }} {{ activeLanguageObj.code }} <span class="arrow">▼</span>
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

        <!-- LINK GITHUB -->
        <a href="https://github.com/alexdpl/hackernews" target="_blank" rel="noopener" class="github-link">
          GitHub <strong style="color: #00dc82;">↗</strong>
        </a>

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

          <!-- MENU A TENDINA PROFILO UTENTE / ADMIN COMPLETO -->
          <Transition name="fade-slide">
            <div v-show="activeDropdown === 'user'" class="menu-dropdown profile-menu">
              <div class="profile-header">
                <span class="user-display-name">@{{ currentUser?.username }}</span>
                <span class="user-role-badge">{{ isAdmin ? '🛡️ Administrator' : '🌱 VIP Developer' }}</span>
              </div>

              <div class="dropdown-divider"></div>

              <NuxtLink to="/user/dashboard" class="menu-item">
                <span>📊</span> {{ t('dashboard') }}
              </NuxtLink>

              <NuxtLink to="/user/dashboard?tab=vault" class="menu-item">
                <span>🛡️</span> {{ t('vault') }}
              </NuxtLink>

              <NuxtLink to="/user/dashboard?tab=profile" class="menu-item">
                <span>⚙️</span> {{ t('settings') }}
              </NuxtLink>

              <!-- PANNELLO ADMIN & SUB-SEZIONI -->
              <template v-if="isAdmin">
                <div class="dropdown-divider"></div>
                <div class="dropdown-section-title">AMMINISTRAZIONE DKP</div>
                
                <NuxtLink to="/admin" class="menu-item admin-item">
                  <span>🔒</span> {{ t('adminControl') }}
                </NuxtLink>

                <NuxtLink to="/admin/crawler" class="menu-item admin-item">
                  <span>🤖</span> {{ t('crawlerEngine') }}
                </NuxtLink>

                <NuxtLink to="/admin/blog" class="menu-item admin-item">
                  <span>📝</span> Gestione DKP Blog
                </NuxtLink>

                <NuxtLink to="/admin/shop" class="menu-item admin-item">
                  <span>🛍️</span> {{ t('shopManagement') }}
                </NuxtLink>

                <NuxtLink to="/admin/jobs" class="menu-item admin-item">
                  <span>💼</span> {{ t('jobsManagement') }}
                </NuxtLink>
              </template>

              <div class="dropdown-divider"></div>

              <button @click="handleLogout" class="menu-item logout-item">
                <span>🚪</span> {{ t('logout') }}
              </button>
            </div>
          </Transition>
        </div>

      </div>

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
          <NuxtLink to="/feed" class="mobile-nav-link">📰 News Feed</NuxtLink>
          <NuxtLink to="/ask" class="mobile-nav-link">💬 Ask Community</NuxtLink>
          <NuxtLink to="/show" class="mobile-nav-link">⚡ Show DKP</NuxtLink>
          <NuxtLink to="/jobs" class="mobile-nav-link">💼 Tech Jobs</NuxtLink>
          
          <div class="mobile-section-divider"></div>
          
          <NuxtLink to="/submit" class="mobile-nav-link highlight">+ Submit Link</NuxtLink>
          <NuxtLink to="/blog" class="mobile-nav-link">✍️ DKP Blog</NuxtLink>
          
          <div class="mobile-section-divider"></div>
          <span class="mobile-section-title">🛠️ DKP TOOLS V2.0</span>
          
          <NuxtLink v-for="tool in dkpTools" :key="tool.route" :to="tool.route" class="mobile-nav-link tool-link">
            <span>{{ tool.icon }} {{ tool.name }}</span>
          </NuxtLink>

          <div class="mobile-section-divider"></div>
          
          <div v-if="isAuthenticated" class="mobile-user-block">
            <span class="m-user">👤 @{{ currentUser?.username }}</span>
            <NuxtLink to="/user/dashboard" class="mobile-nav-link">📊 Dashboard & Vault</NuxtLink>
            
            <template v-if="isAdmin">
              <div class="mobile-section-divider"></div>
              <span class="mobile-section-title">🛡️ AMMINISTRAZIONE DKP</span>
              <NuxtLink to="/admin" class="mobile-nav-link admin">🔒 Control Center Admin</NuxtLink>
              <NuxtLink to="/admin/crawler" class="mobile-nav-link admin">🤖 DKP Crawler Engine</NuxtLink>
              <NuxtLink to="/admin/blog" class="mobile-nav-link admin">📝 Gestione DKP Blog</NuxtLink>
              <NuxtLink to="/admin/shop" class="mobile-nav-link admin">🛍️ Gestione DKP Shop</NuxtLink>
              <NuxtLink to="/admin/jobs" class="mobile-nav-link admin">💼 Gestione Job Hub</NuxtLink>
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
.navbar-wrapper {
  background: #020420;
  border-bottom: 2px solid #00dc82;
  position: sticky;
  top: 0;
  z-index: 1000;
  padding: 0.6rem 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 220, 130, 0.08);
}

.navbar-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

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

.brand-name { letter-spacing: -0.3px; }
.pulse-highlight { color: #00dc82; }

.version-tag {
  font-size: 0.65rem;
  font-weight: 700;
  color: #00dc82;
  background: rgba(0, 220, 130, 0.1);
  border: 1px solid rgba(0, 220, 130, 0.3);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.nav-link-item {
  color: #cbd5e1;
  text-decoration: none;
  transition: color 0.15s ease;
}

.nav-link-item:hover,
.nav-link-item.router-link-active { color: #00dc82; }

.nav-dropdown-btn {
  background: transparent;
  border: none;
  color: #cbd5e1;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: color 0.15s ease;
}

.nav-dropdown-btn:hover,
.nav-dropdown-btn.active { color: #00dc82; }

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

.dropdown-wrapper { position: relative; }

.tools-btn {
  background: transparent;
  border: none;
  color: #38bdf8;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.tools-btn:hover,
.tools-btn.active {
  color: #7dd3fc;
  background: rgba(56, 189, 248, 0.1);
}

.arrow {
  font-size: 0.65rem;
  transition: transform 0.2s ease;
}

.arrow.rotated { transform: rotate(180deg); }

.right-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.lang-btn {
  background: #090d16;
  border: 1px solid #1e293b;
  color: #cbd5e1;
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: border-color 0.15s ease;
}

.lang-btn:hover,
.lang-btn.active {
  border-color: #00dc82;
  color: #ffffff;
}

.github-link {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  transition: color 0.15s ease;
}

.github-link:hover { color: #ffffff; }

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
  gap: 0.5rem;
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
  background: #38bdf8;
  color: #020420;
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

.menu-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  z-index: 100;
}

.news-menu { left: 0; width: 260px; }
.tools-menu { left: 0; width: 270px; }
.lang-menu { right: 0; width: 180px; max-height: 280px; overflow-y: auto; }
.profile-menu { right: 0; width: 250px; }

.profile-header {
  padding: 0.5rem 0.75rem;
  display: flex;
  flex-direction: column;
}

.user-display-name {
  font-weight: 800;
  font-size: 0.9rem;
  color: #ffffff;
}

.user-role-badge {
  font-size: 0.7rem;
  color: #00dc82;
  font-weight: 600;
}

.dropdown-divider {
  height: 1px;
  background: #1e293b;
  margin: 0.3rem 0;
}

.dropdown-section-title {
  font-size: 0.65rem;
  font-weight: 800;
  color: #00dc82;
  padding: 0.3rem 0.75rem 0.1rem;
  letter-spacing: 0.5px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.75rem;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.85rem;
  border-radius: 6px;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.menu-item:hover {
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
}

.lang-item { font-size: 0.8rem; padding: 0.45rem 0.65rem; }

.lang-item.selected {
  color: #00dc82;
  font-weight: 800;
  background: rgba(0, 220, 130, 0.1);
}

.item-text strong { display: block; font-size: 0.85rem; color: #f8fafc; }
.item-text small { display: block; font-size: 0.7rem; color: #64748b; }

.admin-item { color: #00dc82; font-weight: 600; }
.admin-item:hover { background: rgba(0, 220, 130, 0.1); color: #00dc82; }

.logout-item { color: #ef4444; }
.logout-item:hover { background: rgba(239, 68, 68, 0.1); color: #f87171; }

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
  .mobile-nav-link.admin { color: #00dc82; }
  .mobile-nav-link.logout { color: #ef4444; }
  .mobile-section-divider { height: 1px; background: #1e293b; margin: 0.5rem 0; }
  .mobile-section-title { color: #64748b; font-size: 0.75rem; font-weight: 800; }
  .full-width { width: 100%; margin-top: 0.5rem; }
  .m-user { color: #38bdf8; font-weight: 800; font-size: 0.9rem; }
}

.fade-slide-enter-active,
.fade-slide-leave-active { transition: all 0.15s ease-out; }
.fade-slide-enter-from,
.fade-slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>