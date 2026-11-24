<!-- app/components/blog/DkpEditor.vue -->
<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import DkpTagInput from '~/components/blog/DkpTagInput.vue'
import { useSentinelGrammar } from '~/composables/useSentinelGrammar'
import { highlightCodeDynamic, prismRegistryVersion } from '~/composables/useDynamicPrism'

useCodeCopy()

const props = defineProps<{
  modelValue?: {
    title: string
    category: string
    subCategory: string
    tags: string[]
    summary: string
    content: string
  }
}>()

const emit = defineEmits(['update:modelValue'])

const title = ref(props.modelValue?.title || '')
const categoryName = ref(props.modelValue?.category || '')
const subCategoryName = ref(props.modelValue?.subCategory || '')
const tags = ref<string[]>(Array.isArray(props.modelValue?.tags) ? [...props.modelValue.tags] : [])
const summary = ref(props.modelValue?.summary || '')
const content = ref(props.modelValue?.content || '')

const {
  detectedLang: sentinelLang,
  grammarIssues: sentinelIssues,
  applyGrammarFix: applySentinelFix,
  applyAllGrammarFixes,
  runAiGrammarFix,
  isAiFixing,
  lastFixMessage
} = useSentinelGrammar(content)

const activeTab = ref<'write' | 'preview'>('write')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isZenMode = ref(false)

// DKP Ai Nexus State
const showAiBar = ref(false)
const aiPromptHint = ref('')
const aiTone = ref<'deep-dive' | 'tutorial' | 'rfc'>('deep-dive')
const aiCodeLang = ref('typescript')
const isAiGenerating = ref(false)
const aiStatusMessage = ref('')
const previousContentSnapshot = ref<string | null>(null)

// Autosave locale anti-perdita dati
const BLOG_AUTOSAVE_KEY = 'DKP_BLOG_EDITOR_AUTOSAVE_V1'
const autosaveNotice = ref('')
const savedDraftAvailable = ref<{
  title: string
  category: string
  subCategory: string
  tags: string[]
  summary: string
  content: string
  savedAt: number
} | null>(null)

function toggleZenMode() {
  isZenMode.value = !isZenMode.value
  if (import.meta.client) {
    document.body.style.overflow = isZenMode.value ? 'hidden' : ''
  }
}

onUnmounted(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
  }
})

let isResettingEditor = false

watch(
  () => props.modelValue,
  (newVal) => {
    if (!newVal) return
    const nextTitle = newVal.title || ''
    const nextCategory = newVal.category || ''
    const nextSubCategory = newVal.subCategory || ''
    const nextSummary = newVal.summary || ''
    const nextContent = newVal.content || ''
    const nextTags = Array.isArray(newVal.tags) ? [...newVal.tags] : []

    if (nextTitle !== title.value) title.value = nextTitle
    if (nextCategory !== categoryName.value) categoryName.value = nextCategory
    if (nextSubCategory !== subCategoryName.value) subCategoryName.value = nextSubCategory
    if (nextSummary !== summary.value) summary.value = nextSummary
    if (nextContent !== content.value) content.value = nextContent
    if (JSON.stringify(nextTags) !== JSON.stringify(tags.value)) {
      tags.value = nextTags
    }

    if (!nextTitle.trim() && !nextContent.trim() && !nextSummary.trim()) {
      previousContentSnapshot.value = null
      savedDraftAvailable.value = null
      autosaveNotice.value = ''
      activeTab.value = 'write'
    }
  },
  { deep: true }
)

function syncToParent() {
  emit('update:modelValue', {
    title: title.value,
    category: categoryName.value,
    subCategory: subCategoryName.value,
    tags: tags.value,
    summary: summary.value,
    content: content.value
  })
}

watch(
  [title, categoryName, subCategoryName, tags, summary, content],
  () => {
    if (isResettingEditor) return
    syncToParent()
    if (!import.meta.client) return
    if (!title.value.trim() && !content.value.trim() && !summary.value.trim()) return
    try {
      localStorage.setItem(
        BLOG_AUTOSAVE_KEY,
        JSON.stringify({
          title: title.value,
          category: categoryName.value,
          subCategory: subCategoryName.value,
          tags: tags.value,
          summary: summary.value,
          content: content.value,
          savedAt: Date.now()
        })
      )
      autosaveNotice.value = 'Bozza salvata localmente'
    } catch {}
  },
  { deep: true }
)

if (import.meta.client) {
  try {
    const rawDraft = localStorage.getItem(BLOG_AUTOSAVE_KEY)
    if (rawDraft) {
      const parsed = JSON.parse(rawDraft)
      if (parsed && (parsed.content || parsed.title)) {
        if (parsed.content !== content.value || parsed.title !== title.value) {
          savedDraftAvailable.value = parsed
        }
      }
    }
  } catch {}
}

function restoreSavedDraft() {
  if (!savedDraftAvailable.value) return
  const d = savedDraftAvailable.value
  title.value = d.title || ''
  categoryName.value = d.category || ''
  subCategoryName.value = d.subCategory || ''
  tags.value = Array.isArray(d.tags) ? [...d.tags] : []
  summary.value = d.summary || ''
  content.value = d.content || ''
  savedDraftAvailable.value = null
  autosaveNotice.value = 'Bozza locale ripristinata'
  syncToParent()
}

