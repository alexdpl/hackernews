<!-- app/components/DKPAdBanner.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface DkpBannerAd {
  id: string
  title: string
  tagline: string
  badge: string
  ctaText: string
  targetUrl: string
  isInternal: boolean
  provider: string
  accentColor: 'emerald' | 'sky' | 'purple' | 'amber'
}

const props = withDefaults(
  defineProps<{
    categoryTag?: string
    placement?: 'nodeTalks' | 'blogSidebar' | 'feedInline' | 'docs' | 'global'
    layout?: 'vertical' | 'horizontal'
    limit?: number
    showAdvertiseLink?: boolean
  }>(),
  {
    categoryTag: 'DKP ECOSYSTEM & SPONSOR',
    placement: 'nodeTalks',
    layout: 'vertical',
    limit: 3,
    showAdvertiseLink: true
  }
)

// Mappa client-side anti-link rotti per garantire 100% di navigazione valida
const CLIENT_ROUTE_FIXES: Record<string, string> = {
  '/vault': '/nodes/n/blockchain-vault',
  '/proof-of-code': '/user/dashboard?tab=vault',
  '/api-console': '/user/dashboard?tab=api',
  '/keys': '/user/dashboard?tab=api',
  '/shop': '/bounties',
  '/talks': '/nodes',
  '/node-talks': '/nodes',
  '/sdk': '/docs/api',
  '/sentinel': '/docs/ecosystem'
}

function sanitizeBannerTarget(rawUrl: string): { url: string; isInternal: boolean } {
  const clean = String(rawUrl || '').trim()
  if (!clean || clean === '#' || /^(javascript|data|vbscript):/i.test(clean)) {
    return { url: '/nodes', isInternal: true }
  }

  if (/^https?:\/\//i.test(clean)) {
    try {
      const parsed = new URL(clean)
      if (parsed.hostname.endsWith('devkernelpulse.org')) {
        return sanitizeBannerTarget(`${parsed.pathname}${parsed.search}${parsed.hash}` || '/nodes')
      }
      return { url: parsed.toString(), isInternal: false }
    } catch {
      return { url: '/nodes', isInternal: true }
    }
  }

  const withSlash = clean.startsWith('/') ? clean : `/${clean}`
  const [pathOnly, queryPart] = withSlash.split('?')
  const normalizedBase = pathOnly.replace(/\/+$/, '') || '/'

  if (CLIENT_ROUTE_FIXES[normalizedBase]) {
    const fixed = CLIENT_ROUTE_FIXES[normalizedBase]
    return {
      url: queryPart && !fixed.includes('?') ? `${fixed}?${queryPart}` : fixed,
      isInternal: true
    }
  }

  return { url: withSlash, isInternal: true }
}

// 3 Card native DKP v2.6-PURE-SQL sempre valide come fallback istantaneo (zero CLS / zero link rotti)
const fallbackAds: DkpBannerAd[] = [
  {
    id: 'house-sdk-v1',
    title: '@devkernelpulse/sdk v1.0.0',
    tagline: 'SDK TypeScript ufficiale: AI Trinity, notarizzazione SHA-256 on-chain e Sentinel SAST.',
    badge: 'OFFICIAL SDK',
    ctaText: 'Apri API Docs',
    targetUrl: '/docs/api',
    isInternal: true,
    provider: 'DevKernelPulse Core',
    accentColor: 'emerald'
  },
  {
    id: 'house-blockchain-vault',
    title: 'DKP Blockchain Vault© v2.6',
    tagline: 'Notarizza thread e codice su Neon Pure-SQL con hash SHA-256 concatenato e Block #N.',
    badge: 'ON-CHAIN VAULT',
    ctaText: 'Apri Nodo Vault',
    targetUrl: '/nodes/n/blockchain-vault',
    isInternal: true,
    provider: 'DKP Ledger Network',
    accentColor: 'sky'
  },
  {
    id: 'house-sentinel-sast',
    title: 'Pulse Sentinel & API Keys',
    tagline: 'Audit SAST con OpenRouter Strict JSON e gateway AI ad alte prestazioni per dev.',
    badge: 'AI SECURITY',
    ctaText: 'Gestisci API Key',
    targetUrl: '/user/dashboard?tab=api',
    isInternal: true,
    provider: 'DKP Edge Gateway',
    accentColor: 'amber'
  }
]

