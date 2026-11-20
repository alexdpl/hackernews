<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const mainSections = [
  { to: '/', label: 'Home Hub' },
  { to: '/news', label: 'Tech Feed (News)' },
  { to: '/nodes', label: 'Nodes & Talks' },
  { to: '/blog', label: 'Editorial Blog' },
  { to: '/tools', label: 'All Tools' }
]

const toolTabs = [
  { to: '/tools/proof-of-code', label: 'Proof of Code' },
  { to: '/tools/openui-studio', label: 'OpenUI Studio' },
  { to: '/tools/ai-repo-scanner', label: 'Repo Scanner' },
  { to: '/tools/terminal', label: 'Terminal' },
  { to: '/tools/ai-scanner', label: 'AI Scanner' },
  { to: '/tools/cli-toolkit', label: 'CLI Toolkit' }
]

function isActive(target: string): boolean {
  return route.path === target || route.path.startsWith(`${target}/`)
}
</script>

<template>
  <header class="sticky top-0 z-40 bg-[#050914]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 font-mono text-xs">
    <div class="max-w-7xl mx-auto flex flex-col gap-2.5">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-1.5">
          <NuxtLink
            v-for="sec in mainSections"
            :key="sec.to"
            :to="sec.to"
            :class="[
              'px-3 py-1.5 rounded-xl no-underline font-bold border transition-colors',
              sec.to !== '/' && isActive(sec.to)
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/60'
                : 'bg-[#020617] text-slate-300 border-slate-800 hover:border-cyan-400/50 hover:text-white'
            ]"
          >
            {{ sec.label }}
          </NuxtLink>
        </div>

        <NuxtLink
          to="/user/dashboard"
          class="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-extrabold no-underline transition-colors"
        >
          Dashboard
        </NuxtLink>
      </div>

      <nav aria-label="Navigazione Tools" class="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/70 overflow-x-auto">
        <NuxtLink
          v-for="t in toolTabs"
          :key="t.to"
          :to="t.to"
          :class="[
            'px-2.5 py-1 rounded-lg no-underline text-[11px] font-bold border transition-colors whitespace-nowrap',
            isActive(t.to)
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold'
              : 'bg-[#020617]/80 text-slate-400 border-slate-800/90 hover:text-white hover:border-slate-600'
          ]"
        >
          {{ t.label }}
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>