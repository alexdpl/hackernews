<!-- app/pages/nodes/thread/[id].vue -->
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
const threadId = computed(() => String(route.params.id || ''))
const { currentUser } = useAuthCore()
const { $prism } = useNuxtApp()
const { getAuthorRank } = useBlog()

function cleanNodeLabel(raw: string): string {
  return String(raw || '').replace(/^(n\/)+/i, '').trim()
}

// Recupero singolo thread dall'endpoint /api/nodes/post/[id]
const { data: threadRes, pending, error, refresh } = await useFetch<any>(() => `/api/nodes/post/${threadId.value}`)

const post = computed(() => {
  const raw = threadRes.value?.post || threadRes.value?.data || (threadRes.value?.id ? threadRes.value : null)
  if (!raw) return null
  return {
    ...raw,
    id: Number(raw.id),
    nodeName: cleanNodeLabel(raw.nodeName || raw.node_name || raw.nodeSlug || 'General'),
    nodeSlug: raw.nodeSlug || raw.node_slug || '',
    nodeIcon: raw.nodeIcon || raw.node_icon || '#',
    authorUsername: raw.authorUsername || raw.author_username || 'community',
    authorXp: Number(raw.authorXp ?? raw.author_xp ?? 0),
    karmaScore: Number(raw.karmaScore ?? raw.karma_score ?? 1),
    vaultHash: raw.vaultHash || raw.vault_hash || null,
    vaultCertificateId: raw.vaultCertificateId || raw.vault_certificate_id || (raw.vaultHash || raw.vault_hash ? `DKP-NODE-${raw.id}` : null),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.updated_at || null
  }
})

// Recupero commenti dall'endpoint /api/nodes/comments
const { data: commentsRes, refresh: refreshComments } = await useFetch<any>('/api/nodes/comments', {
  query: computed(() => ({ postId: threadId.value }))
})

const comments = computed<any[]>(() => {
  if (Array.isArray(post.value?.comments) && post.value.comments.length > 0) return post.value.comments
  if (Array.isArray(commentsRes.value?.comments)) return commentsRes.value.comments
  if (Array.isArray(commentsRes.value?.data)) return commentsRes.value.data
  if (Array.isArray(commentsRes.value)) return commentsRes.value
  return []
})

const readTime = computed(() => {
  const text = post.value?.content || ''
  if (!text) return 1
  const plainText = text.replace(/<\/?[^>]+(>|$)/g, '')
  const words = plainText.trim().split(/\s+/).length
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

    html = html.replace(/^\|(.+)\|$/gm, (_match, p1) => {
      const cells = p1.split('|').map((c: string) => c.trim())
      if (cells.every((c: string) => /^:?-+:?$/.test(c))) return ''
      const rowHtml = cells.map((c: string) => `<td>${c}</td>`).join('')
      return `<tr>${rowHtml}</tr>`
    })
    html = html.replace(/(<tr>.*?<\/tr>[\s\n\r]*)+/g, (match) => {
      const cleanRows = match.replace(/[\n\r]+/g, '')
      return `<div class="dkp-table-wrapper"><table class="dkp-table"><tbody>${cleanRows}</tbody></table></div>`
    })

    html = html
      .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="dkp-img" loading="lazy" />')
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

    html = html.replace(/^( {2,}|\t+)- (.*?)\r?$/gm, '<ul class="dkp-sub-list"><li class="dkp-li-nested">$2</li></ul>')
    html = html.replace(/^( {2,}|\t+)[0-9]+\. (.*?)\r?$/gm, '<ol class="dkp-sub-list"><li class="dkp-li-nested dkp-li-num">$2</li></ol>')
    html = html.replace(/^-(?!\S) (.*?)\r?$/gm, '<ul><li class="dkp-li-main">$1</li></ul>')
    html = html.replace(/^[0-9]+\. (.*?)\r?$/gm, '<ol><li class="dkp-li-main">$1</li></ol>')
    html = html.replace(/<\/ul>\s*<ul>/g, '')
    html = html.replace(/<\/ol>\s*<ol>/g, '')
    html = html.replace(/<\/ul>\s*<ul class="dkp-sub-list">/g, '')
    html = html.replace(/<\/ol>\s*<ol class="dkp-sub-list">/g, '')

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
  } catch (err) {
    console.error('Errore nel parsing thread:', err)
    return '<p class="text-rose-400">Errore nella formattazione del contenuto.</p>'
  }
}

const parsedContent = computed(() => parseDkpMarkdown(String(post.value?.content || '')))

