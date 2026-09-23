<!-- app/layouts/default.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const userCookie = useCookie('dkp_user')
const router = useRouter()
const isNewsDropdownOpen = ref(false)
const isToolsDropdownOpen = ref(false)
const isLangDropdownOpen = ref(false)
const currentLang = ref('IT')

function handleLogout() {
  userCookie.value = null
  router.push('/login')
}

function selectLanguage(lang: string) {
  currentLang.value = lang
  isLangDropdownOpen.value = false
}
</script>

<template>
  <div class="app-layout">
    <header class="navbar">
      <div class="nav-left">
        <!-- BRAND CON FAVICON A STRATI TRA <> -->
        <NuxtLink to="/" class="nav-brand">
          <span class="logo-badge">
            &lt;<svg class="navbar-favicon" viewBox="0 0 24 24" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6L12 2L20 6L12 10L4 6Z" fill="#020420"/><path d="M4 11L12 15L20 11" stroke="#020420" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 16L12 20L20 16" stroke="#020420" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>&gt;
          </span> DevKernelPulse
        </NuxtLink>
        
        <nav class="nav-links">
          <!-- Dropdown News -->
          <div 
            class="dropdown-container" 
            @mouseenter="isNewsDropdownOpen = true" 
            @mouseleave="isNewsDropdownOpen = false"
          >
            <NuxtLink to="/news" class="dropdown-toggle" @click="isNewsDropdownOpen = false">
              News ▾
            </NuxtLink>
            <div v-if="isNewsDropdownOpen" class="dropdown-menu">
              <NuxtLink to="/news" @click="isNewsDropdownOpen = false">🔥 Top News</NuxtLink>
              <NuxtLink to="/newest" @click="isNewsDropdownOpen = false">⏱️ Newest</NuxtLink>
              <NuxtLink to="/ask" @click="isNewsDropdownOpen = false">💬 Ask DKP</NuxtLink>
              <NuxtLink to="/show" @click="isNewsDropdownOpen = false">🚀 Show DKP</NuxtLink>
              <NuxtLink to="/jobs" @click="isNewsDropdownOpen = false">💼 Tech Jobs</NuxtLink>
            </div>
          </div>

          <!-- MENÙ A TENDINA: DKP Tools -->
          <div 
            class="dropdown-container" 
            @mouseenter="isToolsDropdownOpen = true" 
            @mouseleave="isToolsDropdownOpen = false"
          >
            <span class="dropdown-toggle tools-toggle">
              🛠️ DKP Tools ▾
            </span>
            <div v-if="isToolsDropdownOpen" class="dropdown-menu">
              <NuxtLink to="/ai-scanner" @click="isToolsDropdownOpen = false">⚡ AI Scanner</NuxtLink>
              <NuxtLink to="/terminal" @click="isToolsDropdownOpen = false">💻 Terminal</NuxtLink>
              <NuxtLink to="/neural-playground" @click="isToolsDropdownOpen = false">🧠 Neural Playground</NuxtLink>
            </div>
          </div>

          <NuxtLink to="/submit" class="submit-link">Invia Link</NuxtLink>
        </nav>
      </div>

      <div class="nav-right">
        <!-- SELETTORE LINGUA GLOBALE NATIVO CON FRANCESE E TEDESCO -->
        <div 
          class="dropdown-container lang-dropdown"
          @mouseenter="isLangDropdownOpen = true"
          @mouseleave="isLangDropdownOpen = false"
        >
          <button class="dropdown-toggle lang-btn">
            🌐 {{ currentLang }} ▾
          </button>
          <div v-if="isLangDropdownOpen" class="dropdown-menu lang-menu">
            <a href="#" @click.prevent="selectLanguage('IT')">🇮🇹 Italiano</a>
            <a href="#" @click.prevent="selectLanguage('EN')">🇬🇧 English</a>
            <a href="#" @click.prevent="selectLanguage('ES')">🇪🇸 Español</a>
            <a href="#" @click.prevent="selectLanguage('FR')">🇫🇷 Français</a>
            <a href="#" @click.prevent="selectLanguage('DE')">🇩🇪 Deutsch</a>
            <a href="#" @click.prevent="selectLanguage('ZH')">🇨🇳 中文</a>
          </div>
        </div>

        <template v-if="userCookie">
          <NuxtLink :to="`/user/${userCookie}`" class="user-pill">
            👤 {{ userCookie }}
          </NuxtLink>
          <button @click="handleLogout" class="logout-btn">Esci</button>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="login-nav-btn">Login</NuxtLink>
        </template>
        
        <a href="https://github.com/alexdpl/hackernews" target="_blank" rel="noopener" class="github-link">
          Esplora su GitHub <strong style="color: #50C878;">↗</strong>
        </a>
      </div>
    </header>

    <main class="main-content">
      <slot />
    </main>

    <footer class="footer">
      <div class="footer-links">
	    <NuxtLink to="/blog">Blog</NuxtLink> •
        <NuxtLink to="/about">Chi Siamo</NuxtLink> • 
        <NuxtLink to="/features">Ecosistema & Features</NuxtLink> • 
        <NuxtLink to="/guidelines">Linee Guida</NuxtLink> • 
        <NuxtLink to="/terms">Termini d'Uso</NuxtLink> • 
        <NuxtLink to="/privacy">Privacy & Cookie</NuxtLink> • 
        <NuxtLink to="/contact">Contatti</NuxtLink>
      </div>
      <p class="footer-copy">
        © 2026 <strong>DevKernelPulse</strong> — Proudly built with ❤️ by Alessandro De Paola & Gemini AI. Tutti i diritti sono riservati.
      </p>
    </footer>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fcfcfc;
  color: #020420;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.navbar {
  background-color: #020420;
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
  position: relative;
  z-index: 50;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.nav-brand {
  font-weight: 700;
  font-size: 1.1rem;
  color: #ffffff;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.logo-badge {
  background: #00dc82;
  color: #020420;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.navbar-favicon {
  display: inline-block;
  vertical-align: middle;
}

