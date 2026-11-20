<!-- app/components/DKPnodesRichEditor.vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { parseDkpMarkdown, cleanNodeLabel } from '~/composables/useDkpNodes'
import { highlightDomElement, extractLanguagesFromMarkdown, prismRegistryVersion } from '~/composables/useDynamicPrism'

const props = withDefaults(defineProps<{
  isOpen: boolean
  categories: string[]
  groupedNodes: Record<string, any[]>
  initialCategory?: string
  initialNodeId?: number | null
  isAdmin?: boolean
  editPost?: {
    id: number
    title: string
    content: string
    nodeId?: number
    nodeSlug?: string
    vaultHash?: string | null
    isPinned?: boolean
  } | null
}>(), {
  initialCategory: '',
  initialNodeId: null,
  isAdmin: false,
  editPost: null
})

const emit = defineEmits(['close', 'published', 'updated'])

const composerCategory = ref(props.initialCategory || props.categories[0] || '')
const newPostNodeId = ref<number | null>(props.initialNodeId || null)
const newPostTitle = ref('')
const newPostContent = ref('')
const newPostVaultHash = ref('')
const newPostIsPinned = ref(false)

const editorMode = ref<'advanced' | 'simple'>('advanced')
const editorTab = ref<'write' | 'preview'>('write')
const selectedCodeLang = ref<string>('typescript')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const previewBoxRef = ref<HTMLElement | null>(null)
const isSubmitting = ref(false)
const formError = ref('')

// AI Thread Copilot State
const showAiCopilot = ref(false)
const aiPromptHint = ref('')
const isAiLoading = ref(false)
const aiFeedback = ref('')
const prevContentSnapshot = ref<string | null>(null)

const { currentUser } = useAuthCore()

const isEditMode = computed(() => Boolean(props.editPost?.id))

const composerSubNodes = computed(() => {
  if (!composerCategory.value) return []
  return props.groupedNodes[composerCategory.value] || []
})

const selectedNodeInfo = computed(() => {
  for (const list of Object.values(props.groupedNodes || {})) {
    const found = list.find((n: any) => Number(n.id) === Number(newPostNodeId.value))
    if (found) return found
  }
  return null
})

function syncInitialSelection() {
  if (props.editPost?.id) {
    newPostTitle.value = props.editPost.title || ''
    newPostContent.value = props.editPost.content || ''
    newPostVaultHash.value = props.editPost.vaultHash || ''
    newPostIsPinned.value = Boolean(props.editPost.isPinned)

    const targetId = Number(props.editPost.nodeId || 0)
    const targetSlug = String(props.editPost.nodeSlug || '').toLowerCase()

    for (const [cat, list] of Object.entries(props.groupedNodes || {})) {
      const found = list.find(
        (n: any) => (targetId > 0 && Number(n.id) === targetId) || (targetSlug && String(n.slug).toLowerCase() === targetSlug)
      )
      if (found) {
        composerCategory.value = cat
        newPostNodeId.value = Number(found.id)
        return
      }
    }
  } else {
    newPostTitle.value = ''
    newPostContent.value = ''
    newPostVaultHash.value = ''
    newPostIsPinned.value = false
  }

  if (props.initialNodeId) {
    for (const [cat, list] of Object.entries(props.groupedNodes || {})) {
      const found = list.find((n: any) => Number(n.id) === Number(props.initialNodeId))
      if (found) {
        composerCategory.value = cat
        newPostNodeId.value = Number(found.id)
        return
      }
    }
  }

  const targetCat =
    props.initialCategory && props.groupedNodes[props.initialCategory]?.length
      ? props.initialCategory
      : (props.categories[0] || '')

  composerCategory.value = targetCat
  const list = props.groupedNodes[targetCat] || []
  if (list.length > 0 && !list.some((n: any) => Number(n.id) === Number(newPostNodeId.value))) {
    newPostNodeId.value = Number(list[0].id)
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      formError.value = ''
      editorTab.value = 'write'
      syncInitialSelection()
    }
  },
  { immediate: true }
)

watch([() => props.initialCategory, () => props.initialNodeId, () => props.editPost], () => {
  if (props.isOpen) syncInitialSelection()
})

watch(composerCategory, (cat) => {
  const list = props.groupedNodes[cat] || []
  if (list.length > 0 && !list.some((n: any) => Number(n.id) === Number(newPostNodeId.value))) {
    newPostNodeId.value = Number(list[0].id)
  }
})