function resetEditor(clearStorage = true) {
  isResettingEditor = true
  title.value = ''
  categoryName.value = ''
  subCategoryName.value = ''
  tags.value = []
  summary.value = ''
  content.value = ''
  previousContentSnapshot.value = null
  savedDraftAvailable.value = null
  autosaveNotice.value = ''
  activeTab.value = 'write'
  if (textareaRef.value) textareaRef.value.value = ''
  if (clearStorage) {
    try { localStorage.removeItem(BLOG_AUTOSAVE_KEY) } catch {}
  }
  syncToParent()
  isResettingEditor = false
}
function clearSavedDraft() {
  savedDraftAvailable.value = null
  autosaveNotice.value = ''
  if (import.meta.client) {
    try {
      localStorage.removeItem(BLOG_AUTOSAVE_KEY)
    } catch {}
  }
}

const { data: catResponse } = useFetch<any>('/api/blog/categories')

const categories = computed(() => {
  const raw = catResponse.value?.data || []
  return Array.isArray(raw) ? raw : []
})

const availableSubcategories = computed(() => {
  if (!categoryName.value) return []
  const cat = categories.value.find((c: any) => c.name === categoryName.value)
  return (cat?.subcategories || []).map((s: any) => (typeof s === 'string' ? s : s.name))
})

function onCategoryChange() {
  const subs = availableSubcategories.value
  subCategoryName.value = subs.length > 0 ? subs[0] : ''
  syncToParent()
}

function insertFormatting(prefix: string, suffix: string = '', placeholder: string = '') {
  const textarea = textareaRef.value
  if (!textarea) {
    content.value = `${content.value}${prefix}${placeholder}${suffix}`
    syncToParent()
    return
  }

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.value.substring(start, end) || placeholder

  const before = content.value.substring(0, start)
  const after = content.value.substring(end)

  content.value = `${before}${prefix}${selectedText}${suffix}${after}`
  syncToParent()

  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length)
  }, 0)
}

function insertCodeBlock() {
  const nl = content.value && !content.value.endsWith('\n') ? '\n' : ''
  insertFormatting(`${nl}\`\`\`${aiCodeLang.value}\n`, `\n\`\`\`\n`, '// Inserisci qui il tuo codice')
}

function insertList(type: 'bullet' | 'number' | 'sub') {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.value.substring(start, end)

  const before = content.value.substring(0, start)
  const after = content.value.substring(end)

  let newText = ''
  if (selectedText) {
    const lines = selectedText.split('\n')
    newText = lines
      .map((line, index) => {
        const cleanLine = line.replace(/^(\s*)(\d+\.|-)\s+/, '$1')
        if (type === 'number') return `${index + 1}. ${cleanLine}`
        if (type === 'sub') return `  - ${cleanLine}`
        return `- ${cleanLine}`
      })
      .join('\n')
  } else {
    newText = type === 'number' ? '1. ' : type === 'sub' ? '  - ' : '- '
  }

  content.value = `${before}${newText}${after}`
  syncToParent()

  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(start, start + newText.length)
  }, 0)
}

function handleEnter(e: KeyboardEvent) {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const textBeforeCursor = content.value.substring(0, start)
  const lines = textBeforeCursor.split('\n')
  const lastLine = lines[lines.length - 1]

  const numberMatch = lastLine.match(/^(\s*)(\d+)\.\s+(.*)$/)
  const bulletMatch = lastLine.match(/^(\s*)-\s+(.*)$/)

  if (numberMatch || bulletMatch) {
    e.preventDefault()

    const spaces = numberMatch ? numberMatch[1] : bulletMatch![1]
    const textContent = numberMatch ? numberMatch[3] : bulletMatch![2]

    if (!textContent.trim()) {
      const beforeWithoutLastLine = content.value.substring(0, start - lastLine.length)
      const after = content.value.substring(textarea.selectionEnd)
      content.value = beforeWithoutLastLine + '\n' + after
      syncToParent()
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start - lastLine.length + 1
      }, 0)
      return
    }

    let prefix = ''
    if (numberMatch) {
      const currentNum = parseInt(numberMatch[2], 10)
      prefix = `\n${spaces}${currentNum + 1}. `
    } else {
      prefix = `\n${spaces}- `
    }

    const before = content.value.substring(0, start)
    const after = content.value.substring(textarea.selectionEnd)
    content.value = `${before}${prefix}${after}`
    syncToParent()

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + prefix.length
    }, 0)
  }
}

