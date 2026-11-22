<!-- app/pages/blog/[slug].vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBlog } from '~/composables/useBlog'
import { useDynamicPrism } from '~/composables/useDynamicPrism'
import { parseDkpMarkdown } from '~/utils/dkpMarkdown'
import SocialShare from '~/components/blog/SocialShare.vue'
import DkpRelatedPosts from '~/components/blog/DkpRelatedPosts.vue'
import DkpRelatedNodesWidget from '~/components/widgets/DkpRelatedNodesWidget.vue'
import DkpHomeWidget from '~/components/DkpHomeWidget.vue'
import VaultTrustBadge from '~/components/VaultTrustBadge.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import DkpAdsWidget from '~/components/ads/DkpAdsWidget.vue'

interface BlogPost {
  id?: string | number
  slug?: string
  title: string
  content?: string
  description?: string
  excerpt?: string
  summary?: string
  categoryName?: string
  category?: string
  subcategoryName?: string
  subCategory?: string
  isVerified?: boolean
  authorXp?: number
  authorName?: string
  createdAt?: string
  updatedAt?: string
  date?: string
  views?: number
  likes?: number
  tags?: string[]
  vaultCertificateId?: string
  vaultHash?: string
  vaultBlockNumber?: number | null
}

interface BlogApiResponse {
  data?: BlogPost | null
}

interface AuthorRank {
  color: string
  badge: string
  level: number
  title: string
}

const heroCards = [
  {
    to: '/news',
    icon: '🌍',
    badge: 'LIVE STREAM',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35',
    title: 'DKP Tech Feed',
    desc: 'Segnali tech e newsroom filtrati in tempo reale da Trinity AI'
  },
  {
    to: '/nodes',
    icon: '💬',
    badge: 'COMMUNITY',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/35',
    title: 'DKP Talks Hub',
    desc: 'Nodi tematici, architetture, bounty e discussioni tecniche'
  },
  {
    to: '/tools',
    icon: '🛠️',
    badge: 'SECURITY & DEV',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
    title: 'Developer Tools',
    desc: 'Utility crittografiche, audit SAST e diagnostica per ingegneri'
  },
  {
    to: '/blog',
    icon: '📝',
    badge: 'VAULT VERIFIED',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    title: 'DKP Editorial Hub',
    desc: 'Deep-dive tecnici con certificazione SHA-256 immutabile'
  }
]

useCodeCopy()

const route = useRoute()
const slug = computed(() => String(route.params.slug || '').trim())
const articleBodyRef = ref<HTMLElement | null>(null)

const { likePost, incrementView, getAuthorRank } = useBlog()
const { highlightDomElement, ensurePrismLanguages, extractLanguagesFromMarkdown } = useDynamicPrism()

const {
  data: apiResponse,
  pending,
  error
} = await useFetch(() => `/api/blog/posts/${encodeURIComponent(slug.value)}`)

const optimisticLikes = ref<number | null>(null)
const hasLiked = ref(false)
const optimisticVaultHash = ref<string | null>(null)
const optimisticVaultBlock = ref<number | null>(null)

const post = computed<BlogPost | null>(() => {
  const res = apiResponse.value as unknown as BlogApiResponse | null
  const raw = res?.data || null
  if (!raw) return null

  return {
    ...raw,
    likes: optimisticLikes.value !== null ? optimisticLikes.value : Number(raw.likes || 0),
    vaultHash: optimisticVaultHash.value || raw.vaultHash,
    vaultBlockNumber: optimisticVaultBlock.value ?? raw.vaultBlockNumber ?? null,
    tags: Array.isArray(raw.tags) ? raw.tags : []
  }
})

// --- BLOCKCHAIN VAULT LIVE VERIFICATION (BLOG) ---
const vaultProof = ref<any>(null)
const isCheckingVault = ref(false)
const hashCopied = ref(false)
const toastMsg = ref('')
let toastTimer: ReturnType<typeof setTimeout> | undefined

function showNotification(msg: string) {
  toastMsg.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMsg.value = ''
  }, 3500)
}

