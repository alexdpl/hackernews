<!-- app/components/Navbar.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Integrazione Core Auth & Routing
const { currentUser, isAuthenticated, logout, openAuthModal } = useAuthCore()
const router = useRouter()

// Riferimento al DOM per la chiusura dei dropdown al click esterno
const navbarRef = ref<HTMLElement | null>(null)

// Stati dei Dropdown
const isUserDropdownOpen = ref(false)
const isDkpToolsOpen = ref(false)
const isLangOpen = ref(false)
const currentLang = ref('IT')

// Controllo ruoli per accedere al Pannello Admin
const isAdmin = computed(() => {
  if (!currentUser.value) return false
  const username = currentUser.value.username?.toLowerCase()
  const role = currentUser.value.role?.toLowerCase()
  return username === 'alexdpl' || role === 'admin'
})

// Toggle Gestione Dropdown
function toggleUserDropdown() {
  isUserDropdownOpen.value = !isUserDropdownOpen.value
  isDkpToolsOpen.value = false
  isLangOpen.value = false
}

function toggleDkpTools() {
  isDkpToolsOpen.value = !isDkpToolsOpen.value
  isUserDropdownOpen.value = false
  isLangOpen.value = false
}

function toggleLang() {
  isLangOpen.value = !isLangOpen.value
  isUserDropdownOpen.value = false
  isDkpToolsOpen.value = false
}

function closeAllDropdowns() {
  isUserDropdownOpen.value = false
  isDkpToolsOpen.value = false
  isLangOpen.value = false
}

function selectLang(lang: string) {
  currentLang.value = lang
  isLangOpen.value = false
}

