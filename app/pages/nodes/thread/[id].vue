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

const { data: threadRes, pending, error, refresh } = await useFetch<any>(() => `/api/nodes/posts/${threadId.value}`)

const post = computed(() => {
  const raw = threadRes.value?.post || threadRes.value?.data || (threadRes.value?.id ? threadRes.value : null)
  if (!raw) return null
  return {
    ...raw,
    id: Number(raw.id),
    userId: Number(raw.user_id ?? raw.userId ?? 0),
    nodeName: cleanNodeLabel(raw.nodeName || raw.node_name || raw.nodeSlug || 'General'),
    nodeSlug: raw.nodeSlug || raw.node_slug || '',
    nodeIcon: raw.nodeIcon || raw.node_icon || '#',
    authorUsername: raw.authorUsername || raw.author_username || 'community',
    authorXp: Number(raw.authorXp ?? raw.author_xp ?? 0),
    karmaScore: Number(raw.karmaScore ?? raw.karma_score ?? 1),
    isPinned: Boolean(raw.isPinned || raw.is_pinned),
    vaultHash: raw.vaultHash || raw.vault_hash || null,
    vaultCertificateId: raw.vaultCertificateId || raw.vault_certificate_id || (raw.vaultHash || raw.vault_hash ? `DKP-NODE-${raw.id}` : null),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.updated_at || null
  }
})

const canEditPost = computed(() => {
  if (!currentUser.value || !post.value) return false
  return Number(currentUser.value.id) === Number(post.value.userId) || currentUser.value.role === 'ADMIN'
})

const isAdmin = computed(() => currentUser.value?.role === 'ADMIN')

const isEditing = ref(false)
const editTitle = ref('')
const editContent = ref('')
const isSavingEdit = ref(false)

function startEditing() {
  if (!post.value) return
  editTitle.value = post.value.title
  editContent.value = post.value.content
  isEditing.value = true
}

async function saveEdit() {
  if (!post.value || !editTitle.value.trim() || !editContent.value.trim()) return
  isSavingEdit.value = true

  try {
    const res: any = await $fetch(`/api/nodes/posts/${post.value.id}`, {
      method: 'PATCH',
      body: {
        title: editTitle.value.trim(),
        content: editContent.value.trim(),
        userId: currentUser.value?.id
      }
    })

    if (res?.success) {
      showNotification('✨ Post modificato con successo!')
      isEditing.value = false
      await refresh()
    }
  } catch (err: any) {
    showNotification(`❌ Errore: ${err?.data?.statusMessage || 'Impossibile salvare'}`)
  } finally {
    isSavingEdit.value = false
  }
}

async function togglePinPost() {
  if (!post.value) return
  const newPinState = !post.value.isPinned
  try {
    await $fetch(`/api/nodes/posts/${post.value.id}`, {
      method: 'PATCH',
      body: { is_pinned: newPinState, userId: currentUser.value?.id }
    })
    showNotification(newPinState ? '📌 Thread fissato in alto!' : '📍 Thread rimosso dai pinned.')
    await refresh()
  } catch {
    showNotification('❌ Errore durante l\'aggiornamento dello stato pinned.')
  }
}

async function deleteCurrentPost() {
  if (!confirm('Sei sicuro di voler eliminare definitivamente questo thread?')) return
  try {
    await $fetch(`/api/nodes/posts/${post.value.id}`, { method: 'DELETE' })
    showNotification('🗑️ Thread eliminato.')
    navigateTo('/nodes')
  } catch {
    showNotification('❌ Errore durante la cancellazione.')
  }
}

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
  } catch (err) {
    console.error('Errore nel parsing thread:', err)
    return '<p class="text-rose-400">Errore nella formattazione del contenuto.</p>'
  }
}

const parsedContent = computed(() => parseDkpMarkdown(String(post.value?.content || '')))

const authorRank = computed<AuthorRank>(() => {
  try {
    const xp = post.value?.authorXp || 0
    return getAuthorRank ? getAuthorRank(xp) : { color: '#a855f7', badge: '⚡', level: 2, title: 'Kernel Builder' }
  } catch {
    return { color: '#a855f7', badge: '⚡', level: 2, title: 'Kernel Builder' }
  }
})

const currentUrl = computed(() => import.meta.client ? window.location.href : `https://devkernelpulse.org/nodes/thread/${threadId.value}`)

