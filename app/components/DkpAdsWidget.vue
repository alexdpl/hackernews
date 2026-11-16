<!-- app/components/ads/DkpAdsWidget.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { AdPlacement, DkpAdCampaign } from '~~/server/utils/dkpAdsService'

const props = withDefaults(
  defineProps<{
    placement?: AdPlacement
    layout?: 'horizontal' | 'vertical' | 'single'
    limit?: number
    compact?: boolean
    showAdvertiseLink?: boolean
  }>(),
  {
    placement: 'nodeTalks',
    layout: 'horizontal',
    limit: 3,
    compact: false,
    showAdvertiseLink: true
  }
)

const effectiveLimit = computed(() => (props.layout === 'single' ? 1 : Math.max(1, Math.min(6, props.limit))))

const LEGACY_CLIENT_REWRITES: Record<string, string> = {
  '/talks': '/nodes',
  '/node-talks': '/nodes',
  '/nodetalks': '/nodes',
  '/vault': '/nodes/n/blockchain-vault',
  '/proof-of-code': '/user/dashboard?tab=vault',
  '/api-console': '/user/dashboard?tab=api',
  '/keys': '/user/dashboard?tab=api',
  '/shop': '/bounties',
  '/sdk': '/docs/api',
  '/sentinel': '/docs/ecosystem'
}

function sanitizeAdUrl(rawUrl: string): { url: string; isInternal: boolean } {
  const clean = String(rawUrl || '').trim()
  if (!clean || clean === '#' || /^(javascript|data|vbscript):/i.test(clean)) {
    return { url: '/nodes', isInternal: true }
  }

  if (/^https?:\/\//i.test(clean)) {
    try {
      const parsed = new URL(clean)
      if (parsed.hostname.endsWith('devkernelpulse.org')) {
        return sanitizeAdUrl(`${parsed.pathname}${parsed.search}${parsed.hash}` || '/nodes')
      }
      return { url: parsed.toString(), isInternal: false }
    } catch {
      return { url: '/nodes', isInternal: true }
    }
  }

  const withSlash = clean.startsWith('/') ? clean : `/${clean}`
  const [basePath, queryPart] = withSlash.split('?')
  const normalizedBase = basePath.replace(/\/+$/, '') || '/'

  if (LEGACY_CLIENT_REWRITES[normalizedBase]) {
    const fixed = LEGACY_CLIENT_REWRITES[normalizedBase]
    return {
      url: queryPart && !fixed.includes('?') ? `${fixed}?${queryPart}` : fixed,
      isInternal: true
    }
  }

  return { url: withSlash, isInternal: true }
}

const FALLBACK_HOUSE_ADS: DkpAdCampaign[] = [
  {
    id: 'house-sdk-v1',
    title: '@devkernelpulse/sdk v1.0.0 Stable',
    tagline: 'Notarizzazione SHA-256 on-chain, AI Trinity e Pulse Sentinel SAST in un unico pacchetto TypeScript ufficiale.',
    badge: 'OFFICIAL NPM SDK',
    ctaText: 'Apri Docs & Snippet',
    targetUrl: '/docs/api',
    isInternal: true,
    placement: 'nodeTalks',
    tier: 'HOUSE',
    accentColor: 'emerald',
    impressionsCount: 0,
    clicksCount: 0,
    maxImpressions: null,
    status: 'active'
  },
  {
    id: 'house-blockchain-vault',
    title: 'DKP Blockchain Vault© & Auditor',
    tagline: 'Verifica l integrità crittografica SHA-256 dei blocchi e la Merkle Root sul ledger pubblico Pure-SQL.',
    badge: 'ON-CHAIN SECURITY',
    ctaText: 'Ispeziona Ledger',
    targetUrl: '/nodes/n/blockchain-vault',
    isInternal: true,
    placement: 'nodeTalks',
    tier: 'HOUSE',
    accentColor: 'sky',
    impressionsCount: 0,
    clicksCount: 0,
    maxImpressions: null,
    status: 'active'
  },
  {
    id: 'house-sentinel-sast',
    title: 'Pulse Sentinel SAST • Strict JSON',
    tagline: 'Audit statico e firewall AI alimentato da OpenRouter Structured Outputs (strict: true) con risposta deterministica.',
    badge: 'AI FIREWALL v2.6',
    ctaText: 'Scopri Architettura',
    targetUrl: '/docs/ecosystem',
    isInternal: true,
    placement: 'nodeTalks',
    tier: 'HOUSE',
    accentColor: 'purple',
    impressionsCount: 0,
    clicksCount: 0,
    maxImpressions: null,
    status: 'active'
  }
]

