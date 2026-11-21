<script setup lang="ts">
import { computed } from 'vue'
import { roadmapMilestones, type RoadmapMilestone } from '~/data/roadmap'

useDkpSeo({
  title: 'Roadmap & Changelog v2.6-PURE-SQL - DevKernelPulse',
  description: 'Roadmap ufficiale e Changelog v2.6-PURE-SQL: Unificazione Ecosistema, DKP Ai Nexus©, DKP Mail Nexus© (Resend + Brevo), 10 Macro-Nodi e Pulsebot.',
  type: 'website',
  canonicalPath: '/roadmap'
})

const { data: roadmapRes } = await useFetch<any>('/api/roadmap', {
  default: () => ({ completion: 65, milestones: roadmapMilestones })
})

const milestones = computed<RoadmapMilestone[]>(() => {
  const list = roadmapRes.value?.milestones
  return Array.isArray(list) && list.length > 0 ? list : roadmapMilestones
})

const overallCompletion = computed<number>(() => Number(roadmapRes.value?.completion || 65))

const changelogV26 = [
  {
    area: 'DKP Ai Nexus© & Editor',
    badge: 'NEW',
    items: [
      'Unificazione nomenclatura da AI Studio / AI Copilot a DKP Ai Nexus© su Blog e Nodes.',
      'Sentinella Passiva Grammarly-Style integrata in tempo reale con auto-rilevamento lingua (IT/EN) e fix 1-click.',
      'Fix rendering liste puntate (<ul>) e numerate (<ol>), highlight (<mark>) e codice inline (<code>) con Prism.js dinamico.'
    ]
  },
  {
    area: 'DKP Mail Nexus© 2.6',
    badge: 'DUAL-PROVIDER',
    items: [
      'Adapter unificato IMailProvider con Resend API (Sentinel Network, Chat Pulse Nexus, alert critici) e Brevo (Newsletter Double Opt-In, posta ordinaria, autoresponder) con failover automatico.',
      'Endpoint webhook idempotente (/api/webhooks/brevo) su PostgreSQL per gestire hard_bounce, spam e unsubscribed senza duplicati.'
    ]
  },
  {
    area: 'Gerarchia 10 Macro-Nodi & Vault',
    badge: 'PURE SQL',
    items: [
      'Riordino semantico dei sub-nodi su 10 Macro-Domini tematici bilanciati (DKP Core, Community, Dev/Arch, AI/LLM, Security, Cloud/DB, Tools, Blockchain, Mobile, Programming Languages).',
      'Notarizzazione SHA-256 concatenata su dkp_vault_ledger per discussioni Forum e articoli Editorial Hub.'
    ]
  },
  {
    area: 'Pulsebot & Resilienza SSR',
    badge: 'SENTINEL',
    items: [
      'Nuova Sentinella guardiana Pulsebot (BEMYAGENT.md) per audit build, dipendenze, sicurezza chiavi .env e allineamento endpoint.',
      'Hardening SSR sulle rotte dinamiche /[feed] e gate CI/CD Playwright su Google Cloud Run.'
    ]
  }
]
</script>

<template>
  <DkpLayout
    title="Roadmap & Changelog v2.6-PURE-SQL"
    subtitle="Milestone completate, Changelog v2.6 e sviluppo futuro dell'ecosistema DKP"
    :show-sidebar-ads="true"
  >
    <div class="space-y-6">
      <!-- HERO STATO AVANZAMENTO v2.6 -->
      <div class="bg-dkp-card border border-dkp-border rounded-xl p-6 card-glow space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded">
              LIVE IN PRODUZIONE &bull; v2.6-PURE-SQL
            </span>
            <span class="text-xs font-mono text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded">
              BEMYAGENT.md + PULSEBOT ACTIVE
            </span>
          </div>
          <span class="font-mono text-xs text-dkp-muted">
            Avanzamento Roadmap Globale: <strong class="text-emerald-400">{{ overallCompletion }}%</strong>
          </span>
        </div>

        <h2 class="text-2xl font-extrabold text-dkp-text m-0">
          Unificazione Ecosistema, DKP Ai Nexus© &amp; Mail Nexus© 2.6
        </h2>
        <p class="text-dkp-muted text-sm leading-relaxed m-0">
          Con <strong>DKP Kernel v2.6 Pure SQL</strong> l'intera piattaforma opera su un design system unificato (<strong>DKP Sentinel Style</strong>), query SQL parametrizzate su Neon PostgreSQL, cinque Sentinelle autonome (<code>sentinel_ai</code>, <code>guardian_bot</code>, <code>snippet_master</code>, <code>security_watch</code> e <code>pulsebot</code>) e infrastruttura mail asincrona dual-provider.
        </p>

        <div class="w-full h-2.5 bg-dkp-bg border border-dkp-border rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 transition-all duration-500"
            :style="{ width: `${overallCompletion}%` }"
          />
        </div>
      </div>

      <!-- CHANGELOG FINALE v2.6 -->
      <div class="bg-dkp-card border border-emerald-500/30 rounded-xl p-6 card-glow space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2 border-b border-dkp-border pb-3">
          <h3 class="text-lg font-extrabold text-dkp-text m-0 font-mono">
            Changelog Ufficiale &bull; DKP Kernel v2.6-PURE-SQL
          </h3>
          <span class="text-[11px] font-mono text-emerald-400">VERIFIED &amp; DEPLOYED</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="block in changelogV26"
            :key="block.area"
            class="bg-dkp-bg border border-dkp-border rounded-lg p-4 space-y-2.5"
          >
            <div class="flex items-center justify-between gap-2">
              <h4 class="text-sm font-bold text-dkp-accent m-0">{{ block.area }}</h4>
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {{ block.badge }}
              </span>
            </div>
            <ul class="text-xs text-dkp-muted space-y-1.5 pl-4 list-disc m-0 leading-relaxed">
              <li v-for="(item, idx) in block.items" :key="idx">{{ item }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- TIMELINE MILESTONE COMPLETA -->
      <div class="space-y-4">
        <div
          v-for="m in milestones"
          :key="m.id"
          class="bg-dkp-card border border-dkp-border rounded-xl p-5 card-glow space-y-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-dkp-bg border border-dkp-border text-dkp-text">
                {{ m.quarter }} &bull; {{ m.version }}
              </span>
              <span
                :class="[
                  'font-mono text-[11px] font-bold px-2.5 py-0.5 rounded border uppercase',
                  m.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : m.status === 'in-progress'
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                      : 'bg-slate-800/70 text-slate-300 border-slate-700'
                ]"
              >
                {{ m.status === 'completed' ? 'Completato' : m.status === 'in-progress' ? 'In Corso' : 'In Arrivo' }} ({{ m.progress }}%)
              </span>
            </div>
          </div>

          <h3 class="text-lg font-bold text-dkp-text m-0">{{ m.phaseTitle }}</h3>
          <p class="text-sm text-dkp-muted m-0 leading-relaxed">{{ m.description }}</p>

          <ul class="text-xs text-dkp-muted space-y-1 pl-4 list-disc m-0 font-mono">
            <li v-for="(feat, fIdx) in m.features" :key="fIdx">{{ feat }}</li>
          </ul>
        </div>
      </div>
    </div>
  </DkpLayout>
</template>