.nav-links {
  display: flex;
  gap: 1.2rem;
  align-items: center;
  font-size: 0.9rem;
}

.nav-links a {
  color: #cbd5e1;
  text-decoration: none;
  transition: color 0.2s;
}

.nav-links a:hover, .nav-links a.router-link-active {
  color: #00dc82;
}

.dropdown-container {
  position: relative;
  display: inline-block;
  padding-bottom: 0.2rem;
}

.dropdown-toggle, .lang-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #cbd5e1;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  transition: color 0.2s;
  padding: 0;
}

.tools-toggle {
  color: #38bdf8;
  font-weight: 600;
}

.dropdown-toggle:hover, .dropdown-container:hover .dropdown-toggle, .lang-btn:hover {
  color: #00dc82;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 6px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  min-width: 190px;
  padding: 0.5rem 0;
  z-index: 100;
}

.dropdown-menu a {
  padding: 0.5rem 1rem;
  color: #cbd5e1;
  font-size: 0.85rem;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}

.dropdown-menu a:hover {
  background: #0f172a;
  color: #00dc82;
}

.submit-link {
  color: #00dc82 !important;
  font-weight: 600;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
}

.lang-menu {
  left: auto;
  right: 0;
}

.user-pill {
  background: #0f172a;
  color: #00dc82;
  padding: 0.3rem 0.7rem;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.85rem;
  border: 1px solid #1e293b;
}

.logout-btn {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #ef4444;
  color: #ffffff;
}

.login-nav-btn {
  background: #00dc82;
  color: #020420;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  font-weight: 700;
  text-decoration: none;
}

.login-nav-btn:hover {
  opacity: 0.9;
}

.github-link {
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.85rem;
}

.github-link:hover {
  color: #ffffff;
}

.main-content {
  flex: 1;
}

.footer {
  background-color: #020420;
  color: #94a3b8;
  text-align: center;
  padding: 1.5rem;
  font-size: 0.85rem;
  border-top: 1px solid #0f172a;
  margin-top: auto;
}

.footer-links {
  margin-bottom: 0.5rem;
}

.footer-links a {
  color: #cbd5e1;
  text-decoration: none;
}

.footer-links a:hover {
  color: #00dc82;
}

.footer-copy {
  color: #64748b;
  font-size: 0.75rem;
}
</style>