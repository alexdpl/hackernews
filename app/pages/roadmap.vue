<-- app/pages/roadmap.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { roadmapMilestones, type RoadmapMilestone } from '~/data/roadmap'
import DkpAdsWidget from '~/components/ads/DkpAdsWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

useDkpSeo({
  title: 'Roadmap & Changelog v2.6-PURE-SQL - DevKernelPulse',
  description: 'Roadmap ufficiale e Changelog v2.6-PURE-SQL: Albero Gerarchico Nodi, DKP Ai Nexus Safe-Diff Engine, DKP Mail Nexus (Resend + Brevo), SDK v1.1.0 e Blockchain Vault.',
  type: 'website',
  canonicalPath: '/roadmap'
})

const { data: roadmapRes } = await useFetch<any>('/api/roadmap', {
  default: () => ({ completion: 69, milestones: roadmapMilestones })
})

const milestones = computed<RoadmapMilestone[]>(() => {
  const list = roadmapRes.value?.milestones
  return Array.isArray(list) && list.length > 0 ? list : roadmapMilestones
})

const overallCompletion = computed<number>(() => Number(roadmapRes.value?.completion || 69))

const changelogV26 = [
  {
    area: 'DKP Ai Nexus© Safe-Diff & Undo Engine',
    badge: 'PATCHED & VERIFIED',
    items: [
      'Algoritmo LCS Word-Diff granulare con guardrail anti-troncamento e protezione strutturale su blocchi codice, liste, link, immagini e tabelle.',
      'Undo/Redo Stack deterministico (Ctrl+Z / Ctrl+Y) su tutte le trasformazioni AI e fix grammaticali, più rendering corretto delle liste puntate e numerate in Zen Mode.'
    ]
  },
  {
    area: 'Albero Gerarchico Nodi & Sub-Nodi (Parent -> Children)',
    badge: 'PURE SQL TREE',
    items: [
      'Riordino semantico della tabella nodes su PostgreSQL con risoluzione deterministica dei nodi orfani, controllo anti-ciclo padre-figlio e API dedicata /api/nodes/tree.',
      'Gestione Accordion interattiva in Admin (/admin/nodes) con azioni dirette [Modifica], [Elimina], [+ Sub] sincronizzate istantaneamente con l\'hub pubblico /nodes.'
    ]
  },
  {
    area: '@devkernelpulse/sdk v1.1.0 & Sentinel Scan',
    badge: 'DEPLOYED',
    items: [
      'Rilascio @devkernelpulse/sdk v1.1.0 con moduli completi AI, Vault, Blog, Sentinel Scan (SAST + AI) e OpenUI Studio.',
      'Certificazione crittografica Proof of Safety SHA-256 concatenata sul ledger pubblico n/blockchain-vault con verifica hash/blocco.'
    ]
  },
  {
    area: 'OpenUI Studio AI & BEMYAGENT.md',
    badge: 'SAAS + TTEV',
    items: [
      'Streaming Tailwind/HTML in OpenUI Studio con audit automatico Sentinel e sigillo Proof of Safety.',
      'Integrazione workspace BEMYAGENT.md e telemetria TTEV / Sentinelle accessibile anche via SDK (dkp.openui.bemyAgentWorkspace).'
    ]
  },
  {
    area: 'DKP Shop, Stripe & Ads Network v2.6',
    badge: 'MONETIZATION',
    items: [
      'Checkout Stripe Checkout + Webhook idempotente con rilascio License Key (DKP-...) e chiavi SaaS per Sentinel, OpenUI + BEMYAGENT e Vault Packs.',
      'Unificazione circuito Ads su 3 modelli (Visualizzazioni, Click, Ibrido) sincronizzati con la dashboard personale I Miei Link & Ads (/user/ads).'
    ]
  },
  {
    area: 'DKP Mail Nexus© 2.6 & Pulsebot',
    badge: 'DUAL-PROVIDER',
    items: [
      'Adapter unificato IMailProvider con Resend API (Sentinel Network, alert critici) e Brevo (Newsletter Double Opt-In, autoresponder) con webhook idempotente su PostgreSQL.',
      'Sentinella guardiana Pulsebot (BEMYAGENT.md) per audit build, dipendenze, sicurezza chiavi .env e gate CI/CD Playwright.'
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
          Unificazione Ecosistema, Albero Nodi Gerarchico &amp; DKP Ai Nexus© Safe-Diff
        </h2>
        <p class="text-dkp-muted text-sm leading-relaxed m-0">
          Con <strong>DKP Kernel v2.6 Pure SQL</strong> l'intera piattaforma opera su un design system unificato (<strong>DKP Sentinel Style</strong>), query SQL parametrizzate su Neon PostgreSQL, albero gerarchico Nodi/Sub-Nodi sincronizzato, cinque Sentinelle autonome e infrastruttura mail asincrona dual-provider.
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
	<DkpAdsWidget
             placement="feedInline"
              layout="horizontal"
              :limit="3"
              :show-advertise-link="true"
           />
		   <DkpAdStrip />
  </DkpLayout>
</template>