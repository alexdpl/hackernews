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
  subtitle: 'DKP Kernel v2.6 Pure SQL \u2022 Sentinel Network & BEMYAGENT TTEV',
  badge: 'v2.6 PURE-SQL',
  seoTitle: 'Admin Control Panel \u2014 DevKernelPulse',
  seoDescription: 'Pannello amministrativo DevKernelPulse Pure SQL.'
})

useDkpSeo({
  title: props.seoTitle,
  description: props.seoDescription,
  noindex: true
})

const route = useRoute()

const adminNavItems = [
  { to: '/admin', label: '🏠 Dashboard Main' },
  { to: '/admin/api-gateway', label: '⚙️ API Gateway' },
  { to: '/admin/mail', label: '📧 Mail Center' },
  { to: '/admin/newsletter', label: '📣 Newsletter' },
  { to: '/admin/autoresponder', label: '📡 Autoresponder' },
  { to: '/admin/crawler', label: '🤖 Crawler Engine' },
  { to: '/admin/blog', label: '📝 Gestione Blog' },
  { to: '/admin/nodes', label: '💬 Gestione Nodi' },
  { to: '/admin/shop', label: '🛍️ Shop & ADS' },
  { to: '/admin/jobs', label: '💼 Tech Jobs' },
  { to: '/admin/bounties', label: '🏆 Bounties' },
  { to: '/admin/users', label: '👥 Utenti & RBAC' },
  { to: '/admin/diagnostic', label: '🩺 Diagnostic' },
  { to: '/admin/seo', label: '🔎 SEO & Sitemap' }
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
    <!-- Background Glow -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>
    </div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
      <!-- NAVBAR ADMIN ORGANIZZATA IN GRIGLIA 2x2 -->
      <nav aria-label="Admin Navigation" class="bg-dkp-card/95 border border-cyan-500/35 rounded-2xl p-3.5 font-mono text-xs card-glow space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-dkp-border/80">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
            <span class="text-[11px] font-extrabold text-cyan-400 tracking-wider uppercase">
              DKP ADMIN CONTROL CENTER &bull; NAV 2&times;2
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-slate-400 hidden sm:inline">v2.6-PURE-SQL</span>
            <NuxtLink
              to="/"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:text-white font-bold text-[11px] no-underline transition-colors"
            >
              &larr; Sito Live
            </NuxtLink>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <NuxtLink
            v-for="item in adminNavItems"
            :key="item.to"
            :to="item.to"
            :class="[
              'flex items-center justify-center text-center px-2 py-2 rounded-xl font-bold no-underline transition-all border truncate',
              isNavActive(item.to)
                ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                : 'bg-dkp-bg/90 text-slate-200 hover:text-cyan-400 border-dkp-border hover:border-cyan-400/50'
            ]"
          >
            {{ item.label }}
          </NuxtLink>
        </div>
      </nav>

      <!-- HEADER SEZIONE ADMIN -->
      <header class="bg-dkp-card/95 border border-dkp-border rounded-2xl px-6 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 card-glow">
        <div>
          <div class="flex flex-wrap items-center gap-2.5 mb-2 font-mono">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold uppercase">
              &#9889; {{ badge }}
            </span>
            <slot name="status-badges" />
          </div>
          <h1 class="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white m-0">
            {{ title }}
          </h1>
          <p class="font-mono text-xs text-slate-300 m-0 mt-1.5">
            {{ subtitle }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          <slot name="actions" />
        </div>
      </header>

      <!-- CONTENUTO MODULO -->
      <slot />
    </div>
  </div>
</template>

<style>
/* FORZA TUTTI I FORM, INPUT, SELECT E OPTION IN NERO IN TUTTA LA ADMIN */
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