function stripMarkdownForSeo(raw: string, maxLen = 160): string {
  const clean = String(raw || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/[#>*_~=+|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (clean.length <= maxLen) return clean
  return `${clean.slice(0, maxLen - 1).trimEnd()}…`
}

function safeVideoEmbedUrl(raw: string): string | null {
  const normalized = String(raw || '').replace(/&amp;/g, '&').trim()
  if (/^https:\/\/(?:www\.youtube\.com\/embed\/|www\.youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/)[a-zA-Z0-9_-]+(?:\?[a-zA-Z0-9_=&%-]*)?$/.test(normalized)) {
    return normalized
  }
  return null
}

async function loadOnChainBlogProof(autoNotarizeIfMissing = true) {
  if (!post.value?.id && !slug.value) return
  isCheckingVault.value = true
  try {
    const queryParams: Record<string, any> = {
      entityType: 'blog',
      slug: post.value?.slug || slug.value
    }
    if (post.value?.id && !Number.isNaN(Number(post.value.id))) {
      queryParams.entityId = Number(post.value.id)
    }

    let verifyRes: any = await $fetch('/api/vault/verify', {
      query: queryParams
    }).catch(() => null)

    if (!verifyRes?.proof && autoNotarizeIfMissing && post.value?.id && !Number.isNaN(Number(post.value.id))) {
      await $fetch('/api/vault/notarize', {
        method: 'POST',
        body: {
          entityType: 'blog',
          entityId: Number(post.value.id)
        }
      }).catch(() => null)

      verifyRes = await $fetch('/api/vault/verify', {
        query: queryParams
      }).catch(() => null)
    }

    if (verifyRes?.proof) {
      vaultProof.value = verifyRes.proof
      if (verifyRes.proof.vaultHash) {
        optimisticVaultHash.value = verifyRes.proof.vaultHash
      }
      if (verifyRes.proof.blockNumber != null) {
        optimisticVaultBlock.value = Number(verifyRes.proof.blockNumber)
      }
    }
  } finally {
    isCheckingVault.value = false
  }
}

async function copyFullVaultHash() {
  const hash = vaultProof.value?.vaultHash || post.value?.vaultHash
  if (!hash || typeof navigator === 'undefined') return
  await navigator.clipboard.writeText(hash).catch(() => {})
  hashCopied.value = true
  showNotification("📋 Hash SHA-256 dell'articolo copiato negli appunti!")
  setTimeout(() => {
    hashCopied.value = false
  }, 2000)
}

const readTime = computed(() => {
  const text = post.value?.content || post.value?.description || ''
  if (!text) return 1
  const plainText = text.replace(/<\/?[^>]+(>|$)/g, '')
  const words = plainText.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
})

// --- NORMALIZZAZIONE INLINE CODE BLOG ---
function renderInlineBackticksInHtml(html: string): string {
  if (!html) return ''
  const protectedBlocks: string[] = []
  let working = html.replace(/<(pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi, (m) => {
    const idx = protectedBlocks.length
    protectedBlocks.push(m)
    return `__DKP_PROTECTED_CODE_${idx}__`
  })

  working = working.replace(/`+([^`\r\n]+?)`+/g, (_m, inner: string) => {
    const cleanInner = inner.replace(/^`+|`+$/g, '').trim()
    if (!cleanInner) return ''
    return `<code class="dkp-inline-code">${cleanInner}</code>`
  })

  protectedBlocks.forEach((block, idx) => {
    working = working.replace(new RegExp(`__DKP_PROTECTED_CODE_${idx}__`, 'g'), () => block)
  })

  working = working.replace(/(<code\b[^>]*>)`+([^<]*?)`+(<\/code>)/gi, '$1$2$3')
  return working
}

// Pulizia apici doppi '' / backtick residui nei code inline del blog
if (typeof document !== 'undefined') {
  const inlineCodes = document.querySelectorAll('.post-content :not(pre) > code, .dkp-markdown-body :not(pre) > code')
  inlineCodes.forEach((el) => {
    const txt = el.textContent || ''
    if (/^`.*`$/.test(txt)) {
      el.textContent = txt.replace(/^`+|`+$/g, '')
    }
  })
}

const parsedContent = computed(() => {
  const contentVal = post.value?.content || post.value?.description || ''
  if (!contentVal) return ''

  const baseHtml = parseDkpMarkdown(contentVal)

  const normalizedInlineHtml = renderInlineBackticksInHtml(baseHtml)

  // Supporto sicuro per embed video (solo YouTube / Vimeo allowlisted)
  return normalizedInlineHtml.replace(/@\[video\]\(([^)]+)\)/g, (_m, rawUrl: string) => {
    const validEmbed = safeVideoEmbedUrl(rawUrl)
    if (!validEmbed) return ''
    return `<div class="dkp-video-wrapper not-prose"><iframe src="${validEmbed}" title="Video embed" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
  })
})

const authorRank = computed<AuthorRank>(() => {
  try {
    const xp = post.value?.authorXp || 0
    return getAuthorRank
      ? getAuthorRank(xp)
      : { color: '#10b981', badge: '🔰', level: 1, title: 'Member' }
  } catch {
    return { color: '#10b981', badge: '🔰', level: 1, title: 'Member' }
  }
})

// --- DKP SEO v2.6 UNIFICATO + RICH RESULTS SCHEMA.ORG ---
const resolvedSlug = computed(() => post.value?.slug || slug.value)
const canonicalPath = computed(() => `/blog/${encodeURIComponent(resolvedSlug.value)}`)
const canonicalUrl = computed(() => `https://devkernelpulse.org${canonicalPath.value}`)
const currentUrl = computed(() => (import.meta.client ? window.location.href : canonicalUrl.value))

const categoryLabel = computed(() => post.value?.categoryName || post.value?.category || 'DKP Ecosystem & Releases')
const subcategoryLabel = computed(() => post.value?.subcategoryName || post.value?.subCategory || '')

const seoTitle = computed(() =>
  post.value?.title
    ? `${post.value.title} — ${categoryLabel.value} | DevKernelPulse`
    : 'Articolo Tecnico — DKP Editorial Hub | DevKernelPulse'
)

const seoDescription = computed(() => {
  const rawDesc =
    post.value?.excerpt ||
    post.value?.description ||
    post.value?.summary ||
    post.value?.content ||
    ''
  const cleaned = stripMarkdownForSeo(rawDesc, 160)
  return cleaned || "Approfondimento tecnico verificato dall'ecosistema DevKernelPulse."
})

const isNotFound = computed(() => Boolean(error.value || (!pending.value && !post.value)))

