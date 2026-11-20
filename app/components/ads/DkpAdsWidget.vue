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
  '/vault': '/nodes/blockchain-vault',
  '/nodes/n/blockchain-vault': '/nodes/blockchain-vault',
  '/proof-of-code': '/user/dashboard?tab=vault',
  '/api-console': '/user/dashboard?tab=api',
  '/keys': '/user/dashboard?tab=api',
  '/sdk': '/tools',
  '/sentinel': '/ecosystem'
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
    id: 'house-openui-studio',
    title: 'OpenUI Studio AI & Dev Suite',
    tagline: 'Genera interfacce, telemetria e componenti AI-native direttamente dal tuo browser in Pure SQL.',
    badge: 'DKP TOOLS SUITE',
    ctaText: 'Apri Studio',
    targetUrl: '/tools',
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
    title: 'DKP Blockchain Vault&copy; SHA-256',
    tagline: 'Verifica l\'integrit\u00E0 crittografica dei thread e degli articoli tecnici sul registro pubblico Pure SQL.',
    badge: 'ON-CHAIN VAULT',
    ctaText: 'Esplora Vault',
    targetUrl: '/nodes/blockchain-vault',
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
    title: 'DKP API Gateway & Sentinel AI',
    tagline: 'Genera chiavi dkp_live_* con rate-limiting e audit statico governato da BEMYAGENT.md.',
    badge: 'API & SECURITY',
    ctaText: 'Apri Console',
    targetUrl: '/user/dashboard?tab=api',
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
  const normalized = (Array.isArray(rawList) ? rawList : [])
    .filter((c: any) => !/amazon\.|amzn\./i.test(String(c.targetUrl || c.url || '')))
    .map((c, idx) => {
      const safe = sanitizeAdUrl(c.targetUrl || c.url)
      const fallbackAccent = (['emerald', 'sky', 'purple'] as const)[idx % 3]
      return {
        ...c,
        targetUrl: safe.url,
        isInternal: c.isInternal !== false && safe.isInternal,
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
        border: 'border-dkp-border hover:border-sky-500/50',
        badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        cta: 'text-sky-400 group-hover:text-white'
      }
    case 'purple':
      return {
        border: 'border-dkp-border hover:border-purple-500/50',
        badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
        cta: 'text-purple-300 group-hover:text-white'
      }
    case 'amber':
      return {
        border: 'border-dkp-border hover:border-amber-500/50',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        cta: 'text-amber-400 group-hover:text-white'
      }
    default:
      return {
        border: 'border-dkp-border hover:border-emerald-500/50',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        cta: 'text-emerald-400 group-hover:text-white'
      }
  }
}

const widgetRef = ref<HTMLElement | null>(null)
const impressionTracked = ref(false)
let observer: IntersectionObserver | null = null

