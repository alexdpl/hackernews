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

const FALLBACK_CAMPAIGNS: DkpAdCampaign[] = [
  {
    id: 'dkp-camp-visualizzazioni',
    title: 'Campagna Visualizzazioni (Impressioni)',
    tagline: 'Visibilita sulle superfici orizzontali e verticali con telemetria impressioni in tempo reale.',
    badge: 'VISUALIZZAZIONI',
    ctaText: 'Gestisci in I Miei Link',
    targetUrl: '/user/ads',
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
    id: 'dkp-camp-click',
    title: 'Campagna Click & CTR',
    tagline: 'Tracciamento click e CTR diretto sui tuoi link attivi con metriche sincronizzate.',
    badge: 'CLICK',
    ctaText: 'Apri I Miei Link',
    targetUrl: '/user/ads',
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
    id: 'dkp-camp-ibrido',
    title: 'Campagna Ibrida (Imp + Click)',
    tagline: 'Modello ibrido visualizzazioni + click per bilanciare reach e traffico sui tuoi link.',
    badge: 'IBRIDO',
    ctaText: 'Vedi Campagne',
    targetUrl: '/user/ads',
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

function sanitizeTarget(rawUrl: string): { url: string; isInternal: boolean } {
  const clean = String(rawUrl || '').trim()
  if (!clean || clean === '#' || /^(javascript|data|vbscript):/i.test(clean)) {
    return { url: '/user/ads', isInternal: true }
  }
  if (/^https?:\/\//i.test(clean)) {
    try {
      const parsed = new URL(clean)
      if (parsed.hostname.endsWith('devkernelpulse.org')) {
        return { url: (parsed.pathname + parsed.search + parsed.hash) || '/user/ads', isInternal: true }
      }
      return { url: parsed.toString(), isInternal: false }
    } catch {
      return { url: '/user/ads', isInternal: true }
    }
  }
  const normalized = clean.startsWith('/') ? clean : '/' + clean
  if (normalized === '/user/dashboard?tab=ads') {
    return { url: '/user/ads', isInternal: true }
  }
  return { url: normalized, isInternal: true }
}

const { data: apiRes, refresh: refreshAds } = await useFetch<any>('/api/ads/serve', {
  key: () => 'dkp-ads-' + props.placement + '-' + props.layout + '-' + effectiveLimit.value,
  query: () => ({
    placement: props.placement,
    limit: effectiveLimit.value
  }),
  server: false,
  lazy: true,
  default: () => ({ ok: true, data: [] })
})

const campaigns = computed<DkpAdCampaign[]>(() => {
  const rawList: any[] = Array.isArray(apiRes.value?.data) ? apiRes.value.data : []
  const mapped: DkpAdCampaign[] = []
  const usedIds = new Set<string>()

  for (const row of rawList) {
    if (mapped.length >= effectiveLimit.value) break
    const id = String(row.id || '').trim()
    if (!id || usedIds.has(id)) continue
    usedIds.add(id)

    const target = sanitizeTarget(row.targetUrl || '/user/ads')
    mapped.push({
      id,
      title: String(row.title || 'Campagna DKP'),
      tagline: String(row.tagline || 'Spazio attivo sul circuito DKP.'),
      badge: String(row.badge || 'IBRIDO'),
      ctaText: String(row.ctaText || 'I Miei Link'),
      targetUrl: target.url,
      isInternal: target.isInternal,
      placement: (row.placement || props.placement) as AdPlacement,
      tier: row.tier || 'PRO_NODE',
      accentColor: row.accentColor || 'emerald',
      impressionsCount: Number(row.impressionsCount || 0),
      clicksCount: Number(row.clicksCount || 0),
      maxImpressions: row.maxImpressions ?? null,
      status: 'active'
    })
  }

  for (const fallback of FALLBACK_CAMPAIGNS) {
    if (mapped.length >= effectiveLimit.value) break
    if (!usedIds.has(fallback.id)) {
      usedIds.add(fallback.id)
      mapped.push(fallback)
    }
  }

  return mapped.slice(0, effectiveLimit.value)
})

const widgetRef = ref<HTMLElement | null>(null)
const impressionTracked = ref(false)
let observer: IntersectionObserver | null = null

function sendTracking(campaignId: string, type: 'impression' | 'click') {
  if (!campaignId || campaignId.startsWith('dkp-camp-')) return
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

function getCardAccent(color?: string) {
  if (color === 'sky' || color === 'cyan') {
    return {
      border: 'border-cyan-500/25 hover:border-cyan-400/50',
      badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      cta: 'text-cyan-300 hover:text-white'
    }
  }
  if (color === 'purple' || color === 'violet') {
    return {
      border: 'border-violet-500/25 hover:border-violet-400/50',
      badge: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
      cta: 'text-violet-300 hover:text-white'
    }
  }
  return {
    border: 'border-emerald-500/25 hover:border-emerald-400/50',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    cta: 'text-emerald-300 hover:text-white'
  }
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
</script>

<template>
  <section
    ref="widgetRef"
    :aria-label="'DKP Ads Circuit - ' + placement"
    :class="[
      'w-full rounded-2xl bg-dkp-card/95 border border-dkp-border font-sans',
      compact ? 'p-4' : 'p-5'
    ]"
  >
    <div class="flex items-center justify-between gap-2 pb-3 mb-3.5 border-b border-dkp-border/80 font-mono">
      <div class="flex items-center gap-2 min-w-0">
        <span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
        <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-400 truncate">
          DKP ADS &bull; VISUALIZZAZIONI, CLICK &amp; IBRIDO
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

        <NuxtLink
          to="/user/ads"
          class="px-2.5 py-1 rounded-lg bg-[#050914] hover:bg-slate-900 border border-dkp-border text-slate-300 hover:text-cyan-300 font-mono text-[11px] font-bold no-underline transition-colors"
        >
          I Miei Link
        </NuxtLink>

        <NuxtLink
          v-if="showAdvertiseLink"
          to="/shop?category=sponsored_ads"
          class="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold no-underline transition-colors"
        >
          + Spazio
        </NuxtLink>
      </div>
    </div>

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
          'rounded-xl bg-[#050914]/90 border transition-all flex flex-col justify-between group',
          getCardAccent(ad.accentColor).border,
          compact ? 'p-3.5' : 'p-4'
        ]"
      >
        <div>
          <div class="flex items-center justify-between gap-2 mb-2 font-mono">
            <span
              :class="[
                'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border',
                getCardAccent(ad.accentColor).badge
              ]"
            >
              {{ ad.badge }}
            </span>
            <span class="text-[9px] text-slate-400 uppercase font-mono">
              {{ ad.impressionsCount }} imp &bull; {{ ad.clicksCount }} click
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
              getCardAccent(ad.accentColor).cta
            ]"
          >
            <span>{{ ad.ctaText }}</span>
            <span>&rarr;</span>
          </NuxtLink>

          <a
            v-else
            :href="ad.targetUrl"
            target="_blank"
            rel="sponsored noopener noreferrer"
            @click="handleAdClick(ad.id)"
            :class="[
              'w-full inline-flex items-center justify-between text-[11px] font-bold no-underline transition-colors',
              getCardAccent(ad.accentColor).cta
            ]"
          >
            <span>{{ ad.ctaText }}</span>
            <span>&nearr;</span>
          </a>
        </div>
      </article>
    </div>
  </section>
</template>