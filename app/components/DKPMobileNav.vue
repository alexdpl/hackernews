<!-- app/components/DKPMobileNav.vue -->
<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isOpen = ref(false)

// Chiusura automatica al cambio pagina
watch(() => route.fullPath, () => {
  closeMenu()
})

// Blocco dello scroll del body quando il drawer è aperto
function toggleMenu() {
  isOpen.value = !isOpen.value
  if (typeof document !== 'undefined') {
    document.body.style.overflow = isOpen.value ? 'hidden' : ''
  }
}

function closeMenu() {
  isOpen.value = false
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
}

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <div class="dkp-mobile-nav-container">
    <!-- HAMBURGER BUTTON PER MOBILE (< 768px) -->
    <button 
      @click="toggleMenu" 
      class="hamburger-btn" 
      :class="{ active: isOpen }"
      aria-label="Toggle Mobile Menu"
    >
      <span class="bar bar-1"></span>
      <span class="bar bar-2"></span>
      <span class="bar bar-3"></span>
    </button>

    <!-- BACKDROP SCURO CON BLUR -->
    <Transition name="fade">
      <div v-if="isOpen" @click="closeMenu" class="mobile-backdrop"></div>
    </Transition>

    <!-- DRAWER LATERALE MOBILE -->
    <Transition name="slide">
      <div v-if="isOpen" class="mobile-drawer">
        <!-- HEADER DRAWER -->
        <div class="drawer-header">
          <div class="brand-box">
            <span class="brand-logo">DK</span>
            <span class="brand-name">DevKernelPulse</span>
            <span class="version-badge">v2.4-GOLD</span>
          </div>
          <button @click="closeMenu" class="close-btn">✕</button>
        </div>

        <!-- CONTENUTO MENU MOBILE -->
        <div class="drawer-nav-list">
          
          <!-- SEZIONE MAIN NAVIGATION -->
          <div class="nav-section">
            <span class="section-title">NAVIGAZIONE</span>
            <NuxtLink to="/" class="mobile-link">
              <span class="icon">📰</span> Tech Feed <span class="tag-v">v2.4</span>
            </NuxtLink>
            <NuxtLink to="/submit" class="mobile-link highlight">
              <span class="icon">⚡</span> Invia Post (+15 XP)
            </NuxtLink>
            <NuxtLink to="/blog" class="mobile-link">
              <span class="icon">📝</span> DKP Blog
            </NuxtLink>
          </div>

          <!-- SEZIONE AMMINISTRAZIONE & MAIL ENGINE v2.4 -->
          <div class="nav-section">
            <span class="section-title">AMMINISTRAZIONE DKP</span>
            <NuxtLink to="/admin" class="mobile-link admin-link">
              <span class="icon">🔒</span> Control Center Admin
            </NuxtLink>
            <NuxtLink to="/admin/mail" class="mobile-link mail-link">
              <span class="icon">📬</span> DKP Mail Center <span class="badge-cyan">v2.4</span>
            </NuxtLink>
            <NuxtLink to="/admin/newsletter" class="mobile-link mail-link">
              <span class="icon">📣</span> Newsletter & Contatti
            </NuxtLink>
            <NuxtLink to="/admin/autoresponder" class="mobile-link mail-link">
              <span class="icon">🤖</span> Autoresponder Rules
            </NuxtLink>
          </div>

          <!-- SEZIONE TOOLS & ECOSYSTEM -->
          <div class="nav-section">
            <span class="section-title">DKP TOOLS SUITE</span>
            <NuxtLink to="/vault" class="mobile-link">
              <span class="icon">🛡️</span> Proof of Code (Vault)
            </NuxtLink>
            <NuxtLink to="/scanner" class="mobile-link">
              <span class="icon">🔍</span> AI Code Scanner v2
            </NuxtLink>
            <NuxtLink to="/terminal" class="mobile-link">
              <span class="icon">💻</span> Terminal Web Shell
            </NuxtLink>
          </div>

        </div>

        <!-- FOOTER DRAWER CON METRICHE RAPIDE -->
        <div class="drawer-footer">
          <div class="status-indicator">
            <span class="status-led"></span>
            <span class="status-text">Kernel v2.4-GOLD Active</span>
          </div>
          <span class="author-note">Built by Alessandro De Paola & Gemini AI</span>
        </div>

      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dkp-mobile-nav-container {
  display: block;
}

@media (min-width: 769px) {
  .dkp-mobile-nav-container {
    display: none; /* Visibile solo su schermi smartphone e tablet */
  }
}

/* HAMBURGER BUTTON STYLING */
.hamburger-btn {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(0, 220, 130, 0.3);
  border-radius: 8px;
  width: 42px;
  height: 42px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  padding: 0;
  transition: all 0.25s ease;
}

.hamburger-btn:hover, .hamburger-btn.active {
  border-color: #00dc82;
  box-shadow: 0 0 12px rgba(0, 220, 130, 0.4);
}

.bar {
  width: 20px;
  height: 2px;
  background-color: #f8fafc;
  border-radius: 2px;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.hamburger-btn.active .bar-1 {
  transform: translateY(7px) rotate(45deg);
}
.hamburger-btn.active .bar-2 {
  opacity: 0;
}
.hamburger-btn.active .bar-3 {
  transform: translateY(-7px) rotate(-45deg);
}

/* BACKDROP OVERLAY */
.mobile-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.82);
  backdrop-filter: blur(8px);
  z-index: 99990;
}

/* DRAWER CONTAINER */
.mobile-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 85%;
  max-width: 340px;
  background: #060a12;
  border-left: 1px solid rgba(0, 220, 130, 0.3);
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.9);
  z-index: 99995;
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  overflow-y: auto;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid #1e293b;
  margin-bottom: 1rem;
}

.brand-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-logo {
  background: #00dc82;
  color: #020420;
  font-weight: 900;
  font-size: 0.75rem;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}

.brand-name {
  font-weight: 800;
  font-size: 0.95rem;
  color: #fff;
}

.version-badge {
  font-size: 0.62rem;
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.3);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.2rem;
  cursor: pointer;
}

/* NAV LIST & SECTIONS */
.drawer-nav-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  flex: 1;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.section-title {
  font-size: 0.68rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 1px;
  margin-bottom: 0.2rem;
}

.mobile-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 600;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid transparent;
  transition: all 0.2s ease;
  min-height: 48px; /* Touch target ottimizzato */
}

.mobile-link:hover, .mobile-link.router-link-exact-active {
  background: rgba(0, 220, 130, 0.1);
  border-color: rgba(0, 220, 130, 0.4);
  color: #00dc82;
  transform: translateX(3px);
}

.mobile-link.highlight {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  border-color: rgba(0, 220, 130, 0.3);
  font-weight: 700;
}

.mobile-link.admin-link {
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.2);
}

.mobile-link.mail-link {
  color: #38bdf8;
}

.badge-cyan {
  font-size: 0.62rem;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  margin-left: auto;
}

.tag-v {
  font-size: 0.65rem;
  color: #94a3b8;
  margin-left: auto;
}

/* FOOTER DRAWER */
.drawer-footer {
  margin-top: 1.5rem;
  border-top: 1px solid #1e293b;
  padding-top: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
  color: #34d399;
}

.status-led {
  width: 7px;
  height: 7px;
  background: #34d399;
  border-radius: 50%;
  box-shadow: 0 0 8px #34d399;
}

.author-note {
  font-size: 0.65rem;
  color: #64748b;
}

/* ANIMAZIONI TRANSITION */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>