<!-- app/components/DKPMobileNav.vue -->
<script setup lang="ts">
import { ref, watch, onUnmounted, computed, isRef } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isOpen = ref(false)

const auth = useAuthCore() || {}

// Estrazione utente reattiva per mostrare gli XP aggiornati in tempo reale anche da mobile
const currentUser = computed(() => {
  if (isRef(auth.user)) return auth.user.value
  return auth.user || null
})

const userXp = computed(() => currentUser.value?.xp || 850)
const userLevel = computed(() => currentUser.value?.level || 1)

// Chiusura automatica al cambio pagina
watch(() => route.fullPath, () => {
  closeMenu()
})

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
  <div class="dkp-mobile-nav-container md:hidden">
    <!-- HAMBURGER BUTTON PER MOBILE -->
    <button 
      @click="toggleMenu" 
      class="hamburger-btn flex flex-col justify-center items-center w-11 h-11 bg-slate-900/90 border border-emerald-500/30 rounded-xl focus:outline-none transition-all"
      :class="{ active: isOpen }"
      aria-label="Toggle Mobile Menu"
    >
      <span class="bar bar-1 w-5 h-0.5 bg-slate-100 rounded transition-all duration-300"></span>
      <span class="bar bar-2 w-5 h-0.5 bg-slate-100 rounded my-1 transition-all duration-300"></span>
      <span class="bar bar-3 w-5 h-0.5 bg-slate-100 rounded transition-all duration-300"></span>
    </button>

    <!-- BACKDROP SCURO CON BLUR -->
    <Transition name="fade">
      <div v-if="isOpen" @click="closeMenu" class="mobile-backdrop fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99990]"></div>
    </Transition>

    <!-- DRAWER LATERALE MOBILE -->
    <Transition name="slide">
      <div v-if="isOpen" class="mobile-drawer fixed top-0 right-0 bottom-0 w-[85%] max-w-[340px] bg-[#060a12] border-l border-emerald-500/30 shadow-2xl z-[99995] flex flex-col p-5 overflow-y-auto">
        <!-- HEADER DRAWER -->
        <div class="drawer-header flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
          <div class="brand-box flex items-center gap-2">
            <span class="brand-logo bg-emerald-500 text-slate-950 font-black text-xs px-1.5 py-0.5 rounded">DK</span>
            <span class="brand-name font-extrabold text-sm text-white">DevKernelPulse</span>
            <span class="version-badge text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1 py-0.5 rounded font-mono">v2.5-GOLD</span>
          </div>
          <button @click="closeMenu" class="close-btn text-slate-400 hover:text-white text-lg font-bold">✕</button>
        </div>

        <!-- BADGE LIVE XP & LEVEL NEL DRAWER -->
        <div class="xp-widget-mobile mb-4 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-emerald-400 text-lg">⚡</span>
            <div>
              <div class="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Gamification Status</div>
              <div class="text-sm font-bold text-emerald-300 font-mono">{{ userXp }} XP <span class="text-xs font-normal text-slate-400">(Lv. {{ userLevel }})</span></div>
            </div>
          </div>
          <span class="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-md font-mono">ACTIVE</span>
        </div>

        <!-- CONTENUTO MENU MOBILE -->
        <div class="drawer-nav-list flex flex-col gap-5 flex-1">
          
          <!-- SEZIONE MAIN NAVIGATION -->
          <div class="nav-section flex flex-col gap-1.5">
            <span class="section-title text-[10px] font-extrabold text-slate-500 tracking-widest uppercase">NAVIGAZIONE</span>
            <NuxtLink to="/" class="mobile-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 transition text-sm font-semibold">
              <span class="icon">📰</span> Tech Feed <span class="tag-v ml-auto text-[10px] text-slate-500 font-mono">v2.5</span>
            </NuxtLink>
            <NuxtLink to="/submit" class="mobile-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 transition text-sm font-bold">
              <span class="icon">⚡</span> Invia Post (+30 XP)
            </NuxtLink>
            <NuxtLink to="/blog" class="mobile-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 transition text-sm font-semibold">
              <span class="icon">📝</span> DKP Blog
            </NuxtLink>
          </div>

          <!-- SEZIONE AMMINISTRAZIONE -->
          <div class="nav-section flex flex-col gap-1.5">
            <span class="section-title text-[10px] font-extrabold text-slate-500 tracking-widest uppercase">AMMINISTRAZIONE DKP</span>
            <NuxtLink to="/admin" class="mobile-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition text-sm font-semibold">
              <span class="icon">🔒</span> Control Center Admin
            </NuxtLink>
            <NuxtLink to="/admin/crawler" class="mobile-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition text-sm font-semibold">
              <span class="icon">🤖</span> Crawler Engine v2.5
            </NuxtLink>
            <NuxtLink to="/admin/mail" class="mobile-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sky-400 bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 transition text-sm font-semibold">
              <span class="icon">📬</span> DKP Mail Center
            </NuxtLink>
          </div>

          <!-- SEZIONE TOOLS & ECOSYSTEM -->
          <div class="nav-section flex flex-col gap-1.5">
            <span class="section-title text-[10px] font-extrabold text-slate-500 tracking-widest uppercase">DKP TOOLS SUITE</span>
            <NuxtLink to="/vault" class="mobile-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent transition text-sm font-semibold">
              <span class="icon">🛡️</span> Proof of Code (Vault)
            </NuxtLink>
            <NuxtLink to="/scanner" class="mobile-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent transition text-sm font-semibold">
              <span class="icon">🔍</span> AI Code Scanner v2
            </NuxtLink>
            <NuxtLink to="/terminal" class="mobile-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent transition text-sm font-semibold">
              <span class="icon">💻</span> Terminal Web Shell
            </NuxtLink>
          </div>

        </div>

        <!-- FOOTER DRAWER -->
        <div class="drawer-footer mt-6 border-t border-slate-800 pt-3 flex flex-col gap-1">
          <div class="status-indicator flex items-center gap-2 text-xs text-emerald-400 font-mono">
            <span class="status-led w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]"></span>
            <span>Kernel v2.5-GOLD Active</span>
          </div>
          <span class="author-note text-[11px] text-slate-500">Built by Alessandro De Paola & Gemini AI</span>
        </div>

      </div>
    </Transition>
  </div>
</template>

<style scoped>
.hamburger-btn.active .bar-1 {
  transform: translateY(6px) rotate(45deg);
}
.hamburger-btn.active .bar-2 {
  opacity: 0;
}
.hamburger-btn.active .bar-3 {
  transform: translateY(-6px) rotate(-45deg);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>