useDkpSeo({
  title: seoTitle,
  description: seoDescription,
  keywords: computed(() => (post.value?.tags || []).join(', ')),
  type: 'article',
  noindex: isNotFound,
  publishedTime: computed(() => post.value?.createdAt || undefined),
  modifiedTime: computed(() => post.value?.updatedAt || post.value?.createdAt || undefined),
  authorName: computed(() => post.value?.authorName || 'DevKernelPulse Team'),
  section: categoryLabel,
  notarizationHash: computed(() => vaultProof.value?.vaultHash || post.value?.vaultHash || undefined),
  canonicalPath
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() => {
        if (!post.value) return ''

        const breadcrumbItems: any[] = [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://devkernelpulse.org/'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'DKP Editorial Hub',
            item: 'https://devkernelpulse.org/blog'
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: categoryLabel.value,
            item: `https://devkernelpulse.org/blog?category=${encodeURIComponent(categoryLabel.value)}`
          }
        ]

        if (subcategoryLabel.value) {
          breadcrumbItems.push({
            '@type': 'ListItem',
            position: 4,
            name: subcategoryLabel.value,
            item: `https://devkernelpulse.org/blog?category=${encodeURIComponent(categoryLabel.value)}&subcategory=${encodeURIComponent(subcategoryLabel.value)}`
          })
        }

        breadcrumbItems.push({
          '@type': 'ListItem',
          position: breadcrumbItems.length + 1,
          name: post.value.title,
          item: canonicalUrl.value
        })

        return JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'BreadcrumbList',
              itemListElement: breadcrumbItems
            },
            {
              '@type': 'TechArticle',
              '@id': canonicalUrl.value,
              mainEntityOfPage: canonicalUrl.value,
              headline: post.value.title,
              description: seoDescription.value,
              articleSection: categoryLabel.value,
              keywords: (post.value.tags || []).join(', '),
              datePublished: post.value.createdAt || undefined,
              dateModified: post.value.updatedAt || post.value.createdAt || undefined,
              author: {
                '@type': 'Person',
                name: post.value.authorName || 'DevKernelPulse Team'
              },
              publisher: {
                '@type': 'Organization',
                name: 'DevKernelPulse',
                url: 'https://devkernelpulse.org/'
              },
              interactionStatistic: [
                {
                  '@type': 'InteractionCounter',
                  interactionType: 'https://schema.org/LikeAction',
                  userInteractionCount: Number(post.value.likes || 0)
                },
                {
                  '@type': 'InteractionCounter',
                  interactionType: 'https://schema.org/ReadAction',
                  userInteractionCount: Number(post.value.views || 0)
                }
              ]
            }
          ]
        })
      })
    }
  ]
})

const viewTrackedSlug = ref('')

watch(slug, () => {
  optimisticLikes.value = null
  hasLiked.value = false
  optimisticVaultHash.value = null
  optimisticVaultBlock.value = null
  vaultProof.value = null
})

watch(
  () => post.value,
  (currentPost) => {
    const targetIdentifier = String(currentPost?.slug || slug.value || currentPost?.id || '')
    if (currentPost && targetIdentifier && viewTrackedSlug.value !== targetIdentifier) {
      incrementView(targetIdentifier)
      viewTrackedSlug.value = targetIdentifier
    }
  },
  { immediate: true }
)

watch(
  () => post.value?.id,
  (newId) => {
    if (newId && import.meta.client) {
      loadOnChainBlogProof(true)
    }
  }
)

// --- HIGHLIGHTING ASINCRONO CON useDynamicPrism ---
async function applyDynamicPrism() {
  if (!import.meta.client) return
  await nextTick()
  const mdLangs = extractLanguagesFromMarkdown(post.value?.content || post.value?.description || '')
  if (mdLangs.length > 0) {
    await ensurePrismLanguages(mdLangs)
  }
  await highlightDomElement(articleBodyRef.value || document)
}

watch(parsedContent, () => {
  void applyDynamicPrism()
})

onMounted(() => {
  setTimeout(() => {
    void applyDynamicPrism()
  }, 120)
  if (post.value?.id || slug.value) {
    loadOnChainBlogProof(true)
  }
})

onUnmounted(() => {
  clearTimeout(toastTimer)
})

function handleLike() {
  if (!post.value || hasLiked.value) return
  const targetIdentifier = String(post.value.slug || slug.value || post.value.id)
  const currentLikes = Number(post.value.likes || 0)
  optimisticLikes.value = currentLikes + 1
  hasLiked.value = true
  likePost(targetIdentifier)
  showNotification('🔥 Kernel acceso! +1 Karma assegnato all\'articolo.')
}
</script>

