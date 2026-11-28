<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DkpAdsWidget from '~/components/ads/DkpAdsWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

interface Props {
  title?: string
  subtitle?: string
  icon?: string
  seoTitle?: string
  seoDescription?: string
  noindex?: boolean
  hideSidebar?: boolean
  hideSectionHeader?: boolean
  showSidebarAds?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Sentinel Network Control Panel',
  subtitle: 'DKP PRO v2.6 \u2022 BEMYAGENT.md \u2022 Pure SQL & SHA-256 Vault',
  icon: '\u26A1',
  seoTitle: 'DevKernelPulse \u2014 Piattaforma per Sviluppatori & Sentinel AI',
  seoDescription: 'Notarizzazione crittografica del codice, strumenti di sicurezza e aggregatore tech ad alto segnale arricchito in tempo reale da Trinity AI.',
  noindex: false,
  hideSidebar: false,
  hideSectionHeader: false,
  showSidebarAds: true
})

const route = useRoute()

const resolvedSeoTitle = computed(() =>
  props.seoTitle && props.seoTitle !== 'DevKernelPulse \u2014 Piattaforma per Sviluppatori & Sentinel AI'
    ? props.seoTitle
    : (props.title || 'DevKernelPulse')
)

const resolvedSeoDescription = computed(() =>
  props.seoDescription && props.seoDescription !== 'Notarizzazione crittografica del codice, strumenti di sicurezza e aggregatore tech ad alto segnale arricchito in tempo reale da Trinity AI.'
    ? props.seoDescription
    : (props.subtitle || 'DevKernelPulse v2.6-PURE-SQL')
)

useDkpSeo({
  title: resolvedSeoTitle.value,
  description: resolvedSeoDescription.value,
  noindex: props.noindex
})

const homeHubLink = { to: '/', label: '\uD83C\uDFE0 Home Hub' }

const newsHubSections = [
  { to: '/news', label: '\uD83E\uDD16 DKP News AI', badge: 'AI' },
  { to: '/feed', label: '\uD83C\uDF0D Latest Tech Feed', badge: 'LIVE' },
  { to: '/newest', label: '\uD83C\uDD95 Newest Stream' },
  { to: '/ask', label: '\u2753 Ask DKP' },
  { to: '/show', label: '\uD83D\uDE80 Show DKP' },
  { to: '/jobs', label: '\uD83D\uDCBC Tech Jobs' },
  { to: '/nodes', label: '\uD83D\uDCAC DKP Nodes Forum' },
  { to: '/blog', label: '\uD83D\uDCDD Editorial Blog' }
]

const toolsVaultSections = [
  { to: '/tools/sentinel-scan', label: '\uD83D\uDEE1\uFE0F Sentinel Scan', badge: 'SAST' },
  { to: '/tools/openui-studio', label: '\uD83C\uDFA8 OpenUI Studio AI', badge: 'v2.6' },
  { to: '/nodes/n/blockchain-vault', label: '\uD83D\uDD10 Blockchain Vault', badge: 'SHA-256' },
  { to: '/tools', label: '\uD83D\uDEE0\uFE0F Tutti i DKP Tools' },
  { to: '/tools/ai-repo-scanner', label: '\uD83E\uDD16 AI Repo Scanner' },
  { to: '/tools/terminal', label: '\uD83D\uDCBB Terminal Web Shell' },
  { to: '/tools/ai-scanner', label: '\uD83D\uDD0D AI Code Scanner' },
  { to: '/tools/proof-of-code', label: '\uD83D\uDEE1\uFE0F Proof of Code Vault' },
  { to: '/tools/cli-toolkit', label: '\u26A1 DKP CLI Toolkit' },
  { to: '/shop', label: '\uD83D\uDCB3 Shop & SaaS Plans' }
]

