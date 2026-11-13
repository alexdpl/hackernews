<!-- app/components/DKPnodesRichEditor.vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps<{
  isOpen: boolean
  categories: string[]
  groupedNodes: Record<string, any[]>
  initialCategory?: string
  initialNodeId?: number | null
  isAdmin?: boolean
}>()

const emit = defineEmits(['close', 'published'])

const composerCategory = ref(props.initialCategory || props.categories[0] || '')
const newPostNodeId = ref<number | null>(props.initialNodeId || null)
const newPostTitle = ref('')
const newPostContent = ref('')
const newPostVaultHash = ref('')
const newPostIsPinned = ref(false)
const editorTab = ref<'write' | 'preview'>('write')
const selectedCodeLang = ref<'typescript' | 'sql' | 'rust' | 'bash' | 'python'>('typescript')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isSubmitting = ref(false)
const formError = ref('')

const { currentUser } = useAuthCore()
const { $prism } = useNuxtApp()

const composerSubNodes = computed(() => {
  if (!composerCategory.value) return []
  return props.groupedNodes[composerCategory.value] || []
})

watch(() => props.initialCategory, (val) => {
  if (val) composerCategory.value = val
})

watch(() => props.initialNodeId, (val) => {
  if (val) newPostNodeId.value = val
})