const authorRank = computed<AuthorRank>(() => {
  try {
    const xp = post.value?.authorXp || 0
    return getAuthorRank
      ? getAuthorRank(xp)
      : { color: '#a855f7', badge: '⚡', level: 2, title: 'Kernel Builder' }
  } catch {
    return { color: '#a855f7', badge: '⚡', level: 2, title: 'Kernel Builder' }
  }
})

const currentUrl = computed(() =>
  import.meta.client ? window.location.href : `https://devkernelpulse.org/nodes/thread/${threadId.value}`
)

useHead({
  title: computed(() => `${post.value?.title || 'Discussione'} — DKP Talks Hub v2.6`),
  meta: [
    {
      name: 'description',
      content: computed(() => String(post.value?.content || '').slice(0, 160) || 'Discussione tecnica nei DKP Nodes v2.6-PURE-SQL.')
    }
  ]
})

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
      if (codeElement) {
        const textToCopy = codeElement.innerText || codeElement.textContent || ''
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(textToCopy).then(() => showCopyFeedback(copyBtn))
        }
      }
    }
  }
}

watch(parsedContent, async () => {
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

const commentText = ref('')
const isSendingComment = ref(false)
const commentError = ref('')
const toastMsg = ref('')

function showNotification(msg: string) {
  toastMsg.value = msg
  setTimeout(() => {
    toastMsg.value = ''
  }, 3500)
}

async function voteThread(direction: 'up' | 'down') {
  if (!post.value) return
  const delta = direction === 'up' ? 1 : -1
  post.value.karmaScore = (post.value.karmaScore || 0) + delta
  await $fetch('/api/nodes/vote', {
    method: 'POST',
    body: {
      postId: post.value.id,
      targetId: post.value.id,
      targetType: 'post',
      direction,
      value: delta,
      userId: currentUser.value?.id
    }
  }).catch(() => null)
}

async function submitComment() {
  if (!commentText.value.trim() || !post.value) return
  commentError.value = ''
  isSendingComment.value = true

  try {
    await $fetch('/api/nodes/comments', {
      method: 'POST',
      body: {
        postId: post.value.id,
        content: commentText.value.trim(),
        userId: currentUser.value?.id
      }
    })
    if (import.meta.client) {
      window.dispatchEvent(new CustomEvent('dkp:xp_updated'))
    }
    commentText.value = ''
    showNotification('💬 Risposta pubblicata! +10 XP accreditati!')
    await Promise.all([refresh(), refreshComments()])
    await nextTick()
    applyPrism()
  } catch (err: any) {
    commentError.value = err?.data?.statusMessage || 'Errore durante la pubblicazione del commento.'
  } finally {
    isSendingComment.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 py-10">
    <!-- Toast XP / Feedback -->
    <div
      v-if="toastMsg"
      role="status"
      class="fixed top-6 right-6 z-[10000] bg-[#041a13]/95 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl font-mono text-xs font-bold"
    >
      {{ toastMsg }}
    </div>

    <div class="max-w-4xl mx-auto flex flex-col gap-6">
      <!-- BARRA 4 PILASTRI ECOSISTEMA DKP v2.6 -->
      <nav aria-label="Navigazione Ecosistema DKP" class="flex flex-wrap gap-2.5 justify-center font-mono bg-[#090d16] border border-slate-800 p-3 rounded-2xl shadow-lg">
        <NuxtLink
          to="/news"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-400 font-extrabold text-xs rounded-xl transition-all no-underline"
        >
          🌍 DKP Tech Feed
        </NuxtLink>

        <NuxtLink
          to="/nodes"
          class="px-4 py-2 bg-purple-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.35)] no-underline"
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

      <div v-if="pending" class="text-center py-20 text-emerald-400 font-mono bg-[#090d16] border border-slate-800 rounded-2xl">
        <span class="text-3xl animate-pulse inline-block mb-4">⚡</span>
        <p class="m-0">Caricamento discussione dal DB Neon v2.6-PURE-SQL...</p>
      </div>

      <div v-else-if="error || !post" class="text-center py-20 text-rose-400 bg-[#090d16] border border-slate-800 rounded-2xl">
        <h2 class="text-2xl font-bold mb-4 m-0">⚠️ Discussione non trovata</h2>
        <p class="text-slate-400 text-sm">Il thread richiesto non esiste o è stato rimosso.</p>
        <NuxtLink
          to="/nodes"
          class="mt-6 inline-block text-purple-400 hover:underline font-bold font-mono text-xs no-underline"
        >
          ← Torna al DKP Talks Hub
        </NuxtLink>
      </div>

      <div v-else class="flex flex-col gap-8 relative">
        <article class="glass-panel p-6 sm:p-10 rounded-2xl border border-slate-800 bg-[#090d16] shadow-2xl relative overflow-hidden">
          <!-- BREADCRUMB NAVBAR SEO-READY -->
          <div class="flex flex-col gap-4 mb-8 relative z-10 border-b border-slate-800 pb-4">
            <nav aria-label="Breadcrumb" class="w-full text-sm text-slate-400">
              <ol class="flex items-center gap-2 m-0 p-0 list-none font-medium flex-wrap">
                <li class="flex items-center">
                  <NuxtLink to="/nodes" class="text-slate-400 hover:text-purple-400 transition-colors flex items-center gap-1 no-underline">
                    <span class="text-xs">💬</span> Talks Hub
                  </NuxtLink>
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-slate-600 font-bold">/</span>
                  <span class="text-purple-400 font-mono font-bold max-w-[160px] sm:max-w-[240px] truncate">
                    {{ post.nodeIcon }} n/{{ post.nodeName }}
                  </span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-slate-600 font-bold">/</span>
                  <span class="text-slate-200 max-w-[160px] sm:max-w-[280px] truncate" :title="post.title" aria-current="page">
                    {{ post.title }}
                  </span>
                </li>
              </ol>
            </nav>

            <!-- BADGES NODO, VAULT & ECOSISTEMA -->
            <div class="flex items-center gap-2.5 flex-wrap justify-start font-mono">
              <span class="bg-purple-500/15 text-purple-300 border border-purple-500/35 px-3 py-1 rounded-md text-xs font-bold tracking-wider">
                {{ post.nodeIcon }} n/{{ post.nodeName }}
              </span>

              <span class="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                ⚡ PURE-SQL THREAD
              </span>

              <span
                v-if="post.vaultHash"
                class="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.25)]"
              >
                🛡️ VAULT CERTIFIED v2.6
              </span>
            </div>
          </div>

          <h1 class="text-2xl sm:text-4xl font-black text-white mb-8 leading-tight relative z-10 mt-0">
            {{ post.title }}
          </h1>

          <!-- AUTHOR CARD CON RANK & XP -->
          <div
            class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#020420] border border-slate-800 mb-10 relative z-10 transition-colors"
            :style="{
              borderColor: `${authorRank.color}45`,
              boxShadow: `0 4px 20px ${authorRank.color}12`
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
                {{ (post.authorUsername || 'D')[0].toUpperCase() }}
              </div>

              <div>
                <div class="text-slate-200 font-bold flex items-center gap-2 flex-wrap">
                  <span>@{{ post.authorUsername }}</span>
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
                  <span>📅 {{ new Date(post.createdAt).toLocaleDateString('it-IT') }}</span>
                  <span>💬 {{ comments.length }} commenti</span>
                  <span>⏱️ {{ readTime }} min lettura</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 font-mono text-xs self-end sm:self-center">
              <button
                type="button"
                @click="voteThread('up')"
                class="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/35 font-bold cursor-pointer transition-all"
              >
                ▲ {{ post.karmaScore }} Karma
              </button>
            </div>
          </div>

          <!-- CONTENUTO FORMATTATO DKP MARKDOWN + PRISM -->
          <ClientOnly>
            <div
              class="post-content prose prose-invert max-w-none text-slate-200 mb-10 dkp-preview-content relative z-10"
              v-html="parsedContent"
            ></div>

            <template #fallback>
              <div class="py-10 text-center text-slate-500 animate-pulse font-mono mb-10">
                ⏳ Formattazione codice e thread in corso...
              </div>
            </template>
          </ClientOnly>

          <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-2 mb-8 relative z-10">
            <span
              v-for="tag in post.tags"
              :key="tag"
              class="bg-[#020420] text-sky-400 border border-slate-700 px-2.5 py-1 rounded text-xs font-mono"
            >
              #{{ tag }}
            </span>
          </div>

          <!-- CERTIFICATO VAULT NOTARIZATION (SE PRESENTE VAULT HASH) -->
          <div
            v-if="post.vaultHash"
            class="mt-6 bg-[#020420] border border-emerald-500/35 rounded-xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.08)] z-10 mb-8"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
                <span class="text-emerald-400 text-xl">🛡️</span>
              </div>
              <div>
                <h3 class="text-emerald-400 font-bold text-base sm:text-lg tracking-wide uppercase m-0">
                  Vault Notarization Certificate v2.6
                </h3>
                <p class="text-xs text-slate-400 mt-0.5 m-0">
                  Proof of Code &amp; Integrity Checksum by DevKernelPulse Vault
                </p>
              </div>
            </div>

            <div class="bg-[#090d16] border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 relative z-10">
              <div class="flex flex-col sm:flex-row sm:justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
                <span class="text-slate-500 font-semibold">THREAD_CERTIFICATE_ID:</span>
                <span class="text-emerald-400 font-bold select-all">{{ post.vaultCertificateId }}</span>
              </div>
              <div class="flex flex-col sm:flex-row sm:justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
                <span class="text-slate-500 font-semibold">TIMESTAMP:</span>
                <span class="text-slate-300">{{ new Date(post.updatedAt || post.createdAt).toISOString() }}</span>
              </div>
              <div class="flex flex-col gap-2">
                <span class="text-slate-500 font-semibold">SHA-256 SECURE CHECKSUM:</span>
                <span class="text-sky-400 select-all break-all bg-[#020420] p-2 rounded border border-slate-800">{{ post.vaultHash }}</span>
              </div>
            </div>
          </div>

          <!-- FOOTER KARMA / UPVOTE -->
          <div class="bg-[#020420] border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10 mb-6">
            <div class="flex flex-col gap-1 items-center sm:items-start text-center sm:text-left w-full sm:w-auto">
              <div class="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
                <button
                  type="button"
                  @click="voteThread('up')"
                  class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none px-6 py-3 rounded-lg font-bold text-base sm:text-lg cursor-pointer flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  🔥 Accendi Karma
                  <span class="bg-[#020420] text-emerald-400 px-3 py-1 rounded text-sm shadow-inner">{{ post.karmaScore }}</span>
                </button>

                <button
                  type="button"
                  @click="voteThread('down')"
                  title="Downvote"
                  class="bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 px-3.5 py-3 rounded-lg font-mono font-bold text-sm cursor-pointer transition-colors"
                >
                  ▼
                </button>
              </div>
              <span class="text-slate-400 text-xs mt-1">Premi per supportare questa discussione con Karma nel network!</span>
            </div>
          </div>

          <!-- SEZIONE CONDIVISIONE THREAD (SOCIAL SHARE) -->
          <div class="bg-[#020420] border border-slate-800 rounded-xl p-6 relative z-10 mb-8 shadow-lg">
            <div class="flex flex-col md:flex-row items-center justify-between gap-4">
              <div class="flex items-center gap-3 text-center md:text-left">
                <div class="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-xl font-bold shrink-0">
                  🚀
                </div>
                <div>
                  <h4 class="text-white font-extrabold text-base m-0">Condividi discussione</h4>
                  <p class="text-slate-400 text-xs m-0">Diffondi questo thread nella community DevKernelPulse</p>
                </div>
              </div>

              <div class="w-full md:w-auto flex justify-center">
                <SocialShare
                  :title="post.title || 'DevKernelPulse Talks'"
                  :url="currentUrl"
                  :horizontal="true"
                />
              </div>
            </div>
          </div>

          <!-- SEZIONE COMMENTI COMMUNITY -->
          <section class="bg-[#020420] border border-slate-800 rounded-2xl p-6 relative z-10 mb-8 flex flex-col gap-5">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 class="font-mono text-sm sm:text-base font-bold text-white m-0 flex items-center gap-2">
                <span>💬</span> Discussione Community ({{ comments.length }})
              </h2>
              <span class="text-[11px] font-mono text-emerald-400 font-bold">
                ⚡ +10 XP per risposta
              </span>
            </div>

            <form @submit.prevent="submitComment" class="flex flex-col gap-3">
              <textarea
                v-model="commentText"
                rows="4"
                placeholder="Scrivi la tua risposta tecnica (supporta blocchi codice ```ts ... ``` e Markdown)..."
                class="w-full bg-[#090d16] border border-slate-800 focus:border-purple-400 rounded-xl p-3.5 text-slate-200 text-xs sm:text-sm font-mono outline-none"
              ></textarea>

              <div v-if="commentError" class="text-xs font-mono text-rose-400">⚠️ {{ commentError }}</div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="isSendingComment"
                  class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.25)] cursor-pointer disabled:opacity-50 transition-all"
                >
                  {{ isSendingComment ? 'Invio in corso...' : '🚀 Pubblica Risposta (+10 XP)' }}
                </button>
              </div>
            </form>

            <div v-if="comments.length === 0" class="text-xs font-mono text-slate-500 text-center py-6 bg-[#090d16] rounded-xl border border-slate-800/70">
              📭 Nessun commento ancora. Avvia tu la discussione tecnica!
            </div>

            <div v-else class="flex flex-col gap-3">
              <div
                v-for="c in comments"
                :key="c.id"
                class="bg-[#090d16] border border-slate-800 rounded-xl p-4 flex flex-col gap-2"
              >
                <div class="flex items-center justify-between font-mono text-[11px] text-slate-400 border-b border-slate-800/70 pb-2">
                  <span class="text-sky-400 font-bold">@{{ c.authorUsername || c.author_username || 'member' }}</span>
                  <span>{{ new Date(c.createdAt || c.created_at || Date.now()).toLocaleString('it-IT') }}</span>
                </div>
                <div
                  class="text-xs sm:text-sm text-slate-200 leading-relaxed dkp-preview-content"
                  v-html="parseDkpMarkdown(String(c.content || ''))"
                ></div>
              </div>
            </div>
          </section>

          <!-- ADS SPONSORED STRIP -->
          <div class="mb-8">
            <DkpAdStrip categoryTag="DKP NODES TALKS STREAM" />
          </div>

          <!-- DISCUSSIONI CORRELATE NEL NODO -->
          <div class="mb-8 pt-6 border-t border-slate-800">
            <DKPRelatedThreads :currentNodeSlug="post.nodeSlug || undefined" />
          </div>

          <!-- HACKER NEWS AI STREAM WIDGET -->
          <div class="mb-8 pt-6 border-t border-slate-800">
            <DkpNodesHomeWidget />
          </div>

          <!-- BANNER ECOSISTEMA / ADS -->
          <div class="pt-4 border-t border-slate-800">
            <DKPAdBanner />
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

.prose h1, .post-content h1 { @apply text-2xl md:text-3xl font-extrabold text-white mt-8 mb-4 border-b border-slate-800 pb-2; }
.prose h2, .post-content h2 { @apply text-xl font-bold text-white mt-6 mb-3; }
.prose h3, .post-content h3 { @apply text-lg font-bold text-sky-400 mt-4 mb-2; }
.prose p, .post-content p { @apply text-slate-300 text-base leading-relaxed mb-6; }
.prose blockquote, .post-content blockquote { @apply border-l-4 border-emerald-400 bg-emerald-500/10 p-4 my-6 text-slate-300 italic rounded-r-lg; }

.prose table, .post-content table { @apply w-full border-collapse my-6 bg-[#090d16] rounded-lg overflow-hidden border border-slate-800 text-left; }
.prose th, .post-content th { @apply bg-[#0d1322] text-emerald-400 font-bold p-3 border border-slate-800 text-xs uppercase tracking-wider; }
.prose td, .post-content td { @apply p-3 text-slate-300 border border-slate-800 text-sm; }

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

:deep(.dkp-h1) { font-size: 1.6rem; font-weight: 900; color: #ffffff; margin-top: 1.2rem; margin-bottom: 0.6rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.3rem; }
:deep(.dkp-h2) { font-size: 1.3rem; font-weight: 800; color: #ffffff; margin-top: 1rem; margin-bottom: 0.5rem; }
:deep(.dkp-h3) { font-size: 1.05rem; font-weight: 700; color: #00dc82; margin-top: 0.8rem; margin-bottom: 0.4rem; }
:deep(.dkp-quote) { border-left: 3px solid #00dc82; padding-left: 0.8rem; color: #94a3b8; font-style: italic; margin: 0.8rem 0; background: rgba(0, 220, 130, 0.05); padding-top: 0.2rem; padding-bottom: 0.2rem; }
:deep(.dkp-link) { color: #38bdf8; text-decoration: underline; text-underline-offset: 2px; }
:deep(.dkp-link:hover) { color: #00dc82; }
:deep(.dkp-hr) { border: none; height: 1px; background-color: #334155; margin: 1.5rem 0; }

:deep(.dkp-preview-content ul), :deep(.dkp-preview-content ol) { padding-left: 1.5rem; margin: 0.8rem 0; color: #cbd5e1; }
:deep(.dkp-preview-content ul) { list-style-type: none; }
:deep(.dkp-preview-content ol) { list-style-type: decimal; }
:deep(.dkp-li-main) { margin-bottom: 0.4rem; position: relative; }
:deep(ul > .dkp-li-main::before) { content: "○"; color: #38bdf8; position: absolute; left: -1.2rem; top: 0; font-weight: bold; }
:deep(.dkp-li-nested) { margin-left: 1.5rem; margin-bottom: 0.3rem; color: #94a3b8; position: relative; }
:deep(ul > .dkp-li-nested:not(.dkp-li-num)::before) { content: "▪"; color: #00dc82; position: absolute; left: -1.2rem; top: 0; }
</style>