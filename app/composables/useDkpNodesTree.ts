// app/composables/useDkpNodesTree.ts
import { computed, type Ref } from 'vue'

export interface DkpSubNode {
  id: number
  name: string
  slug: string
  icon: string
  color: string
  category?: string
  parentId?: number | null
  subscribersCount: number
  postsCount: number
  description?: string
}

export interface DkpCategoryGroup {
  key: string
  label: string
  icon: string
  accent: string
  description: string
  nodes: DkpSubNode[]
  totalPosts: number
  totalSubscribers: number
}

const MACRO_CATEGORIES: Omit<DkpCategoryGroup, 'nodes' | 'totalPosts' | 'totalSubscribers'>[] = [
  {
    key: 'dkp-ecosystem',
    label: 'DKP Ecosystem & Meta',
    icon: '⚡',
    accent: 'emerald',
    description: 'Annunci ufficiali, Kernel v2.6, CLI, API Gateway e feedback community'
  },
  {
    key: 'ai-ml',
    label: 'AI, LLM & Neural Agents',
    icon: '🧠',
    accent: 'purple',
    description: 'Modelli linguistici, RAG, agenti autonomi, inference e computer vision'
  },
  {
    key: 'systems-kernel',
    label: 'Systems, Linux & Low-Level',
    icon: '🐧',
    accent: 'sky',
    description: 'Kernel Linux, Rust, C/C++, Zig, networking, compilatori e hardware'
  },
  {
    key: 'web-fullstack',
    label: 'Web, Frontend & Full-Stack',
    icon: '🌐',
    accent: 'cyan',
    description: 'Nuxt, Vue, TypeScript, React, Edge rendering, UI/UX e performance'
  },
  {
    key: 'cloud-devops-sec',
    label: 'Cloud, DevOps & Cybersecurity',
    icon: '🛡️',
    accent: 'rose',
    description: 'Cloud Run, Kubernetes, Docker, Cloudflare WAF, Zero-Trust e pentesting'
  },
  {
    key: 'data-databases',
    label: 'Data, Pure SQL & Distributed',
    icon: '🗄️',
    accent: 'amber',
    description: 'PostgreSQL, NeonDB, streaming eventi, big data e motori analitici'
  },
  {
    key: 'web3-crypto-oss',
    label: 'Open Source, Crypto & Career',
    icon: '🚀',
    accent: 'teal',
    description: 'Crittografia, protocolli decentralizzati, bounties, startup e lavoro tech'
  }
]

