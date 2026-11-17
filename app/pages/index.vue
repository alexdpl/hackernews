<!-- app/pages/index.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import DkpAdsWidget from '~/components/DkpAdsWidget.vue'
import DKPRelatedThreads from '~/components/nodes/DKPRelatedThreads.vue'

interface FeaturedArticle {
  id: number | string
  title: string
  slug: string
  category?: string
  categoryName?: string
  excerpt?: string
  vaultHash?: string | null
  createdAt?: string
}

interface EcosystemPillar {
  to: string
  icon: string
  tag: string
  title: string
  subtitle: string
  accentClass: string
}

const CANONICAL_HOME_URL = 'https://devkernelpulse.org/'

useDkpSeo({
  title: 'DevKernelPulse — Tech Intelligence, Developer Ecosystem & SHA-256 Vault',
  description:
    'Infrastruttura per sviluppatori e software architect: aggregatore tech arricchito da Trinity AI, DKP Nodes, strumenti di sicurezza e notarizzazione crittografica SHA-256.',
  canonical: CANONICAL_HOME_URL,
  url: CANONICAL_HOME_URL,
  type: 'website'
})

useHead({
  htmlAttrs: { lang: 'it' },
  link: [
    { rel: 'canonical', href: CANONICAL_HOME_URL },
    { rel: 'alternate', hreflang: 'it', href: CANONICAL_HOME_URL },
    { rel: 'alternate', hreflang: 'x-default', href: CANONICAL_HOME_URL }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': 'https://devkernelpulse.org/#website',
            url: CANONICAL_HOME_URL,
            name: 'DevKernelPulse',
            alternateName: 'DKP',
            description:
              'Infrastruttura per sviluppatori, strumenti di sicurezza notarizzati, newsroom AI e DKP Nodes.',
            inLanguage: 'it-IT',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://devkernelpulse.org/nodes?q={search_term_string}'
              },
              'query-input': 'required name=search_term_string'
            }
          },
          {
            '@type': 'Organization',
            '@id': 'https://devkernelpulse.org/#organization',
            name: 'DevKernelPulse',
            url: CANONICAL_HOME_URL,
            logo: {
              '@type': 'ImageObject',
              url: 'https://devkernelpulse.org/favicon.ico'
            },
            founder: {
              '@type': 'Person',
              name: 'Alessandro De Paola',
              url: 'https://devkernelpulse.org/u/alexdpl'
            },
            sameAs: [
              'https://github.com/alexdpl',
              'https://x.com/alexdpl76',
              'https://linkedin.com/in/alexdpl'
            ]
          },
          {
            '@type': 'CollectionPage',
            '@id': 'https://devkernelpulse.org/#webpage',
            url: CANONICAL_HOME_URL,
            name: 'DevKernelPulse — The Developer Ecosystem & AI Tech Stream',
            isPartOf: { '@id': 'https://devkernelpulse.org/#website' },
            about: { '@id': 'https://devkernelpulse.org/#organization' },
            inLanguage: 'it-IT'
          }
        ]
      })
    }
  ]
})

const ecosystemPillars: EcosystemPillar[] = [
  {
    to: '/news',
    icon: '🌍',
    tag: 'LIVE STREAM',
    title: 'DKP Tech Feed',
    subtitle: 'Segnali tech e newsroom filtrati in tempo reale da Trinity AI',
    accentClass: 'pillar-emerald'
  },
  {
    to: '/nodes',
    icon: '💬',
    tag: 'COMMUNITY',
    title: 'DKP Talks Hub',
    subtitle: 'Nodi tematici, architetture, bounty e discussioni tecniche',
    accentClass: 'pillar-purple'
  },
  {
    to: '/tools',
    icon: '🛠️',
    tag: 'SECURITY & DEV',
    title: 'Developer Tools',
    subtitle: 'Utility crittografiche, audit SAST e diagnostica per ingegneri',
    accentClass: 'pillar-cyan'
  },
  {
    to: '/blog',
    icon: '✍️',
    tag: 'VAULT VERIFIED',
    title: 'DKP Editorial Hub',
    subtitle: 'Deep-dive tecnici con certificazione SHA-256 immutabile',
    accentClass: 'pillar-amber'
  }
]

