<!-- app/components/blog/DkpEditor.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import DkpTagInput from '~/components/blog/DkpTagInput.vue'

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
const tags = ref<string[]>(props.modelValue?.tags || [])
const summary = ref(props.modelValue?.summary || '')
const content = ref(props.modelValue?.content || '')

const activeTab = ref<'write' | 'preview'>('write')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// Sincronizzazione Reattiva con il Padre
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    title.value = newVal.title || ''
    categoryName.value = newVal.category || ''
    subCategoryName.value = newVal.subCategory || ''
    tags.value = newVal.tags || []
    summary.value = newVal.summary || ''
    content.value = newVal.content || ''
  }
}, { deep: true })

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

watch([title, categoryName, subCategoryName, tags, summary, content], () => {
  syncToParent()
}, { deep: true })

const { data: catResponse } = await useFetch<any>('/api/blog/categories')

const categories = computed(() => {
  const raw = catResponse.value?.data || []
  return Array.isArray(raw) ? raw : []
})

const availableSubcategories = computed(() => {
  if (!categoryName.value) return []
  const cat = categories.value.find((c: any) => c.name === categoryName.value)
  return (cat?.subcategories || []).map((s: any) => typeof s === 'string' ? s : s.name)
})

function onCategoryChange() {
  const subs = availableSubcategories.value
  subCategoryName.value = subs.length > 0 ? subs[0] : ''
  syncToParent()
}

function insertFormatting(prefix: string, suffix: string = '') {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.value.substring(start, end)
  
  const before = content.value.substring(0, start)
  const after = content.value.substring(end)

  content.value = `${before}${prefix}${selectedText}${suffix}${after}`
  syncToParent()

  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(start + prefix.length, end + prefix.length)
  }, 0)
}