function classifyNode(node: DkpSubNode): string {
  const rawCat = (node.category || '').toLowerCase()
  const haystack = `${rawCat}${node.slug} ${node.name}`.toLowerCase()  if (/(dkp\vert{}devkernel\vert{}pulse\vert{}meta\vert{}announc\vert{}bount\vert{}feedback\vert{}talk)/.test(haystack)) return 'dkp-ecosystem' if (/(ai\vert{}llm\vert{}gpt\vert{}claude\vert{}neural\vert{}ml\vert{}machine\vert{}deep\vert{}agent\vert{}rag\vert{}pytorch\vert{}tensor\vert{}vision\vert{}nlp)/.test(haystack)) return 'ai-ml' if (/(linux\vert{}kernel\vert{}rust\vert{}cpp\vert{}c\+\+\vert{}zig\vert{}asm\vert{}os\vert{}embedded\vert{}wasm\vert{}compiler\vert{}hardware\vert{}riscv\vert{}arm)/.test(haystack)) return 'systems-kernel' if (/(web\vert{}nuxt\vert{}vue\vert{}react\vert{}ts\vert{}typescript\vert{}js\vert{}javascript\vert{}css\vert{}tailwind\vert{}html\vert{}node\vert{}deno\vert{}bun\vert{}frontend\vert{}backend\vert{}api)/.test(haystack)) return 'web-fullstack' if (/(cloud\vert{}gcp\vert{}aws\vert{}azure\vert{}docker\vert{}k8s\vert{}kubernetes\vert{}devops\vert{}sec\vert{}cyber\vert{}waf\vert{}sentinel\vert{}linux-sec\vert{}net\vert{}infra\vert{}ci\vert{}cd)/.test(haystack)) return 'cloud-devops-sec' if (/(sql\vert{}postgres\vert{}neon\vert{}db\vert{}data\vert{}redis\vert{}kafka\vert{}duckdb\vert{}clickhouse\vert{}analytics\vert{}etl\vert{}storage)/.test(haystack)) return 'data-databases'  return 'web3-crypto-oss' }  export function useDkpNodesTree(rawNodes: Ref<DkpSubNode[]>, searchFilter?: Ref<string>) { const categoryTree = computed<DkpCategoryGroup[]>(() => { const query = (searchFilter?.value \vert{}\vert{} '').trim().toLowerCase()  const buckets = new Map<string, DkpSubNode[]>() for (const cat of MACRO_CATEGORIES) { buckets.set(cat.key, []) }  for (const node of rawNodes.value) { if (query) { const match = node.name.toLowerCase().includes(query) \vert{}\vert{} node.slug.toLowerCase().includes(query) \vert{}\vert{} (node.description \vert{}\vert{} '').toLowerCase().includes(query) if (!match) continue }  const targetKey = classifyNode(node) buckets.get(targetKey)?.push(node) }  return MACRO_CATEGORIES.map((cat) => { const nodes = (buckets.get(cat.key) \vert{}\vert{} []).sort((a, b) => (b.postsCount \vert{}\vert{} 0) - (a.postsCount \vert{}\vert{} 0)) return { ...cat, nodes, totalPosts: nodes.reduce((acc, n) => acc + (n.postsCount \vert{}\vert{} 0), 0), totalSubscribers: nodes.reduce((acc, n) => acc + (n.subscribersCount \vert{}\vert{} 0), 0) } }).filter(group => !query \vert{}\vert{} group.nodes.length > 0) })  return { macroCategories: MACRO_CATEGORIES, categoryTree } } ```  ---  ### 3. Clone del Blog Editor per DKP Talks (`app/components/nodes/DkpTalksComposer.vue`)  Editor completo ispirato a quello del Blog DKP: **selettore guidato a 2 livelli (1. Categoria Principale → 2. Sotto-Nodo)**, toolbar di formattazione rapida (Grassetto, Corsivo, Titolo H2, Inline Code, Blocco Codice con linguaggio, Citazione, Link), modalità **Scrivi / Anteprima Live** e pubblicazione diretta su `/api/nodes/posts`.  ```vue <!-- app/components/nodes/DkpTalksComposer.vue --> <script setup lang="ts"> import { ref, computed, watch } from 'vue' import { useDkpNodesTree, type DkpSubNode } from '~/composables/useDkpNodesTree'  const props = defineProps<{ isOpen: boolean nodes: DkpSubNode[] defaultNodeSlug?: string }>()  const emit = defineEmits<{ (e: 'close'): void (e: 'published', post: any): void }>()  const nodesRef = computed(() => props.nodes \vert{}\vert{} []) const { categoryTree } = useDkpNodesTree(nodesRef)  const selectedCategoryKey = ref<string>('dkp-ecosystem') const selectedNodeId = ref<number \vert{} null>(null) const title = ref<string>('') const content = ref<string>('') const tagsInput = ref<string>('') const enableProofOfCode = ref<boolean>(false) const editorMode = ref<'write' \vert{} 'preview'>('write') const codeLang = ref<string>('typescript')  const isSubmitting = ref<boolean>(false) const errorMsg = ref<string>('') const textareaRef = ref<HTMLTextAreaElement \vert{} null>(null)  const availableSubNodes = computed(() => { const group = categoryTree.value.find(c => c.key === selectedCategoryKey.value) return group ? group.nodes : props.nodes })  watch( () => [props.isOpen, props.defaultNodeSlug, props.nodes], () => { if (!props.isOpen) return errorMsg.value = ''  if (props.defaultNodeSlug) { const found = props.nodes.find(n => n.slug === props.defaultNodeSlug) if (found) { const parentGroup = categoryTree.value.find(g => g.nodes.some(n => n.id === found.id)) if (parentGroup) selectedCategoryKey.value = parentGroup.key selectedNodeId.value = found.id return } }  if (!selectedNodeId.value && availableSubNodes.value.length > 0) { selectedNodeId.value = availableSubNodes.value[0].id } }, { immediate: true } )  watch(selectedCategoryKey, () => { const first = availableSubNodes.value[0] selectedNodeId.value = first ? first.id : null })  function insertFormatting(prefix: string, suffix = '', placeholder = 'testo') { const el = textareaRef.value if (!el) { content.value += `${prefix}${placeholder}${suffix}`
    return
  }

  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = content.value.substring(start, end) || placeholder
  const before = content.value.substring(0, start)
  const after = content.value.substring(end)

  content.value = `${before}${prefix}${selected}${suffix}${after}`

  requestAnimationFrame(() => {
    el.focus()
    el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
  })
}

function insertCodeBlock() {
  insertFormatting(`\n\`\`\`${codeLang.value}\n`, '\n```\n', '// Inserisci qui il tuo codice')
}