const { data: adsResponse, refresh: refreshAds } = await useFetch<{
  success: boolean
  data?: DkpAdCampaign[]
  campaigns?: DkpAdCampaign[]
}>('/api/ads/active', {
  key: `dkp-ads-widget-${props.placement}-${props.layout}-${effectiveLimit.value}`,
  query: {
    placement: props.placement,
    limit: effectiveLimit.value
  },
  default: () => ({
    success: true,
    data: FALLBACK_HOUSE_ADS.slice(0, effectiveLimit.value)
  })
})

const campaigns = computed<DkpAdCampaign[]>(() => {
  const rawList = adsResponse.value?.data || adsResponse.value?.campaigns || []
  const normalized = (Array.isArray(rawList) ? rawList : []).map((c, idx) => {
    const safe = sanitizeAdUrl(c.targetUrl)
    const fallbackAccent = (['emerald', 'sky', 'purple'] as const)[idx % 3]
    return {
      ...c,
      targetUrl: safe.url,
      isInternal: c.isInternal && safe.isInternal,
      accentColor: c.accentColor || fallbackAccent
    }
  })

  const usedIds = new Set(normalized.map((item) => item.id))
  const fillers = FALLBACK_HOUSE_ADS.filter((h) => !usedIds.has(h.id))
  return [...normalized, ...fillers].slice(0, effectiveLimit.value)
})

function getCardStyles(accent: DkpAdCampaign['accentColor']) {
  switch (accent) {
    case 'sky':
      return {
        border: 'border-sky-500/30 hover:border-sky-400/70',
        badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
        cta: 'bg-sky-500 hover:bg-sky-400 text-slate-950',
        glow: 'bg-sky-500/10'
      }
    case 'purple':
      return {
        border: 'border-purple-500/30 hover:border-purple-400/70',
        badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        cta: 'bg-purple-500 hover:bg-purple-400 text-white',
        glow: 'bg-purple-500/10'
      }
    case 'amber':
      return {
        border: 'border-amber-500/30 hover:border-amber-400/70',
        badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        cta: 'bg-amber-400 hover:bg-amber-300 text-slate-950',
        glow: 'bg-amber-500/10'
      }
    default:
      return {
        border: 'border-emerald-500/30 hover:border-emerald-400/70',
        badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        cta: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
        glow: 'bg-emerald-500/10'
      }
  }
}

// Telemetria Impressioni & Click (Pure-SQL)
const widgetRef = ref<HTMLElement | null>(null)
const impressionTracked = ref(false)
let observer: IntersectionObserver | null = null

function sendTracking(campaignId: string, type: 'impression' | 'click') {
  if (!campaignId || campaignId.startsWith('house-')) return

  const payload = JSON.stringify({ campaignId, type })
  if (import.meta.client && navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' })
    navigator.sendBeacon('/api/ads/track', blob)
  } else {
    $fetch('/api/ads/track', { method: 'POST', body: { campaignId, type } }).catch(() => null)
  }
}

function handleAdClick(campaignId: string) {
  sendTracking(campaignId, 'click')
}

function handleRotate() {
  impressionTracked.value = false
  refreshAds()
}

onMounted(() => {
  if (!import.meta.client || !widgetRef.value || typeof IntersectionObserver === 'undefined') return

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting) && !impressionTracked.value) {
        impressionTracked.value = true
        campaigns.value.forEach((c) => sendTracking(c.id, 'impression'))
        observer?.disconnect()
      }
    },
    { threshold: 0.35 }
  )
  observer.observe(widgetRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
})

// Modal Self-Serve DKP ADS per Buyer Esterni
const showSponsorModal = ref(false)
const isSubmittingSponsor = ref(false)
const sponsorSuccess = ref<string | null>(null)
const sponsorError = ref<string | null>(null)