watch(composerCategory, (cat) => {
  const list = props.groupedNodes[cat] || []
  if (list.length > 0 && !list.some((n: any) => n.id === newPostNodeId.value)) {
    newPostNodeId.value = list[0].id
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
  const nl = String.fromCharCode(10)
  const fence = '```'
  applyMarkdown(`${nl}${fence}${selectedCodeLang.value}${nl}`, `${nl}${fence}${nl}`, '// Inserisci qui il tuo codice')
}

function insertHeading() {
  const nl = String.fromCharCode(10)
  applyMarkdown(`${nl}## `, nl, 'Titolo Sezione')
}

function insertQuote() {
  const nl = String.fromCharCode(10)
  applyMarkdown(`${nl}> `, nl, 'Citazione tecnica')
}

function insertHighlight() {
  applyMarkdown('==', '==', 'testo evidenziato')
}

const previewHtml = computed(() => {
  const val = newPostContent.value
  if (!val) return '<span class="text-slate-500 font-mono text-xs">Nessun contenuto in anteprima...</span>'

  let content = val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  content = content.replace(/```([a-zA-Z0-9+#-]*)\r?\n([\s\S]*?)```/g, (_match, lang, code) => {
    const cleanLang = lang ? lang.trim() : 'text'
    return `<div class="bg-[#020420] border border-slate-800 rounded-xl my-3 overflow-hidden font-mono text-xs"><div class="bg-[#090d16] px-3 py-1.5 text-slate-400 border-b border-slate-800 flex justify-between"><span>${cleanLang}</span></div><pre class="p-3 overflow-x-auto text-emerald-300"><code>${code}</code></pre></div>`
  })

  return content
    .replace(/==(.*?)==/g, '<mark class="bg-emerald-500/25 text-emerald-300 px-1 rounded">$1</mark>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`\n]+)`/g, '<code class="bg-slate-800 text-sky-400 px-1.5 py-0.5 rounded text-xs">$1</code>')
    .replace(/^## (.*?)$/gm, '<h2 class="text-base font-bold text-emerald-400 mt-3 mb-1">$1</h2>')
    .replace(/^&gt; (.*?)$/gm, '<blockquote class="border-l-4 border-purple-400 pl-3 my-2 text-slate-300 italic">$1</blockquote>')
    .replace(/\n/g, '<br />')
})

watch(editorTab, async (tab) => {
  if (tab === 'preview' && import.meta.client && $prism) {
    await nextTick()
    try { ($prism as any).highlightAll() } catch {}
  }
})

async function handlePublish() {
  formError.value = ''
  if (!newPostNodeId.value || !newPostTitle.value.trim() || !newPostContent.value.trim()) {
    formError.value = 'Seleziona un nodo e compila titolo e contenuto della discussione.'
    return
  }

  isSubmitting.value = true
  try {
    const res: any = await $fetch('/api/nodes/posts', {
      method: 'POST',
      body: {
        nodeId: newPostNodeId.value,
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
      emit('published')
    } else {
      formError.value = res?.statusMessage || 'Impossibile pubblicare il thread.'
    }
  } catch (err: any) {
    formError.value = err?.data?.statusMessage || err?.message || 'Errore durante la pubblicazione.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" @click.self="$emit('close')">
    <div class="bg-[#090d16] border border-purple-500/40 rounded-2xl w-full max-w-4xl p-6 shadow-2xl flex flex-col gap-4 font-sans my-auto">
      <div class="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 class="font-mono text-sm sm:text-base font-black text-white flex items-center gap-2 m-0">
          DKP Talks Rich Editor <span class="text-xs text-emerald-400 font-normal">- Componentized Engine</span>
        </h3>
        <button type="button" @click="$emit('close')" class="text-slate-400 hover:text-rose-400 font-bold text-sm bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg cursor-pointer">X</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#020420] p-3.5 rounded-xl border border-slate-800 font-mono text-xs">
        <div>
          <label class="block text-sky-400 font-bold mb-1 text-[11px]">1. Categoria Principale:</label>
          <select v-model="composerCategory" class="w-full bg-[#090d16] border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none font-sans">
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
        <div>
          <label class="block text-emerald-400 font-bold mb-1 text-[11px]">2. Sotto-Nodo di Destinazione:</label>
          <select v-model="newPostNodeId" class="w-full bg-[#090d16] border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none font-sans">
            <option v-for="node in composerSubNodes" :key="node.id" :value="node.id">{{ node.icon || '#' }} n/{{ node.name }}</option>
          </select>
        </div>
      </div>

      <div v-if="isAdmin" class="flex items-center gap-2 bg-[#020420] border border-amber-500/30 p-3 rounded-xl font-mono text-xs">
        <input id="modal-pin-check" v-model="newPostIsPinned" type="checkbox" class="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer" />
        <label for="modal-pin-check" class="text-amber-400 font-bold cursor-pointer">📌 Fissa questo thread in cima al feed (Pinned)</label>
      </div>

      <div class="font-mono text-xs">
        <label class="block text-slate-400 mb-1">Titolo Thread:</label>
        <input v-model="newPostTitle" type="text" placeholder="Es. [Architecture] Benchmark Pure SQL vs ORM..." class="w-full bg-[#020420] border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-purple-400 outline-none font-sans font-bold text-sm" />
      </div>

      <div class="border border-slate-800 rounded-xl overflow-hidden bg-[#020420]">
        <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#0b101d] border-b border-slate-800 font-mono">
          <div class="flex flex-wrap items-center gap-1.5">
            <button type="button" @click="applyMarkdown('**', '**', 'grassetto')" class="px-2.5 py-1 rounded bg-slate-900 text-slate-200 text-xs font-bold">B</button>
            <button type="button" @click="applyMarkdown('*', '*', 'corsivo')" class="px-2.5 py-1 rounded bg-slate-900 text-slate-200 text-xs italic">I</button>
            <button type="button" @click="insertHeading" class="px-2.5 py-1 rounded bg-slate-900 text-slate-200 text-xs font-bold">H2</button>
            <button type="button" @click="applyMarkdown('`', '`', 'codice')" class="px-2.5 py-1 rounded bg-slate-900 text-sky-400 text-xs">&lt;/&gt;</button>
            <button type="button" @click="insertHighlight" class="px-2.5 py-1 rounded bg-slate-900 text-emerald-400 text-xs font-bold" title="Evidenzia">==H==</button>
            <button type="button" @click="insertQuote" class="px-2.5 py-1 rounded bg-slate-900 text-slate-200 text-xs">Quote</button>
            <select v-model="selectedCodeLang" class="bg-slate-950 text-emerald-400 text-[11px] px-2 py-1 rounded outline-none border border-slate-800">
              <option value="typescript">TS</option><option value="sql">SQL</option><option value="rust">Rust</option><option value="bash">Bash</option><option value="python">Python</option>
            </select>
            <button type="button" @click="insertCodeBlock" class="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/35">+ Code</button>
          </div>
          <div class="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button type="button" @click="editorTab = 'write'" class="px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer" :class="editorTab === 'write' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'">Scrivi</button>
            <button type="button" @click="editorTab = 'preview'" class="px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer" :class="editorTab === 'preview' ? 'bg-sky-400 text-slate-950' : 'text-slate-400'">Anteprima</button>
          </div>
        </div>

        <textarea v-if="editorTab === 'write'" ref="textareaRef" v-model="newPostContent" rows="8" placeholder="Scrivi il corpo della discussione..." class="w-full bg-transparent p-4 text-slate-100 outline-none font-mono text-xs sm:text-sm leading-relaxed resize-y"></textarea>
        <div v-else class="p-4 min-h-[200px] max-h-[300px] overflow-y-auto text-sm text-slate-200 leading-relaxed" v-html="previewHtml"></div>
      </div>

      <div class="font-mono text-xs">
        <label class="block text-slate-400 mb-1">Vault SHA-256 Hash (Opzionale):</label>
        <input v-model="newPostVaultHash" type="text" placeholder="Incolla l'hash del DKP Vault..." class="w-full bg-[#020420] border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none" />
      </div>

      <div v-if="formError" role="alert" class="bg-rose-500/15 border border-rose-500/40 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold">{{ formError }}</div>

      <div class="flex justify-between items-center pt-3 border-t border-slate-800 flex-wrap gap-3">
        <span class="text-[11px] font-mono text-emerald-400">Inviando questo post riceverai +25 XP!</span>
        <div class="flex gap-2 font-mono">
          <button type="button" @click="$emit('close')" class="px-4 py-2 bg-slate-900 text-slate-300 text-xs rounded-xl cursor-pointer">Annulla</button>
          <button type="button" @click="handlePublish" :disabled="isSubmitting" class="px-5 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50">{{ isSubmitting ? 'Invio...' : 'Pubblica Thread' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>