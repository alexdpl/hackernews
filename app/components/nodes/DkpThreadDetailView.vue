<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import DkpLayout from '~/components/DkpLayout.vue'
import DkpRelatedBlogWidget from '~/components/widgets/DkpRelatedBlogWidget.vue'
import DkpHomeWidget from '~/components/DkpHomeWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import {
  parseDkpMarkdown,
  cleanNodeLabel,
  buildNodeThreadSlug,
  extractNodeThreadId
} from '~/composables/useDkpNodes'
import { useDynamicPrism } from '~/composables/useDynamicPrism'

useCodeCopy()
const { highlightDomElement, ensurePrismLanguages, extractLanguagesFromMarkdown, prismRegistryVersion } = useDynamicPrism()

const props = defineProps<{
  threadIdOrSlug: string
  routePrefix: 'thread' | 'post'
}>()

const quickNavLinks = [
  { to: '/news', label: 'Tech Feed (News)', badge: 'LIVE' },
  { to: '/nodes', label: 'Nodes & Talks', badge: 'FORUM' },
  { to: '/blog', label: 'Editorial Blog', badge: 'VAULT' },
  { to: '/tools', label: 'Developer Tools', badge: 'SAST' }
]

const { data: threadRes, pending, refresh } = await useAsyncData(
  () => `dkp-node-thread-${props.routePrefix}-${props.threadIdOrSlug}`,
  async () => {
    const res: any = await $fetch(`/api/nodes/posts/${encodeURIComponent(props.threadIdOrSlug)}`).catch(() => null)
    return res?.post || res?.data || null
  }
)

const thread = computed<any>(() => threadRes.value)
const resolvedId = computed<number>(() => Number(thread.value?.id || extractNodeThreadId(props.threadIdOrSlug) || 0))
const nodeLabel = computed(() => cleanNodeLabel(thread.value?.nodeName || thread.value?.nodeSlug || 'General'))
const nodeSlugClean = computed(() => String(thread.value?.nodeSlug || 'general').replace(/^(n\/)+/i, '').toLowerCase())
const canonicalThreadSlug = computed(() => {
  if (thread.value?.slug) return String(thread.value.slug)
  if (resolvedId.value > 0 && thread.value?.title) return buildNodeThreadSlug(resolvedId.value, thread.value.title)
  return String(resolvedId.value || props.threadIdOrSlug)
})

