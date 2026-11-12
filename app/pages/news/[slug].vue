<!-- app/pages/news/[slug].vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBlog } from '~/composables/useBlog'
import SocialShare from '~/components/blog/SocialShare.vue'
import DKPRelatedThreads from '~/components/nodes/DKPRelatedThreads.vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'
import DKPAdBanner from '~/components/DKPAdBanner.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

interface AuthorRank {
  color: string
  badge: string
  level: number
  title: string
}

interface PrismHighlighter {
  highlightAll: () => void
}

useCodeCopy()

const route = useRoute()
const slugParam = computed(() => String(route.params.slug || ''))
const { $prism } = useNuxtApp()
const { getAuthorRank } = useBlog()

// 1. Fetch dettaglio notizia
const { data: newsRes, pending } = await useFetch(() => `/api/news/${slugParam.value}`, {
  key: `news-detail-${slugParam.value}`
})

const story = computed(() => {
  const res: any = newsRes.value
  if (!res) return null
  const payload = res.story || res.data || res.news || (Array.isArray(res) ? res[0] : res)
  if (payload && payload.title) {
    return {
      ...payload,
      points: Number(payload.points ?? payload.score ?? 1),
      techScore: Number(payload.techScore ?? payload.tech_score ?? 0),
      summaryIt: payload.summary_it || payload.summaryIt || payload.summary || '',
      createdAt: payload.createdAt || payload.created_at || new Date().toISOString(),
      vaultHash: payload.vaultHash || payload.vault_hash || payload.sha256 || null
    }
  }
  return null
})

// 2. Gestione Commenti Notizia (lazy SSR-safe)
const newCommentText = ref('')
const isSubmitting = ref(false)
const commentError = ref('')
const toastMsg = ref('')

function showNotification(msg: string) {
  toastMsg.value = msg
  setTimeout(() => {
    toastMsg.value = ''
  }, 3500)
}

const { data: commentsRes, refresh: refreshComments } = await useFetch('/api/news/comments', {
  key: `news-comments-${slugParam.value}`,
  query: computed(() => ({ slug: slugParam.value })),
  lazy: true
})

const comments = computed<any[]>(() => {
  const res: any = commentsRes.value
  if (!res) return []
  return res.data || res.comments || []
})

// 3. Approfondimenti dal Vault Editorial Hub (4 colonne)
const { data: vaultRes } = await useFetch('/api/blog/posts', {
  key: `news-slug-vault-${slugParam.value}`,
  lazy: true
})

const featuredArticles = computed(() => {
  const res: any = vaultRes.value
  const raw = res?.success ? res.data : (Array.isArray(res) ? res : [])
  return raw.slice(0, 4)
})

const readTime = computed(() => {
  const text = `${story.value?.summaryIt || ''} ${story.value?.content || ''}`.trim()
  if (!text) return 1
  const plainText = text.replace(/<\/?[^>]+(>|$)/g, '')
  const words = plainText.split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
})