const fallbackArticles: FeaturedArticle[] = [
  {
    id: 1,
    title: "Guida all'Architettura Nuxt 4 & Rolldown",
    category: 'Cloud Native & DevOps',
    categoryName: 'DevOps',
    slug: 'nuxt-4-rolldown',
    excerpt: 'Come strutturare applicazioni SSR ad altissime prestazioni con bundling nativo e zero overhead.'
  },
  {
    id: 2,
    title: 'Integrazione Ollama e LLM Locali in Vue 3',
    category: 'AI & Machine Learning',
    categoryName: 'AI / LLM',
    slug: 'ollama-vue3',
    excerpt: 'Orchestrazione di modelli locali in streaming SSE con latenza minima e privacy totale.'
  },
  {
    id: 3,
    title: 'Notarizzazione Codice & Hashing SHA-256',
    category: 'Cybersecurity & Vault',
    categoryName: 'Security',
    slug: 'vault-sha256',
    excerpt: 'Garantire integrità e paternità del software tramite prove crittografiche verificabili.'
  },
  {
    id: 4,
    title: 'Telemetria SSE Live & Worker Nitro v2.6',
    category: 'Backend Architecture',
    categoryName: 'Backend',
    slug: 'sse-nitro-v26',
    excerpt: 'Pattern Pure SQL su Neon PostgreSQL e flussi reattivi serverless su Google Cloud Run.'
  }
]

// Fetch SSR per garantire indicizzazione immediata degli articoli in evidenza
const { data: fetchedArticles } = await useAsyncData<FeaturedArticle[]>(
  'dkp-home-featured-articles',
  async () => {
    try {
      const res: any = await $fetch('/api/blog/posts')
      const raw = res?.success ? res.data : (Array.isArray(res) ? res : [])
      if (Array.isArray(raw) && raw.length > 0) {
        return raw.slice(0, 4)
      }
    } catch {}
    return fallbackArticles
  },
  {
    default: () => fallbackArticles
  }
)

const featuredArticles = computed<FeaturedArticle[]>(() =>
  fetchedArticles.value && fetchedArticles.value.length > 0
    ? fetchedArticles.value.slice(0, 4)
    : fallbackArticles
)
</script>