useHead({
  title: computed(() => `${post.value?.title || 'Discussione'} — DKP Talks Hub v2.6`),
  meta: [{ name: 'description', content: computed(() => String(post.value?.content || '').slice(0, 160)) }]
})

let prismTimer: ReturnType<typeof setTimeout> | undefined
const applyPrism = () => {
  if (import.meta.client && $prism) {
    clearTimeout(prismTimer)
    prismTimer = setTimeout(() => {
      try { ($prism as PrismHighlighter).highlightAll() } catch {}
    }, 100)
  }
}

const showCopyFeedback = (btn: HTMLButtonElement) => {
  const originalText = btn.innerHTML
  btn.innerHTML = '✅'
  setTimeout(() => { btn.innerHTML = originalText }, 2000)
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
  setTimeout(() => { toastMsg.value = '' }, 3500)
}

async function voteThread(direction: 'up' | 'down') {
  if (!post.value) return
  const delta = direction === 'up' ? 1 : -1
  post.value.karmaScore = (post.value.karmaScore || 0) + delta
  await $fetch('/api/nodes/vote', {
    method: 'POST',
    body: { postId: post.value.id, targetId: post.value.id, targetType: 'post', direction, value: delta, userId: currentUser.value?.id }
  }).catch(() => null)
}

async function submitComment() {
  if (!commentText.value.trim() || !post.value) return
  commentError.value = ''
  isSendingComment.value = true

  try {
    await $fetch('/api/nodes/comments', {
      method: 'POST',
      body: { postId: post.value.id, content: commentText.value.trim(), userId: currentUser.value?.id }
    })
    if (import.meta.client) window.dispatchEvent(new CustomEvent('dkp:xp_updated'))
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
    <div v-if="toastMsg" role="status" class="fixed top-6 right-6 z-[10000] bg-[#041a13]/95 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl font-mono text-xs font-bold">
      {{ toastMsg }}
    </div>

    <div class="max-w-4xl mx-auto flex flex-col gap-6">
      <nav aria-label="Navigazione Ecosistema DKP" class="flex flex-wrap gap-2.5 justify-center font-mono bg-[#090d16] border border-slate-800 p-3 rounded-2xl shadow-lg">
        <NuxtLink to="/news" class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-400 font-extrabold text-xs rounded-xl transition-all no-underline">🌍 DKP Tech Feed</NuxtLink>
        <NuxtLink to="/nodes" class="px-4 py-2 bg-purple-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.35)] no-underline">💬 DKP Talks Hub</NuxtLink>
        <NuxtLink to="/tools" class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-sky-400 text-sky-400 font-extrabold text-xs rounded-xl transition-all no-underline">🛠️ Developer Tools</NuxtLink>
        <NuxtLink to="/blog" class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-300 font-extrabold text-xs rounded-xl transition-all no-underline">✍️ DKP Editorial Hub</NuxtLink>
      </nav>

      <div v-if="pending" class="text-center py-20 text-emerald-400 font-mono bg-[#090d16] border border-slate-800 rounded-2xl">
        <span class="text-3xl animate-pulse inline-block mb-4">⚡</span>
        <p class="m-0">Caricamento discussione dal DB Neon v2.6-PURE-SQL...</p>
      </div>

      <div v-else-if="error || !post" class="text-center py-20 text-rose-400 bg-[#090d16] border border-slate-800 rounded-2xl">
        <h2 class="text-2xl font-bold mb-4 m-0">⚠️ Discussione non trovata</h2>
        <NuxtLink to="/nodes" class="mt-6 inline-block text-purple-400 hover:underline font-bold font-mono text-xs no-underline">← Torna al DKP Talks Hub</NuxtLink>
      </div>

      <div v-else class="flex flex-col gap-8 relative">
        <article class="glass-panel p-6 sm:p-10 rounded-2xl border border-slate-800 bg-[#090d16] shadow-2xl relative overflow-hidden">
          
          <div class="flex flex-col gap-4 mb-8 relative z-10 border-b border-slate-800 pb-4">
            <nav aria-label="Breadcrumb" class="w-full text-sm text-slate-400">
              <ol class="flex items-center gap-2 m-0 p-0 list-none font-medium flex-wrap">
                <li><NuxtLink to="/nodes" class="text-slate-400 hover:text-purple-400 no-underline">Talks Hub</NuxtLink></li>
                <li class="flex items-center gap-2"><span class="text-slate-600 font-bold">/</span><NuxtLink :to="`/nodes/n/${post.nodeSlug}`" class="text-purple-400 font-mono font-bold no-underline">{{ post.nodeIcon }} n/{{ post.nodeName }}</NuxtLink></li>
                <li class="flex items-center gap-2"><span class="text-slate-600 font-bold">/</span><span class="text-slate-200 truncate max-w-[200px]">{{ post.title }}</span></li>
              </ol>
            </nav>

            <div class="flex items-center gap-2.5 flex-wrap justify-start font-mono">
              <span v-if="post.isPinned" class="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-md text-xs font-bold">📌 PINNED THREAD</span>
              <span class="bg-purple-500/15 text-purple-300 border border-purple-500/35 px-3 py-1 rounded-md text-xs font-bold">{{ post.nodeIcon }} n/{{ post.nodeName }}</span>
              <span class="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-3 py-1 rounded-md text-xs font-bold">⚡ PURE-SQL THREAD</span>
              <span v-if="post.vaultHash" class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-md text-xs font-bold">🛡️ VAULT CERTIFIED v2.6</span>
            </div>
          </div>

          <!-- AZIONI EDIT / DELETE / PIN -->
          <div v-if="canEditPost || isAdmin" class="flex items-center gap-2 mb-6 font-mono flex-wrap">
            <button v-if="canEditPost" type="button" @click="startEditing" class="px-3.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-bold cursor-pointer">✏️ Modifica</button>
            <button v-if="isAdmin" type="button" @click="togglePinPost" class="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold cursor-pointer">📌 {{ post.isPinned ? 'Rimuovi Pin' : 'Pinna Thread' }}</button>
            <button v-if="canEditPost" type="button" @click="deleteCurrentPost" class="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold cursor-pointer">🗑️ Elimina</button>
          </div>

          <!-- MODALE EDIT -->
          <div v-if="isEditing" class="bg-[#020420] border border-sky-500/50 rounded-2xl p-6 mb-8 font-mono shadow-2xl relative z-20">
            <h3 class="text-sky-400 font-bold text-base mb-4 mt-0">🛠️ Modifica Contenuto Thread v2.6</h3>
            <div class="flex flex-col gap-4">
              <input v-model="editTitle" type="text" class="w-full bg-[#090d16] border border-slate-700 rounded-xl p-3 text-white text-sm outline-none" />
              <textarea v-model="editContent" rows="8" class="w-full bg-[#090d16] border border-slate-700 rounded-xl p-3 text-white text-xs font-mono outline-none"></textarea>
              <div class="flex justify-end gap-3">
                <button type="button" @click="isEditing = false" class="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer">Annulla</button>
                <button type="button" @click="saveEdit" :disabled="isSavingEdit" class="px-5 py-2 bg-sky-500 text-slate-950 font-black rounded-xl text-xs cursor-pointer">Salva</button>
              </div>
            </div>
          </div>

          <h1 class="text-2xl sm:text-4xl font-black text-white mb-8 leading-tight relative z-10 mt-0">{{ post.title }}</h1>

          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#020420] border border-slate-800 mb-10 relative z-10" :style="{ borderColor: `${authorRank.color}45` }">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 shrink-0" :style="{ background: `linear-gradient(135deg, ${authorRank.color}, #0f172a)`, borderColor: authorRank.color }">
                {{ (post.authorUsername || 'D')[0].toUpperCase() }}
              </div>
              <div>
                <div class="text-slate-200 font-bold flex items-center gap-2 flex-wrap">
                  <span>@{{ post.authorUsername }}</span>
                  <span class="text-[0.65rem] px-2 py-0.5 rounded uppercase border font-bold" :style="{ backgroundColor: `${authorRank.color}15`, color: authorRank.color, borderColor: `${authorRank.color}40` }">
                    {{ authorRank.badge }} Lvl. {{ authorRank.level }} - {{ authorRank.title }}
                  </span>
                </div>
                <div class="text-xs text-slate-400 flex items-center gap-3 mt-1 font-mono">
                  <span>📅 {{ new Date(post.createdAt).toLocaleDateString('it-IT') }}</span>
                  <span>💬 {{ comments.length }} commenti</span>
                  <span>⏱️ {{ readTime }} min lettura</span>
                </div>
              </div>
            </div>
            <button type="button" @click="voteThread('up')" class="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 font-bold cursor-pointer">▲ {{ post.karmaScore }} Karma</button>
          </div>

          <ClientOnly>
            <div class="post-content prose prose-invert max-w-none text-slate-200 mb-10 dkp-preview-content relative z-10" v-html="parsedContent"></div>
            <template #fallback><div class="py-10 text-center text-slate-500 animate-pulse font-mono mb-10">⏳ Formattazione in corso...</div></template>
          </ClientOnly>

          <!-- SEZIONE CONDIVISIONE SUBITO SOTTO IL THREAD COME RICHIESTO NEL PNG -->
          <div class="bg-[#020420] border border-slate-800 rounded-xl p-6 relative z-10 mb-8 shadow-lg">
            <div class="flex flex-col md:flex-row items-center justify-between gap-4">
              <div class="flex items-center gap-3 text-center md:text-left">
                <div class="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-xl font-bold shrink-0">🚀</div>
                <div>
                  <h4 class="text-white font-extrabold text-base m-0">Condividi discussione</h4>
                  <p class="text-slate-400 text-xs m-0">Diffondi questo thread nella community DevKernelPulse</p>
                </div>
              </div>
              <div class="w-full md:w-auto flex justify-center">
                <SocialShare :title="post.title || 'DevKernelPulse Talks'" :url="currentUrl" :horizontal="true" />
              </div>
            </div>
          </div>

          <!-- COMMENTI -->
          <section class="bg-[#020420] border border-slate-800 rounded-2xl p-6 relative z-10 mb-8 flex flex-col gap-5">
            <h2 class="font-mono text-base font-bold text-white m-0">💬 Discussione Community ({{ comments.length }})</h2>
            <form @submit.prevent="submitComment" class="flex flex-col gap-3">
              <textarea v-model="commentText" rows="4" placeholder="Scrivi la tua risposta..." class="w-full bg-[#090d16] border border-slate-800 rounded-xl p-3.5 text-slate-200 text-xs font-mono outline-none"></textarea>
              <div v-if="commentError" class="text-xs font-mono text-rose-400">⚠️ {{ commentError }}</div>
              <div class="flex justify-end">
                <button type="submit" :disabled="isSendingComment" class="px-5 py-2.5 bg-emerald-500 text-slate-950 font-mono font-extrabold text-xs rounded-xl cursor-pointer">🚀 Pubblica Risposta (+10 XP)</button>
              </div>
            </form>
            <div v-for="c in comments" :key="c.id" class="bg-[#090d16] border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
              <div class="flex items-center justify-between font-mono text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                <span class="text-sky-400 font-bold">@{{ c.authorUsername || c.author_username || 'member' }}</span>
                <span>{{ new Date(c.createdAt || c.created_at).toLocaleString('it-IT') }}</span>
              </div>
              <div class="text-xs sm:text-sm text-slate-200 dkp-preview-content" v-html="parseDkpMarkdown(String(c.content || ''))"></div>
            </div>
          </section>

          <DkpAdStrip categoryTag="DKP NODES TALKS STREAM" />
          <DKPRelatedThreads :currentNodeSlug="post.nodeSlug || undefined" />
          <DkpNodesHomeWidget />
          <DKPAdBanner />
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-panel { backdrop-filter: blur(12px); }
.prose h1, .post-content h1 { @apply text-2xl font-extrabold text-white mt-8 mb-4 border-b border-slate-800 pb-2; }
.prose p, .post-content p { @apply text-slate-300 text-base leading-relaxed mb-6; }
:deep(.dkp-code-wrapper) { background: #0d1117; border: 1px solid #1e293b; border-radius: 8px; margin: 1.2rem 0; }
:deep(.dkp-code-header) { background: #161b22; padding: 0.5rem 1rem; display: flex; justify-content: space-between; color: #8b949e; font-size: 0.8rem; font-weight: bold; }
:deep(.dkp-copy-btn) { background: none; border: none; color: #8b949e; cursor: pointer; }
:deep(.dkp-code-block) { padding: 1rem; margin: 0; overflow-x: auto; font-family: monospace; }
:deep(.dkp-highlight) { background-color: rgba(0, 220, 130, 0.25); color: #f8fafc; padding: 0.1rem 0.3rem; border-radius: 4px; }
:deep(.dkp-inline-code) { background-color: rgba(30, 41, 59, 0.8); color: #38bdf8; padding: 0.2rem 0.4rem; border-radius: 0.375rem; }
</style>