function parseDkpMarkdown(contentVal: string): string {
  try {
    if (!contentVal) return ''

    let rawContent = contentVal.replace(/\\n/g, '\n').replace(/\\r/g, '\r')
    const codeBlocks: string[] = []

    rawContent = rawContent.replace(
      /```([a-zA-Z0-9+#-]*)\r?\n([\s\S]*?)```/g,
      (_match: string, lang: string, code: string) => {
        const index = codeBlocks.length
        const cleanLang = lang ? lang.trim().toLowerCase() : 'code'
        const languageClass = cleanLang !== 'code' ? `language-${cleanLang}` : 'language-none'

        const languageLabel = `<div class="dkp-code-header"><span>${cleanLang}</span><button type="button" class="dkp-copy-btn" data-code-id="code-block-${index}" title="Copia codice">📋</button></div>`
        const escapedCode = code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')

        codeBlocks.push(
          `<div class="dkp-code-wrapper not-prose">${languageLabel}<pre class="dkp-code-block ${languageClass}"><code id="code-block-${index}" class="${languageClass}">${escapedCode}</code></pre></div>`
        )
        return `__DKP_CODE_BLOCK_${index}__`
      }
    )

    let html = rawContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    html = html
      .replace(/==(.*?)==/g, '<mark class="dkp-highlight">$1</mark>')
      .replace(/\+\+(.*?)\+\+/g, '<u class="dkp-underline">$1</u>')
      .replace(/`([^`\n]+)`/g, '<code class="dkp-inline-code">$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="dkp-link" target="_blank" rel="noopener noreferrer">$1</a>')

    html = html
      .replace(/^# (.*?)\r?$/gm, '<h1 class="dkp-h1">$1</h1>')
      .replace(/^## (.*?)\r?$/gm, '<h2 class="dkp-h2">$1</h2>')
      .replace(/^### (.*?)\r?$/gm, '<h3 class="dkp-h3">$1</h3>')
      .replace(/^&gt; (.*?)\r?$/gm, '<blockquote class="dkp-quote">$1</blockquote>')
      .replace(/^---$/gm, '<hr class="dkp-hr" />')

    html = html.replace(/^-(?!\S) (.*?)\r?$/gm, '<ul><li class="dkp-li-main">$1</li></ul>')
    html = html.replace(/^[0-9]+\. (.*?)\r?$/gm, '<ol><li class="dkp-li-main">$1</li></ol>')
    html = html.replace(/<\/ul>\s*<ul>/g, '')
    html = html.replace(/<\/ol>\s*<ol>/g, '')

    const lines = html.split(/\r?\n/)
    let parsedHtml = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      if (trimmed.includes('__DKP_CODE_BLOCK_')) {
        parsedHtml += line + '\n'
      } else if (
        /^<(h[1-6]|pre|div|table|ul|ol|blockquote|hr|li|img)/.test(trimmed) ||
        /^<\/(div|table|ul|ol|blockquote)>/.test(trimmed)
      ) {
        parsedHtml += line + '\n'
      } else if (trimmed === '') {
        parsedHtml += '<br />\n'
      } else {
        parsedHtml += line + (i < lines.length - 1 ? '<br />' : '')
      }
    }

    codeBlocks.forEach((block, index) => {
      parsedHtml = parsedHtml.replace(
        new RegExp(`__DKP_CODE_BLOCK_${index}__(?:<br \\/>)?`, 'g'),
        () => block
      )
    })

    return parsedHtml
      .replace(/(<\/h[1-6]>)<br \/>/g, '$1')
      .replace(/(<\/pre>)<br \/>/g, '$1')
      .replace(/(<\/div>)<br \/>/g, '$1')
  } catch {
    return ''
  }
}

const parsedExtraContent = computed(() =>
  story.value?.content ? parseDkpMarkdown(String(story.value.content)) : ''
)

const curatorRank = computed<AuthorRank>(() => {
  try {
    const xp = (story.value?.points || 10) * 15
    return getAuthorRank
      ? getAuthorRank(xp)
      : { color: '#10b981', badge: '🛡️', level: 3, title: 'Trinity AI Sentinel' }
  } catch {
    return { color: '#10b981', badge: '🛡️', level: 3, title: 'Trinity AI Sentinel' }
  }
})

const currentUrl = computed(() =>
  import.meta.client ? window.location.href : `https://devkernelpulse.org/news/${slugParam.value}`
)

const sourceDomain = computed(() => {
  if (!story.value?.url) return 'news.ycombinator.com'
  try {
    return new URL(story.value.url).hostname.replace(/^www\./, '')
  } catch {
    return 'hackernews.org'
  }
})

function boostStoryPoints() {
  if (!story.value) return
  story.value.points = (story.value.points || 0) + 1
  showNotification('🔥 Kernel acceso! +1 Karma assegnato alla notizia!')
}

async function submitComment() {
  if (!newCommentText.value.trim()) return
  commentError.value = ''
  isSubmitting.value = true

  try {
    const res: any = await $fetch('/api/news/comments', {
      method: 'POST',
      body: {
        slug: slugParam.value,
        content: newCommentText.value.trim()
      }
    })

    if (res && (res.success || res.id)) {
      newCommentText.value = ''
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dkp:xp_updated'))
      }
      showNotification('💬 Commento pubblicato! +10 XP accreditati!')
      await refreshComments()
      await nextTick()
      applyPrism()
    }
  } catch (err: any) {
    commentError.value = err?.data?.statusMessage || 'Errore durante l\'invio del commento.'
  } finally {
    isSubmitting.value = false
  }
}