async function runAiAssist(mode: 'generate_draft' | 'expand' | 'security_audit' | 'seo_optimize' | 'generate_code' | 'tldr_table') {
  isAiGenerating.value = true
  aiStatusMessage.value = 'Elaborazione DKP Ai Nexus in corso...'

  const textarea = textareaRef.value
  const selectedText = textarea
    ? content.value.substring(textarea.selectionStart, textarea.selectionEnd)
    : ''

  previousContentSnapshot.value = content.value

  try {
    const res: any = await $fetch('/api/admin/ai-assist', {
      method: 'POST',
      body: {
        mode,
        context: 'blog',
        title: title.value,
        category: categoryName.value,
        subCategory: subCategoryName.value,
        tags: tags.value,
        summary: summary.value,
        content: content.value,
        selectedText,
        promptHint: aiPromptHint.value,
        codeLang: aiCodeLang.value,
        tone: aiTone.value
      }
    })

    if (res?.success && res.result) {
      if (res.result.title && (!title.value.trim() || mode === 'seo_optimize' || mode === 'generate_draft')) {
        title.value = res.result.title
      }
      if (res.result.summary && (!summary.value.trim() || mode === 'seo_optimize' || mode === 'generate_draft')) {
        summary.value = res.result.summary
      }
      if (Array.isArray(res.result.tags) && res.result.tags.length > 0 && (tags.value.length === 0 || mode === 'seo_optimize')) {
        tags.value = Array.from(new Set([...tags.value, ...res.result.tags])).slice(0, 12)
      }

      if (mode === 'generate_code' || mode === 'tldr_table' || mode === 'security_audit') {
        const snippet = res.result.insertSnippet || ''
        if (textarea && snippet) {
          const start = textarea.selectionStart
          const before = content.value.substring(0, start)
          const after = content.value.substring(textarea.selectionEnd)
          content.value = `${before}${snippet}${after}`
        } else if (res.result.content) {
          content.value = res.result.content
        }
      } else if (mode !== 'seo_optimize' && res.result.content) {
        content.value = res.result.content
      }

      syncToParent()
      aiStatusMessage.value = `Completato (${res.source || 'AI Engine'})`
    }
  } catch (err: any) {
    aiStatusMessage.value = `Errore AI: ${err?.message || 'Impossibile completare'}`
  } finally {
    isAiGenerating.value = false
  }
}

function undoLastAiAction() {
  if (previousContentSnapshot.value !== null) {
    content.value = previousContentSnapshot.value
    previousContentSnapshot.value = null
    aiStatusMessage.value = 'Modifica AI annullata.'
    syncToParent()
  }
}

const parsedContent = computed(() => {
  void prismRegistryVersion.value

  if (!content.value) {
    return '<p class="preview-empty">Inizia a scrivere per vedere la preview in tempo reale...' + '<' + '/p>'
  }

  let rawContent = content.value
  const codeBlocks: string[] = []

  rawContent = rawContent.replace(/```([a-zA-Z0-9_+#.-]*)\r?\n([\s\S]*?)```/g, (match, lang, code) => {
    const index = codeBlocks.length
    const cleanLang = lang ? lang.trim().toLowerCase() : ''
    const languageClass = cleanLang ? `language-${cleanLang}` : 'language-none'
    const languageLabel = cleanLang
      ? `<` + `div class="dkp-code-header"><span>${cleanLang}<` + `/span><button class="dkp-copy-btn" type="button">Copia<` + `/button><` + `/div>`
      : ''

    const highlightedCode = highlightCodeDynamic(code, cleanLang)

    codeBlocks.push(
      `<` + `div class="dkp-code-wrapper">${languageLabel}<pre class="dkp-code-block ${languageClass}"><code class="${languageClass}">${highlightedCode}<` + `/code><` + `/pre><` + `/div>`
    )

    return `__DKP_CODE_BLOCK_${index}__`
  })

  let html = rawContent
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  html = html.replace(/&lt;div class='dkp-custom-html'&gt;/g, '<' + "div class='dkp-custom-html'>")
  html = html.replace(/&lt;\/div&gt;/g, '<' + '/div>')

  html = html.replace(/^\|(.+)\|$/gm, (match, p1) => {
    const cells = p1.split('|').map((c: string) => c.trim())
    if (cells.every((c: string) => /^:?-+:?$/.test(c))) return ''
    const rowHtml = cells.map((c: string) => `<td>${c}<` + `/td>`).join('')
    return `<tr>${rowHtml}<` + `/tr>`
  })
  html = html.replace(new RegExp('(<tr>.*?<\\/tr>[\\s\\n\\r]*)+', 'g'), (match) => {
    const cleanRows = match.replace(/[\n\r]+/g, '')
    return `<` + `div class="dkp-table-wrapper"><table class="dkp-table"><tbody>${cleanRows}<` + `/tbody><` + `/table><` + `/div>`
  })

  html = html
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="dkp-img" loading="lazy" />')
    .replace(/@\[video\]\(([^)]+)\)/g, '<' + 'div class="dkp-video-wrapper"><iframe src="$1" frameborder="0" allowfullscreen><' + '/iframe><' + '/div>')
    .replace(/==(.*?)==/g, '<mark class="dkp-highlight">$1<' + '/mark>')
    .replace(/\+\+(.*?)\+\+/g, '<u class="dkp-underline">$1<' + '/u>')
    .replace(/`+([^`\n]+?)`+/g, (_m, c) => '<code class="dkp-inline-code">' + String(c).replace(/^(?:''|&#39;&#39;|&apos;&apos;|&#x27;&#x27;|`)+|(?:''|&#39;&#39;|&apos;&apos;|&#x27;&#x27;|`)+$/gi, '').trim() + '<' + '/code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="dkp-bold">$1<' + '/strong>')
    .replace(/\*(.*?)\*/g, '<em class="dkp-italic">$1<' + '/em>')
    .replace(/~~(.*?)~~/g, '<del class="dkp-strike">$1<' + '/del>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="dkp-link" target="_blank">$1<' + '/a>')

  html = html
    .replace(/^# (.*?)\r?$/gm, '<h1 class="dkp-h1">$1<' + '/h1>')
    .replace(/^## (.*?)\r?$/gm, '<h2 class="dkp-h2">$1<' + '/h2>')
    .replace(/^### (.*?)\r?$/gm, '<h3 class="dkp-h3">$1<' + '/h3>')
    .replace(/^&gt; (.*?)\r?$/gm, '<blockquote class="dkp-quote">$1<' + '/blockquote>')
    .replace(/^---$/gm, '<hr class="dkp-hr" />')

  html = html.replace(/^(\s{2,}|\t+)-\s+(.*?)\r?$/gm, '<ul class="dkp-sub-list"><li class="dkp-li-nested">$2<' + '/li><' + '/ul>')
  html = html.replace(/^(\s{2,}|\t+)[0-9]+\.\s+(.*?)\r?$/gm, '<ol class="dkp-sub-list"><li class="dkp-li-nested dkp-li-num">$2<' + '/li><' + '/ol>')
  html = html.replace(/^ {0,1}-\s+(.*?)\r?$/gm, '<ul class="dkp-main-list"><li class="dkp-li-main">$1<' + '/li><' + '/ul>')
  html = html.replace(/^ {0,1}[0-9]+\.\s+(.*?)\r?$/gm, '<ol class="dkp-main-list"><li class="dkp-li-main">$1<' + '/li><' + '/ol>')

  const lines = html.split(/\r?\n/)
  let parsedHtml = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed.includes('__DKP_CODE_BLOCK_')) {
      parsedHtml += line + '\n'
    } else if (/^<(h[1-6]|pre|div|table|ul|ol|blockquote|hr|li|img)/.test(trimmed) || /^<\/(div|table|ul|ol|blockquote)>/.test(trimmed)) {
      parsedHtml += line + '\n'
    } else if (trimmed === '') {
      parsedHtml += '<br />\n'
    } else {
      parsedHtml += line + (i < lines.length - 1 ? '<br />' : '')
    }
  }

  codeBlocks.forEach((block, index) => {
    parsedHtml = parsedHtml.replace(new RegExp(`__DKP_CODE_BLOCK_${index}__(?:<br \\/>)?`, 'g'), () => block)
  })

  parsedHtml = parsedHtml
    .replace(new RegExp('(<\\/h[1-6]>)<br \\/>', 'g'), '$1')
    .replace(new RegExp('(<\\/div>)<br \\/>', 'g'), '$1')

  return parsedHtml
})
</script>