const sentinelAgents = [
  { handle: '@sentinel_ai', role: 'Feed & Core' },
  { handle: '@guardian_bot', role: 'Zero-Trust' },
  { handle: '@snippet_master', role: 'Code Vault' },
  { handle: '@security_watch', role: 'SAST Guard' }
]

const isActive = (path: string) => computed(() => route.path === path)
</script>

<template>
  <div class="bg-dkp-bg text-dkp-text font-display min-h-screen bg-grid-pattern relative selection:bg-dkp-accent selection:text-slate-950">
    <!-- Background Glow -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>
    </div>

    <div class="relative z-10 px-4 sm:px-6 py-6 md:py-8 max-w-7xl mx-auto">
      <!-- Header Sezione DKP Pro con Fulmine nella Pillola -->
      <div
        v-if="!hideSectionHeader"
        class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-dkp-card/95 backdrop-blur-xs border border-dkp-border rounded-2xl px-6 py-5 card-glow"
      >
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/35 text-dkp-accent font-mono text-[11px] font-bold mb-2.5">
            <span class="text-amber-400 text-xs leading-none">&#9889;</span>
            <span>{{ subtitle }}</span>
          </div>
          <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-dkp-text flex items-center gap-2.5 m-0">
            <span class="text-dkp-accent">{{ icon }}</span>
            <span>{{ title }}</span>
          </h1>
        </div>

        <div class="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          <slot name="header-actions" />
        </div>
      </div>

      <!-- Griglia Principale con Sidebar Verticale DKP Pro -->
      <div :class="hideSidebar ? 'grid grid-cols-1 gap-8' : 'grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8'">
        <aside v-if="!hideSidebar" class="lg:col-span-1 space-y-5">
          <!-- Navigazione Ecosistema -->
          <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 card-glow">
            <h3 class="text-dkp-accent font-mono text-xs font-bold mb-3 uppercase tracking-wider m-0 px-2 flex items-center justify-between">
              <span>&#129517; Navigazione</span>
              <span class="text-[10px] text-dkp-pass">DKP PRO</span>
            </h3>
            <div class="space-y-2.5">
              <NuxtLink
                :to="homeHubLink.to"
                :class="[
                  'flex items-center justify-between px-3 py-2 rounded-xl transition-all no-underline text-xs sm:text-sm font-mono',
                  isActive(homeHubLink.to).value
                    ? 'bg-cyan-500/15 border border-cyan-400/50 text-dkp-accent font-bold shadow-[0_0_14px_rgba(34,211,238,0.16)]'
                    : 'text-slate-200 hover:text-white hover:bg-slate-900/60 border border-transparent'
                ]"
              >
                <span>{{ homeHubLink.label }}</span>
              </NuxtLink>

              <div class="pt-2 border-t border-dkp-border/70">
                <div class="px-2 pb-1 text-[10px] font-mono font-extrabold uppercase tracking-wider text-sky-400">
                  Home &amp; News Hub
                </div>
                <ul class="space-y-1 list-none p-0 m-0">
                  <li v-for="sec in newsHubSections" :key="sec.to">
                    <NuxtLink
                      :to="sec.to"
                      :class="[
                        'flex items-center justify-between px-3 py-2 rounded-xl transition-all no-underline text-xs sm:text-sm font-mono',
                        isActive(sec.to).value
                          ? 'bg-cyan-500/15 border border-cyan-400/50 text-dkp-accent font-bold shadow-[0_0_14px_rgba(34,211,238,0.16)]'
                          : 'text-slate-200 hover:text-white hover:bg-slate-900/60 border border-transparent'
                      ]"
                    >
                      <span>{{ sec.label }}</span>
                      <span
                        v-if="sec.badge"
                        class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-dkp-pass border border-emerald-500/30 font-bold"
                      >
                        {{ sec.badge }}
                      </span>
                    </NuxtLink>
                  </li>
                </ul>
              </div>

              <div class="pt-2 border-t border-dkp-border/70">
                <div class="px-2 pb-1 text-[10px] font-mono font-extrabold uppercase tracking-wider text-emerald-400">
                  DKP Tools &amp; Vault
                </div>
                <ul class="space-y-1 list-none p-0 m-0">
                  <li v-for="sec in toolsVaultSections" :key="sec.to">
                    <NuxtLink
                      :to="sec.to"
                      :class="[
                        'flex items-center justify-between px-3 py-2 rounded-xl transition-all no-underline text-xs sm:text-sm font-mono',
                        isActive(sec.to).value
                          ? 'bg-emerald-500/15 border border-emerald-400/50 text-emerald-300 font-bold shadow-[0_0_14px_rgba(16,185,129,0.16)]'
                          : 'text-slate-200 hover:text-white hover:bg-slate-900/60 border border-transparent'
                      ]"
                    >
                      <span>{{ sec.label }}</span>
                      <span
                        v-if="sec.badge"
                        class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-dkp-pass border border-emerald-500/30 font-bold"
                      >
                        {{ sec.badge }}
                      </span>
                    </NuxtLink>
                  </li>
                </ul>
              </div>

              <div class="pt-2.5 border-t border-dkp-border/70">
                <NuxtLink
                  to="/submit"
                  :class="[
                    'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-extrabold no-underline transition-all',
                    isActive('/submit').value
                      ? 'bg-emerald-400 text-slate-950 shadow-[0_0_16px_rgba(16,185,129,0.35)]'
                      : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                  ]"
                >
                  <span>&#9889;</span>
                  <span>Invia / Submit</span>
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- BEMYAGENT.md • Sentinel Network Control Card -->
          <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 card-glow font-mono">
            <div class="flex items-center justify-between border-b border-dkp-border pb-2.5 mb-3">
              <h3 class="text-dkp-accent text-xs font-bold uppercase tracking-wider m-0">
                &#128737;&#65039; Sentinel &amp; BEMYAGENT
              </h3>
              <span class="text-[10px] px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 font-bold">
                TTEV
              </span>
            </div>

            <div class="space-y-2 text-xs mb-3">
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-2 text-slate-200">
                  <span class="status-dot bg-dkp-pass text-dkp-pass"></span>
                  Pure SQL Core
                </span>
                <span class="text-dkp-pass font-bold">ONLINE</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-2 text-slate-200">
                  <span class="status-dot bg-dkp-accent text-dkp-accent"></span>
                  Contract
                </span>
                <NuxtLink to="/docs/BEMYAGENT.md" class="text-dkp-accent hover:text-white font-bold no-underline">
                  BEMYAGENT.md
                </NuxtLink>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-1.5 pt-2.5 border-t border-dkp-border/80">
              <div
                v-for="agent in sentinelAgents"
                :key="agent.handle"
                class="flex items-center justify-between bg-dkp-bg/80 border border-dkp-border/80 px-2.5 py-1.5 rounded-lg text-[11px]"
              >
                <span class="text-slate-100 font-bold">{{ agent.handle }}</span>
                <span class="text-dkp-pass text-[10px]">{{ agent.role }}</span>
              </div>
            </div>
          </div>

          <!-- Circuito 1 Ads (Verticale - 3 Annunci Shop / House / Sponsor) -->
          <DkpAdsWidget
            v-if="showSidebarAds"
            placement="nodeTalks"
            layout="vertical"
            :limit="3"
            :compact="true"
          />

          <slot name="sidebar-extra" />
		  <DkpAdsWidget
      placement="feedInline"
      layout="vertical"
      :limit="3"
      :show-advertise-link="true"
    />
	<DkpAdStrip 
	placement="feedInline"
      layout="vertical"
      :limit="3"
	/>
        </aside>

        <!-- Contenuto Principale -->
        <section :class="hideSidebar ? 'col-span-1 space-y-6' : 'lg:col-span-3 space-y-6'">
          <slot />
        </section>
      </div>
    </div>
  </div>
</template>