function getTypeBadgeColor(type: string) {
  if (type === 'show') return 'border-purple-500/40 bg-purple-500/15 text-purple-400'
  if (type === 'ask') return 'border-sky-500/40 bg-sky-500/15 text-sky-400'
  return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
}

function parseTags(tags: any): string[] {
  if (Array.isArray(tags)) return tags
  if (typeof tags === 'string') {
    return tags.replace(/[{}]/g, '').split(',').map(t => t.trim().replace(/^"/, '').replace(/"$/, '')).filter(Boolean)
  }
  return ['HackerNews', 'Tech']
}

let prismTimer: ReturnType<typeof setTimeout> | undefined
const applyPrism = () => {
  if (import.meta.client && $prism) {
    clearTimeout(prismTimer)
    prismTimer = setTimeout(() => {
      try {
        ;($prism as PrismHighlighter).highlightAll()
      } catch (e) {
        console.warn('Prism highlight notice:', e)
      }
    }, 100)
  }
}

const showCopyFeedback = (btn: HTMLButtonElement) => {
  const originalText = btn.innerHTML
  btn.innerHTML = '✅'
  btn.style.color = '#00dc82'
  setTimeout(() => {
    btn.innerHTML = originalText
    btn.style.color = ''
  }, 2000)
}

const handleCopyClick = (event: MouseEvent) => {
  const target = event.target
  const copyBtn = target instanceof Element ? (target.closest('.dkp-copy-btn') as HTMLButtonElement | null) : null
  if (copyBtn) {
    const codeId = copyBtn.getAttribute('data-code-id')
    if (codeId) {
      const codeElement = document.getElementById(codeId)
      if (codeElement && navigator.clipboard && window.isSecureContext) {
        const textToCopy = codeElement.innerText || codeElement.textContent || ''
        navigator.clipboard.writeText(textToCopy).then(() => showCopyFeedback(copyBtn))
      }
    }
  }
}

watch(parsedExtraContent, async () => {
  await nextTick()
  applyPrism()
})

onMounted(() => {
  setTimeout(applyPrism, 200)
  document.addEventListener('click', handleCopyClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleCopyClick)
})