const parsedContent = computed(() => {
  if (!content.value) return '<p class="preview-empty">Inizia a scrivere per vedere la preview in tempo reale...</p>'
  
  let html = content.value
    .replace(/```([\s\S]*?)```/g, '<pre class="dkp-code-block"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="dkp-inline-code">$1</code>')
    .replace(/^# (.*$)/gim, '<h1 class="dkp-h1">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="dkp-h2">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="dkp-h3">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="dkp-link" target="_blank">$1</a>')
    .replace(/^> (.*$)/gim, '<blockquote class="dkp-quote">$1</blockquote>')
    .replace(/\n$/gim, '<br />')

  return html
})
</script>

<template>
  <div class="dkp-editor-wrapper">
    <!-- Form Campi Primari -->
    <div class="editor-fields-grid">
      <div class="field-group full-width">
        <label class="field-label">TITOLO DELL'ARTICOLO *</label>
        <input 
          v-model="title" 
          type="text" 
          class="dkp-input-element" 
          placeholder="Es: Architettura DKP v2.4-GOLD su Cloud GCP..."
        />
      </div>

      <div class="field-group">
        <label class="field-label">CATEGORIA *</label>
        <select v-model="categoryName" @change="onCategoryChange" class="dkp-input-element">
          <option value="" disabled>Seleziona Categoria</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.name">
            {{ cat.icon || '🏷️' }} {{ cat.name }}
          </option>
        </select>
      </div>

      <div class="field-group">
        <label class="field-label">SOTTOCATEGORIA</label>
        <select 
          v-model="subCategoryName" 
          class="dkp-input-element" 
          :disabled="!categoryName || availableSubcategories.length === 0"
        >
          <option value="">Nessuna / Generale</option>
          <option v-for="sub in availableSubcategories" :key="sub" :value="sub">
            {{ sub }}
          </option>
        </select>
      </div>
      
      <!-- COMPONENTE TAG AGGIUNTO ANCHE QUI -->
      <div class="field-group full-width">
        <label class="field-label">TAGS DELL'ARTICOLO (AUTOSUGGEST 600+)</label>
        <DkpTagInput v-model="tags" />
      </div>

      <div class="field-group full-width">
        <label class="field-label">BREVE RIASSUNTO (EXCERPT)</label>
        <textarea 
          v-model="summary" 
          rows="2" 
          class="dkp-input-element" 
          placeholder="Un breve riassunto per le card dell'articolo..."
        ></textarea>
      </div>
    </div>

    <!-- Area Markdown & Preview (Rimpicciolita) -->
    <div class="editor-body-box">
      <!-- Toolbar Estesa -->
      <div class="toolbar-bar">
        <div class="tab-switch-group">
          <button 
            type="button"
            @click="activeTab = 'write'" 
            :class="['tab-toggle-btn', activeTab === 'write' ? 'active' : '']"
          >
            ✏️ Scrivi
          </button>
          <button 
            type="button"
            @click="activeTab = 'preview'" 
            :class="['tab-toggle-btn', activeTab === 'preview' ? 'active' : '']"
          >
            👁️ Live Preview
          </button>
        </div>

        <!-- Bottoni Formattazione Toolbar -->
        <div v-show="activeTab === 'write'" class="formatting-tools">
          <button type="button" @click="insertFormatting('# ')" class="tool-icon-btn" title="Titolo 1">H1</button>
          <button type="button" @click="insertFormatting('## ')" class="tool-icon-btn" title="Titolo 2">H2</button>
          <button type="button" @click="insertFormatting('### ')" class="tool-icon-btn" title="Titolo 3">H3</button>
          <div class="tool-divider"></div>
          <button type="button" @click="insertFormatting('**', '**')" class="tool-icon-btn font-bold" title="Grassetto">B</button>
          <button type="button" @click="insertFormatting('*', '*')" class="tool-icon-btn italic" title="Corsivo">I</button>
          <div class="tool-divider"></div>
          <button type="button" @click="insertFormatting('[', '](url)')" class="tool-icon-btn" title="Link">🔗</button>
          <button type="button" @click="insertFormatting('> ')" class="tool-icon-btn" title="Citazione">”</button>
          <div class="tool-divider"></div>
          <button type="button" @click="insertFormatting('`', '`')" class="tool-icon-btn code-font" title="Codice Inline">`</button>
          <button type="button" @click="insertFormatting('```\n', '\n```')" class="tool-icon-btn code-font" title="Blocco Codice">{ }</button>
          <div class="tool-divider"></div>
          <button type="button" @click="insertFormatting('(', ')')" class="tool-icon-btn code-font" title="Parentesi Tonde">( )</button>
          <button type="button" @click="insertFormatting('[', ']')" class="tool-icon-btn code-font" title="Parentesi Quadre">[ ]</button>
        </div>
      </div>

      <!-- Textarea Markdown (Altezza Ridotta) -->
      <div v-show="activeTab === 'write'" class="textarea-container">
        <textarea 
          ref="textareaRef"
          v-model="content" 
          rows="6" 
          class="markdown-textarea"
          placeholder="Scrivi qui il contenuto in Markdown..."
        ></textarea>
      </div>

      <!-- Area Live Preview -->
      <div v-show="activeTab === 'preview'" class="preview-container">
        <div class="dkp-preview-content" v-html="parsedContent"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dkp-editor-wrapper { display: flex; flex-direction: column; gap: 1rem; width: 100%; }
.editor-fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
@media (max-width: 650px) { .editor-fields-grid { grid-template-columns: 1fr; } }
.field-group { display: flex; flex-direction: column; gap: 0.4rem; }
.field-group.full-width { grid-column: 1 / -1; }
.field-label { font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; }

.dkp-input-element { background: #020420; border: 1px solid #1e293b; color: #ffffff; padding: 0.65rem 0.85rem; border-radius: 6px; font-size: 0.88rem; outline: none; width: 100%; box-sizing: border-box; }
.dkp-input-element:focus { border-color: #00dc82; }

.editor-body-box { border: 1px solid #1e293b; border-radius: 8px; overflow: hidden; background: #020420; }
.toolbar-bar { display: flex; justify-content: space-between; align-items: center; background: #090d16; border-bottom: 1px solid #1e293b; padding: 0.5rem 0.75rem; flex-wrap: wrap; gap: 0.5rem;}
.tab-switch-group { display: flex; gap: 0.4rem; }
.tab-toggle-btn { background: transparent; border: 1px solid transparent; color: #94a3b8; padding: 0.35rem 0.8rem; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
.tab-toggle-btn.active { background: rgba(0, 220, 130, 0.15); border-color: #00dc82; color: #00dc82; }

.formatting-tools { display: flex; flex-wrap: wrap; gap: 0.25rem; align-items: center; }
.tool-divider { width: 1px; height: 20px; background: #1e293b; margin: 0 0.2rem; }
.tool-icon-btn { background: #1e293b; border: 1px solid #334155; color: #cbd5e1; min-width: 30px; height: 30px; padding: 0 0.3rem; border-radius: 4px; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease; }
.tool-icon-btn:hover { background: #00dc82; color: #020420; border-color: #00dc82; }
.tool-icon-btn.code-font { font-family: monospace; font-weight: bold; }

.markdown-textarea { width: 100%; background: transparent; color: #f8fafc; padding: 1rem; border: none; outline: none; resize: vertical; font-family: monospace; font-size: 0.88rem; line-height: 1.6; box-sizing: border-box; }
.preview-container { padding: 1.25rem; min-height: 150px; background: #050814; }
.preview-empty { color: #64748b; font-style: italic; }

/* STILI PREVIEW MARKDOWN */
:deep(.dkp-h1) { font-size: 1.8rem; font-weight: 900; color: #ffffff; margin-top: 1.2rem; margin-bottom: 0.6rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.3rem;}
:deep(.dkp-h2) { font-size: 1.4rem; font-weight: 800; color: #ffffff; margin-top: 1rem; margin-bottom: 0.5rem; }
:deep(.dkp-h3) { font-size: 1.1rem; font-weight: 700; color: #00dc82; margin-top: 0.8rem; margin-bottom: 0.4rem; }
:deep(.dkp-quote) { border-left: 3px solid #00dc82; padding-left: 0.8rem; color: #94a3b8; font-style: italic; margin: 0.8rem 0; }
:deep(.dkp-inline-code) { background: #1e293b; color: #38bdf8; padding: 0.15rem 0.4rem; border-radius: 4px; font-family: monospace; font-size: 0.82rem; }
:deep(.dkp-code-block) { background: #020420; border: 1px solid #1e293b; padding: 0.8rem; border-radius: 6px; font-family: monospace; color: #e2e8f0; overflow-x: auto; margin: 0.8rem 0; }
:deep(.dkp-link) { color: #38bdf8; text-decoration: underline; text-underline-offset: 2px;}
:deep(.dkp-link:hover) { color: #00dc82;}
</style>