const { data: adsPayload, pending: isLoading, refresh: refreshAds } = await useFetch<{
  success: boolean
  data?: any[]
  campaigns?: any[]
}>('/api/ads/active', {
  key: `dkp-ad-banner-${props.placement}-${props.limit}`,
  query: {
    placement: props.placement,
    limit: props.limit
  },
  default: () => ({
    success: true,
    data: fallbackAds
  })
})

const ads = computed<DkpBannerAd[]>(() => {
  const rawList = adsPayload.value?.data || adsPayload.value?.campaigns || []
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return fallbackAds.slice(0, props.limit)
  }

  const normalized = rawList.map((item: any, idx: number): DkpBannerAd => {
    const safe = sanitizeBannerTarget(item.targetUrl || item.url || '/nodes')
    const defaultAccent = (['emerald', 'sky', 'amber'] as const)[idx % 3]
    return {
      id: String(item.id || `dkp-ad-${idx}`),
      title: String(item.title || 'DevKernelPulse v2.6'),
      tagline: String(item.tagline || item.snippet || 'Esplora gli strumenti nativi dell\'ecosistema DKP.'),
      badge: String(item.badge || item.categoryTag || 'DKP ECOSYSTEM'),
      ctaText: String(item.ctaText || 'Scopri di più'),
      targetUrl: safe.url,
      isInternal: safe.isInternal,
      provider: String(item.provider || item.buyerName || (safe.isInternal ? 'DevKernelPulse' : 'DKP Partner')),
      accentColor: item.accentColor || defaultAccent
    }
  })

  // Garantisce sempre il numero esatto di card richieste (es. 3)
  const usedIds = new Set(normalized.map((a) => a.id))
  const fillers = fallbackAds.filter((f) => !usedIds.has(f.id))
  return [...normalized, ...fillers].slice(0, props.limit)
})

function sendTelemetry(campaignId: string, type: 'impression' | 'click') {
  if (!campaignId || campaignId.startsWith('house-') || campaignId.startsWith('dkp-')) return

  const body = JSON.stringify({ campaignId, type })
  if (import.meta.client && navigator.sendBeacon) {
    navigator.sendBeacon('/api/ads/track', new Blob([body], { type: 'application/json' }))
  } else {
    $fetch('/api/ads/track', { method: 'POST', body: { campaignId, type } }).catch(() => null)
  }
}

function trackClick(adId: string) {
  sendTelemetry(adId, 'click')
}

// Traccia le impressioni reali quando il banner entra nel viewport
const bannerRef = ref<HTMLElement | null>(null)
const impressionsSent = ref(false)
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!import.meta.client || !bannerRef.value || typeof IntersectionObserver === 'undefined') return

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting) && !impressionsSent.value) {
        impressionsSent.value = true
        ads.value.forEach((ad) => sendTelemetry(ad.id, 'impression'))
        observer?.disconnect()
      }
    },
    { threshold: 0.35 }
  )
  observer.observe(bannerRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
})

// Modal Self-Serve DKP ADS per Buyer Esterni
const showSponsorModal = ref(false)
const isSubmittingSponsor = ref(false)
const sponsorFeedback = ref<{ type: 'ok' | 'err'; text: string } | null>(null)

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
  sponsorFeedback.value = null
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
      sponsorFeedback.value = {
        type: 'ok',
        text: `Campagna attivata su DKP ADS! ID: ${res.campaign.id}`
      }
      impressionsSent.value = false
      await refreshAds()
      setTimeout(() => {
        showSponsorModal.value = false
        sponsorFeedback.value = null
      }, 1600)
    }
  } catch (err: any) {
    sponsorFeedback.value = {
      type: 'err',
      text: err?.data?.statusMessage || 'Errore durante l\'attivazione della campagna.'
    }
  } finally {
    isSubmittingSponsor.value = false
  }
}
</script>