useHead({
  title: computed(() => story.value ? `${story.value.title} — DKP Tech Feed v2.6` : 'Scheda Notizia AI — DevKernelPulse'),
  meta: [
    {
      name: 'description',
      content: computed(() => story.value?.summaryIt || 'Analisi tecnica in tempo reale elaborata da Trinity AI su DevKernelPulse v2.6-PURE-SQL.')
    }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 sm:px-6 py-10">
    <!-- Toast XP / Feedback -->
    <div
      v-if="toastMsg"
      role="status"
      class="fixed top-6 right-6 z-[10000] bg-[#041a13]/95 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl font-mono text-xs font-bold"
    >
      {{ toastMsg }}
    </div>

    <div class="max-w-5xl mx-auto flex flex-col gap-6">
      <!-- BARRA 4 PILASTRI ECOSISTEMA DKP v2.6 -->
      <nav aria-label="Navigazione Ecosistema DKP" class="flex flex-wrap gap-2.5 justify-center font-mono bg-[#090d16] border border-slate-800 p-3 rounded-2xl shadow-lg">
        <NuxtLink
          to="/news"
          class="px-4 py-2 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] no-underline"
        >
          🌍 DKP Tech Feed
        </NuxtLink>

        <NuxtLink
          to="/nodes"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-purple-400 text-purple-400 font-extrabold text-xs rounded-xl transition-all no-underline"
        >
          💬 DKP Talks Hub
        </NuxtLink>

        <NuxtLink
          to="/tools"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-sky-400 text-sky-400 font-extrabold text-xs rounded-xl transition-all no-underline"
        >
          🛠️ Developer Tools
        </NuxtLink>

        <NuxtLink
          to="/blog"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-300 font-extrabold text-xs rounded-xl transition-all no-underline"
        >
          ✍️ DKP Editorial Hub
        </NuxtLink>
      </nav>

      <!-- STATE: LOADING PRINCIPALE -->
      <div v-if="pending" class="text-center py-20 bg-[#090d16] border border-slate-800 rounded-2xl text-emerald-400 font-mono text-xs animate-pulse">
        <span class="text-3xl inline-block mb-3">⚡</span>
        <p class="m-0">Analisi della notizia da parte di Trinity AI v2.6-PURE-SQL in corso...</p>
      </div>

      <!-- STATE: SCHEDA NOTIZIA -->
      <template v-else-if="story">
        <div class="flex flex-col gap-8">
          <article class="glass-panel bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-80 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <!-- BREADCRUMB NAVBAR SEO-READY + BADGES -->
            <div class="flex flex-col gap-4 relative z-10 border-b border-slate-800 pb-4">
              <nav aria-label="Breadcrumb" class="w-full text-sm text-slate-400">
                <ol class="flex items-center gap-2 m-0 p-0 list-none font-medium flex-wrap">
                  <li class="flex items-center">
                    <NuxtLink to="/news" class="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1 no-underline">
                      <span class="text-xs">🌍</span> Tech Feed
                    </NuxtLink>
                  </li>
                  <li class="flex items-center gap-2">
                    <span class="text-slate-600 font-bold">/</span>
                    <span class="text-sky-400 font-mono font-bold">
                      {{ story.type === 'show' ? 'SHOW HN' : story.type === 'ask' ? 'ASK HN' : 'NEWS' }}
                    </span>
                  </li>
                  <li class="flex items-center gap-2">
                    <span class="text-slate-600 font-bold">/</span>
                    <span class="text-slate-200 max-w-[170px] sm:max-w-[340px] truncate" :title="story.title" aria-current="page">
                      {{ story.title }}
                    </span>
                  </li>
                </ol>
              </nav>

              <!-- BADGES SENTINEL & PURE-SQL -->
              <div class="flex items-center gap-2.5 flex-wrap justify-start font-mono">
                <span :class="['px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider border', getTypeBadgeColor(story.type)]">
                  {{ story.type === 'show' ? 'SHOW HN' : story.type === 'ask' ? 'ASK HN' : 'NEWS' }}
                </span>

                <span class="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                  ⚡ PURE-SQL INDEXED
                </span>

                <span class="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  🛡️ TRINITY SENTINEL {{ story.techScore ? `${story.techScore}%` : 'v2.6' }}
                </span>
              </div>
            </div>

            <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight relative z-10 m-0">
              {{ story.title }}
            </h1>

            <!-- SOURCE & CURATOR CARD CON RANK & XP -->
            <div
              class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#020420] border border-slate-800 relative z-10 transition-colors"
              :style="{
                borderColor: `${curatorRank.color}45`,
                boxShadow: `0 4px 20px ${curatorRank.color}12`
              }"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 shrink-0"
                  :style="{
                    background: `linear-gradient(135deg, ${curatorRank.color}, #0f172a)`,
                    borderColor: curatorRank.color
                  }"
                >
                  {{ (story.author || 'H')[0].toUpperCase() }}
                </div>

                <div>
                  <div class="text-slate-200 font-bold flex items-center gap-2 flex-wrap">
                    <span>@{{ story.author || 'hackernews' }}</span>
                    <span
                      class="text-[0.65rem] px-2 py-0.5 rounded uppercase tracking-wider border font-bold flex items-center gap-1"
                      :style="{
                        backgroundColor: `${curatorRank.color}15`,
                        color: curatorRank.color,
                        borderColor: `${curatorRank.color}40`
                      }"
                    >
                      <span>{{ curatorRank.badge }}</span> Lvl. {{ curatorRank.level }} - {{ curatorRank.title }}
                    </span>
                  </div>

                  <div class="text-xs text-slate-400 flex items-center gap-3 mt-1 flex-wrap font-mono">
                    <span>📅 {{ new Date(story.createdAt).toLocaleDateString('it-IT') }}</span>
                    <span>🔥 {{ story.points }} pts HN</span>
                    <span>💬 {{ comments.length }} commenti</span>
                    <span>⏱️ {{ readTime }} min lettura</span>
                  </div>
                </div>
              </div>

              <a
                v-if="story.url"
                :href="story.url"
                target="_blank"
                rel="noopener noreferrer"
                class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.25)] no-underline shrink-0"
              >
                <span>Fonte ({{ sourceDomain }})</span>
                <span>↗</span>
              </a>
            </div>

            <!-- SINTESI & ANALISI TRINITY AI -->
            <div class="bg-[#020420] border border-emerald-500/35 rounded-xl p-5 sm:p-6 relative z-10 flex flex-col gap-3 shadow-inner">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                  Sintesi &amp; Analisi Trinity AI
                </div>
                <span class="text-[10px] font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded uppercase font-bold">
                  Pure SQL Indexed
                </span>
              </div>
              <p class="text-sm sm:text-base text-slate-200 leading-relaxed font-sans m-0">
                {{ story.summaryIt || 'Notizia di tendenza analizzata dal motore Trinity AI, focalizzata sull\'impatto tecnologico e architetturale.' }}
              </p>
            </div>

            <!-- EVENTUALE CONTENUTO ESTESO FORMATTATO -->
            <div
              v-if="parsedExtraContent"
              class="post-content prose prose-invert max-w-none text-slate-200 dkp-preview-content relative z-10"
              v-html="parsedExtraContent"
            ></div>

            <!-- TAGS -->
            <div class="flex flex-wrap gap-1.5 relative z-10">
              <span v-for="tag in parseTags(story.tags)" :key="tag" class="text-xs font-mono bg-[#020420] text-sky-400 border border-slate-800 px-2.5 py-1 rounded-lg">
                #{{ tag }}
              </span>
            </div>

            <!-- CERTIFICATO SENTINEL AI & VAULT TELEMETRY v2.6 -->
            <div class="bg-[#020420] border border-emerald-500/30 rounded-xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.06)] z-10">
              <div class="flex items-center gap-3 mb-4">
                <div class="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
                  <span class="text-emerald-400 text-xl">🛡️</span>
                </div>
                <div>
                  <h3 class="text-emerald-400 font-bold text-base sm:text-lg tracking-wide uppercase m-0">
                    Trinity Sentinel Verification Certificate v2.6
                  </h3>
                  <p class="text-xs text-slate-400 mt-0.5 m-0">
                    AI Relevance Audit &amp; Pure SQL Stream Checksum
                  </p>
                </div>
              </div>

              <div class="bg-[#090d16] border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 relative z-10">
                <div class="flex flex-col sm:flex-row sm:justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
                  <span class="text-slate-500 font-semibold">STREAM_NODE_ID:</span>
                  <span class="text-emerald-400 font-bold select-all">DKP-HN-{{ story.hnId || story.hn_id || story.id }}</span>
                </div>
                <div class="flex flex-col sm:flex-row sm:justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
                  <span class="text-slate-500 font-semibold">SENTINEL_TECH_SCORE:</span>
                  <span class="text-sky-400 font-bold">{{ story.techScore ? `${story.techScore}% VERIFIED` : '92% VERIFIED' }}</span>
                </div>
                <div class="flex flex-col gap-2">
                  <span class="text-slate-500 font-semibold">INDEXED_ORIGIN_ENDPOINT:</span>
                  <span class="text-slate-300 select-all break-all bg-[#020420] p-2 rounded border border-slate-800">
                    {{ story.vaultHash || story.url || `https://devkernelpulse.org/news/${slugParam}` }}
                  </span>
                </div>
              </div>
            </div>

            <!-- FOOTER KARMA / ACCENDI KERNEL -->
            <div class="bg-[#020420] border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
              <div class="flex flex-col gap-1 items-center sm:items-start text-center sm:text-left w-full sm:w-auto">
                <button
                  type="button"
                  @click="boostStoryPoints"
                  class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none px-6 py-3 rounded-lg font-bold text-base sm:text-lg cursor-pointer flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] w-full sm:w-auto"
                >
                  🔥 Accendi Kernel
                  <span class="bg-[#020420] text-emerald-400 px-3 py-1 rounded text-sm shadow-inner">{{ story.points }}</span>
                </button>
                <span class="text-slate-400 text-xs mt-1">Premi per supportare questa notizia con Karma nel network!</span>
              </div>

              <a
                v-if="story.url"
                :href="story.url"
                target="_blank"
                rel="noopener noreferrer"
                class="px-5 py-3 bg-[#090d16] hover:bg-slate-900 text-sky-400 border border-slate-700 hover:border-sky-400 font-mono font-bold text-xs rounded-xl transition-all flex items-center gap-2 no-underline shrink-0"
              >
                <span>Apri articolo originale</span>
                <span>↗</span>
              </a>
            </div>

            <!-- SEZIONE CONDIVISIONE NOTIZIA (SOCIAL SHARE) -->
            <div class="bg-[#020420] border border-slate-800 rounded-xl p-6 relative z-10 shadow-lg">
              <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                <div class="flex items-center gap-3 text-center md:text-left">
                  <div class="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-xl font-bold shrink-0">
                    🚀
                  </div>
                  <div>
                    <h4 class="text-white font-extrabold text-base m-0">Condividi notizia AI</h4>
                    <p class="text-slate-400 text-xs m-0">Diffondi l'analisi Trinity AI nell'ecosistema Dev</p>
                  </div>
                </div>

                <div class="w-full md:w-auto flex justify-center">
                  <SocialShare
                    :title="story.title || 'DevKernelPulse Tech Feed'"
                    :url="currentUrl"
                    :horizontal="true"
                  />
                </div>
              </div>
            </div>

            <!-- FORM & ELENCO COMMENTI COMMUNITY -->
            <section class="bg-[#020420] border border-slate-800 rounded-2xl p-6 relative z-10 flex flex-col gap-5">
              <div class="flex items-center justify-between border-b border-slate-800 pb-3 font-mono">
                <h2 class="text-sm sm:text-base font-bold text-white m-0 flex items-center gap-2">
                  <span>💬</span> Discussione &amp; Opinion ({{ comments.length }})
                </h2>
                <span class="text-emerald-400 font-bold text-[11px] bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  ⚡ +10 XP per commento
                </span>
              </div>

              <form @submit.prevent="submitComment" class="flex flex-col gap-3">
                <textarea
                  v-model="newCommentText"
                  rows="3"
                  placeholder="Esprimi la tua opinione o aggiungi contesto tecnico a questa notizia..."
                  class="w-full bg-[#090d16] border border-slate-800 rounded-xl p-3.5 text-slate-200 focus:border-emerald-400 outline-none transition-all font-sans text-sm"
                ></textarea>

                <div v-if="commentError" class="text-xs font-mono text-rose-400">⚠️ {{ commentError }}</div>

                <div class="flex justify-end font-mono">
                  <button
                    type="submit"
                    :disabled="isSubmitting || !newCommentText.trim()"
                    class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    {{ isSubmitting ? 'Invio in corso...' : '🚀 Invia Commento (+10 XP)' }}
                  </button>
                </div>
              </form>

              <div v-if="comments.length === 0" class="p-8 text-center font-mono text-xs text-slate-500 bg-[#090d16] rounded-xl border border-slate-800/80 italic">
                Nessun commento ancora. Condividi per primo la tua opinione!
              </div>

              <div v-else class="flex flex-col gap-3">
                <div
                  v-for="c in comments"
                  :key="c.id"
                  class="bg-[#090d16] border border-slate-800 rounded-xl p-4 flex flex-col gap-2 font-mono text-xs hover:border-emerald-500/30 transition-colors"
                >
                  <div class="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800/70 pb-2">
                    <span class="font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      @{{ c.authorUsername || c.author || 'dev_kernel' }}
                    </span>
                    <span>{{ new Date(c.createdAt || Date.now()).toLocaleDateString('it-IT') }}</span>
                  </div>
                  <div
                    class="text-slate-200 text-sm font-sans leading-relaxed dkp-preview-content"
                    v-html="parseDkpMarkdown(String(c.content || ''))"
                  ></div>
                </div>
              </div>
            </section>

            <!-- APPROFONDIMENTI DAL VAULT EDITORIAL HUB (WIDGET 4 COLONNE) -->
            <div v-if="featuredArticles.length > 0" class="pt-6 border-t border-slate-800 flex flex-col gap-4 relative z-10">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-bold text-white flex items-center gap-2 font-mono m-0">
                  <span>🔗</span> Approfondimenti dal Vault Editorial Hub
                </h3>
                <NuxtLink to="/blog" class="text-xs font-mono text-emerald-400 hover:underline font-bold no-underline">
                  Esplora Blog ➔
                </NuxtLink>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <NuxtLink
                  v-for="art in featuredArticles"
                  :key="art.id"
                  :to="`/blog/${art.slug || art.id}`"
                  class="bg-[#020420] border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 flex flex-col justify-between transition-all hover:-translate-y-0.5 shadow-md group no-underline"
                >
                  <div>
                    <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block truncate">
                      {{ art.categoryName || art.category || 'Tech' }}
                    </span>
                    <h4 class="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition-colors mt-1.5 leading-snug line-clamp-3 mb-0">
                      {{ art.title }}
                    </h4>
                  </div>
                  <span class="text-[11px] font-mono font-bold text-sky-400 group-hover:underline mt-3 pt-2 border-t border-slate-800/60">
                    Leggi articolo ➔
                  </span>
                </NuxtLink>
              </div>
            </div>

            <!-- FEED DEL FORUM: DISCUSSIONI CORRELATE NEI NODI -->
            <div class="pt-6 border-t border-slate-800 relative z-10">
              <DKPRelatedThreads />
            </div>

            <!-- WIDGET STREAM NODI & FORUM COMMUNITY -->
            <div class="pt-6 border-t border-slate-800 relative z-10">
              <DkpNodesHomeWidget />
            </div>

            <!-- BANNER ECOSISTEMA / ADS -->
            <div class="pt-4 border-t border-slate-800 relative z-10">
              <DKPAdBanner />
            </div>
          </article>

          <DkpAdStrip categoryTag="DKP NEWS DETAIL SPONSORED" />
        </div>
      </template>

      <!-- STATE: NOT FOUND -->
      <template v-else>
        <div class="text-center py-16 bg-[#090d16] border border-slate-800 rounded-2xl text-slate-400 font-mono text-xs flex flex-col gap-3 items-center">
          <p class="text-3xl m-0">📭</p>
          <p class="m-0">Scheda notizia non trovata o rimossa.</p>
          <NuxtLink to="/news" class="text-emerald-400 hover:text-emerald-300 underline font-bold mt-2 bg-emerald-500/10 px-4 py-2 rounded-xl transition-colors no-underline">
            Torna al DKP Tech Feed
          </NuxtLink>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.glass-panel {
  backdrop-filter: blur(12px);
}

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
:deep(.dkp-inline-code) {
  background-color: rgba(30, 41, 59, 0.8) !important;
  color: #38bdf8 !important;
  padding: 0.2rem 0.4rem !important;
  border-radius: 0.375rem !important;
  border: 1px solid rgba(51, 65, 85, 0.6) !important;
}
:deep(.dkp-h1) { font-size: 1.6rem; font-weight: 900; color: #ffffff; margin-top: 1.2rem; margin-bottom: 0.6rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.3rem; }
:deep(.dkp-h2) { font-size: 1.3rem; font-weight: 800; color: #ffffff; margin-top: 1rem; margin-bottom: 0.5rem; }
:deep(.dkp-h3) { font-size: 1.05rem; font-weight: 700; color: #00dc82; margin-top: 0.8rem; margin-bottom: 0.4rem; }
:deep(.dkp-quote) { border-left: 3px solid #00dc82; padding-left: 0.8rem; color: #94a3b8; font-style: italic; margin: 0.8rem 0; background: rgba(0, 220, 130, 0.05); padding-top: 0.2rem; padding-bottom: 0.2rem; }
:deep(.dkp-link) { color: #38bdf8; text-decoration: underline; text-underline-offset: 2px; }
:deep(.dkp-link:hover) { color: #00dc82; }
:deep(.dkp-hr) { border: none; height: 1px; background-color: #334155; margin: 1.5rem 0; }
</style>