<template>
  <main class="min-h-screen bg-[var(--bg-kernel)] text-[var(--text-main)] font-sans px-4 sm:px-6 py-10 sm:py-14 relative overflow-hidden transition-colors duration-500">
    <!-- BACKGROUND GLOW & TECHNICAL GRID -->
    <div class="hero-grid-bg pointer-events-none" aria-hidden="true"></div>
    <div
      class="absolute -top-44 left-1/2 -translate-x-1/2 w-[860px] h-[340px] bg-[var(--accent-emerald)]/10 blur-[130px] rounded-full pointer-events-none"
      aria-hidden="true"
    ></div>

    <div class="max-w-6xl mx-auto flex flex-col gap-10 sm:gap-14 relative z-10">
      <!-- 1. HERO SECTION PRINCIPALE -->
      <header class="relative pt-4 sm:pt-8 text-center flex flex-col items-center gap-6">
        <!-- BADGE TELEMETRY ECOSYSTEM V2.6 -->
        <div class="inline-flex items-center gap-2.5 bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--accent-emerald)]/35 px-4 py-1.5 rounded-full shadow-[0_0_24px_rgba(16,185,129,0.14)]">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-emerald)] opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--accent-emerald)]"></span>
          </span>
          <span class="text-[11px] font-mono font-black text-[var(--accent-emerald)] uppercase tracking-widest">
            DevKernelPulse v2.6 • Pure SQL &amp; SHA-256 Vault
          </span>
        </div>

        <h1 class="text-4xl sm:text-6xl font-black text-[var(--text-main)] tracking-tight leading-[1.1] max-w-4xl mx-auto">
          La Piattaforma per
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-emerald)] via-[var(--accent-cyan)] to-purple-400">
            Sviluppatori &amp; Sentinel AI
          </span>
        </h1>

        <p class="text-[var(--text-muted)] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Notarizzazione crittografica del codice, strumenti di sicurezza e aggregatore tech ad alto segnale arricchito in tempo reale da Trinity AI.
        </p>

        <!-- BENTO GRID 4 PILASTRI DELL'ECOSISTEMA -->
        <nav aria-label="Moduli principali DevKernelPulse" class="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-3 text-left">
          <NuxtLink
            v-for="pillar in ecosystemPillars"
            :key="pillar.to"
            :to="pillar.to"
            :class="['pillar-card group', pillar.accentClass]"
          >
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-xl" aria-hidden="true">{{ pillar.icon }}</span>
              <span class="pillar-tag font-mono text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                {{ pillar.tag }}
              </span>
            </div>
            <h2 class="text-sm font-extrabold text-[var(--text-main)] group-hover:text-[var(--accent-emerald)] transition-colors flex items-center justify-between">
              <span>{{ pillar.title }}</span>
              <span class="text-xs opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">➔</span>
            </h2>
            <p class="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
              {{ pillar.subtitle }}
            </p>
          </NuxtLink>
        </nav>
      </header>

      <!-- 2. METRICS & LEDGER TELEMETRY -->
      <section aria-label="Metriche dell'ecosistema" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 flex items-center gap-4 shadow-xl hover:border-[var(--accent-emerald)]/40 transition-all">
          <div class="w-12 h-12 rounded-xl bg-[var(--accent-emerald)]/10 border border-[var(--accent-emerald)]/25 flex items-center justify-center text-2xl shrink-0">
            🛡️
          </div>
          <div>
            <p class="text-2xl sm:text-3xl font-black text-[var(--text-main)] font-mono leading-none">1.2M+</p>
            <p class="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider font-mono mt-1.5">
              Linee Codice Notarizzate
            </p>
          </div>
        </div>

        <div class="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 flex items-center gap-4 shadow-xl hover:border-[var(--accent-cyan)]/40 transition-all">
          <div class="w-12 h-12 rounded-xl bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/25 flex items-center justify-center text-2xl shrink-0">
            🚀
          </div>
          <div>
            <p class="text-2xl sm:text-3xl font-black text-[var(--text-main)] font-mono leading-none">48K+</p>
            <p class="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider font-mono mt-1.5">
              Bounties Risolte ($PULSE)
            </p>
          </div>
        </div>

        <div class="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 flex items-center gap-4 shadow-xl hover:border-purple-500/40 transition-all">
          <div class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-2xl shrink-0">
            📡
          </div>
          <div>
            <div class="flex items-center gap-2">
              <p class="text-2xl sm:text-3xl font-black text-[var(--text-main)] font-mono leading-none">Live</p>
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                ONLINE
              </span>
            </div>
            <p class="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider font-mono mt-1.5">
              Sentinel Threat Stream
            </p>
          </div>
        </div>
      </section>

      <!-- 3. WIDGET SPONSORED ECOSYSTEM GLOBAL -->
      <section aria-label="In evidenza nell'ecosistema">
        <DkpAdsWidget placement="global" />
      </section>

      <!-- 4. WIDGET NOTIZIE HACKER NEWS (DKP NODES LIVE STREAM) -->
      <section aria-label="DKP Nodes Live Stream">
        <DkpNodesHomeWidget />
      </section>

      <!-- 5. SEZIONE VAULT DEL BLOG (4 SCHEDE SSR) -->
      <section
        v-if="featuredArticles.length > 0"
        aria-labelledby="vault-featured-heading"
        class="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 shadow-2xl transition-colors duration-500"
      >
        <div class="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <span class="text-[10px] font-mono font-black uppercase tracking-widest text-[var(--accent-emerald)] block mb-1">
              SHA-256 NOTARIZED KNOWLEDGE
            </span>
            <h2 id="vault-featured-heading" class="text-xl sm:text-2xl font-extrabold text-[var(--text-main)] flex items-center gap-2">
              <span aria-hidden="true">🔗</span> Approfondimenti dal Vault
            </h2>
          </div>

          <NuxtLink
            to="/blog"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--bg-kernel)] border border-[var(--border-color)] hover:border-[var(--accent-emerald)] text-xs font-mono font-bold text-[var(--accent-emerald)] transition-all"
          >
            Vedi tutti gli articoli ➔
          </NuxtLink>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <article
            v-for="art in featuredArticles"
            :key="art.id"
            class="bg-[var(--bg-kernel)] border border-[var(--border-color)] hover:border-[var(--accent-emerald)]/50 rounded-2xl p-5 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-md group"
          >
            <div>
              <div class="flex items-center justify-between gap-2 mb-2.5">
                <span class="text-[10px] font-mono font-bold text-[var(--accent-emerald)] uppercase tracking-wider truncate">
                  {{ art.categoryName || art.category || 'Tech' }}
                </span>
                <span
                  v-if="art.vaultHash"
                  title="Contenuto notarizzato nel DKP Vault"
                  class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shrink-0"
                >
                  VAULT ✓
                </span>
              </div>

              <h3 class="text-sm font-bold text-[var(--text-main)] group-hover:text-[var(--accent-emerald)] transition-colors leading-snug">
                <NuxtLink :to="`/blog/${art.slug || art.id}`" class="focus:outline-none">
                  {{ art.title }}
                </NuxtLink>
              </h3>

              <p v-if="art.excerpt" class="text-xs text-[var(--text-muted)] line-clamp-2 mt-2 leading-relaxed">
                {{ art.excerpt }}
              </p>
            </div>

            <NuxtLink
              :to="`/blog/${art.slug || art.id}`"
              class="text-[11px] font-mono font-bold text-[var(--accent-cyan)] group-hover:underline mt-4 inline-flex items-center gap-1"
            >
              Leggi articolo ➔
            </NuxtLink>
          </article>
        </div>
      </section>

      <!-- 6. FEED DEL FORUM: DISCUSSIONI CORRELATE NEI NODI -->
      <section aria-label="Discussioni attive nei DKP Nodes" class="pt-6 border-t border-[var(--border-color)]">
        <DKPRelatedThreads />
      </section>

      <!-- 7. BANNER AD SPONSORED ECOSYSTEM -->
      <aside aria-label="Risorse e libri consigliati">
        <DkpAdStrip categoryTag="DKP DEV LIBRARY • LIBRI CONSIGLIATI" />
      </aside>
    </div>
  </main>