<template>
  <aside
    ref="bannerRef"
    :aria-label="`DKP Ad Network - ${placement}`"
    class="bg-[#090d16] border border-amber-500/30 rounded-xl p-4 shadow-xl relative overflow-hidden font-mono text-xs flex flex-col gap-3"
  >
    <!-- LIGHTING ACCENT -->
    <div class="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

    <!-- HEADER DEL BANNER -->
    <div class="flex items-center justify-between gap-2 pb-2 border-b border-slate-800 relative z-10">
      <span class="text-[9px] bg-amber-500/15 text-amber-400 font-extrabold px-2 py-0.5 rounded border border-amber-500/30 tracking-wider uppercase">
        📣 {{ categoryTag }}
      </span>

      <div class="flex items-center gap-2">
        <button
          v-if="showAdvertiseLink"
          type="button"
          @click="showSponsorModal = true"
          class="text-[9px] font-bold text-emerald-400 hover:text-emerald-300 bg-transparent border-none cursor-pointer underline p-0"
        >
          + Sponsorizza
        </button>
        <span class="text-[9px] text-slate-500">DKP ADS</span>
      </div>
    </div>

    <div v-if="isLoading && ads.length === 0" class="py-6 text-center text-slate-500 text-[11px]">
      Caricamento circuito DKP ADS...
    </div>

    <!-- LAYOUT ADATTIVO: PILA VERTICALE (SIDEBAR NODES) OPPURE 3 CARD ORIZZONTALI (ALTRE PAGINE) -->
    <div
      v-else
      :class="[
        'relative z-10',
        layout === 'horizontal'
          ? 'grid grid-cols-1 md:grid-cols-3 gap-3.5'
          : 'flex flex-col gap-2.5'
      ]"
    >
      <article
        v-for="ad in ads"
        :key="ad.id"
        class="bg-[#020420] border border-slate-800 hover:border-amber-500/45 rounded-lg p-3 transition-all flex flex-col justify-between gap-2 group"
      >
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-1 text-[9px]">
            <span
              :class="[
                'font-bold px-1.5 py-0.5 rounded border',
                ad.accentColor === 'emerald'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                  : ad.accentColor === 'sky'
                    ? 'text-sky-400 bg-sky-500/10 border-sky-500/25'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/25'
              ]"
            >
              {{ ad.badge }}
            </span>
            <span class="text-slate-500 truncate max-w-[115px]">{{ ad.provider }}</span>
          </div>

          <h4 class="font-bold text-slate-100 text-xs group-hover:text-amber-300 transition-colors m-0">
            <NuxtLink
              v-if="ad.isInternal"
              :to="ad.targetUrl"
              @click="trackClick(ad.id)"
              class="flex items-center justify-between gap-1 text-inherit no-underline"
            >
              <span>{{ ad.title }}</span>
              <span class="text-[10px] text-emerald-400">→</span>
            </NuxtLink>

            <a
              v-else
              :href="ad.targetUrl"
              target="_blank"
              rel="sponsored noopener noreferrer"
              @click="trackClick(ad.id)"
              class="flex items-center justify-between gap-1 text-inherit no-underline"
            >
              <span>{{ ad.title }}</span>
              <span class="text-[10px] text-sky-400">↗</span>
            </a>
          </h4>

          <p class="text-slate-400 text-[10px] leading-relaxed font-sans line-clamp-2 m-0">
            {{ ad.tagline }}
          </p>
        </div>

        <!-- CTA INTERNA SPA O ESTERNA SPONSOR -->
        <NuxtLink
          v-if="ad.isInternal"
          :to="ad.targetUrl"
          @click="trackClick(ad.id)"
          class="mt-1 text-center py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-bold text-[9px] transition-all no-underline block"
        >
          {{ ad.ctaText }} →
        </NuxtLink>

        <a
          v-else
          :href="ad.targetUrl"
          target="_blank"
          rel="sponsored noopener noreferrer"
          @click="trackClick(ad.id)"
          class="mt-1 text-center py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-bold text-[9px] transition-all no-underline block"
        >
          {{ ad.ctaText }} ↗
        </a>
      </article>
    </div>

    <!-- MODAL SELF-SERVE BUYER ESTERNI -->
    <Teleport to="body">
      <div
        v-if="showSponsorModal"
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 font-mono"
        @click.self="showSponsorModal = false"
      >
        <div class="w-full max-w-lg bg-[#090d16] border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span class="text-[10px] font-black text-emerald-400 uppercase">DKP ADS NETWORK • v2.6-PURE-SQL</span>
              <h3 class="text-base font-black text-white font-sans m-0 mt-0.5">Acquista Spazio Pubblicitario</h3>
            </div>
            <button
              type="button"
              @click="showSponsorModal = false"
              class="text-slate-400 hover:text-white text-sm cursor-pointer bg-transparent border-none"
            >
              ✕
            </button>
          </div>

          <form @submit.prevent="submitSponsorCampaign" class="flex flex-col gap-3 text-xs">
            <input
              v-model="sponsorForm.title"
              required
              maxlength="120"
              placeholder="Titolo Annuncio (es. Serverless Postgres per Team)"
              class="bg-[#020420] border border-slate-700 text-white p-2.5 rounded-xl outline-none focus:border-emerald-400"
            />
            <textarea
              v-model="sponsorForm.tagline"
              required
              maxlength="280"
              rows="2"
              placeholder="Descrizione breve del tuo tool o servizio..."
              class="bg-[#020420] border border-slate-700 text-white p-2.5 rounded-xl outline-none focus:border-emerald-400 resize-none"
            ></textarea>
            <input
              v-model="sponsorForm.targetUrl"
              required
              type="url"
              placeholder="https://tuodominio.com"
              class="bg-[#020420] border border-slate-700 text-sky-400 p-2.5 rounded-xl outline-none focus:border-emerald-400"
            />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                v-model="sponsorForm.ctaText"
                maxlength="40"
                placeholder="Testo CTA (es. Prova Gratis)"
                class="bg-[#020420] border border-slate-700 text-white p-2.5 rounded-xl outline-none focus:border-emerald-400"
              />
              <select
                v-model="sponsorForm.tier"
                class="bg-[#020420] border border-slate-700 text-emerald-400 font-bold p-2.5 rounded-xl outline-none focus:border-emerald-400 cursor-pointer"
              >
                <option value="STARTER">STARTER • 10k imp (€49)</option>
                <option value="PRO_NODE">PRO NODE • 50k imp (€149)</option>
                <option value="ECOSYSTEM_TAKEOVER">TAKEOVER • 200k imp (€399)</option>
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                v-model="sponsorForm.buyerName"
                required
                placeholder="Nome Azienda / Progetto"
                class="bg-[#020420] border border-slate-700 text-white p-2.5 rounded-xl outline-none focus:border-emerald-400"
              />
              <input
                v-model="sponsorForm.buyerEmail"
                required
                type="email"
                placeholder="ads@azienda.com"
                class="bg-[#020420] border border-slate-700 text-white p-2.5 rounded-xl outline-none focus:border-emerald-400"
              />
            </div>

            <div
              v-if="sponsorFeedback"
              :class="[
                'p-2.5 rounded-xl border',
                sponsorFeedback.type === 'ok'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                  : 'text-red-400 bg-red-500/10 border-red-500/30'
              ]"
            >
              {{ sponsorFeedback.text }}
            </div>

            <div class="flex justify-end gap-2 pt-1">
              <button
                type="button"
                @click="showSponsorModal = false"
                class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer border-none"
              >
                Annulla
              </button>
              <button
                type="submit"
                :disabled="isSubmittingSponsor"
                class="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black cursor-pointer border-none disabled:opacity-50"
              >
                {{ isSubmittingSponsor ? 'Attivazione...' : 'Attiva Spazio ADS' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </aside>
</template>