<template>
  <Teleport :disabled="!isZenMode" to="body">
    <div
      :class="
        isZenMode
          ? 'fixed inset-0 z-[9999] w-screen h-screen bg-[#050814] flex flex-col overflow-hidden'
          : 'w-full bg-[#070b14] border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xl'
      "
    >
      <!-- NAVBAR SUPERIORE DEDICATA SOLO ALLO ZEN MODE (PAGINA INTERA ANTIDISTRAZIONE) -->
      <div
        v-if="isZenMode"
        class="shrink-0 bg-[#070b14] border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 flex-wrap"
      >
        <div class="flex items-center gap-3 flex-wrap">
          <span class="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-extrabold">
            ZEN MODE
          </span>
          <span class="text-slate-300 font-mono text-xs font-bold truncate max-w-[220px] sm:max-w-sm">
            {{ title || 'Nuovo Articolo Blog' }}
          </span>
          <div class="inline-flex rounded-lg bg-[#030712] p-0.5 border border-slate-800 font-mono text-xs">
            <button
              type="button"
              @click="activeTab = 'write'"
              :class="activeTab === 'write' ? 'bg-emerald-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-slate-200'"
              class="px-3 py-1 rounded-md transition cursor-pointer"
            >
              Scrivi
            </button>
            <button
              type="button"
              @click="activeTab = 'preview'"
              :class="activeTab === 'preview' ? 'bg-cyan-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-slate-200'"
              class="px-3 py-1 rounded-md transition cursor-pointer"
            >
              Anteprima
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-[11px] font-mono text-slate-400 hidden sm:inline">
            {{ content.length }} caratteri
          </span>
          <button
            type="button"
            @click="resetEditor(true)" class="px-3 py-1.5 rounded-xl border bg-slate-900 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/15 font-bold font-mono text-xs transition cursor-pointer" title="Pulisci editor">+ Nuovo</button><button type="button" @click="showAiBar = !showAiBar"
            :class="showAiBar ? 'bg-purple-500 text-slate-950 border-purple-400 font-extrabold' : 'bg-purple-500/15 text-purple-300 border-purple-500/40 hover:bg-purple-500/25 font-bold'"
            class="px-3 py-1.5 rounded-xl border font-mono text-xs transition cursor-pointer"
          >
            &#10024; DKP Ai Nexus&copy;
          </button>
          <button
            type="button"
            @click="toggleZenMode"
            class="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-extrabold transition cursor-pointer shadow-lg"
          >
            &#8617; Torna all'Editor
          </button>
        </div>
      </div>

      <!-- HEADER STANDARD QUANDO NON IN ZEN MODE -->
      <div
        v-if="!isZenMode"
        class="flex items-center justify-between gap-3 flex-wrap border-b border-slate-800/80 pb-3"
      >
        <div class="flex items-center gap-2.5 flex-wrap">
          <span class="text-slate-100 font-extrabold text-sm sm:text-base font-mono tracking-tight">
            DKP Blog Rich Editor
          </span>
          <span class="text-emerald-400 font-mono text-xs font-bold">
            - Rich Editor Avanzato
          </span>
          <span
            v-if="autosaveNotice"
            class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] font-bold"
          >
            {{ autosaveNotice }}
            <button
              type="button"
              @click="clearSavedDraft"
              title="Svuota bozza salvata"
              class="text-slate-400 hover:text-rose-300 bg-transparent border-none cursor-pointer p-0 ml-1"
            >
              &times;
            </button>
          </span>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            @click="resetEditor(true)" class="px-3 py-1.5 rounded-xl border bg-slate-900 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/15 font-bold font-mono text-xs transition cursor-pointer" title="Pulisci editor">+ Nuovo</button><button type="button" @click="showAiBar = !showAiBar"
            :class="showAiBar ? 'bg-purple-500 text-slate-950 border-purple-400 font-extrabold' : 'bg-purple-500/15 text-purple-300 border-purple-500/40 hover:bg-purple-500/25 font-bold'"
            class="px-3 py-1.5 rounded-xl border font-mono text-xs transition cursor-pointer"
            title="Apri DKP Ai Nexus"
          >
            &#10024; DKP Ai Nexus&copy;
          </button>

          <button
            type="button"
            @click="toggleZenMode"
            class="px-3 py-1.5 rounded-xl border bg-slate-900 text-cyan-300 border-slate-700 hover:bg-slate-800 font-bold font-mono text-xs transition cursor-pointer"
            title="Attiva Modalita Zen a schermo intero"
          >
            Zen Mode
          </button>
        </div>
      </div>

      <!-- TUTTE LE SCHEDE METADATI NASCOSTE IN ZEN MODE -->
      <template v-if="!isZenMode">
        <!-- BANNER RIPRISTINO BOZZA SE PRESENTE -->
        <div
          v-if="savedDraftAvailable"
          class="flex items-center justify-between gap-3 flex-wrap bg-amber-500/10 border border-amber-500/40 rounded-xl px-3.5 py-2 font-mono text-xs"
        >
          <span class="text-amber-300">
            Trovata una bozza locale salvata in precedenza ({{ savedDraftAvailable.title || 'Senza titolo' }}).
          </span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="restoreSavedDraft"
              class="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-extrabold text-[11px] cursor-pointer"
            >
              Ripristina
            </button>
            <button
              type="button"
              @click="clearSavedDraft"
              class="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[11px] cursor-pointer"
            >
              Ignora
            </button>
          </div>
        </div>

        <!-- DKP Ai Nexus — SENTINELLA PASSIVA GRAMMARLY-STYLE -->
        <div class="bg-[#050a18] border border-purple-500/35 rounded-xl px-3.5 py-2.5 font-mono text-xs space-y-2">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2">
              <span class="text-purple-300 font-extrabold">DKP Ai Nexus&copy; &bull; Sentinella Passiva</span>
              <span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 text-[10px] font-bold uppercase">
                LANG: {{ sentinelLang }}
              </span>
              <span
                v-if="lastFixMessage"
                class="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 text-[10px] font-bold"
              >
                &#10003; {{ lastFixMessage }}
              </span>
            </div>

            <div class="flex items-center gap-2 flex-wrap"><button v-if="sentinelIssues.length > 0" type="button" @click="applyAllGrammarFixes" class="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/40 font-extrabold text-[10px] cursor-pointer">Correggi Tutto ({{ sentinelIssues.length }})</button><button type="button" :disabled="isAiFixing" @click="runAiGrammarFix('blog')" class="px-2.5 py-1 rounded-lg bg-purple-500 hover:bg-purple-400 text-slate-950 font-extrabold text-[10px] border-none cursor-pointer disabled:opacity-50">{{ isAiFixing ? 'Revisione AI...' : '✨ Correggi Grammatica (Ai Nexus©)' }}</button></div><span v-if="sentinelIssues.length === 0" class="text-[11px] text-emerald-400">
              &#10003; Sintassi, punteggiatura e Markdown verificati
            </span>
            <span v-else class="text-[11px] text-amber-300 font-bold">
              {{ sentinelIssues.length }} suggeriment{{ sentinelIssues.length === 1 ? 'o' : 'i' }} in tempo reale
            </span>
          </div>

          <div v-if="sentinelIssues.length > 0" class="space-y-1.5">
            <div
              v-for="issue in sentinelIssues.slice(0, 3)"
              :key="issue.id"
              class="flex items-center justify-between gap-2 flex-wrap bg-[#090d16] border border-slate-800 rounded-lg px-2.5 py-1.5"
            >
              <span class="text-[11px] text-slate-300">
                <strong class="text-sky-400">[{{ issue.rule }}]</strong> {{ issue.message }}
              </span>
              <button
                v-if="issue.replacement || issue.id === 'double-space' || issue.id === 'unclosed-fence' || issue.id === 'unclosed-inline-code'"
                type="button"
                @click="applySentinelFix(issue)"
                class="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[10px] border-none cursor-pointer"
              >
                Correggi 1-Click
              </button>
            </div>
          </div>
        </div>

        <!-- DESTINAZIONE EDITORIALE: CATEGORIA & SOTTOCATEGORIA -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#090e1c] border border-slate-800/80 rounded-xl p-3">
          <div>
            <label class="block text-[11px] font-mono font-bold text-sky-400 mb-1.5">
              1. Categoria Principale *
            </label>
            <select
              v-model="categoryName"
              @change="onCategoryChange"
              class="w-full bg-[#030712] border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-slate-100 text-xs sm:text-sm outline-none"
            >
              <option value="" disabled>Seleziona Categoria</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.name">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-mono font-bold text-emerald-400 mb-1.5">
              2. Sottocategoria di Destinazione
            </label>
            <select
              v-model="subCategoryName"
              :disabled="!categoryName || availableSubcategories.length === 0"
              class="w-full bg-[#030712] border border-slate-700/80 focus:border-emerald-400 rounded-xl px-3 py-2 text-slate-100 text-xs sm:text-sm outline-none disabled:opacity-50"
            >
              <option value="">Nessuna / Generale</option>
              <option v-for="sub in availableSubcategories" :key="sub" :value="sub">
                {{ sub }}
              </option>
            </select>
          </div>
        </div>

        <!-- DESTINAZIONE ATTIVA BAR -->
        <div class="flex items-center justify-between gap-2 flex-wrap bg-emerald-950/35 border border-emerald-500/35 rounded-xl px-3.5 py-2 font-mono text-xs">
          <span class="text-emerald-300 font-bold">
            Destinazione attiva: {{ categoryName || 'Seleziona categoria' }}<span v-if="subCategoryName"> / {{ subCategoryName }}</span>
          </span>
          <span class="text-slate-400 text-[11px]">
            {{ tags.length }} tag selezionati
          </span>
        </div>

        <!-- TITOLO ARTICOLO -->
        <div>
          <label class="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Titolo Articolo *
          </label>
          <input
            v-model="title"
            type="text"
            placeholder="Es: Architettura DKP Kernel v2.6 Pure-SQL su GCP Cloud Run..."
            class="w-full bg-[#030712] border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-medium outline-none"
          />
        </div>

        <!-- TAGS ARTICOLO (AUTOSUGGEST 600+) -->
        <div>
          <label class="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Tags dell'Articolo (Autosuggest 600+)
          </label>
          <DkpTagInput v-model="tags" />
        </div>

        <!-- ESTRATTO BREVE (SUMMARY / EXCERPT) -->
        <div>
          <label class="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Estratto Breve (Anteprima Card &amp; SEO)
          </label>
          <textarea
            v-model="summary"
            rows="2"
            placeholder="Breve sintesi tecnica dell'articolo visibile nelle card del blog..."
            class="w-full bg-[#030712] border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-slate-200 text-xs sm:text-sm outline-none resize-y"
          ></textarea>
        </div>
      </template>

      <!-- PANNELLO DKP Ai Nexus (DISPONIBILE SIA IN STANDARD CHE IN ZEN MODE) -->
      <div
        v-if="showAiBar"
        :class="isZenMode ? 'shrink-0 mx-4 sm:mx-6 mt-2 bg-[#050a18] border border-purple-500/40 rounded-xl p-3 space-y-2.5 font-mono text-xs' : 'bg-[#050a18] border border-purple-500/40 rounded-xl p-3 space-y-2.5 font-mono text-xs'"
      >
        <div class="flex items-center gap-2 flex-wrap">
          <input
            v-model="aiPromptHint"
            type="text"
            placeholder="Argomento o istruzione AI (es: Analisi architetturale Pure-SQL vs ORM)..."
            class="flex-1 min-w-[220px] bg-[#030712] border border-slate-700 focus:border-purple-400 rounded-lg px-3 py-1.5 text-slate-100 outline-none"
          />
          <select v-model="aiTone" class="bg-[#030712] border border-slate-700 text-purple-300 rounded-lg px-2.5 py-1.5 outline-none">
            <option value="deep-dive">Tono: Deep-Dive</option>
            <option value="tutorial">Tono: Tutorial</option>
            <option value="rfc">Tono: RFC Spec</option>
          </select>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            :disabled="isAiGenerating"
            @click="runAiAssist('generate_draft')"
            class="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer disabled:opacity-50"
          >
            &#10024; Genera Bozza
          </button>
          <button
            type="button"
            :disabled="isAiGenerating"
            @click="runAiAssist('expand')"
            class="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 cursor-pointer disabled:opacity-50"
          >
            Espandi Testo
          </button>
          <button
            type="button"
            :disabled="isAiGenerating"
            @click="runAiAssist('security_audit')"
            class="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 cursor-pointer disabled:opacity-50"
          >
            Sentinel Audit
          </button>
          <button
            type="button"
            :disabled="isAiGenerating"
            @click="runAiAssist('seo_optimize')"
            class="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-purple-300 cursor-pointer disabled:opacity-50"
          >
            SEO &amp; Tag
          </button>
          <button
            type="button"
            :disabled="isAiGenerating"
            @click="runAiAssist('generate_code')"
            class="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-emerald-300 cursor-pointer disabled:opacity-50"
          >
            Snippet {{ aiCodeLang.toUpperCase() }}
          </button>
          <button
            type="button"
            :disabled="isAiGenerating"
            @click="runAiAssist('tldr_table')"
            class="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-amber-300 cursor-pointer disabled:opacity-50"
          >
            TL;DR &amp; Tabella
          </button>
          <button
            v-if="previousContentSnapshot !== null"
            type="button"
            @click="undoLastAiAction"
            class="px-2.5 py-1 rounded bg-rose-500/15 border border-rose-500/40 text-rose-300 cursor-pointer"
          >
            Annulla AI
          </button>
          <span v-if="aiStatusMessage" class="text-[11px] text-emerald-400 ml-auto">
            {{ aiStatusMessage }}
          </span>
        </div>
      </div>

      <!-- TOOLBAR STRUMENTI (SEMPRE VISIBILE ANCHE IN ZEN MODE) -->
      <div
        :class="isZenMode ? 'shrink-0 bg-[#090e1c] border-b border-slate-800 px-4 sm:px-6 py-2' : 'bg-[#090e1c] border border-slate-800 rounded-xl p-2 space-y-2'"
      >
        <div class="flex items-center gap-1.5 flex-wrap font-mono">
          <button type="button" @click="insertFormatting('**', '**', 'grassetto')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-100 text-xs font-extrabold cursor-pointer" title="Grassetto **testo**">B</button>
          <button type="button" @click="insertFormatting('*', '*', 'corsivo')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs italic cursor-pointer" title="Corsivo *testo*">I</button>
          <button type="button" @click="insertFormatting('++', '++', 'sottolineato')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-sky-300 text-xs underline cursor-pointer" title="Sottolineato ++testo++">U</button>
          <button type="button" @click="insertFormatting('~~', '~~', 'barrato')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs line-through cursor-pointer" title="Barrato ~~testo~~">S</button>
          <button type="button" @click="insertFormatting('==', '==', 'evidenziato')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 text-xs font-bold cursor-pointer" title="Evidenzia ==testo==">==H==</button>

          <span class="text-slate-700">|</span>

          <button type="button" @click="insertFormatting('# ', '', 'Titolo 1')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer" title="Titolo H1">H1</button>
          <button type="button" @click="insertFormatting('## ', '', 'Titolo 2')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer" title="Titolo H2">H2</button>
          <button type="button" @click="insertFormatting('### ', '', 'Titolo 3')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs font-bold cursor-pointer" title="Titolo H3">H3</button>

          <span class="text-slate-700">|</span>

          <button type="button" @click="insertList('bullet')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-sky-300 text-xs font-bold cursor-pointer" title="Elenco puntato (- )">- Lista</button>
          <button type="button" @click="insertList('number')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs font-bold cursor-pointer" title="Elenco numerato (1. )">1. Num</button>
          <button type="button" @click="insertList('sub')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs cursor-pointer" title="Sotto-elenco indentato (  - )">&crarr; Sub</button>

          <span class="text-slate-700">|</span>

          <button type="button" @click="insertFormatting('`', '`', 'codice')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs cursor-pointer" title="Codice inline">&lt;/&gt;</button>
          <button type="button" @click="insertFormatting('> ', '', 'Citazione')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs cursor-pointer" title="Citazione">Quote</button>
          <button type="button" @click="insertFormatting('\n| Intestazione 1 | Intestazione 2 |\n|---|---|\n| Cella 1 | Cella 2 |\n', '')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs cursor-pointer" title="Tabella Markdown">Table</button>
          <button type="button" @click="insertFormatting('[', '](https://)', 'Testo link')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-sky-300 text-xs cursor-pointer" title="Link">Link</button>
          <button type="button" @click="insertFormatting('![Descrizione Immagine](', ')', 'https://')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs cursor-pointer" title="Inserisci Immagine">Img</button>
          <button type="button" @click="insertFormatting('@[video](', ')', 'https://')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-purple-300 text-xs cursor-pointer" title="Embed Video @[video](url)">Video</button>
          <button type="button" @click="insertFormatting('\n---\n', '')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs cursor-pointer" title="Separatore ---">---</button>

          <select v-model="aiCodeLang" class="bg-[#030712] text-emerald-400 text-[11px] px-2 py-1 rounded outline-none border border-slate-800">
            <option value="typescript">TS</option>
            <option value="javascript">JS</option>
            <option value="sql">SQL</option>
            <option value="rust">Rust</option>
            <option value="go">Go</option>
            <option value="python">Python</option>
            <option value="bash">Bash</option>
            <option value="docker">Docker</option>
            <option value="yaml">YAML</option>
            <option value="json">JSON</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="csharp">C#</option>
            <option value="php">PHP</option>
            <option value="kotlin">Kotlin</option>
            <option value="swift">Swift</option>
            <option value="solidity">Solidity</option>
          </select>

          <button
            type="button"
            @click="insertCodeBlock"
            class="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold border border-emerald-500/35 cursor-pointer"
          >
            + Code
          </button>
        </div>

        <!-- SWITCHER SCRIVI / ANTEPRIMA IN MODALITA STANDARD -->
        <div v-if="!isZenMode" class="flex items-center justify-between pt-1 border-t border-slate-800/70">
          <div class="inline-flex rounded-lg bg-[#030712] p-0.5 border border-slate-800 font-mono text-xs">
            <button
              type="button"
              @click="activeTab = 'write'"
              :class="activeTab === 'write' ? 'bg-emerald-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-slate-200'"
              class="px-3 py-1 rounded-md transition cursor-pointer"
            >
              Scrivi
            </button>
            <button
              type="button"
              @click="activeTab = 'preview'"
              :class="activeTab === 'preview' ? 'bg-cyan-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-slate-200'"
              class="px-3 py-1 rounded-md transition cursor-pointer"
            >
              Anteprima
            </button>
          </div>

          <span class="text-[11px] font-mono text-slate-500">
            {{ content.length }} caratteri
          </span>
        </div>
      </div>

      <!-- AREA SCRITTURA / ANTEPRIMA -->
      <div
        v-show="activeTab === 'write'"
        :class="isZenMode ? 'flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 flex flex-col overflow-hidden' : ''"
      >
        <textarea
          ref="textareaRef"
          v-model="content"
          rows="16"
          placeholder="Inizia a scrivere il tuo articolo qui (supporta ```qualsiasi-linguaggio con PrismJS dinamico, immagini, @[video](url) e tabelle)..."
          @keydown.enter="handleEnter"
          :class="
            isZenMode
              ? 'flex-1 w-full h-full bg-[#030712] border border-slate-800/90 focus:border-cyan-400 rounded-xl p-5 sm:p-6 text-slate-100 font-mono text-sm leading-relaxed outline-none resize-none'
              : 'w-full min-h-[340px] bg-[#030712] border border-slate-800 focus:border-cyan-400 rounded-xl p-4 text-slate-100 font-mono text-xs sm:text-sm leading-relaxed outline-none resize-y'
          "
        ></textarea>
      </div>

      <div
        v-show="activeTab === 'preview'"
        :class="
          isZenMode
            ? 'flex-1 w-full max-w-5xl mx-auto p-6 overflow-y-auto bg-[#050814]'
            : 'min-h-[340px] bg-[#050814] border border-slate-800 rounded-xl p-4 sm:p-5 overflow-x-auto'
        "
      >
        <div class="dkp-preview-content" v-html="parsedContent"></div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dkp-preview-content {
  color: #e2e8f0;
  font-size: 0.95rem;
  line-height: 1.75;
}