</template>

<style scoped>
.hero-grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(148, 163, 184, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(ellipse 80% 55% at 50% 10%, #000 40%, transparent 100%);
}

.pillar-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.1rem 1.15rem;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.pillar-card:hover {
  transform: translateY(-3px);
}

.pillar-emerald:hover {
  border-color: rgba(16, 185, 129, 0.55);
  box-shadow: 0 12px 28px -10px rgba(16, 185, 129, 0.25);
}
.pillar-emerald .pillar-tag {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
}

.pillar-purple:hover {
  border-color: rgba(168, 85, 247, 0.55);
  box-shadow: 0 12px 28px -10px rgba(168, 85, 247, 0.25);
}
.pillar-purple .pillar-tag {
  background: rgba(168, 85, 247, 0.12);
  color: #c084fc;
}

.pillar-cyan:hover {
  border-color: rgba(56, 189, 248, 0.55);
  box-shadow: 0 12px 28px -10px rgba(56, 189, 248, 0.25);
}
.pillar-cyan .pillar-tag {
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
}

.pillar-amber:hover {
  border-color: rgba(245, 158, 11, 0.55);
  box-shadow: 0 12px 28px -10px rgba(245, 158, 11, 0.25);
}
.pillar-amber .pillar-tag {
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
}
</style>