const seoTitle = computed(() =>
  thread.value?.title
    ? `${thread.value.title} \u2014 n/${nodeLabel.value} | DevKernelPulse`
    : 'Discussione Tecnica \u2014 DKP Nodes'
)
const seoDescription = computed(() => {
  const raw = String(thread.value?.content || '').replace(/[#*`>|]/g, ' ').replace(/\s+/g, ' ').trim()
  return raw ? raw.slice(0, 160) : `Discussione tecnica nel nodo n/${nodeLabel.value} su DevKernelPulse.`
})

useDkpSeo({
  title: seoTitle,
  description: seoDescription,
  type: 'forum',
  publishedTime: computed(() => thread.value?.createdAt || new Date().toISOString()),
  authorName: computed(() => thread.value?.authorUsername || 'alexdpl'),
  section: computed(() => `n/${nodeLabel.value}`),
  notarizationHash: computed(() => thread.value?.vaultHash || ''),
  canonicalPath: computed(() => `/nodes/${props.routePrefix}/${canonicalThreadSlug.value}`)
})

const renderedBodyHtml = computed(() => {
  void prismRegistryVersion.value
  const raw = String(thread.value?.content || '')
  if (!raw.trim()) return ''
  extractLanguagesFromMarkdown(raw)
  return parseDkpMarkdown(raw)
})

const bodyContainerRef = ref<HTMLElement | null>(null)
const threadTags = computed<string[]>(() => {
  const raw = thread.value?.tags
  const list = Array.isArray(raw)
    ? raw
    : (typeof raw === 'string' && raw.trim()
        ? (raw.trim().startsWith('[') ? (() => { try { return JSON.parse(raw) } catch { return raw.split(',') } })() : raw.split(','))
        : [])
  return Array.from(new Set(list.map((t: any) => String(t || '').trim().replace(/^#+/, '')).filter(Boolean)))
})

const router = useRouter()

function handleBodyLinkClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  const anchor = target?.closest('a') as HTMLAnchorElement | null
  if (!anchor) return

  const href = (anchor.getAttribute('href') || '').trim()
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return

  if (href.startsWith('/')) {
    event.preventDefault()
    void router.push(href)
    return
  }

  if (typeof window !== 'undefined' && href.startsWith(window.location.origin)) {
    const relPath = href.slice(window.location.origin.length) || '/'
    if (relPath.startsWith('/')) {
      event.preventDefault()
      void router.push(relPath)
    }
  }
}

async function applyPrismHighlight() {
  if (!import.meta.client) return
  await nextTick()
  const raw = String(thread.value?.content || '')
  const mdLangs = extractLanguagesFromMarkdown(raw)
  if (mdLangs.length > 0) {
    await ensurePrismLanguages(mdLangs)
  }
  await highlightDomElement(bodyContainerRef.value || document)
}

watch([renderedBodyHtml, prismRegistryVersion], () => {
  void applyPrismHighlight()
})

const bonusKarma = ref(0)
const hasVoted = ref(false)
const displayedKarma = computed(() => Number(thread.value?.karmaScore ?? thread.value?.karma_score ?? 1) + bonusKarma.value)

async function handleVote() {
  if (!resolvedId.value || hasVoted.value) return
  hasVoted.value = true
  bonusKarma.value += 1
  await $fetch(`/api/nodes/posts/${resolvedId.value}/vote`, {
    method: 'POST',
    body: { delta: 1 }
  }).catch(() => null)
}

const comments = ref<any[]>([])
const newCommentText = ref('')
const isLoadingComments = ref(false)
const isPostingComment = ref(false)
const commentFeedback = ref('')

async function loadThreadComments() {
  if (!resolvedId.value) return
  isLoadingComments.value = true
  try {
    const res: any = await $fetch(`/api/nodes/comments?postId=${resolvedId.value}`).catch(() => null)
    comments.value = res?.comments || res?.data || []
  } finally {
    isLoadingComments.value = false
  }
}

async function submitThreadComment() {
  const txt = newCommentText.value.trim()
  if (!txt || !resolvedId.value) return
  isPostingComment.value = true
  commentFeedback.value = ''
  try {
    const res: any = await $fetch('/api/nodes/comments', {
      method: 'POST',
      body: {
        postId: resolvedId.value,
        content: txt
      }
    })
    if (res?.success) {
      newCommentText.value = ''
      commentFeedback.value = 'Risposta pubblicata e sottoposta a Peer Review Sentinella!'
      await loadThreadComments()
    }
  } finally {
    isPostingComment.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadThreadComments(), applyPrismHighlight()])
})

watch(() => props.threadIdOrSlug, async () => {
  bonusKarma.value = 0
  hasVoted.value = false
  commentFeedback.value = ''
  await refresh()
  await Promise.all([loadThreadComments(), applyPrismHighlight()])
})
</script>

<template>
  <DkpLayout
    :hide-section-header="true"
    :show-sidebar-ads="true"
    :seo-title="seoTitle"
    :seo-description="seoDescription"
  >
    <div class="flex flex-wrap items-center justify-between gap-2 bg-dkp-card/90 border border-dkp-border rounded-2xl px-4 py-3 font-mono text-xs">
      <div class="flex flex-wrap items-center gap-2">
        <NuxtLink
          v-for="nav in quickNavLinks"
          :key="nav.to"
          :to="nav.to"
          :class="[
            'px-3 py-1.5 rounded-xl no-underline font-bold border transition-colors',
            nav.to === '/nodes'
              ? 'bg-violet-500/20 text-violet-200 border-violet-400/60'
              : 'bg-[#020420] text-slate-300 border-slate-800 hover:border-cyan-400/60 hover:text-white'
          ]"
        >
          {{ nav.label }}
        </NuxtLink>
      </div>
      <NuxtLink
        to="/user/dashboard?tab=content&subtab=nodes&new=1"
        class="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold no-underline transition-colors"
      >
        + Pubblica Thread
      </NuxtLink>
    </div>

    <div v-if="pending" class="bg-dkp-card border border-dkp-border rounded-2xl p-10 text-center font-mono text-xs text-violet-300 animate-pulse">
      Sincronizzazione thread dal Vault Pure SQL...
    </div>

    <div v-else-if="!thread" class="bg-dkp-card border border-dkp-border rounded-2xl p-10 text-center space-y-4">
      <h1 class="text-xl font-bold text-white m-0">Discussione non trovata</h1>
      <p class="text-slate-400 text-sm m-0">Il thread richiesto non esiste o lo slug/ID non &egrave; pi&ugrave; attivo.</p>
      <NuxtLink to="/nodes" class="inline-block px-4 py-2 rounded-xl bg-violet-500 text-white font-mono text-xs font-extrabold no-underline">
        Torna a DKP Talks Hub &rarr;
      </NuxtLink>
    </div>

    <article v-else ref="bodyContainerRef" class="space-y-6">
      <div class="bg-[#050914]/95 border border-slate-800 rounded-2xl p-6 sm:p-8 card-glow space-y-5">
        <nav aria-label="Breadcrumb" class="flex flex-wrap items-center gap-2 font-mono text-xs text-slate-400">
          <NuxtLink to="/" class="text-slate-400 hover:text-emerald-400 no-underline">Home</NuxtLink>
          <span>/</span>
          <NuxtLink to="/nodes" class="text-slate-300 hover:text-violet-300 no-underline">DKP Talks Hub</NuxtLink>
          <span>/</span>
          <NuxtLink :to="`/nodes/n/${nodeSlugClean}`" class="text-cyan-400 hover:text-cyan-300 no-underline font-bold">
            n/{{ nodeLabel }}
          </NuxtLink>
          <span>/</span>
          <span class="text-slate-200 truncate max-w-md">{{ thread.title }}</span>
        </nav>

        <div class="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <NuxtLink
            :to="`/nodes/n/${nodeSlugClean}`"
            class="px-2.5 py-1 rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/40 font-extrabold no-underline"
          >
            n/{{ nodeLabel }}
          </NuxtLink>
          <span class="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-bold">
            SHA-256 VAULT VERIFIED
          </span>
          <span v-if="thread.isPinned || thread.is_pinned" class="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold">
            IN EVIDENZA
          </span>
        </div>

        <h1 class="text-2xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight m-0">
          {{ thread.title }}
        </h1>

        <div v-if="threadTags.length > 0" class="flex flex-wrap items-center gap-2 font-mono text-xs">
          <span
            v-for="(tag, idx) in threadTags"
            :key="`${tag}-${idx}`"
            class="px-2.5 py-1 rounded-lg bg-[#050a14] border border-cyan-500/30 text-cyan-300 font-bold"
          >
            #{{ tag }}
          </span>
        </div>

        <div class="bg-[#030712] border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3 font-mono text-xs">
            <div class="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-400/60 flex items-center justify-center text-violet-300 font-extrabold">
              {{ String(thread.authorUsername || 'A').charAt(0).toUpperCase() }}
            </div>
            <div>
              <div class="text-white font-bold text-sm">@{{ thread.authorUsername || 'alexdpl' }}</div>
              <div class="text-slate-400 flex flex-wrap items-center gap-3 mt-0.5">
                <span>{{ thread.createdAt ? new Date(thread.createdAt).toLocaleDateString('it-IT') : 'Oggi' }}</span>
                <span class="text-amber-300 font-bold">&#9650; {{ displayedKarma }} karma</span>
                <span>{{ comments.length }} risposte</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            :disabled="hasVoted"
            @click="handleVote"
            class="px-4 py-2 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-400/50 text-violet-200 font-mono text-xs font-extrabold cursor-pointer transition-colors"
          >
            &#9650; {{ hasVoted ? 'Votato' : 'Upvote Thread' }}
          </button>
        </div>

        <div
          ref="bodyContainerRef" @click="handleBodyLinkClick" class="dkp-markdown-body text-slate-200 text-sm sm:text-base leading-relaxed pt-2"
          v-html="renderedBodyHtml"
        ></div>

        <div v-if="thread.vaultHash" class="bg-[#020617] border border-slate-800 rounded-xl px-4 py-2.5 font-mono text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>Proof of Code SHA-256:</span>
          <code class="text-emerald-400 break-all">{{ thread.vaultHash }}</code>
        </div>
      </div>

      <section class="bg-[#050914]/95 border border-slate-800 rounded-2xl p-6 sm:p-8 card-glow space-y-5">
        <h2 class="text-lg font-extrabold text-white m-0 font-display">
          Risposte &amp; Peer Review ({{ comments.length }})
        </h2>

        <div v-if="commentFeedback" class="bg-emerald-500/15 border border-emerald-400/50 text-emerald-300 font-mono text-xs font-bold px-4 py-2.5 rounded-xl">
          {{ commentFeedback }}
        </div>

        <form v-if="!(thread.isLocked || thread.is_locked)" @submit.prevent="submitThreadComment" class="space-y-3">
          <textarea
            v-model="newCommentText"
            rows="3"
            placeholder="Scrivi una risposta tecnica, un benchmark o una peer review..."
            class="w-full bg-[#020617] border border-slate-700 focus:border-violet-400 text-white p-3.5 rounded-xl font-sans text-sm outline-none box-border"
          ></textarea>
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="isPostingComment || !newCommentText.trim()"
              class="px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white font-mono text-xs font-extrabold border-none cursor-pointer transition-colors"
            >
              {{ isPostingComment ? 'Invio...' : 'Pubblica Risposta' }}
            </button>
          </div>
        </form>

        <div v-if="isLoadingComments" class="text-center font-mono text-xs text-slate-400 py-4">
          Caricamento risposte...
        </div>

        <div v-else-if="comments.length === 0" class="text-center font-mono text-xs text-slate-400 py-4">
          Nessuna risposta ancora presente in questo thread.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="c in comments"
            :key="c.id"
            class="bg-[#030712] border border-slate-800 rounded-xl p-4 space-y-1.5"
          >
            <div class="flex items-center justify-between font-mono text-xs">
              <span class="text-cyan-300 font-bold">@{{ c.authorUsername || c.author || 'dev_kernel' }}</span>
              <span class="text-slate-500 text-[11px]">{{ c.createdAt ? new Date(c.createdAt).toLocaleString('it-IT') : 'Adesso' }}</span>
            </div>
            <p class="text-slate-200 text-sm leading-relaxed m-0 whitespace-pre-line">{{ c.content }}</p>
          </div>
        </div>
      </section>

      <DkpRelatedBlogWidget />
      <DkpHomeWidget />

      <DkpAdStrip
        layout="horizontal"
        category-tag="DKP ADS NETWORK &bull; APPROFONDIMENTI DAL VAULT"
      />
    </article>
  </DkpLayout>
</template>

<style scoped>
:deep(.dkp-code-wrapper) {
  background: #0d1117;
  border: 1px solid #1e293b;
  border-radius: 10px;
  overflow: hidden;
  margin: 1.15rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

:deep(.dkp-code-header) {
  background: #161b22;
  padding: 0.45rem 0.95rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #1e293b;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.76rem;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

:deep(.dkp-copy-btn) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(148, 163, 184, 0.25);
  color: #cbd5e1;
  cursor: pointer;
  font-size: 0.74rem;
  font-weight: 700;
  padding: 0.22rem 0.6rem;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.18s ease;
}

:deep(.dkp-copy-btn:hover) {
  background: rgba(0, 220, 130, 0.15);
  border-color: rgba(0, 220, 130, 0.45);
  color: #00dc82;
}

:deep(.dkp-code-block) {
  padding: 1rem 1.1rem;
  margin: 0;
  overflow-x: auto;
  background: #080c14 !important;
}

:deep(.dkp-code-block code) {
  background-color: transparent !important;
  border: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
  font-family: "Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace !important;
  font-size: 0.86rem !important;
  line-height: 1.65 !important;
  color: #e2e8f0;
  box-shadow: none !important;
}

:deep(.dkp-code-block code .token) {
  background: transparent !important;
}

:deep(.token.punctuation) { color: #cbd5e1; }
:deep(.token.property), :deep(.token.class-name), :deep(.token.constant), :deep(.token.symbol) { color: #f8c555; font-weight: 600; }
:deep(.token.string), :deep(.token.char), :deep(.token.attr-value) { color: #7ec699; }
:deep(.token.number), :deep(.token.boolean), :deep(.token.function) { color: #f08d49; font-weight: 600; }
:deep(.token.keyword), :deep(.token.atrule), :deep(.token.selector) { color: #cc99cd; font-weight: bold; }
:deep(.token.operator), :deep(.token.entity), :deep(.token.url) { color: #67cdcc; }
:deep(.token.comment) { color: #64748b; font-style: italic; }
:deep(.dkp-markdown-body ul),
:deep(.dkp-markdown-body ol) {
  margin: 0.75rem 0 !important;
  padding-left: 1.65rem !important;
  color: #e2e8f0 !important;
}
:deep(.dkp-markdown-body ul) {
  list-style-type: disc !important;
}
:deep(.dkp-markdown-body ol) {
  list-style-type: decimal !important;
}
:deep(.dkp-markdown-body li) {
  display: list-item !important;
  margin-bottom: 0.4rem !important;
  line-height: 1.65 !important;
}
:deep(.dkp-markdown-body li::marker) {
  color: #38bdf8 !important;
  font-weight: 700 !important;
}
:deep(.dkp-markdown-body .dkp-li-nested) {
  margin-left: 1.25rem !important;
}
:deep(.dkp-markdown-body h1),
:deep(.dkp-h1) {
  font-size: 1.55rem !important;
  font-weight: 900 !important;
  color: #ffffff !important;
  margin: 1.1rem 0 0.5rem !important;
  border-bottom: 1px solid #1e293b !important;
  padding-bottom: 0.3rem !important;
}
:deep(.dkp-markdown-body h2),
:deep(.dkp-h2) {
  font-size: 1.25rem !important;
  font-weight: 800 !important;
  color: #ffffff !important;
  margin: 0.95rem 0 0.45rem !important;
}
:deep(.dkp-markdown-body h3),
:deep(.dkp-h3) {
  font-size: 1.05rem !important;
  font-weight: 700 !important;
  color: #00dc82 !important;
  margin: 0.8rem 0 0.35rem !important;
}
:deep(.dkp-markdown-body blockquote),
:deep(.dkp-quote) {
  border-left: 3px solid #00dc82 !important;
  padding: 0.4rem 0.85rem !important;
  color: #94a3b8 !important;
  font-style: italic !important;
  margin: 0.75rem 0 !important;
  background: rgba(0, 220, 130, 0.05) !important;
}
:deep(.dkp-markdown-body .dkp-table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.85rem 0;
  border: 1px solid #1e293b;
  font-size: 0.85rem;
}
:deep(.dkp-markdown-body .dkp-table td) {
  padding: 0.5rem 0.75rem;
  border: 1px solid #1e293b;
}
:deep(mark),
:deep(.dkp-highlight) {
  background-color: rgba(16, 185, 129, 0.16) !important;
  color: #6ee7b7 !important;
  border: 1px solid rgba(16, 185, 129, 0.35) !important;
  border-radius: 0.375rem !important;
  padding: 0.08rem 0.38rem !important;
  font-weight: 700 !important;
}
:deep(.dkp-inline-code),
:deep(:not(pre) > code) {
  background-color: rgba(30, 41, 59, 0.85) !important;
  color: #38bdf8 !important;
  padding: 0.14rem 0.42rem !important;
  border-radius: 0.3rem !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;
  font-size: 0.86em !important;
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
/* --- STILE UNIFICATO CODE BLOCK (DARK CYBERPUNK SQUADRATO) & LISTE CYAN --- */
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
</style>