function sendTracking(campaignId: string, type: 'impression' | 'click') {
  if (!campaignId || campaignId.startsWith('house-')) return

  const payload = JSON.stringify({ campaignId, type })
  if (import.meta.client && navigator.sendBeacon) {
    navigator.sendBeacon('/api/ads/track', new Blob([payload], { type: 'application/json' }))
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

const showSponsorModal = ref(false)
const isSubmittingSponsor = ref(false)
const sponsorSuccess = ref<string | null>(null)
const sponsorError = ref<string | null>(null)

const sponsorForm = ref({
  title: '',
  tagline: '',
  targetUrl: '',
  ctaText: 'Scopri di pi\u00F9',
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
      'w-full rounded-2xl bg-dkp-card/95 border border-dkp-border card-glow font-sans',
      compact ? 'p-4' : 'p-5'
    ]"
  >
    <!-- HEADER BAR MIMETIZZATA CON IL LAYOUT -->
    <div class="flex items-center justify-between gap-2 pb-3 mb-3.5 border-b border-dkp-border/80 font-mono">
      <div class="flex items-center gap-2 min-w-0">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
        <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-400 truncate">
          DKP ADS &amp; SHOP
        </span>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          title="Ruota annunci"
          @click="handleRotate"
          class="text-xs text-slate-400 hover:text-white bg-transparent border-none cursor-pointer p-0 transition-colors"
        >
          &#8635;
        </button>

        <button
          v-if="showAdvertiseLink"
          type="button"
          @click="showSponsorModal = true"
          class="text-[10px] font-bold text-slate-300 hover:text-emerald-400 bg-dkp-bg/90 border border-dkp-border hover:border-emerald-500/40 px-2 py-0.5 rounded-lg cursor-pointer transition-all"
        >
          + Spazio
        </button>
      </div>
    </div>

    <!-- GRIGLIA ORIZZONTALE O VERTICALE (SEMPRE 3 ANNUNCI) -->
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
          'rounded-xl bg-dkp-bg/90 border transition-all flex flex-col justify-between group',
          getCardStyles(ad.accentColor).border,
          compact ? 'p-3.5' : 'p-4'
        ]"
      >
        <div>
          <div class="flex items-center justify-between gap-2 mb-2 font-mono">
            <span
              :class="[
                'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border',
                getCardStyles(ad.accentColor).badge
              ]"
            >
              {{ ad.badge }}
            </span>
            <span class="text-[9px] text-slate-500 uppercase">
              {{ ad.isInternal ? 'DKP' : 'Partner' }}
            </span>
          </div>

          <h4 class="text-xs sm:text-sm font-bold text-white leading-snug m-0 mb-1 group-hover:text-emerald-400 transition-colors">
            {{ ad.title }}
          </h4>

          <p class="text-[11px] sm:text-xs text-slate-400 leading-relaxed m-0 line-clamp-2">
            {{ ad.tagline }}
          </p>
        </div>

        <div class="mt-3 pt-2.5 border-t border-dkp-border/70 font-mono">
          <NuxtLink
            v-if="ad.isInternal"
            :to="ad.targetUrl"
            @click="handleAdClick(ad.id)"
            :class="[
              'w-full inline-flex items-center justify-between text-[11px] font-bold no-underline transition-colors',
              getCardStyles(ad.accentColor).cta
            ]"
          >
            <span>{{ ad.ctaText }}</span>
            <span>&nearr;</span>
          </NuxtLink>

          <a
            v-else
            :href="ad.targetUrl"
            target="_blank"
            rel="sponsored noopener noreferrer"
            @click="handleAdClick(ad.id)"
            :class="[
              'w-full inline-flex items-center justify-between text-[11px] font-bold no-underline transition-colors',
              getCardStyles(ad.accentColor).cta
            ]"
          >
            <span>{{ ad.ctaText }}</span>
            <span>&nearr;</span>
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
        <div class="w-full max-w-lg bg-dkp-card/95 border border-dkp-border rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-4">
          <div class="flex items-center justify-between border-b border-dkp-border pb-3">
            <div>
              <span class="text-[10px] font-black text-emerald-400 uppercase">DKP ADS NETWORK • PURE-SQL</span>
              <h3 class="text-lg font-black text-white font-sans m-0 mt-0.5">Attiva Campagna Sponsor</h3>
            </div>
            <button type="button" @click="showSponsorModal = false" class="text-slate-400 hover:text-white text-sm cursor-pointer bg-transparent border-none"></button>
          </div>

          <form @submit.prevent="submitSponsorCampaign" class="flex flex-col gap-3 text-xs">
            <input v-model="sponsorForm.title" required maxlength="120" placeholder="Titolo Annuncio (es. Cloud PostgreSQL per Dev)" class="bg-dkp-bg/90 border border-slate-700 text-white p-3 rounded-xl outline-none focus:border-emerald-400" />
            <textarea v-model="sponsorForm.tagline" required maxlength="280" rows="2" placeholder="Descrizione breve del prodotto/tool..." class="bg-dkp-bg/90 border border-slate-700 text-white p-3 rounded-xl outline-none focus:border-emerald-400 resize-none"></textarea>
            <input v-model="sponsorForm.targetUrl" required type="url" placeholder="https://tuodominio.com/landing" class="bg-dkp-bg/90 border border-slate-700 text-sky-400 p-3 rounded-xl outline-none focus:border-emerald-400" />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input v-model="sponsorForm.ctaText" maxlength="40" placeholder="Testo Pulsante (CTA)" class="bg-dkp-bg/90 border border-slate-700 text-white p-3 rounded-xl outline-none focus:border-emerald-400" />
              <select v-model="sponsorForm.tier" class="bg-dkp-bg/90 border border-slate-700 text-emerald-400 font-bold p-3 rounded-xl outline-none focus:border-emerald-400 cursor-pointer">
                <option value="STARTER">STARTER • 10k imp (â‚¬49)</option>
                <option value="PRO_NODE">PRO NODE • 50k imp (â‚¬149)</option>
                <option value="ECOSYSTEM_TAKEOVER">TAKEOVER • 200k imp (â‚¬399)</option>
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input v-model="sponsorForm.buyerName" required placeholder="Azienda / Developer" class="bg-dkp-bg/90 border border-slate-700 text-white p-3 rounded-xl outline-none focus:border-emerald-400" />
              <input v-model="sponsorForm.buyerEmail" required type="email" placeholder="billing@azienda.com" class="bg-dkp-bg/90 border border-slate-700 text-white p-3 rounded-xl outline-none focus:border-emerald-400" />
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