function applyMarkdown(prefix: string, suffix = '', placeholder = 'testo') {
  const el = textareaRef.value
  if (!el) {
    newPostContent.value += `${prefix}${placeholder}${suffix}`
    return
  }

  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = newPostContent.value.substring(start, end) || placeholder
  const before = newPostContent.value.substring(0, start)
  const after = newPostContent.value.substring(end)

  newPostContent.value = `${before}${prefix}${selected}${suffix}${after}`

  requestAnimationFrame(() => {
    el.focus()
    el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
  })
}

function insertCodeBlock() {
  const nl = '\n'
  const fence = '```'
  applyMarkdown(`${nl}${fence}${selectedCodeLang.value}${nl}`, `${nl}${fence}${nl}`, '// Inserisci qui il tuo codice')
}

function insertHeading(level: '#' | '##' | '###' = '##') {
  applyMarkdown(`\n${level} `, '\n', 'Titolo Sezione')
}

function insertBulletList() {
  applyMarkdown('\n- ', '\n', 'Punto elenco')
}

function insertNumberedList() {
  applyMarkdown('\n1. ', '\n', 'Primo passo numerato')
}

function insertSubList() {
  applyMarkdown('\n  - ', '\n', 'Sotto-elemento indentato')
}

function insertQuote() {
  applyMarkdown('\n> ', '\n', 'Citazione tecnica')
}

function insertHighlight() {
  applyMarkdown('==', '==', 'testo evidenziato')
}

function insertUnderline() {
  applyMarkdown('++', '++', 'testo sottolineato')
}

function insertTable() {
  applyMarkdown(
    '\n| Colonna 1 | Colonna 2 | Colonna 3 |\n| --- | --- | --- |\n| ',
    ' | Valore B | Valore C |\n',
    'Valore A'
  )
}

function insertDivider() {
  applyMarkdown('\n---\n', '', '')
}

function insertLink() {
  applyMarkdown('[', '](https://)', 'Testo collegamento')
}

// ✨ AI THREAD COPILOT
async function runNodeAiAssist(mode: 'generate_draft' | 'expand' | 'security_audit' | 'generate_code' | 'tldr_table') {
  isAiLoading.value = true
  aiFeedback.value = 'AI Copilot in esecuzione...'
  prevContentSnapshot.value = newPostContent.value

  const el = textareaRef.value
  const selectedText = el ? newPostContent.value.substring(el.selectionStart, el.selectionEnd) : ''

  try {
    const res: any = await $fetch('/api/admin/ai-assist', {
      method: 'POST',
      body: {
        mode,
        context: 'nodes',
        title: newPostTitle.value,
        category: composerCategory.value,
        subCategory: selectedNodeInfo.value?.name || '',
        content: newPostContent.value,
        selectedText,
        promptHint: aiPromptHint.value,
        codeLang: selectedCodeLang.value
      }
    })

    if (res?.success && res.result) {
      if (res.result.title && !newPostTitle.value.trim()) {
        newPostTitle.value = res.result.title
      }
      if (mode === 'generate_code' || mode === 'tldr_table' || mode === 'security_audit') {
        const snippet = res.result.insertSnippet || ''
        if (el && snippet) {
          const start = el.selectionStart
          const before = newPostContent.value.substring(0, start)
          const after = newPostContent.value.substring(el.selectionEnd)
          newPostContent.value = `${before}${snippet}${after}`
        } else if (res.result.content) {
          newPostContent.value = res.result.content
        }
      } else if (res.result.content) {
        newPostContent.value = res.result.content
      }
      aiFeedback.value = `Pronto (${res.source || 'AI'})`
    }
  } catch (err: any) {
    aiFeedback.value = `Errore AI: ${err?.message || 'Errore'}`
  } finally {
    isAiLoading.value = false
  }
}

function undoNodeAi() {
  if (prevContentSnapshot.value !== null) {
    newPostContent.value = prevContentSnapshot.value
    prevContentSnapshot.value = null
    aiFeedback.value = 'Ripristinato.'
  }
}

const previewHtml = computed(() => {
  void prismRegistryVersion.value
  if (!newPostContent.value.trim()) {
    return '<span class="text-slate-500 font-mono text-xs">Nessun contenuto in anteprima...</span>'
  }
  extractLanguagesFromMarkdown(newPostContent.value)
  return parseDkpMarkdown(newPostContent.value)
})