<template>
  <div class="min-h-screen bg-dkp-bg bg-grid-pattern text-slate-100 px-4 py-10">
    <div
      v-if="toastMsg"
      role="status"
      class="fixed top-6 right-6 z-[10000] bg-[#041a13]/95 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl font-mono text-xs font-bold"
    >
      {{ toastMsg }}
    </div>

    <div class="max-w-5xl mx-auto flex flex-col gap-6">
      <!-- 4 CARD PRINCIPALI IDENTICHE ALLA HOME & SEZIONI -->
      <nav aria-label="Navigazione Ecosistema DKP" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <NuxtLink
          v-for="card in heroCards"
          :key="card.to"
          :to="card.to"
          :class="[
            'bg-dkp-card/95 border rounded-2xl p-4 no-underline transition-all card-glow group flex flex-col justify-between gap-3',
            card.to === '/blog'
              ? 'border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.14)]'
              : 'border-dkp-border hover:border-cyan-400/60'
          ]"
        >
          <div class="flex items-center justify-between">
            <span class="text-xl">{{ card.icon }}</span>
            <span :class="['font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase', card.badgeClass]">
              {{ card.badge }}
            </span>
          </div>
          <div>
            <div class="text-sm font-bold text-white group-hover:text-dkp-accent transition-colors flex items-center justify-between mb-1">
              <span>{{ card.title }}</span>
              <span class="text-slate-400 group-hover:text-dkp-accent transition-transform group-hover:translate-x-1">&rarr;</span>
            </div>
            <p class="text-[11px] text-slate-300 leading-relaxed m-0">{{ card.desc }}</p>
          </div>
        </NuxtLink>
      </nav>

      <div v-if="pending" class="text-center py-20 text-emerald-400 font-mono bg-dkp-card border border-dkp-border rounded-2xl">
        <span class="text-3xl animate-pulse inline-block mb-4">⚡</span>
        <p class="m-0">Caricamento articolo dal Vault v2.6-PURE-SQL...</p>
      </div>

      <div v-else-if="error || !post" class="text-center py-20 text-rose-400 bg-dkp-card border border-dkp-border rounded-2xl">
        <h2 class="text-2xl font-bold mb-4 mt-0">⚠️ Articolo non trovato</h2>
        <p class="text-slate-400 text-sm">L'articolo richiesto non esiste o è stato rimosso dal Vault.</p>
        <NuxtLink
          to="/blog"
          class="mt-6 inline-block text-emerald-400 hover:underline font-bold font-mono text-xs no-underline"
        >
          ← Torna al DKP Editorial Hub
        </NuxtLink>
      </div>

      <div v-else class="flex flex-col gap-8 relative">
        <article
          class="glass-panel p-6 sm:p-10 rounded-2xl border border-slate-800 bg-[#090d16] shadow-2xl relative overflow-hidden"
        >
          <!-- BREADCRUMB NAVBAR SEO-READY CON CASETTA -->
          <div class="flex flex-col gap-4 mb-8 relative z-10 border-b border-slate-800 pb-4">
            <nav aria-label="Breadcrumb" class="w-full text-xs sm:text-sm text-slate-400 font-mono">
              <ol class="flex items-center gap-2 m-0 p-0 list-none font-medium flex-wrap">
                <li>
                  <NuxtLink
                    to="/"
                    class="inline-flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-colors no-underline"
                    title="Torna alla Home"
                  >
                    <span>Home</span>
                  </NuxtLink>
                </li>
                <li aria-hidden="true" class="text-slate-600">/</li>
                <li>
                  <NuxtLink
                    to="/blog"
                    class="text-slate-300 hover:text-emerald-400 transition-colors no-underline"
                  >
                    DKP Editorial Hub
                  </NuxtLink>
                </li>
                <li aria-hidden="true" class="text-slate-600">/</li>
                <li>
                  <NuxtLink
                    :to="{ path: '/blog', query: { category: categoryLabel } }"
                    class="text-cyan-400 hover:text-emerald-300 transition-colors no-underline font-bold"
                  >
                    {{ categoryLabel }}
                  </NuxtLink>
                </li>
                <template v-if="subcategoryLabel">
                  <li aria-hidden="true" class="text-slate-600">/</li>
                  <li>
                    <NuxtLink
                      :to="{ path: '/blog', query: { category: categoryLabel, subcategory: subcategoryLabel } }"
                      class="text-emerald-400 hover:text-emerald-300 transition-colors no-underline font-bold"
                    >
                      {{ subcategoryLabel }}
                    </NuxtLink>
                  </li>
                </template>
                <li aria-hidden="true" class="text-slate-600">/</li>
                <li aria-current="page" class="text-slate-300 truncate max-w-[240px] sm:max-w-[380px]">
                  {{ post.title }}
                </li>
              </ol>
            </nav>

            <!-- Badges Categoria, Verifica & Blockchain Vault -->
            <div class="flex items-center gap-3 flex-wrap justify-start">
              <span class="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                {{ categoryLabel }}
              </span>

              <span v-if="subcategoryLabel" class="bg-sky-500/10 text-sky-300 border border-sky-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                {{ subcategoryLabel }}
              </span>

              <span v-if="post.isVerified" class="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                🛡️ DKP Verified v2.6
              </span>

              <VaultTrustBadge
                v-if="post.id"
                entity-type="blog"
                :post-id="Number(post.id)"
                :vault-hash="vaultProof?.vaultHash || post.vaultHash"
                :block-number="vaultProof?.blockNumber || post.vaultBlockNumber"
                @notarized="(h) => { optimisticVaultHash = h }"
              />
            </div>
          </div>

          <h1 class="text-3xl md:text-5xl font-black text-white mb-8 leading-tight relative z-10 mt-0">
            {{ post.title }}
          </h1>

          <!-- Author Card -->
          <div
            class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#020420] border border-slate-800 mb-10 relative z-10 transition-colors"
            :style="{
              borderColor: `${authorRank.color}40`,
              boxShadow: `0 4px 20px ${authorRank.color}10`
            }"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 shrink-0"
                :style="{
                  background: `linear-gradient(135deg, ${authorRank.color}, #0f172a)`,
                  borderColor: authorRank.color
                }"
              >
                {{ (post.authorName || 'D')[0].toUpperCase() }}
              </div>

              <div>
                <div class="text-slate-200 font-bold flex items-center gap-2 flex-wrap">
                  {{ post.authorName || 'DevKernelPulse Team' }}
                  <span
                    class="text-[0.65rem] px-2 py-0.5 rounded uppercase tracking-wider border font-bold flex items-center gap-1"
                    :style="{
                      backgroundColor: `${authorRank.color}15`,
                      color: authorRank.color,
                      borderColor: `${authorRank.color}40`
                    }"
                  >
                    <span>{{ authorRank.badge }}</span> Lvl. {{ authorRank.level }} - {{ authorRank.title }}
                  </span>
                </div>

                <div class="text-xs text-slate-400 flex items-center gap-3 mt-1 flex-wrap font-mono">
                  <span>📅 {{ post.createdAt ? new Date(post.createdAt).toLocaleDateString('it-IT') : post.date || 'Recente' }}</span>
                  <span>👁️ {{ post.views || 0 }} visualizzazioni</span>
                  <span>⏱️ {{ readTime }} min lettura</span>
                </div>
              </div>
            </div>
          </div>

          <p
            v-if="post.excerpt || post.summary"
            class="text-sky-400 font-semibold text-lg leading-relaxed mb-8 border-l-4 border-sky-400 pl-4 relative z-10"
          >
            {{ post.excerpt || post.summary }}
          </p>

          <ClientOnly>
            <div
              ref="articleBodyRef"
              class="post-content prose prose-invert max-w-none text-slate-200 mb-12 dkp-preview-content relative z-10"
              v-html="parsedContent"
            ></div>

            <template #fallback>
              <div class="py-10 text-center text-slate-500 animate-pulse font-mono mb-12">
                ⏳ Formattazione Vault in corso...
              </div>
            </template>
          </ClientOnly>

          <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-2 mb-10 relative z-10">
            <span
              v-for="tag in post.tags"
              :key="tag"
              class="bg-[#020420] text-sky-400 border border-slate-700 px-2.5 py-1 rounded text-xs font-mono transition-colors hover:border-sky-500"
            >
              #{{ tag }}
            </span>
          </div>

          <!-- CERTIFICATO ON-CHAIN BLOCKCHAIN VAULT -->
          <div
            class="mt-8 bg-[#020420] border border-emerald-500/35 rounded-xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.06)] z-10 mb-8 font-mono"
          >
            <div class="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
              <div class="flex items-center gap-2.5 flex-wrap">
                <span class="text-lg">⛓️</span>
                <h3 class="text-emerald-400 font-black text-sm sm:text-base tracking-wide uppercase m-0">
                  Proof-of-Code On-Chain Vault v2.6
                </h3>
                <span
                  v-if="vaultProof"
                  class="text-[10px] px-2 py-0.5 rounded font-bold border"
                  :class="vaultProof.status === 'VERIFIED'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/40'"
                >
                  {{ vaultProof.status === 'VERIFIED' ? '✅ SHA-256 VERIFIED' : '⚠️ MODIFIED POST-HASH' }}
                </span>
              </div>

              <div class="flex items-center gap-3">
                <span v-if="vaultProof?.blockNumber" class="text-xs text-sky-400 font-bold">
                  Block #{{ vaultProof.blockNumber }}
                </span>
                <NuxtLink
                  to="/nodes/n/blockchain-vault"
                  class="text-xs text-emerald-400 hover:underline no-underline font-bold"
                >
                  n/blockchain-vault →
                </NuxtLink>
              </div>
            </div>

            <div v-if="isCheckingVault" class="text-xs text-slate-400 py-2">
              ⚡ Verifica crittografica SHA-256 dell'articolo sul ledger in corso...
            </div>

            <div v-else class="flex flex-col gap-3 text-xs">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#090d16] border border-slate-800 rounded-lg p-3.5">
                <div class="min-w-0">
                  <div class="text-[10px] text-slate-500 uppercase">SHA-256 Editorial Content Proof Hash</div>
                  <div class="text-emerald-400 break-all select-all text-[11px] mt-1">
                    {{ vaultProof?.vaultHash || post.vaultHash || 'In attesa di notarizzazione...' }}
                  </div>
                </div>
                <button
                  type="button"
                  @click="copyFullVaultHash"
                  class="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 font-bold text-[11px] cursor-pointer"
                >
                  {{ hashCopied ? '✓ Copiato' : '📋 Copia Hash' }}
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
                <div class="bg-[#090d16] border border-slate-800/80 rounded-lg p-2.5 truncate">
                  <span class="text-slate-500">Certificate:</span>
                  <span class="text-emerald-400 font-bold ml-1">{{ post.vaultCertificateId || `DKP-BLOG-${post.id}` }}</span>
                </div>
                <div class="bg-[#090d16] border border-slate-800/80 rounded-lg p-2.5 truncate">
                  <span class="text-slate-500">Network:</span>
                  <span class="text-sky-400 font-bold ml-1">{{ vaultProof?.chainNetwork || 'DKP-VAULT-MAINNET-v2.6' }}</span>
                </div>
                <div class="bg-[#090d16] border border-slate-800/80 rounded-lg p-2.5 truncate">
                  <span class="text-slate-500">Merkle Root:</span>
                  <span class="text-purple-400 ml-1">{{ vaultProof?.merkleRoot ? `${vaultProof.merkleRoot.slice(0, 16)}…` : 'Generazione...' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- FOOTER KARMA / LIKE -->
          <div class="article-actions-footer bg-[#020420] border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10 mb-6">
            <div class="flex flex-col gap-1 items-center sm:items-start text-center sm:text-left w-full sm:w-auto">
              <button
                type="button"
                @click="handleLike"
                :disabled="hasLiked"
                :class="[
                  'border-none px-6 py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition-all w-full sm:w-auto',
                  hasLiked
                    ? 'bg-emerald-500/80 text-slate-950 cursor-default'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer transform hover:-translate-y-1 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                ]"
              >
                🔥 {{ hasLiked ? 'Kernel Acceso' : 'Accendi Kernel' }}
                <span class="bg-[#020420] text-emerald-400 px-3 py-1 rounded text-sm shadow-inner">{{ post.likes || 0 }}</span>
              </button>
              <span class="text-slate-400 text-xs mt-1">Premi per premiare questo articolo con Karma!</span>
            </div>
          </div>

          <!-- SEZIONE CONDIVISIONE ARTICOLO -->
          <div class="share-horizontal-card bg-[#020420] border border-slate-800 rounded-xl p-6 relative z-10 mb-10 shadow-lg">
            <div class="flex flex-col md:flex-row items-center justify-between gap-4">
              <div class="flex items-center gap-3 text-center md:text-left">
                <div class="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-xl font-bold shrink-0">
                  🚀
                </div>
                <div>
                  <h4 class="text-white font-extrabold text-base m-0">Condividi articolo</h4>
                  <p class="text-slate-400 text-xs m-0">Diffondi la conoscenza nell'ecosistema Dev</p>
                </div>
              </div>

              <div class="w-full md:w-auto flex justify-center">
                <SocialShare
                  :title="post?.title || 'DevKernelPulse Blog'"
                  :url="currentUrl"
                  :horizontal="true"
                />
              </div>
            </div>
          </div>
          <!-- CIRCUITO DKP ADS + ACQUISTA SPAZIO (ORIZZONTALE) -->
           <DkpAdsWidget
             placement="feedInline"
             layout="horizontal"
             :limit="3"
             :show-advertise-link="true"
            />
          <!-- WIDGET UNICI SENZA DUPLICATI -->
          <div class="space-y-6 pt-6 border-t border-slate-800 relative z-10">
            <DkpRelatedPosts
              v-if="post && post.id"
              :current-post-id="String(post.id)"
              :category="categoryLabel"
              :tags="post.tags || []"
            />

            <DkpRelatedNodesWidget />
            <DkpHomeWidget />

            <DkpAdStrip
              layout="horizontal"
              category-tag="DKP ADS NETWORK &bull; APPROFONDIMENTI DAL VAULT"
              :topic="categoryLabel"
              :tags="post.tags || []"
            />
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-panel {
  backdrop-filter: blur(12px);
}

.prose h1, .post-content h1 { @apply text-3xl md:text-4xl font-extrabold text-white mt-8 mb-4 border-b border-slate-800 pb-2; }
.prose h2, .post-content h2 { @apply text-2xl font-bold text-white mt-6 mb-3; }
.prose h3, .post-content h3 { @apply text-xl font-bold text-sky-400 mt-4 mb-2; }
.prose p, .post-content p { @apply text-slate-300 text-lg leading-relaxed mb-6; }
.prose blockquote, .post-content blockquote { @apply border-l-4 border-emerald-400 bg-emerald-500/10 p-4 my-6 text-slate-300 italic rounded-r-lg; }

:deep(.dkp-table-wrapper) { @apply overflow-x-auto my-6; }
.prose table, .post-content table, :deep(.dkp-table) { @apply w-full border-collapse bg-[#090d16] rounded-lg overflow-hidden border border-slate-800 text-left; }
.prose th, .post-content th, :deep(.dkp-table th) { @apply bg-[#0d1322] text-emerald-400 font-bold p-3 border border-slate-800 text-xs uppercase tracking-wider; }
.prose td, .post-content td, :deep(.dkp-table td) { @apply p-3 text-slate-300 border border-slate-800 text-sm; }

.prose code::before, .prose code::after { content: "" !important; }

:deep(.dkp-code-wrapper) {
  background: #0d1117;
  border: 1px solid #1e293b;
  border-radius: 8px;
  overflow: hidden;
  margin: 1.2rem 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

:deep(.dkp-code-header) {
  background: #161b22;
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #1e293b;
  font-family: sans-serif;
  font-size: 0.8rem;
  font-weight: bold;
  color: #8b949e;
  text-transform: capitalize;
}

:deep(.dkp-copy-btn) {
  background: none;
  border: none;
  color: #8b949e;
  cursor: pointer;
  font-size: 1rem;
  transition: color 0.2s;
}
:deep(.dkp-copy-btn:hover) { color: #00dc82; }

:deep(.dkp-code-block) { padding: 1rem; margin: 0; overflow-x: auto; }

.prose pre code, .post-content pre code, :deep(.dkp-code-block code) {
  background-color: transparent !important;
  border: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
  font-family: "Fira Code", "Courier New", Courier, monospace;
  font-size: 0.875rem !important;
  line-height: 1.7 !important;
  box-shadow: none !important;
}

.prose pre code .token, :deep(.dkp-code-block code .token) { background: transparent !important; }

:deep(.dkp-img) { max-width: 100%; height: auto; border-radius: 8px; margin: 1.5rem 0; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4); display: block; }
:deep(.dkp-video-wrapper) { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1.5rem 0; border-radius: 8px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4); }
:deep(.dkp-video-wrapper iframe) { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
:deep(.dkp-highlight) { background-color: rgba(0, 220, 130, 0.25); color: #f8fafc; padding: 0.1rem 0.3rem; border-radius: 4px; }
:deep(.dkp-underline) { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #38bdf8; text-decoration-thickness: 2px; }

.prose :not(pre) > code, .post-content :not(pre) > code, :deep(.dkp-inline-code) {
  background-color: rgba(30, 41, 59, 0.8) !important;
  color: #38bdf8 !important;
  padding: 0.2rem 0.4rem !important;
  border-radius: 0.375rem !important;
  border: 1px solid rgba(51, 65, 85, 0.6) !important;
  font-weight: 500 !important;
}

:deep(.dkp-h1) { font-size: 1.8rem; font-weight: 900; color: #ffffff; margin-top: 1.2rem; margin-bottom: 0.6rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.3rem; }
:deep(.dkp-h2) { font-size: 1.4rem; font-weight: 800; color: #ffffff; margin-top: 1rem; margin-bottom: 0.5rem; }
:deep(.dkp-h3) { font-size: 1.1rem; font-weight: 700; color: #00dc82; margin-top: 0.8rem; margin-bottom: 0.4rem; }
:deep(.dkp-quote) { border-left: 3px solid #00dc82; padding-left: 0.8rem; color: #94a3b8; font-style: italic; margin: 0.8rem 0; background: rgba(0, 220, 130, 0.05); padding-top: 0.2rem; padding-bottom: 0.2rem; }
:deep(.dkp-link) { color: #38bdf8; text-decoration: underline; text-underline-offset: 2px; }
:deep(.dkp-link:hover) { color: #00dc82; }
:deep(.dkp-hr) { border: none; height: 1px; background-color: #334155; margin: 1.5rem 0; }

:deep(.dkp-preview-content ul), :deep(.dkp-preview-content ol) { padding-left: 1.5rem; margin: 0.8rem 0; color: #cbd5e1; }
:deep(.dkp-preview-content ul) { list-style-type: none; }
:deep(.dkp-preview-content ol) { list-style-type: decimal; }
:deep(.dkp-li) { margin-bottom: 0.4rem; position: relative; }
:deep(ul > .dkp-li::before) { content: "○"; color: #38bdf8; position: absolute; left: -1.2rem; top: 0; font-weight: bold; }
mark,
.dkp-highlight {
  background-color: rgba(16, 185, 129, 0.16) !important;
  color: #6ee7b7 !important;
  border: 1px solid rgba(16, 185, 129, 0.35) !important;
  border-radius: 0.375rem !important;
  padding: 0.08rem 0.38rem !important;
  font-weight: 700 !important;
}

.dkp-inline-code,
:not(pre) > code {
  background-color: rgba(30, 41, 59, 0.85) !important;
  color: #38bdf8 !important;
  border-radius: 0.3rem !important;
}
:deep(ul) {
  list-style-type: disc !important;
  padding-left: 1.5rem !important;
  margin: 0.75rem 0 !important;
}
:deep(ol) {
  list-style-type: decimal !important;
  padding-left: 1.5rem !important;
  margin: 0.75rem 0 !important;
}
:deep(li) {
  display: list-item !important;
  margin: 0.35rem 0 !important;
}
:deep(ul > li.dkp-li::before) {
  content: none !important;
}
:deep(:not(pre) > code),
:deep(.dkp-inline-code) {
  background-color: rgba(30, 41, 59, 0.88) !important;
  color: #38bdf8 !important;
  border: 1px solid rgba(56, 189, 248, 0.3) !important;
  border-radius: 0.375rem !important;
  padding: 0.15rem 0.45rem !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-size: 0.875em !important;
  font-weight: 600 !important;
}
:deep(.token.comment),
:deep(.token.prolog),
:deep(.token.cdata) { color: #64748b !important; }
:deep(.token.punctuation) { color: #cbd5e1 !important; }
:deep(.token.property),
:deep(.token.tag),
:deep(.token.boolean),
:deep(.token.number),
:deep(.token.constant),
:deep(.token.symbol) { color: #38bdf8 !important; }
:deep(.token.selector),
:deep(.token.attr-name),
:deep(.token.string),
:deep(.token.char),
:deep(.token.builtin) { color: #34d399 !important; }
:deep(.token.operator),
:deep(.token.entity),
:deep(.token.url) { color: #f472b6 !important; }
:deep(.token.atrule),
:deep(.token.attr-value),
:deep(.token.keyword) { color: #c084fc !important; font-weight: 600 !important; }
:deep(.token.function),
:deep(.token.class-name) { color: #fbbf24 !important; }

:deep(.dkp-code-header) {
  background: #081224 !important;
  border-bottom: 1px solid rgba(56, 189, 248, 0.22) !important;
  border-radius: 0 !important;
  padding: 0.5rem 1rem !important;
  color: #7dd3fc !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-size: 0.75rem !important;
  letter-spacing: 0.06em !important;
  text-transform: uppercase !important;
}

:deep(.dkp-copy-btn) {
  border-radius: 2px !important;
  border: 1px solid rgba(56, 189, 248, 0.25) !important;
  background: rgba(15, 23, 42, 0.75) !important;
  color: #bae6fd !important;
  padding: 0.2rem 0.55rem !important;
  font-size: 0.75rem !important;
}

:deep(.dkp-copy-btn:hover) {
  border-color: #22d3ee !important;
  color: #22d3ee !important;
}

:deep(.dkp-code-block) {
  background: #050a14 !important;
  border-radius: 0 !important;
  padding: 1rem 1.1rem !important;
  margin: 0 !important;
  overflow-x: auto !important;
}

:deep(pre code),
:deep(.dkp-code-block code) {
  font-family: "JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-size: 0.9rem !important;
  line-height: 1.72 !important;
  letter-spacing: 0.01em !important;
}

:deep(ul) {
  list-style-type: disc !important;
  padding-left: 1.5rem !important;
  margin: 0.75rem 0 !important;
}

:deep(ul)::marker,
:deep(ul li)::marker {
  color: #22d3ee !important;
  font-weight: 700 !important;
}

:deep(ol) {
  list-style-type: decimal !important;
  padding-left: 1.5rem !important;
  margin: 0.75rem 0 !important;
}

:deep(ol)::marker,
:deep(ol li)::marker {
  color: #22d3ee !important;
  font-weight: 700 !important;
}

:deep(li) {
  display: list-item !important;
  margin: 0.35rem 0 !important;
}

:deep(ul > li.dkp-li::before) {
  content: none !important;
}

/* --- BREADCRUMB PROTETTO DA LISTE MARKDOWN --- */
:deep(nav[aria-label="Breadcrumb"] ol),
:deep(nav[aria-label="Breadcrumb"] ul) {
  list-style: none !important;
  padding-left: 0 !important;
  margin: 0 !important;
  display: flex !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  gap: 0.5rem !important;
}

:deep(nav[aria-label="Breadcrumb"] li),
:deep(nav[aria-label="Breadcrumb"] li::marker) {
  list-style: none !important;
  display: inline-flex !important;
  align-items: center !important;
  margin: 0 !important;
  padding: 0 !important;
  content: none !important;
}

/* --- STILE UNIFICATO CODE BLOCK (DARK CYBERPUNK SQUADRATO) & LISTE CYAN --- */
:deep(.post-content ul),
:deep(.dkp-preview-content ul),
:deep(.prose ul) {
  list-style-type: disc !important;
  padding-left: 1.5rem !important;
  margin: 0.75rem 0 !important;
}

:deep(.post-content ol),
:deep(.dkp-preview-content ol),
:deep(.prose ol) {
  list-style-type: decimal !important;
  padding-left: 1.5rem !important;
  margin: 0.75rem 0 !important;
}

:deep(.post-content ul)::marker,
:deep(.post-content ul li)::marker,
:deep(.dkp-preview-content ul)::marker,
:deep(.dkp-preview-content ul li)::marker,
:deep(.prose ul)::marker,
:deep(.prose ul li)::marker {
  color: #22d3ee !important;
  font-weight: 700 !important;
}

:deep(.post-content ol)::marker,
:deep(.post-content ol li)::marker,
:deep(.dkp-preview-content ol)::marker,
:deep(.dkp-preview-content ol li)::marker,
:deep(.prose ol)::marker,
:deep(.prose ol li)::marker {
  color: #22d3ee !important;
  font-weight: 700 !important;
}

:deep(.post-content li),
:deep(.dkp-preview-content li),
:deep(.prose li) {
  display: list-item !important;
  margin: 0.35rem 0 !important;
}

:deep(.post-content ul > li.dkp-li::before),
:deep(.dkp-preview-content ul > li.dkp-li::before),
:deep(.prose ul > li.dkp-li::before) {
  content: none !important;
}

:deep(.dkp-code-wrapper) {
  background: #050a14 !important;
  border: 1px solid rgba(56, 189, 248, 0.28) !important;
  border-radius: 2px !important;
  overflow: hidden !important;
  margin: 1.25rem 0 !important;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.9), 0 10px 25px rgba(2, 6, 23, 0.65) !important;
}

:deep(.dkp-code-header) {
  background: #081224 !important;
  border-bottom: 1px solid rgba(56, 189, 248, 0.22) !important;
  border-radius: 0 !important;
  padding: 0.5rem 1rem !important;
  color: #7dd3fc !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-size: 0.75rem !important;
  letter-spacing: 0.06em !important;
  text-transform: uppercase !important;
}

:deep(.dkp-copy-btn) {
  border-radius: 2px !important;
  border: 1px solid rgba(56, 189, 248, 0.25) !important;
  background: rgba(15, 23, 42, 0.75) !important;
  color: #bae6fd !important;
  padding: 0.2rem 0.55rem !important;
  font-size: 0.75rem !important;
}

:deep(.dkp-copy-btn:hover) {
  border-color: #22d3ee !important;
  color: #22d3ee !important;
}

:deep(.dkp-code-block) {
  background: #050a14 !important;
  border-radius: 0 !important;
  padding: 1rem 1.1rem !important;
  margin: 0 !important;
  overflow-x: auto !important;
}

:deep(pre code),
:deep(.dkp-code-block code) {
  font-family: "JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-size: 0.9rem !important;
  line-height: 1.72 !important;
  letter-spacing: 0.01em !important;
}

:deep(.post-content :not(pre) > code),
:deep(.dkp-preview-content :not(pre) > code),
:deep(.prose :not(pre) > code),
:deep(.dkp-inline-code) {
  background-color: rgba(14, 116, 144, 0.22) !important;
  color: #67e8f9 !important;
  border: 1px solid rgba(34, 211, 238, 0.35) !important;
  border-radius: 4px !important;
  padding: 0.12rem 0.42rem !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-size: 0.875em !important;
  font-weight: 600 !important;
}
</style>