:deep(.dkp-h1) { font-size: 1.6rem; font-weight: 800; color: #f8fafc; margin: 1.2rem 0 0.6rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.35rem; }
:deep(.dkp-h2) { font-size: 1.3rem; font-weight: 800; color: #38bdf8; margin: 1.1rem 0 0.5rem; }
:deep(.dkp-h3) { font-size: 1.1rem; font-weight: 700; color: #22d3ee; margin: 0.95rem 0 0.4rem; }
:deep(.dkp-bold) { color: #f8fafc; font-weight: 700; }
:deep(.dkp-italic) { color: #cbd5e1; font-style: italic; }
:deep(.dkp-underline) { text-decoration: underline; text-decoration-color: #38bdf8; text-underline-offset: 3px; }
:deep(.dkp-strike) { color: #64748b; text-decoration: line-through; }
:deep(.dkp-highlight) { background: rgba(16, 185, 129, 0.22); color: #6ee7b7; padding: 0.1rem 0.35rem; border-radius: 4px; }
:deep(.dkp-quote) { border-left: 3px solid #22d3ee; padding: 0.45rem 0.9rem; margin: 0.75rem 0; background: rgba(15, 23, 42, 0.7); color: #cbd5e1; font-style: italic; }
:deep(.dkp-hr) { border: 0; border-top: 1px solid #1e293b; margin: 1.2rem 0; }
:deep(.dkp-img) { max-width: 100%; border-radius: 8px; border: 1px solid #1e293b; margin: 0.85rem 0; }

:deep(ul.dkp-main-list), :deep(ul.dkp-sub-list) { list-style-type: disc; margin: 0.25rem 0; padding-left: 1.5rem; }
:deep(ol.dkp-main-list), :deep(ol.dkp-sub-list) { list-style-type: decimal; margin: 0.25rem 0; padding-left: 1.5rem; }
:deep(.dkp-li-main::marker), :deep(.dkp-li-nested::marker) { color: #22d3ee; font-weight: 700; }
:deep(.dkp-li-main), :deep(.dkp-li-nested) { margin-bottom: 0.35rem; color: #cbd5e1; }

:deep(.dkp-video-wrapper) { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1rem 0; border-radius: 8px; border: 1px solid #1e293b; }
:deep(.dkp-video-wrapper iframe) { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

:deep(.dkp-link) { color: #38bdf8; text-decoration: underline; text-underline-offset: 2px; }

:deep(.dkp-table-wrapper) { overflow-x: auto; margin: 0.85rem 0; border-radius: 6px; border: 1px solid #1e293b; }
:deep(.dkp-table) { width: 100%; border-collapse: collapse; text-align: left; background: #090d16; font-size: 0.84rem; }
:deep(.dkp-table td) { padding: 0.6rem 0.85rem; border-bottom: 1px solid #1e293b; color: #cbd5e1; }

:deep(.dkp-code-wrapper) { margin: 0.9rem 0; border-radius: 2px; border: 1px solid rgba(56, 189, 248, 0.28); background: #050a14; overflow: hidden; }
:deep(.dkp-code-header) { display: flex; align-items: center; justify-content: space-between; padding: 0.35rem 0.8rem; background: #091122; border-bottom: 1px solid rgba(56, 189, 248, 0.2); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.72rem; text-transform: uppercase; color: #38bdf8; font-weight: 700; }
:deep(.dkp-copy-btn) { background: rgba(56, 189, 248, 0.12); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 3px; padding: 2px 8px; font-size: 0.7rem; cursor: pointer; }
:deep(.dkp-code-block) { margin: 0; padding: 0.95rem 1.05rem; overflow-x: auto; background: #050a14 !important; font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace; font-size: 0.84rem; line-height: 1.72; }
:deep(.dkp-code-block code) { background: transparent !important; border: none !important; padding: 0 !important; color: #e2e8f0; }
:deep(.dkp-inline-code) { background: rgba(30, 41, 59, 0.85); color: #38bdf8; padding: 0.12rem 0.38rem; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.86em; }
.preview-empty { color: #64748b; font-style: italic; font-family: ui-monospace, monospace; font-size: 0.85rem; }
</style>