watch([editorTab, previewHtml, prismRegistryVersion], async ([tab]) => {
  if (tab === 'preview' && import.meta.client) {
    await nextTick()
    await highlightDomElement(previewBoxRef.value)
  }
})

async function handlePublish() {
  formError.value = ''
  const targetNodeId = Number(newPostNodeId.value)

  if (!targetNodeId || !newPostTitle.value.trim() || !newPostContent.value.trim()) {
    formError.value = 'Seleziona un nodo valido e compila titolo e contenuto della discussione.'
    return
  }

  isSubmitting.value = true
  try {
    if (isEditMode.value && props.editPost?.id) {
      const res: any = await $fetch(`/api/nodes/posts/${props.editPost.id}`, {
        method: 'PATCH',
        body: {
          nodeId: targetNodeId,
          node_id: targetNodeId,
          title: newPostTitle.value.trim(),
          content: newPostContent.value.trim(),
          vaultHash: newPostVaultHash.value.trim() || null,
          is_pinned: newPostIsPinned.value,
          userId: currentUser.value?.id
        }
      })

      if (res?.success !== false) {
        emit('updated', {
          postId: props.editPost.id,
          nodeId: targetNodeId,
          nodeSlug: selectedNodeInfo.value?.slug
        })
        emit('close')
      } else {
        formError.value = res?.statusMessage || 'Impossibile salvare le modifiche del thread.'
      }
      return
    }

    const res: any = await $fetch('/api/nodes/posts', {
      method: 'POST',
      body: {
        nodeId: targetNodeId,
        nodeSlug: selectedNodeInfo.value?.slug,
        title: newPostTitle.value.trim(),
        content: newPostContent.value.trim(),
        vaultHash: newPostVaultHash.value.trim() || null,
        isPinned: newPostIsPinned.value,
        userId: currentUser.value?.id
      }
    })

    if (res?.success) {
      if (import.meta.client) window.dispatchEvent(new CustomEvent('dkp:xp_updated'))
      newPostTitle.value = ''
      newPostContent.value = ''
      newPostVaultHash.value = ''
      newPostIsPinned.value = false
      emit('published', res)
    } else {
      formError.value = res?.statusMessage || 'Impossibile pubblicare il thread.'
    }
  } catch (err: any) {
    formError.value = err?.data?.statusMessage || err?.message || 'Errore durante il salvataggio.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    @click.self="$emit('close')"
  >
    <div class="bg-[#090d16] border border-purple-500/40 rounded-2xl w-full max-w-4xl p-6 shadow-2xl flex flex-col gap-4 font-sans my-auto">
      <!-- HEADER + SWITCHER AVANZATO / SEMPLICE -->
      <div class="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="font-mono text-sm sm:text-base font-black text-white m-0">
            {{ isEditMode ? '✏️ Modifica Thread DKP Nodes' : 'DKP Talks Rich Editor' }}
          </h3>
          <span class="text-xs font-mono text-emerald-400">
            - {{ editorMode === 'advanced' ? 'Rich Editor Avanzato' : 'Editor Semplice Markdown' }}
          </span>
        </div>

        <div class="flex items-center gap-2 font-mono">
          <button
            type="button"
            @click="showAiCopilot = !showAiCopilot"
            class="px-2.5 py-1 rounded-xl font-bold text-[11px] cursor-pointer border transition-all"
            :class="showAiCopilot ? 'bg-purple-500 text-slate-950 border-purple-400' : 'bg-purple-500/15 text-purple-300 border-purple-500/40 hover:bg-purple-500/25'"
          >
            ✨ AI Copilot
          </button>

          <div class="flex bg-[#030712] p-1 rounded-xl border border-slate-800 text-[11px]">
            <button
              type="button"
              @click="editorMode = 'advanced'"
              class="px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all"
              :class="editorMode === 'advanced' ? 'bg-purple-500 text-slate-950' : 'text-slate-400 hover:text-white'"
            >
              ⚡ Avanzato
            </button>
            <button
              type="button"
              @click="editorMode = 'simple'; editorTab = 'write'"
              class="px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all"
              :class="editorMode === 'simple' ? 'bg-sky-400 text-slate-950' : 'text-slate-400 hover:text-white'"
            >
              📝 Semplice
            </button>
          </div>

          <button
            type="button"
            @click="$emit('close')"
            class="text-slate-400 hover:text-rose-400 font-bold text-sm bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- AI THREAD COPILOT DRAWER -->
      <div v-if="showAiCopilot" class="bg-[#050a18] border border-purple-500/40 rounded-xl p-3 space-y-2.5 font-mono text-xs">
        <div class="flex flex-wrap gap-2">
          <input
            v-model="aiPromptHint"
            type="text"
            placeholder="Descrivi il thread o il problema tecnico da analizzare..."
            class="flex-1 min-w-[220px] bg-[#030712] border border-slate-700 text-white px-3 py-2 rounded-lg outline-none"
          />
          <button
            type="button"
            :disabled="isAiLoading"
            @click="runNodeAiAssist('generate_draft')"
            class="px-3 py-2 rounded-lg bg-emerald-500 text-slate-950 font-extrabold border-none cursor-pointer"
          >
            ✨ Genera Thread
          </button>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" :disabled="isAiLoading" @click="runNodeAiAssist('expand')" class="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 cursor-pointer">
            🚀 Espandi &amp; Benchmark
          </button>
          <button type="button" :disabled="isAiLoading" @click="runNodeAiAssist('security_audit')" class="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 cursor-pointer">
            🛡️ Audit Sicurezza
          </button>
          <button type="button" :disabled="isAiLoading" @click="runNodeAiAssist('generate_code')" class="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-emerald-300 cursor-pointer">
            💻 Snippet {{ selectedCodeLang.toUpperCase() }}
          </button>
          <button type="button" :disabled="isAiLoading" @click="runNodeAiAssist('tldr_table')" class="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-amber-300 cursor-pointer">
            📊 Tabella Comparativa
          </button>
          <button v-if="prevContentSnapshot !== null" type="button" @click="undoNodeAi" class="px-2.5 py-1 rounded bg-rose-500/15 border border-rose-500/40 text-rose-300 cursor-pointer">
            ↩️ Annulla
          </button>
          <span v-if="aiFeedback" class="text-[11px] text-emerald-400 ml-auto">{{ aiFeedback }}</span>
        </div>
      </div>

      <!-- SELETTORE CATEGORIA -> NODO / SOTTO-NODO -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#030712] p-3.5 rounded-xl border border-slate-800 font-mono text-xs">
        <div>
          <label class="block text-sky-400 font-bold mb-1 text-[11px]">1. Categoria Principale:</label>
          <select v-model="composerCategory" class="w-full bg-[#030712] border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none font-sans">
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }} ({{ groupedNodes[cat]?.length || 0 }})
            </option>
          </select>
        </div>
        <div>
          <label class="block text-emerald-400 font-bold mb-1 text-[11px]">2. Nodo / Sotto-Nodo di Destinazione:</label>
          <select v-model.number="newPostNodeId" class="w-full bg-[#030712] border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none font-sans">
            <option v-for="node in composerSubNodes" :key="node.id" :value="Number(node.id)">
              {{ node.depth > 0 ? `${'—'.repeat(node.depth)}↳ ` : '' }}{{ node.icon || '#' }} n/{{ cleanNodeLabel(node.name) }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="selectedNodeInfo" class="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-xl font-mono text-[11px] text-emerald-300">
        <span>
          Destinazione attiva: <strong>{{ selectedNodeInfo.icon || '#' }} n/{{ cleanNodeLabel(selectedNodeInfo.name) }}</strong>
          <span v-if="selectedNodeInfo.parentName" class="text-slate-400"> (sub-nodo di {{ selectedNodeInfo.parentName }})</span>
        </span>
        <span class="text-slate-400">slug: {{ selectedNodeInfo.slug }}</span>
      </div>

      <div v-if="isAdmin" class="flex items-center gap-2 bg-[#030712] border border-amber-500/30 p-3 rounded-xl font-mono text-xs">
        <input id="modal-pin-check" v-model="newPostIsPinned" type="checkbox" class="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer" />
        <label for="modal-pin-check" class="text-amber-400 font-bold cursor-pointer">📌 Fissa questo thread in cima al feed (Pinned)</label>
      </div>

      <div class="font-mono text-xs">
        <label class="block text-slate-400 mb-1">Titolo Discussione:</label>
        <input
          v-model="newPostTitle"
          type="text"
          placeholder="Es. [Architecture] Benchmark Pure SQL vs ORM..."
          class="w-full bg-[#030712] border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-purple-400 outline-none font-sans font-bold text-sm"
        />
      </div>

      <!-- AREA EDITOR UNIFICATA -->
      <div class="border border-slate-800 rounded-xl overflow-hidden bg-[#030712]">
        <div
          v-if="editorMode === 'advanced'"
          class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#0b101d] border-b border-slate-800 font-mono"
        >
          <div class="flex flex-wrap items-center gap-1.5">
            <button type="button" @click="applyMarkdown('**', '**', 'grassetto')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer" title="Grassetto">B</button>
            <button type="button" @click="applyMarkdown('*', '*', 'corsivo')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs italic cursor-pointer" title="Corsivo">I</button>
            <button type="button" @click="insertUnderline" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-sky-300 text-xs underline cursor-pointer" title="Sottolineato ++testo++">U</button>
            <button type="button" @click="applyMarkdown('~~', '~~', 'barrato')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs line-through cursor-pointer" title="Barrato">S</button>
            <button type="button" @click="insertHighlight" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 text-xs font-bold cursor-pointer" title="Evidenzia ==testo==">==H==</button>

            <span class="text-slate-700">|</span>

            <button type="button" @click="insertHeading('#')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer" title="Titolo H1">H1</button>
            <button type="button" @click="insertHeading('##')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer" title="Titolo H2">H2</button>
            <button type="button" @click="insertHeading('###')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs font-bold cursor-pointer" title="Titolo H3">H3</button>

            <span class="text-slate-700">|</span>

            <button type="button" @click="insertBulletList" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-sky-300 text-xs font-bold cursor-pointer" title="Elenco puntato (- )">- Lista</button>
            <button type="button" @click="insertNumberedList" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs font-bold cursor-pointer" title="Elenco numerato (1. )">1. Num</button>
            <button type="button" @click="insertSubList" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs cursor-pointer" title="Sotto-elenco indentato (  - )">↳ Sub</button>

            <span class="text-slate-700">|</span>

            <button type="button" @click="applyMarkdown('`', '`', 'codice')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs cursor-pointer" title="Codice inline">&lt;/&gt;</button>
            <button type="button" @click="insertQuote" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs cursor-pointer" title="Citazione">Quote</button>
            <button type="button" @click="insertTable" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs cursor-pointer" title="Tabella Markdown">Table</button>
            <button type="button" @click="insertLink" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-sky-300 text-xs cursor-pointer" title="Link">Link</button>
            <button type="button" @click="insertDivider" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs cursor-pointer" title="Separatore ---">---</button>

            <select v-model="selectedCodeLang" class="bg-[#030712] text-emerald-400 text-[11px] px-2 py-1 rounded outline-none border border-slate-800">
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
            <button type="button" @click="insertCodeBlock" class="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold border border-emerald-500/35 cursor-pointer">+ Code</button>
          </div>

          <div class="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button type="button" @click="editorTab = 'write'" class="px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer" :class="editorTab === 'write' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'">Scrivi</button>
            <button type="button" @click="editorTab = 'preview'" class="px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer" :class="editorTab === 'preview' ? 'bg-sky-400 text-slate-950' : 'text-slate-400'">Anteprima</button>
          </div>
        </div>

        <div
          v-else
          class="flex items-center justify-between px-3 py-2 bg-[#0b101d] border-b border-slate-800 font-mono text-[11px] text-slate-400"
        >
          <span>Contenuto (Markdown diretto — supporta ##, -, 1., ==highlight==, ```qualsiasi-linguaggio```)</span>
          <div class="flex gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button type="button" @click="editorTab = 'write'" class="px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer" :class="editorTab === 'write' ? 'bg-sky-400 text-slate-950' : 'text-slate-400'">Markdown</button>
            <button type="button" @click="editorTab = 'preview'" class="px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer" :class="editorTab === 'preview' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'">Preview</button>
          </div>
        </div>

        <textarea
          v-if="editorTab === 'write'"
          ref="textareaRef"
          v-model="newPostContent"
          rows="9"
          placeholder="Scrivi il corpo della discussione in Markdown..."
          class="w-full bg-transparent p-4 text-slate-100 outline-none font-mono text-xs sm:text-sm leading-relaxed resize-y"
        ></textarea>

        <div
          v-else
          ref="previewBoxRef"
          class="p-5 min-h-[220px] max-h-[360px] overflow-y-auto text-sm text-slate-200 leading-relaxed dkp-preview-content"
          v-html="previewHtml"
        ></div>
      </div>

      <div class="font-mono text-xs">
        <label class="block text-slate-400 mb-1">Vault SHA-256 Hash (Opzionale — auto-generato On-Chain se vuoto):</label>
        <input v-model="newPostVaultHash" type="text" placeholder="Generazione automatica SHA-256 sul Proof-of-Code Vault..." class="w-full bg-[#030712] border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none" />
      </div>

      <div v-if="formError" role="alert" class="bg-rose-500/15 border border-rose-500/40 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold">{{ formError }}</div>

      <div class="flex justify-between items-center pt-3 border-t border-slate-800 flex-wrap gap-3">
        <span class="text-[11px] font-mono text-emerald-400">
          {{ isEditMode ? '⛓️ Aggiornamento thread e sincronizzazione Vault' : '⛓️ Pubblicando questo post riceverai +25 XP e notarizzazione SHA-256!' }}
        </span>
        <div class="flex gap-2 font-mono">
          <button type="button" @click="$emit('close')" class="px-4 py-2 bg-slate-900 text-slate-300 text-xs rounded-xl cursor-pointer">Annulla</button>
          <button type="button" @click="handlePublish" :disabled="isSubmitting" class="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50">
            {{ isSubmitting ? 'Salvataggio...' : (isEditMode ? 'Salva Modifiche' : 'Pubblica Thread') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.dkp-code-wrapper) {
  background: #0d1117;
  border: 1px solid #1e293b;
  border-radius: 8px;
  overflow: hidden;
  margin: 0.9rem 0;
}
:deep(.dkp-code-header) {
  background: #161b22;
  padding: 0.4rem 0.8rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #1e293b;
  font-size: 0.75rem;
  font-weight: bold;
  color: #8b949e;
  text-transform: uppercase;
}
:deep(.dkp-code-block) { padding: 0.85rem; margin: 0; overflow-x: auto; font-size: 0.8rem; }
:deep(.dkp-highlight) { background-color: rgba(0, 220, 130, 0.25); color: #f8fafc; padding: 0.1rem 0.3rem; border-radius: 4px; }
:deep(.dkp-underline) { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #38bdf8; text-decoration-thickness: 2px; }
:deep(.dkp-inline-code) { background-color: rgba(30, 41, 59, 0.8); color: #38bdf8; padding: 0.15rem 0.35rem; border-radius: 0.3rem; font-size: 0.8rem; }
:deep(.dkp-h1) { font-size: 1.4rem; font-weight: 900; color: #ffffff; margin: 0.8rem 0 0.4rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.25rem; }
:deep(.dkp-h2) { font-size: 1.15rem; font-weight: 800; color: #ffffff; margin: 0.7rem 0 0.35rem; }
:deep(.dkp-h3) { font-size: 1rem; font-weight: 700; color: #00dc82; margin: 0.6rem 0 0.3rem; }
:deep(.dkp-quote) { border-left: 3px solid #00dc82; padding-left: 0.8rem; color: #94a3b8; font-style: italic; margin: 0.6rem 0; background: rgba(0, 220, 130, 0.05); }
:deep(.dkp-link) { color: #38bdf8; text-decoration: underline; }
:deep(.dkp-hr) { border: none; height: 1px; background-color: #334155; margin: 1rem 0; }
:deep(.dkp-table) { width: 100%; border-collapse: collapse; margin: 0.8rem 0; border: 1px solid #1e293b; font-size: 0.8rem; }
:deep(.dkp-table td) { padding: 0.45rem 0.6rem; border: 1px solid #1e293b; }
:deep(.dkp-preview-content ul), :deep(.dkp-preview-content ol) { padding-left: 1.5rem; margin: 0.6rem 0; color: #cbd5e1; }
:deep(.dkp-preview-content ul) { list-style-type: none; }
:deep(.dkp-preview-content ol) { list-style-type: decimal; }
:deep(.dkp-li-main) { margin-bottom: 0.35rem; position: relative; }
:deep(ul > .dkp-li-main::before) { content: "○"; color: #38bdf8; position: absolute; left: -1.2rem; top: 0; font-weight: bold; }
:deep(.dkp-li-nested) { margin-left: 1.5rem; margin-bottom: 0.25rem; color: #94a3b8; position: relative; }
:deep(ul > .dkp-li-nested:not(.dkp-li-num)::before) { content: "▪"; color: #00dc82; position: absolute; left: -1.2rem; top: 0; }
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
</style>