const sponsorForm = ref({
  title: '',
  tagline: '',
  targetUrl: '',
  ctaText: 'Scopri di più',
  tier: 'PRO_NODE' as 'STARTER' | 'PRO_NODE' | 'ECOSYSTEM_TAKEOVER',
  buyerName: '',
  buyerEmail: ''
})

async function submitSponsorCampaign() {
  sponsorError.value = null
  sponsorSuccess.value = null
  isSubmittingSponsor.value = true

  try {
    const res: any = await $fetch('/api/ads/purchase', {
      method: 'POST',
      body: {
        ...sponsorForm.value,
        placement: props.placement
      }
    })
    if (res?.success) {
      sponsorSuccess.value = `Campagna attivata! ID: ${res.campaign.id}`
      impressionTracked.value = false
      await refreshAds()
      setTimeout(() => {
        showSponsorModal.value = false
        sponsorSuccess.value = null
      }, 1800)
    }
  } catch (err: any) {
    sponsorError.value = err?.data?.statusMessage || 'Errore durante la creazione della campagna.'
  } finally {
    isSubmittingSponsor.value = false
  }
}
</script>

<template>
  <section
    ref="widgetRef"
    :aria-label="`DKP Ads Circuit - ${placement}`"
    :class="[
      'w-full rounded-2xl bg-[#090d16]/95 border border-slate-800/90 shadow-xl font-sans',
      compact ? 'p-3.5' : 'p-4 sm:p-5'
    ]"
  >
    <!-- HEADER BAR DEL CIRCUITO DKP ADS -->
    <div class="flex items-center justify-between gap-2 pb-3 mb-3.5 border-b border-slate-800/80 font-mono">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="text-[10px] font-black uppercase tracking-wider text-slate-300">
          DKP ECOSYSTEM &amp; ADS CIRCUIT
        </span>
        <span class="hidden sm:inline-block text-[9px] text-slate-500 bg-[#020420] border border-slate-800 px-2 py-0.5 rounded">
          v2.6-PURE-SQL
        </span>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          title="Ruota annunci"
          @click="handleRotate"
          class="text-xs text-slate-400 hover:text-white bg-transparent border-none cursor-pointer p-0 transition-colors"
        >
          ↻
        </button>

        <button
          v-if="showAdvertiseLink"
          type="button"
          @click="showSponsorModal = true"
          class="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg cursor-pointer transition-all"
        >
          + Acquista Spazio
        </button>
      </div>
    </div>

    <!-- GRIGLIA ORIZZONTALE A 3 CARD (O VERTICALE / SINGOLA SU RICHIESTA) -->
    <div
      :class="[
        layout === 'horizontal'
          ? 'grid grid-cols-1 md:grid-cols-3 gap-3.5'
          : 'flex flex-col gap-3'
      ]"
    >
      <article
        v-for="ad in campaigns"
        :key="ad.id"
        :class="[
          'relative overflow-hidden rounded-xl bg-[#020420] border transition-all flex flex-col justify-between group',
          getCardStyles(ad.accentColor).border,
          compact ? 'p-3.5' : 'p-4'
        ]"
      >
        <div
          :class="[
            'absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity opacity-70 group-hover:opacity-100',
            getCardStyles(ad.accentColor).glow
          ]"
        ></div>

        <!-- TOP BADGE & SOURCE -->
        <div class="relative z-10">
          <div class="flex items-center justify-between gap-2 mb-2.5 font-mono">
            <span
              :class="[
                'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border',
                getCardStyles(ad.accentColor).badge
              ]"
            >
              {{ ad.isInternal ? `⚡ ${ad.badge}` : `📢 ${ad.badge}` }}
            </span>
            <span class="text-[9px] text-slate-500 uppercase">
              {{ ad.isInternal ? 'DKP Core' : 'Sponsored' }}
            </span>
          </div>

          <h4 class="text-sm font-extrabold text-white leading-snug m-0 mb-1.5 group-hover:text-emerald-300 transition-colors">
            {{ ad.title }}
          </h4>

          <p class="text-xs text-slate-400 leading-relaxed m-0 line-clamp-2">
            {{ ad.tagline }}
          </p>
        </div>

        <!-- CTA -->
        <div class="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between relative z-10 font-mono">
          <NuxtLink
            v-if="ad.isInternal"
            :to="ad.targetUrl"
            @click="handleAdClick(ad.id)"
            :class="[
              'w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-black px-3 py-2 rounded-lg transition-all no-underline shadow-sm',
              getCardStyles(ad.accentColor).cta
            ]"
          >
            <span>{{ ad.ctaText }}</span>
            <span>→</span>
          </NuxtLink>

          <a
            v-else
            :href="ad.targetUrl"
            target="_blank"
            rel="sponsored noopener noreferrer"
            @click="handleAdClick(ad.id)"
            :class="[
              'w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-black px-3 py-2 rounded-lg transition-all no-underline shadow-sm',
              getCardStyles(ad.accentColor).cta
            ]"
          >
            <span>{{ ad.ctaText }}</span>
            <span>↗</span>
          </a>
        </div>
      </article>
    </div>

    <!-- MODAL SELF-SERVE BUYER ESTERNI -->
    <Teleport to="body">
      <div
        v-if="showSponsorModal"
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 font-mono"
        @click.self="showSponsorModal = false"
      >
        <div class="w-full max-w-lg bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span class="text-[10px] font-black text-emerald-400 uppercase">DKP ADS NETWORK • PURE-SQL</span>
              <h3 class="text-lg font-black text-white font-sans m-0 mt-0.5">Attiva Campagna Sponsor</h3>
            </div>
            <button type="button" @click="showSponsorModal = false" class="text-slate-400 hover:text-white text-sm cursor-pointer bg-transparent border-none">✕</button>
          </div>

          <form @submit.prevent="submitSponsorCampaign" class="flex flex-col gap-3 text-xs">
            <input v-model="sponsorForm.title" required maxlength="120" placeholder="Titolo Annuncio (es. Cloud PostgreSQL per Dev)" class="bg-[#020420] border border-slate-700 text-white p-3 rounded-xl outline-none focus:border-emerald-400" />
            <textarea v-model="sponsorForm.tagline" required maxlength="280" rows="2" placeholder="Descrizione breve del prodotto/tool..." class="bg-[#020420] border border-slate-700 text-white p-3 rounded-xl outline-none focus:border-emerald-400 resize-none"></textarea>
            <input v-model="sponsorForm.targetUrl" required type="url" placeholder="https://tuodominio.com/landing" class="bg-[#020420] border border-slate-700 text-sky-400 p-3 rounded-xl outline-none focus:border-emerald-400" />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input v-model="sponsorForm.ctaText" maxlength="40" placeholder="Testo Pulsante (CTA)" class="bg-[#020420] border border-slate-700 text-white p-3 rounded-xl outline-none focus:border-emerald-400" />
              <select v-model="sponsorForm.tier" class="bg-[#020420] border border-slate-700 text-emerald-400 font-bold p-3 rounded-xl outline-none focus:border-emerald-400 cursor-pointer">
                <option value="STARTER">STARTER • 10k imp (€49)</option>
                <option value="PRO_NODE">PRO NODE • 50k imp (€149)</option>
                <option value="ECOSYSTEM_TAKEOVER">TAKEOVER • 200k imp (€399)</option>
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input v-model="sponsorForm.buyerName" required placeholder="Azienda / Developer" class="bg-[#020420] border border-slate-700 text-white p-3 rounded-xl outline-none focus:border-emerald-400" />
              <input v-model="sponsorForm.buyerEmail" required type="email" placeholder="billing@azienda.com" class="bg-[#020420] border border-slate-700 text-white p-3 rounded-xl outline-none focus:border-emerald-400" />
            </div>

            <div v-if="sponsorError" class="text-red-400 bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl">{{ sponsorError }}</div>
            <div v-if="sponsorSuccess" class="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl">{{ sponsorSuccess }}</div>

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" @click="showSponsorModal = false" class="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer border-none">Annulla</button>
              <button type="submit" :disabled="isSubmittingSponsor" class="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black cursor-pointer border-none disabled:opacity-50">
                {{ isSubmittingSponsor ? 'Attivazione...' : 'Pubblica su DKP ADS' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </section>
</template>