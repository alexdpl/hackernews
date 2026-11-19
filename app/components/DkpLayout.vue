<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

interface Props {
  title?: string
  subtitle?: string
  seoTitle?: string
  seoDescription?: string
  noindex?: boolean
  hideSidebar?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Sentinel Network',
  subtitle: 'v2.6 | Pure SQL | Autonomous Agents',
  seoTitle: 'DevKernelPulse — Sentinel Network & Pure SQL Engineering',
  seoDescription: 'Ecosistema developer governato da Sentinelle AI (BEMYAGENT.md), notarizzazione SHA-256 e architetture Pure SQL.',
  noindex: false,
  hideSidebar: false
})

const route = useRoute()
const { currentUser } = useAuthCore()

useDkpSeo({
  title: props.seoTitle,
  description: props.seoDescription,
  noindex: props.noindex
})

const topNav = [
  { to: '/', label: 'Home' },
  { to: '/nodes', label: 'Nodes' },
  { to: '/blog', label: 'Blog' },
  { to: '/tools', label: 'Tools' },
  { to: '/roadmap', label: 'Roadmap' }
]

const sideSections = [
  { to: '/feed', label: 'Latest Feed', badge: 'LIVE' },
  { to: '/newest', label: 'Newest' },
  { to: '/ask', label: 'Ask HN' },
  { to: '/show', label: 'Show HN' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/nodes/blockchain-vault', label: 'n/blockchain-vault', badge: 'SHA-256' }
]

const isActive = (path: string) => computed(() => route.path === path)
</script>

<template>
  <div class="bg-dkp-bg text-dkp-text font-display min-h-screen bg-grid-pattern relative selection:bg-dkp-accent selection:text-dkp-bg">
    <!-- Background Glow -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>
    </div>

    <div class="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">
      <!-- Header Unificato -->
      <header class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-dkp-border/60 pb-6">
        <div>
          <NuxtLink to="/" class="no-underline group">
            <h1 class="font-display text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3 text-dkp-text group-hover:text-dkp-accent transition-colors m-0">
              <svg class="w-10 h-10 text-dkp-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.198.698.264 1.074.106.346-.146.638-.42.848-.766.093-.154.174-.315.24-.48l.214-1.281c.09-.543.56-.941 1.11-.941h2.594c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.314.686.645.87.074.04.147.083.22.127.357.198.727.264 1.095.106.355-.146.654-.42.87-.776.093-.154.186-.326.252-.494l.162-.965c.227-.047.46-.047.687 0l.162.965c.066.168.159.34.252.494.216.356.515.63.87.776.368.158.738.092 1.095-.106.073-.044.146-.087.22-.127.332-.184.582-.496.645-.87l.214-1.281c.09-.543.56-.941 1.11-.941h2.594c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.198.698.264 1.074.106.346-.146.638-.42.848-.766.11-.18.198-.37.263-.569l.162-.965c.227-.047.46-.047.687 0l.162.965c.066.168.159.34.252.494.216.356.515.63.87.776.368.158.738.092 1.095-.106.073-.044.146-.087.22-.127.332-.184.582-.496.645-.87l.214-1.281c.09-.543.56-.941 1.11-.941h2.594c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.198.698.264 1.074.106.346-.146.638-.42.848-.766" />
              </svg>
              <span>{{ title }}</span>
            </h1>
          </NuxtLink>
          <p class="text-dkp-muted mt-2 font-mono text-sm m-0">{{ subtitle }}</p>
        </div>

        <nav class="flex flex-wrap items-center gap-4">
          <NuxtLink
            v-for="item in topNav"
            :key="item.to"
            :to="item.to"
            :class="[
              'transition-colors font-mono text-sm no-underline px-2.5 py-1.5 rounded-lg',
              isActive(item.to).value ? 'text-dkp-accent bg-dkp-card border border-dkp-accent/40 font-bold' : 'text-dkp-muted hover:text-white'
            ]"
          >
            {{ item.label }}
          </NuxtLink>

          <NuxtLink
            v-if="currentUser"
            to="/user/dashboard"
            class="font-mono text-xs font-bold px-3.5 py-2 rounded-lg bg-dkp-accent/15 border border-dkp-accent/50 text-dkp-accent hover:bg-dkp-accent hover:text-dkp-bg transition-all no-underline"
          >
            ⚡ @{{ currentUser.username }}
          </NuxtLink>
          <NuxtLink
            v-else
            to="/user/dashboard"
            class="font-mono text-xs font-bold px-3.5 py-2 rounded-lg bg-dkp-card border border-dkp-border text-dkp-text hover:border-dkp-accent transition-all no-underline"
          >
            🔐 Console
          </NuxtLink>
        </nav>
      </header>

      <!-- Main Content Grid -->
      <main :class="hideSidebar ? 'grid grid-cols-1 gap-8' : 'grid grid-cols-1 lg:grid-cols-4 gap-8'">
        <!-- Sidebar / Navigation -->
        <aside v-if="!hideSidebar" class="lg:col-span-1 space-y-6">
          <div class="bg-dkp-card border border-dkp-border rounded-lg p-4 card-glow">
            <h3 class="text-dkp-accent font-mono text-sm mb-4 uppercase tracking-wider m-0">Sections</h3>
            <ul class="space-y-2 list-none p-0 m-0">
              <li v-for="sec in sideSections" :key="sec.to">
                <NuxtLink
                  :to="sec.to"
                  :class="[
                    'flex items-center justify-between px-3 py-2 rounded transition-colors no-underline text-sm font-mono',
                    isActive(sec.to).value
                      ? 'bg-dkp-bg border border-dkp-accent/50 text-dkp-accent font-bold'
                      : 'hover:bg-dkp-border/50 text-dkp-text'
                  ]"
                >
                  <span>{{ sec.label }}</span>
                  <span v-if="sec.badge" class="text-[10px] px-1.5 py-0.5 rounded bg-dkp-accent/10 text-dkp-accent border border-dkp-accent/30">
                    {{ sec.badge }}
                  </span>
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Widget: Sentinel Status -->
          <div class="bg-dkp-card border border-dkp-border rounded-lg p-4 card-glow">
            <h3 class="text-dkp-accent font-mono text-sm mb-4 uppercase tracking-wider m-0">System Health</h3>
            <div class="flex items-center gap-2.5 mb-2.5">
              <span class="status-dot bg-dkp-pass text-dkp-pass"></span>
              <span class="text-sm text-dkp-text font-mono">Core Services: Online</span>
            </div>
            <div class="flex items-center gap-2.5 mb-3">
              <span class="status-dot bg-dkp-accent text-dkp-accent"></span>
              <span class="text-sm text-dkp-text font-mono">AI Sentinels: Active</span>
            </div>
            <div class="pt-3 border-t border-dkp-border/70 flex items-center justify-between text-[11px] font-mono text-dkp-muted">
              <span>Contract: BEMYAGENT.md</span>
              <span class="text-dkp-pass font-bold">v2.6</span>
            </div>
          </div>

          <slot name="sidebar-extra" />
        </aside>

        <!-- Main Feed/Content -->
        <section :class="hideSidebar ? 'col-span-1 space-y-6' : 'lg:col-span-3 space-y-6'">
          <slot />
        </section>
      </main>

      <!-- Footer Unificato -->
      <footer class="mt-12 pt-8 border-t border-dkp-border flex flex-col sm:flex-row items-center justify-between gap-4 text-dkp-muted font-mono text-xs">
        <p class="m-0">&copy; 2026 DevKernelPulse. Powered by Pure SQL &amp; Autonomous AI.</p>
        <div class="flex items-center gap-4">
          <NuxtLink to="/ecosystem" class="text-dkp-muted hover:text-dkp-accent no-underline">Ecosystem</NuxtLink>
          <NuxtLink to="/roadmap" class="text-dkp-muted hover:text-dkp-accent no-underline">Roadmap</NuxtLink>
          <NuxtLink to="/faq" class="text-dkp-muted hover:text-dkp-accent no-underline">FAQ</NuxtLink>
        </div>
      </footer>
    </div>
  </div>
</template>