const renderedPreview = computed(() => {
  return content.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-[#020420] border border-slate-800 rounded-xl p-4 my-3 overflow-x-auto text-emerald-300 font-mono text-xs"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded font-mono text-xs">$1</code>')
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-white mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-black text-emerald-400 mt-5 mb-2">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-slate-300 italic">$1</em>')
    .replace(/^&gt; (.*$)/gim, '<blockquote class="border-l-4 border-sky-400 pl-4 py-1 my-2 text-slate-300 italic bg-sky-500/5 rounded-r-lg">$1</blockquote>')
    .replace(/\n/g, '<br />')
})

async function submitThread() {
  if (!selectedNodeId.value) {
    errorMsg.value = 'Seleziona una categoria principale e un sotto-nodo di destinazione.'
    return
  }
  if (title.value.trim().length < 5) {
    errorMsg.value = 'Il titolo della discussione deve contenere almeno 5 caratteri.'
    return
  }
  if (content.value.trim().length < 15) {
    errorMsg.value = 'Scrivi almeno 15 caratteri nel corpo della discussione.'
    return
  }

  errorMsg.value = ''
  isSubmitting.value = true

  try {
    const res: any = await $fetch('/api/nodes/posts', {
      method: 'POST',
      body: {
        nodeId: selectedNodeId.value,
        title: title.value.trim(),
        content: content.value.trim(),
        tags: tagsInput.value.split(',').map(t => t.trim()).filter(Boolean),
        proofOfCode: enableProofOfCode.value
      }
    })

    if (res?.success) {
      const created = res.data
      title.value = ''
      content.value = ''
      tagsInput.value = ''
      emit('published', created)
      emit('close')
    } else {
      errorMsg.value = res?.statusMessage || 'Errore durante la pubblicazione del thread.'
    }
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || err?.message || 'Errore di rete durante la pubblicazione.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-[#020420]/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      @click.self="emit('close')"
    >
      <div class="bg-[#090d16] border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto flex flex-col">
        
        <!-- HEADER COMPOSER (STILE BLOG DKP) -->
        <div class="px-5 py-4 bg-[#020420] border-b border-slate-800 flex justify-between items-center gap-3">
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]"></span>
            <h2 class="text-base sm:text-lg font-black text-white m-0 font-mono">
              ✍️ DKP Talks Rich Editor <span class="text-xs text-emerald-400 font-normal">· Blog-Grade Engine</span>
            </h2>
          </div>
          <button
            type="button"
            @click="emit('close')"
            aria-label="Chiudi editor"
            class="text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono cursor-pointer"
          >
            ✕ ESC
          </button>
        </div>

        <form @submit.prevent="submitThread" class="p-5 sm:p-6 flex flex-col gap-4">
          
          <!-- STEP 1: SELETTORE GERARCHICO CATEGORIA -> SOTTO-NODO -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#020420] p-3.5 rounded-xl border border-slate-800/90">
            <div class="flex flex-col gap-1.5">
              <label for="composer-macro-cat" class="text-[11px] font-mono font-bold uppercase text-sky-400">
                1. Categoria Principale (7 Macro-Aree)
              </label>
              <select
                id="composer-macro-cat"
                v-model="selectedCategoryKey"
                class="bg-[#090d16] border border-slate-700 focus:border-sky-400 text-white px-3 py-2.5 rounded-xl text-xs font-mono outline-none"
              >
                <option v-for="cat in categoryTree" :key="cat.key" :value="cat.key">
                  {{ cat.icon }} {{ cat.label }} ({{ cat.nodes.length }} nodi)
                </option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="composer-sub-node" class="text-[11px] font-mono font-bold uppercase text-emerald-400">
                2. Sotto-Nodo di Destinazione
              </label>
              <select
                id="composer-sub-node"
                v-model="selectedNodeId"
                class="bg-[#090d16] border border-slate-700 focus:border-emerald-400 text-white px-3 py-2.5 rounded-xl text-xs font-mono outline-none"
              >
                <option v-for="sub in availableSubNodes" :key="sub.id" :value="sub.id">
                  {{ sub.icon || '💬' }} n/{{ sub.name }} ({{ sub.postsCount || 0 }} thread)
                </option>
              </select>
            </div>
          </div>

          <!-- STEP 2: TITOLO THREAD -->
          <div class="flex flex-col gap-1.5">
            <label for="composer-title" class="text-xs font-mono font-bold text-slate-300">
              Titolo della Discussione
            </label>
            <input
              id="composer-title"
              v-model="title"
              type="text"
              required
              placeholder="Es. [Architecture] Benchmark Pure SQL vs ORM su Cloud Run..."
              class="bg-[#020420] border border-slate-800 focus:border-emerald-400 text-white px-4 py-3 rounded-xl text-sm font-bold outline-none transition-colors"
            />
          </div>

          <!-- STEP 3: TOOLBAR BLOG-GRADE + EDITOR / PREVIEW -->
          <div class="flex flex-col border border-slate-800 rounded-xl overflow-hidden bg-[#020420]">
            <!-- Toolbar -->
            <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#0b101d] border-b border-slate-800 font-mono">
              <div class="flex flex-wrap items-center gap-1.5">
                <button type="button" @click="insertFormatting('**', '**', 'grassetto')" class="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-black border border-slate-700 cursor-pointer" title="Grassetto">
                  B
                </button>
                <button type="button" @click="insertFormatting('*', '*', 'corsivo')" class="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs italic border border-slate-700 cursor-pointer" title="Corsivo">
                  I
                </button>
                <button type="button" @click="insertFormatting('\n## ', '\n', 'Sezione')" class="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer" title="Titolo H2">
                  H2
                </button>
                <button type="button" @click="insertFormatting('`', '`', 'codice')" class="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs border border-slate-700 cursor-pointer" title="Inline Code">
                  &lt;/&gt;
                </button>
                <button type="button" @click="insertFormatting('\n> ', '\n', 'Citazione tecnica')" class="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs border border-slate-700 cursor-pointer" title="Citazione">
                  ❝ Quote
                </button>
                <button type="button" @click="insertFormatting('[', '](https://)', 'Link')" class="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs border border-slate-700 cursor-pointer" title="Link">
                  🔗 Link
                </button>

                <div class="flex items-center gap-1 ml-1 pl-2 border-l border-slate-800">
                  <select
                    v-model="codeLang"
                    aria-label="Linguaggio blocco codice"
                    class="bg-slate-900 border border-slate-700 text-emerald-400 text-[11px] px-2 py-1 rounded outline-none"
                  >
                    <option value="typescript">TS</option>
                    <option value="sql">SQL</option>
                    <option value="rust">Rust</option>
                    <option value="bash">Bash</option>
                    <option value="python">Python</option>
                  </select>
                  <button
                    type="button"
                    @click="insertCodeBlock"
                    class="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold border border-emerald-500/35 cursor-pointer"
                  >
                    + Code Block
                  </button>
                </div>
              </div>

              <!-- Toggle Scrivi / Anteprima -->
              <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  @click="editorMode = 'write'"
                  class="px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors"
                  :class="editorMode === 'write' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'"
                >
                  ✏️ Scrivi
                </button>
                <button
                  type="button"
                  @click="editorMode = 'preview'"
                  class="px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors"
                  :class="editorMode === 'preview' ? 'bg-sky-400 text-slate-950' : 'text-slate-400 hover:text-white'"
                >
                  👁️ Anteprima
                </button>
              </div>
            </div>

            <!-- Area Testo o Anteprima -->
            <textarea
              v-if="editorMode === 'write'"
              ref="textareaRef"
              v-model="content"
              rows="10"
              required
              placeholder="Condividi architetture, benchmark, snippet SQL/TS o domande tecniche con la community DKP..."
              class="w-full bg-transparent text-slate-100 p-4 text-sm font-mono outline-none resize-y leading-relaxed"
            ></textarea>

            <div
              v-else
              class="p-5 min-h-[240px] text-sm text-slate-200 leading-relaxed prose prose-invert max-w-none"
              v-html="renderedPreview || '<span class=\'text-slate-500 font-mono text-xs\'>Nessun contenuto da visualizzare in anteprima...</span>'"
            ></div>
          </div>

          <!-- TAGS & PROOF OF CODE -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <input
              v-model="tagsInput"
              type="text"
              aria-label="Tag separati da virgola"
              placeholder="Tag opzionali (es. pure-sql, nuxt4, cloud-run)"
              class="flex-1 bg-[#020420] border border-slate-800 focus:border-sky-400 text-white px-3.5 py-2 rounded-xl text-xs font-mono outline-none"
            />

            <label class="inline-flex items-center gap-2 text-xs font-mono text-purple-300 bg-purple-500/10 border border-purple-500/30 px-3.5 py-2 rounded-xl cursor-pointer select-none">
              <input v-model="enableProofOfCode" type="checkbox" class="accent-purple-400" />
              <span>🛡️ Genera Hash Proof-of-Code</span>
            </label>
          </div>

          <div v-if="errorMsg" role="alert" class="bg-rose-500/15 border border-rose-500/40 text-rose-300 px-4 py-2.5 rounded-xl text-xs font-mono font-bold">
            ⚠️ {{ errorMsg }}
          </div>

          <div class="flex justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              @click="emit('close')"
              class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 text-slate-950 font-mono font-black text-xs shadow-[0_0_20px_rgba(52,211,153,0.3)] cursor-pointer disabled:opacity-50"
            >
              {{ isSubmitting ? '⚡ Pubblicazione nel Kernel...' : '🚀 Pubblica su DKP Talks' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>