// Chiusura al click fuori dal menu
function handleClickOutside(event: MouseEvent) {
  if (navbarRef.value && !navbarRef.value.contains(event.target as Node)) {
    closeAllDropdowns()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Azione di Login / Apertura Modal
function handleLogin() {
  closeAllDropdowns()
  if (typeof openAuthModal === 'function') {
    openAuthModal()
  } else {
    router.push('/?auth=login')
  }
}

// Azione Logout
async function handleLogout() {
  closeAllDropdowns()
  await logout()
  router.push('/')
}
</script>

<template>
  <header class="navbar-wrapper" ref="navbarRef">
    <div class="navbar-inner">
      
      <!-- LOGO CON BOX GREEN 'DK' + DevKernelPulse + v1.0 -->
      <div class="brand-section">
        <NuxtLink to="/" class="brand-link" @click="closeAllDropdowns">
          <span class="dk-badge">DK</span>
          <span class="brand-name">DevKernel<span class="pulse-highlight">Pulse</span></span>
        </NuxtLink>
        <span class="version-tag">v1.0</span>
      </div>

      <!-- NAVIGAZIONE PRINCIPALE STILE DEVKERNEL (CON SLASH) -->
      <nav class="nav-links">
        <NuxtLink to="/feed">news</NuxtLink>
        <span class="slash">/</span>
        
        <NuxtLink to="/ask">ask</NuxtLink>
        <span class="slash">/</span>
        
        <NuxtLink to="/show">show</NuxtLink>
        <span class="slash">/</span>
        
        <NuxtLink to="/jobs">jobs</NuxtLink>
        <span class="slash">/</span>
        
        <NuxtLink to="/submit" class="submit-highlight">submit</NuxtLink>
        <span class="slash">/</span>

        <!-- DROPDOWN DKP TOOLS -->
        <div class="dropdown-wrapper">
          <button @click="toggleDkpTools" class="tools-btn" :class="{ active: isDkpToolsOpen }">
            🛠️ DKP Tools <span class="arrow">▼</span>
          </button>
          
          <Transition name="fade-slide">
            <div v-if="isDkpToolsOpen" class="menu-dropdown tools-menu">
              <NuxtLink to="/user/dashboard" class="menu-item" @click="closeAllDropdowns">
                <span class="icon">⚡</span>
                <div class="item-text">
                  <strong>Proof of Code (PoC)</strong>
                  <small>Verifica e notarizzazione script</small>
                </div>
              </NuxtLink>
              
              <NuxtLink to="/user/dashboard" class="menu-item" @click="closeAllDropdowns">
                <span class="icon">🛡️</span>
                <div class="item-text">
                  <strong>AI Security Scanner</strong>
                  <small>Audit vulnerabilità codice</small>
                </div>
              </NuxtLink>
              
              <NuxtLink to="/user/dashboard" class="menu-item" @click="closeAllDropdowns">
                <span class="icon">💻</span>
                <div class="item-text">
                  <strong>Code Playground</strong>
                  <small>Ambiente di test protetto</small>
                </div>
              </NuxtLink>
            </div>
          </Transition>
        </div>
      </nav>

      <!-- SEZIONE DESTRA: LINGUA, GITHUB, AUTH / PROFILE -->
      <div class="right-actions">
        
        <!-- SELETTORE LINGUA -->
        <div class="dropdown-wrapper">
          <button @click="toggleLang" class="lang-btn">
            🌐 {{ currentLang }} <span class="arrow">▼</span>
          </button>
          <Transition name="fade-slide">
            <div v-if="isLangOpen" class="menu-dropdown lang-menu">
              <button @click="selectLang('IT')" class="menu-item lang-item" :class="{ selected: currentLang === 'IT' }">🇮🇹 IT - Italiano</button>
              <button @click="selectLang('EN')" class="menu-item lang-item" :class="{ selected: currentLang === 'EN' }">🇬🇧 EN - English</button>
            </div>
          </Transition>
        </div>

        <!-- LINK GITHUB ESTERNO -->
        <a href="https://github.com/alexdpl/devkernel-pulse" target="_blank" rel="noopener" class="github-link">
          GitHub ↗
        </a>

        <!-- AREA UTENTE: UTENTE NON LOGGATO -->
        <button v-if="!isAuthenticated" @click="handleLogin" class="btn-accedi">
          Accedi
        </button>

        <!-- AREA UTENTE: UTENTE LOGGATO (PILLOLA + DROPDOWN PROFILO) -->
        <div v-else class="dropdown-wrapper">
          <button @click="toggleUserDropdown" class="user-pill-btn" :class="{ active: isUserDropdownOpen }">
            <div class="pill-avatar">
              <img v-if="currentUser?.avatar" :src="currentUser.avatar" alt="Avatar" />
              <span v-else>{{ currentUser?.username?.charAt(0).toUpperCase() || 'U' }}</span>
            </div>
            <span class="pill-username">@{{ currentUser?.username }}</span>
            <span class="arrow" :class="{ rotated: isUserDropdownOpen }">▼</span>
          </button>

          <!-- MENU A TENDINA PROFILO UTENTE / ADMIN -->
          <Transition name="fade-slide">
            <div v-if="isUserDropdownOpen" class="menu-dropdown profile-menu">
              <div class="profile-header">
                <span class="user-display-name">@{{ currentUser?.username }}</span>
                <span class="user-role-badge">{{ isAdmin ? '🛡️ Administrator' : '🌱 VIP Developer' }}</span>
              </div>

              <div class="dropdown-divider"></div>

              <NuxtLink to="/user/dashboard" class="menu-item" @click="closeAllDropdowns">
                <span>📊</span> Dashboard Personale
              </NuxtLink>

              <NuxtLink to="/user/dashboard" class="menu-item" @click="closeAllDropdowns">
                <span>🛡️</span> I Miei Certificati Vault
              </NuxtLink>

              <NuxtLink to="/user/dashboard" class="menu-item" @click="closeAllDropdowns">
                <span>⚙️</span> Impostazioni Account
              </NuxtLink>

              <!-- PANNELLO ADMIN (Visibile solo per alexdpl / admin) -->
              <NuxtLink v-if="isAdmin" to="/admin" class="menu-item admin-item" @click="closeAllDropdowns">
                <span>🔒</span> Pannello Admin
              </NuxtLink>

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
/* CONTAINER NAVBAR CON BORDO INFERIORE VERDE NEON */
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

/* BRANDING & LOGO */
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
  font-weight: 700;
  color: #00dc82;
  background: rgba(0, 220, 130, 0.1);
  border: 1px solid rgba(0, 220, 130, 0.3);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}

/* LINK DI NAVIGAZIONE E SLASH */
.nav-links {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.nav-links a {
  color: #cbd5e1;
  text-decoration: none;
  transition: color 0.15s ease;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: #00dc82;
}

.submit-highlight {
  color: #00dc82 !important;
  font-weight: 700;
}

.slash {
  color: #334155;
  font-weight: 400;
  user-select: none;
}

/* BUTTON DKP TOOLS & DROPDOWNS */
.dropdown-wrapper {
  position: relative;
}

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

.arrow.rotated {
  transform: rotate(180deg);
}

/* AZIONI DESTRA */
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
}

.lang-btn:hover {
  border-color: #38bdf8;
}

.github-link {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  transition: color 0.15s ease;
}

.github-link:hover {
  color: #ffffff;
}

/* BOTTONE ACCEDI */
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

/* PILLOLA UTENTE LOGGATO */
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

/* STILI GENERALI DROPDOWN */
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

.tools-menu {
  left: 0;
  width: 260px;
}

.lang-menu {
  right: 0;
  width: 140px;
}

.profile-menu {
  right: 0;
  width: 230px;
}

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

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.75rem;
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

.lang-item.selected {
  color: #00dc82;
  font-weight: 700;
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

.admin-item {
  color: #facc15;
}

.admin-item:hover {
  background: rgba(250, 204, 21, 0.1);
  color: #fde047;
}

.logout-item {
  color: #ef4444;
}

.logout-item:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

/* TRANSIZIONI FADE SLIDE */
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