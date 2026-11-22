<script setup lang="ts">
import { useRoute } from 'vue-router'

interface Props {
  title: string
  subtitle?: string
  badge?: string
  seoTitle?: string
  seoDescription?: string
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: 'Cruscotto operativo v2.6 Pure SQL • Sentinel Network & SHA-256 Vault',
  badge: 'DEVKERNELPULSE PRO V2.6 • PURE SQL & SHA-256 VAULT',
  seoTitle: 'Admin Control Panel — DevKernelPulse',
  seoDescription: 'Pannello amministrativo DevKernelPulse Pure SQL.'
})

useDkpSeo({
  title: props.seoTitle,
  description: props.seoDescription,
  noindex: true
})

const route = useRoute()

const adminNavItems = [
  { to: '/admin', label: 'Overview Main' },
  { to: '/admin/sentinels', label: 'Sentinel Bot' },
  { to: '/admin/nodes', label: 'Nodi & Forum' },
  { to: '/admin/blog', label: 'Editorial Blog' },
  { to: '/admin/crawler', label: 'Crawler AI' },
  { to: '/admin/api-gateway', label: 'API Gateway' },
  { to: '/admin/mail', label: 'Mail Center' },
  { to: '/admin/newsletter', label: 'Newsletter' },
  { to: '/admin/autoresponder', label: 'Autoresponder' },
  { to: '/admin/shop', label: 'Shop & ADS' },
  { to: '/admin/jobs', label: 'Tech Jobs' },
  { to: '/admin/bounties', label: 'Bounties' },
  { to: '/admin/users', label: 'Utenti & RBAC' },
  { to: '/admin/diagnostic', label: 'Diagnostic' },
  { to: '/admin/seo', label: 'SEO & Sitemap' }
]

function isNavActive(target: string) {
  if (target === '/admin') return route.path === '/admin'
  if (target === '/admin/mail') return route.path === '/admin/mail'
  if (target === '/admin/autoresponder') {
    return route.path === '/admin/autoresponder' || route.path === '/admin/mail/autoresponder'
  }
  return route.path === target || route.path.startsWith(`${target}/`)
}
</script>

<template>
  <div class="dkp-admin-root bg-dkp-bg text-dkp-text font-display min-h-screen bg-grid-pattern relative selection:bg-dkp-accent selection:text-slate-950">
    <!-- Background Glow stile Home -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>
    </div>

    <!-- TOP TELEMETRY BAR (Identica per stile a DkpHomeTelemetry) -->
    <div class="relative z-20 border-b border-dkp-border/80 bg-[#050914]/90 backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
        <div class="flex flex-wrap items-center gap-3">
          <span class="inline-flex items-center gap-1.5 text-emerald-400 font-extrabold">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
            KERNEL CONTROL PLANE
          </span>
          <span class="text-slate-600 hidden sm:inline">|</span>
          <span class="text-slate-300 hidden sm:inline">ENGINE: <strong class="text-cyan-300">PURE-SQL v2.6</strong></span>
          <span class="text-slate-600 hidden md:inline">|</span>
          <span class="text-slate-300 hidden md:inline">SENTINEL: <strong class="text-violet-300">DOCKEEPER + ARCHGUARD</strong></span>
        </div>

        <div class="flex items-center gap-2">
          <NuxtLink
            to="/nodes/n/blockchain-vault"
            class="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/35 text-emerald-300 hover:text-white font-bold no-underline transition-colors"
          >
            n/blockchain-vault
          </NuxtLink>
          <NuxtLink
            to="/"
            class="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/35 text-cyan-300 hover:text-white font-bold no-underline transition-colors"
          >
            &larr; Torna alla Home
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
      <!-- NAVBAR MODULI ADMIN -->
      <nav aria-label="Admin Navigation" class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-3 font-mono text-xs card-glow">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          <NuxtLink
            v-for="item in adminNavItems"
            :key="item.to"
            :to="item.to"
            :class="[
              'flex items-center justify-center text-center px-2.5 py-2 rounded-xl font-bold no-underline transition-all border truncate',
              isNavActive(item.to)
                ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 border-cyan-300 font-extrabold shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                : 'bg-[#050914] text-slate-200 hover:text-dkp-accent border-dkp-border hover:border-cyan-400/50'
            ]"
          >
            {{ item.label }}
          </NuxtLink>
        </div>
      </nav>

      <!-- HERO HEADER SEZIONE ADMIN (Stile Home Hero) -->
      <header class="bg-dkp-card/95 border border-dkp-border rounded-2xl px-6 py-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 card-glow">
        <div class="space-y-2.5">
          <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#050914] border border-dkp-border font-mono text-[11px] text-dkp-accent font-bold">
            <span class="text-amber-400 leading-none">&#9889;</span>
            <span>{{ badge }}</span>
            <slot name="status-badges" />
          </div>

          <h1 class="font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight m-0">
            <span class="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              {{ title }}
            </span>
          </h1>

          <p class="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed m-0">
            {{ subtitle }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5 font-mono text-xs shrink-0">
          <slot name="actions" />
        </div>
      </header>

      <!-- CONTENUTO MODULO -->
      <slot />
    </div>
  </div>
</template>

<style>
.dkp-admin-root {
  color-scheme: dark;
}

.dkp-admin-root input:not([type="checkbox"]):not([type="radio"]):not([type="color"]),
.dkp-admin-root select,
.dkp-admin-root textarea {
  background-color: #030712 !important;
  color: #f8fafc !important;
  border-color: #1e293b !important;
  color-scheme: dark;
}

.dkp-admin-root input::placeholder,
.dkp-admin-root textarea::placeholder {
  color: #64748b !important;
}

.dkp-admin-root input:focus,
.dkp-admin-root select:focus,
.dkp-admin-root textarea:focus {
  border-color: #22d3ee !important;
  outline: none !important;
  box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.2) !important;
}

.dkp-admin-root select option,
.dkp-admin-root select optgroup {
  background-color: #030712 !important;
  color: #f8fafc !important;
}
</style>