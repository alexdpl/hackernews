<!-- app/components/blog/DkpEditor.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import DkpTagInput from '~/components/blog/DkpTagInput.vue'

// 🎨 PRISMJS: Importazione NATIVA ordinata per prevenire l'Errore 500
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'

import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-markup-templating'
import 'prismjs/components/prism-javadoclike'

import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-objectivec'
import 'prismjs/components/prism-opencl'
import 'prismjs/components/prism-scala'
import 'prismjs/components/prism-php'
import 'prismjs/components/prism-django'
import 'prismjs/components/prism-javadoc'
import 'prismjs/components/prism-xml-doc'

import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-jsonp'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-kotlin'
import 'prismjs/components/prism-swift'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-perl'
import 'prismjs/components/prism-docker'
import 'prismjs/components/prism-graphql'
import 'prismjs/components/prism-haskell'
import 'prismjs/components/prism-apacheconf'
import 'prismjs/components/prism-applescript'
import 'prismjs/components/prism-git'
import 'prismjs/components/prism-makefile'
import 'prismjs/components/prism-mongodb'
import 'prismjs/components/prism-neon'
import 'prismjs/components/prism-nginx'
import 'prismjs/components/prism-visual-basic'
import 'prismjs/components/prism-wiki'
import 'prismjs/components/prism-cobol'
import 'prismjs/components/prism-http'
import 'prismjs/components/prism-pascal'
import 'prismjs/components/prism-powershell'
import 'prismjs/components/prism-qsharp'
import 'prismjs/components/prism-rest'
import 'prismjs/components/prism-typoscript'

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
const tags = ref<string[]>(props.modelValue?.tags || [])
const summary = ref(props.modelValue?.summary || '')
const content = ref(props.modelValue?.content || '')

const activeTab = ref<'write' | 'preview'>('write')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isZenMode = ref(false)

function toggleZenMode() {
  isZenMode.value = !isZenMode.value
  if (isZenMode.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

onUnmounted(() => {
  document.body.style.overflow = ''
})

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

const { data: catResponse } = useFetch<any>('/api/blog/categories')

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

function insertList(type: 'bullet' | 'number') {
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
    newText = lines.map((line, index) => {
      const cleanLine = line.replace(/^(\s*)(\d+\.|-)\s+/, '$1')
      return type === 'number' ? `${index + 1}. ${cleanLine}` : `- ${cleanLine}`
    }).join('\n')
  } else {
    newText = type === 'number' ? '1. ' : '- '
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

function getPrismGrammar(lang: string) {
  if (!lang) return null
  const l = lang.toLowerCase()
  const aliases: Record<string, string> = { js: 'javascript', ts: 'typescript', py: 'python', sh: 'bash', bash: 'bash', yml: 'yaml', yaml: 'yaml', html: 'markup', xml: 'markup', json: 'json', css: 'css', cpp: 'cpp', c: 'c', cs: 'csharp', java: 'java', php: 'php', sql: 'sql' }
  const target = aliases[l] || l
  return Prism.languages[target] || Prism.languages[l] || null
}

// 🟢 FUNZIONE DEFINITIVA E BLINDATA AL COMPILATORE VUE/VITE
const parsedContent = computed(() => {
  if (!content.value) return '<p class="preview-empty">Inizia a scrivere per vedere la preview in tempo reale...' + '<' + '/p>'
  
  let rawContent = content.value;
  const codeBlocks: string[] = [];
  
  // 1. ISOLAMENTO BLOCCHI DI CODICE
  rawContent = rawContent.replace(/```([a-zA-Z0-9+#-]*)\r?\n([\s\S]*?)```/g, (match, lang, code) => {
    const index = codeBlocks.length;
    const cleanLang = lang ? lang.trim().toLowerCase() : '';
    const languageClass = cleanLang ? `language-${cleanLang}` : 'language-none';
    const languageLabel = cleanLang ? `<` + `div class="dkp-code-header"><span>${cleanLang}<` + `/span><button class="dkp-copy-btn" type="button">📋 Copia<` + `/button><` + `/div>` : '';
    
    let highlightedCode = ''
    const grammar = getPrismGrammar(cleanLang)
    
    if (grammar) {
      try {
        highlightedCode = Prism.highlight(code, grammar, cleanLang)
      } catch (err) {
        highlightedCode = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      }
    } else {
      highlightedCode = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    }
    
    codeBlocks.push(`<` + `div class="dkp-code-wrapper">${languageLabel}<pre class="dkp-code-block ${languageClass}"><code class="${languageClass}">${highlightedCode}<` + `/code><` + `/pre><` + `/div>`);
    
    return `__DKP_CODE_BLOCK_${index}__`;
  });

  // 2. PARSING MARKDOWN SICURO
  let html = rawContent
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  html = html.replace(/&lt;div class='dkp-custom-html'&gt;/g, "<" + "div class='dkp-custom-html'>")
  html = html.replace(/&lt;\/div&gt;/g, "<" + "/div>")

  html = html.replace(/^\|(.+)\|$/gm, (match, p1) => {
    const cells = p1.split('|').map(c => c.trim())
    if (cells.every(c => /^:?-+:?$/.test(c))) return '' 
    const rowHtml = cells.map(c => `<td>${c}<` + `/td>`).join('')
    return `<tr>${rowHtml}<` + `/tr>`
  })
  html = html.replace(new RegExp('(<tr>.*?<\\/tr>[\\s\\n\\r]*)+', 'g'), (match) => {
    const cleanRows = match.replace(/[\n\r]+/g, '') 
    return `<` + `div class="dkp-table-wrapper"><table class="dkp-table"><tbody>${cleanRows}<` + `/tbody><` + `/table><` + `/div>`
  })

  html = html
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="dkp-img" loading="lazy" />')
    .replace(/@[video]\(([^)]+)\)/g, '<' + 'div class="dkp-video-wrapper"><iframe src="$1" frameborder="0" allowfullscreen><' + '/iframe><' + '/div>')
    .replace(/==(.*?)==/g, '<mark class="dkp-highlight">$1<' + '/mark>')
    .replace(/\+\+(.*?)\+\+/g, '<u class="dkp-underline">$1<' + '/u>')
    .replace(/`([^`\n]+)`/g, '<code class="dkp-inline-code">$1<' + '/code>')
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

  // 3. GESTIONE A CAPO E PARAGRAFI
  let lines = html.split(/\r?\n/);
  let parsedHtml = '';
  
  for (let i = 0; i < lines.length; i++) {
     let line = lines[i];
     let trimmed = line.trim();
     
     // Ignoriamo i placeholder dei blocchi codice
     if (trimmed.includes('__DKP_CODE_BLOCK_')) {
        parsedHtml += line + '\n';
     } else if (/^<(h[1-6]|pre|div|table|ul|ol|blockquote|hr|li|img)/.test(trimmed) || /^<\/(div|table|ul|ol|blockquote)>/.test(trimmed)) {
        parsedHtml += line + '\n'; 
     } else if (trimmed === '') {
        parsedHtml += '<br />\n';
     } else {
        parsedHtml += line + (i < lines.length - 1 ? '<br />' : '');
     }
  }

  // 4. REINSERIMENTO SICURO DEI BLOCCHI DI CODICE 
  // FIX: L'uso di "() => block" impedisce ai simboli del dollaro ($) nel codice di rompere i tag HTML!
  codeBlocks.forEach((block, index) => {
    parsedHtml = parsedHtml.replace(new RegExp(`__DKP_CODE_BLOCK_${index}__(?:<br \\/>)?`, 'g'), () => block);
  });

  // 5. CLEANUP FINALE
  parsedHtml = parsedHtml
      .replace(new RegExp('(<\\/h[1-6]>)<br \\/>', 'g'), '$1') 
      .replace(new RegExp('(<\\/div>)<br \\/>', 'g'), '$1');

  return parsedHtml
})
</script>

<template>
  <div class="dkp-editor-wrapper">
    <!-- Area superiore compattata con scrollbar indipendente -->
    <div class="top-fields-scroll">
      <div class="editor-fields-grid">
        <div class="field-group full-width">
          <label class="field-label">TITOLO DELL'ARTICOLO *</label>
          <input v-model="title" type="text" class="dkp-input-element" placeholder="Es: Architettura DKP v2.4-GOLD su Cloud GCP..." />
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
          <select v-model="subCategoryName" class="dkp-input-element" :disabled="!categoryName || availableSubcategories.length === 0">
            <option value="">Nessuna / Generale</option>
            <option v-for="sub in availableSubcategories" :key="sub" :value="sub">{{ sub }}</option>
          </select>
        </div>
        
        <div class="field-group full-width">
          <label class="field-label">TAGS DELL'ARTICOLO (AUTOSUGGEST 600+)</label>
          <DkpTagInput v-model="tags"></DkpTagInput>
        </div>

        <div class="field-group full-width">
          <label class="field-label">BREVE RIASSUNTO (EXCERPT)</label>
          <textarea v-model="summary" rows="2" class="dkp-input-element" placeholder="Un breve riassunto per le card dell'articolo..."></textarea>
        </div>
      </div>
    </div>

    <!-- Area Editor -->
    <div :class="['editor-body-box', { 'zen-mode-active': isZenMode }]">
      <div class="toolbar-bar">
        <div class="tab-switch-group">
          <button type="button" @click="activeTab = 'write'" :class="['tab-toggle-btn', activeTab === 'write' ? 'active' : '']">✏️ Editor</button>
          <button type="button" @click="activeTab = 'preview'" :class="['tab-toggle-btn', activeTab === 'preview' ? 'active' : '']">👁️ Preview</button>
        </div>

        <div v-show="activeTab === 'write'" class="formatting-tools">
          <div class="tool-group">
            <button type="button" @click="insertFormatting('# ')" class="tool-icon-btn" title="Titolo 1">H1</button>
            <button type="button" @click="insertFormatting('## ')" class="tool-icon-btn" title="Titolo 2">H2</button>
            <button type="button" @click="insertFormatting('### ')" class="tool-icon-btn" title="Titolo 3">H3</button>
          </div>
          <div class="tool-divider"></div>
          <div class="tool-group">
            <button type="button" @click="insertFormatting('**', '**')" class="tool-icon-btn font-bold" title="Grassetto">B</button>
            <button type="button" @click="insertFormatting('*', '*')" class="tool-icon-btn italic" title="Corsivo">I</button>
            <button type="button" @click="insertFormatting('++', '++')" class="tool-icon-btn underline-btn" title="Sottolinea">U</button>
            <button type="button" @click="insertFormatting('~~', '~~')" class="tool-icon-btn strikethrough" title="Barrato">S</button>
            <button type="button" @click="insertFormatting('==', '==')" class="tool-icon-btn highlight-btn" title="Evidenzia Testo">🖍️</button>
          </div>
          <div class="tool-divider"></div>
          <div class="tool-group">
            <button type="button" @click="insertList('bullet')" class="tool-icon-btn symbol-btn" title="Elenco Puntato">•</button>
            <button type="button" @click="insertList('number')" class="tool-icon-btn symbol-btn" title="Elenco Numerato">1.</button>
            <button type="button" @click="insertFormatting('> ')" class="tool-icon-btn symbol-btn" title="Citazione">”</button>
            <button type="button" @click="insertFormatting('\n---\n')" class="tool-icon-btn symbol-btn" title="Linea Orizzontale">—</button>
          </div>
          <div class="tool-divider"></div>
          <div class="tool-group">
            <button type="button" @click="insertFormatting('[', '](url)')" class="tool-icon-btn" title="Inserisci Link">🔗</button>
            <button type="button" @click="insertFormatting('![Descrizione Immagine](', ')')" class="tool-icon-btn" title="Inserisci Immagine">🖼️</button>
            <button type="button" @click="insertFormatting('@[video](', ')')" class="tool-icon-btn" title="Embed Video">🎬</button>
            <button type="button" @click="insertFormatting('\n| Intestazione 1 | Intestazione 2 |\n|---|---|\n| Cella 1 | Cella 2 |\n', '')" class="tool-icon-btn text-emerald-400" title="Tabella">⊞</button>
          </div>
          <div class="tool-divider"></div>
          <div class="tool-group">
            <button type="button" @click="insertFormatting('`', '`')" class="tool-icon-btn code-font" title="Codice Inline">`</button>
            <button type="button" @click="insertFormatting('\n```\n', '\n```\n')" class="tool-icon-btn code-font" title="Blocco Codice">{ }</button>
            <button type="button" @click="toggleZenMode" :class="['tool-icon-btn text-emerald-400', { 'text-emerald-400': isZenMode }]" :title="isZenMode ? 'Esci da Zen Mode' : 'Zen Mode (Fullscreen)'"> {{ isZenMode ? '↙️' : '🗖' }}</button>
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'write'" class="textarea-container">
        <textarea ref="textareaRef" v-model="content" class="markdown-textarea" placeholder="Inizia a scrivere il tuo articolo qui..." @keydown.enter="handleEnter"></textarea>
      </div>
      
      <div v-show="activeTab === 'preview'" class="preview-container">
        <div class="dkp-preview-content" v-html="parsedContent"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 🟢 FORMATTAZIONE INLINE (Sconfigge il Reset CSS di Tailwind) */
:deep(.dkp-bold) { font-weight: 800; color: #ffffff; }
:deep(.dkp-italic) { font-style: italic; color: #e2e8f0; }
:deep(.dkp-strike) { text-decoration: line-through; color: #64748b; }
:deep(.dkp-inline-code) { background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 0.15rem 0.35rem; border-radius: 4px; font-family: 'Fira Code', monospace; font-size: 0.85em; }

/* 🟢 FORMATTAZIONE LISTE */
:deep(ul.dkp-main-list), :deep(ul.dkp-sub-list) { list-style-type: disc; margin: 0.2rem 0; padding-left: 1.5rem; }
:deep(ol.dkp-main-list), :deep(ol.dkp-sub-list) { list-style-type: decimal; margin: 0.2rem 0; padding-left: 1.5rem; }
:deep(ul.dkp-sub-list), :deep(ol.dkp-sub-list) { list-style-type: circle; margin: 0.2rem 0; padding-left: 2.2rem; border-left: 1px solid #1e293b; }
:deep(.dkp-li-main), :deep(.dkp-li-nested) { margin-bottom: 0.35rem; color: #cbd5e1; }

:deep(.dkp-img) { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; box-shadow: 0 4px 15px rgba(0,0,0,0.4); display: block; }
:deep(.dkp-video-wrapper) { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1rem 0; border-radius: 8px; }
:deep(.dkp-video-wrapper iframe) { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
:deep(.dkp-highlight) { background-color: rgba(0, 220, 130, 0.25); color: #f8fafc; padding: 0.1rem 0.3rem; border-radius: 4px; }
:deep(.dkp-underline) { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #38bdf8; text-decoration-thickness: 2px; }

:deep(.dkp-code-wrapper) { background: #0d1117; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden; margin: 1rem 0; box-shadow: 0 4px 10px rgba(0,0,0,0.4); }
:deep(.dkp-code-header) { background: #161b22; padding: 0.4rem 0.8rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; font-family: sans-serif; font-size: 0.75rem; font-weight: bold; color: #8b949e; text-transform: uppercase; }
:deep(.dkp-copy-btn) { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #8b949e; cursor: pointer; font-size: 0.72rem; padding: 0.2rem 0.5rem; border-radius: 4px; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.3rem; }
:deep(.dkp-copy-btn:hover) { background: rgba(0, 220, 130, 0.15); border-color: rgba(0, 220, 130, 0.4); color: #00dc82; }
:deep(.dkp-code-block) { padding: 0.85rem 1rem; margin: 0; overflow-x: auto; background: #080c14; }
:deep(.dkp-code-block code) { font-family: 'Fira Code', 'Courier New', Courier, monospace; font-size: 0.85rem; line-height: 1.6; color: #c9d1d9; }

:deep(.token.punctuation) { color: #cbd5e1; }
:deep(.token.property), :deep(.token.class-name), :deep(.token.constant), :deep(.token.symbol) { color: #f8c555; font-weight: 600; }
:deep(.token.string), :deep(.token.char), :deep(.token.attr-value) { color: #7ec699; }
:deep(.token.number), :deep(.token.boolean), :deep(.token.function) { color: #f08d49; font-weight: 600; }
:deep(.token.keyword), :deep(.token.atrule), :deep(.token.selector) { color: #cc99cd; font-weight: bold; }
:deep(.token.operator), :deep(.token.entity), :deep(.token.url) { color: #67cdcc; }
:deep(.token.comment) { color: #64748b; font-style: italic; }

.dkp-editor-wrapper { 
  display: flex; 
  flex-direction: column; 
  gap: 0.65rem; 
  width: 100%; 
  height: calc(100vh - 250px);
  min-height: 380px;
  max-height: 560px;
  overflow: hidden; 
  box-sizing: border-box;
}

.top-fields-scroll {
  max-height: 135px; 
  overflow-y: auto; 
  flex-shrink: 0;
  padding-right: 4px;
}
.top-fields-scroll::-webkit-scrollbar { width: 5px; }
.top-fields-scroll::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }

.editor-fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; }
@media (max-width: 650px) { .editor-fields-grid { grid-template-columns: 1fr; } }
.field-group { display: flex; flex-direction: column; gap: 0.25rem; }
.field-group.full-width { grid-column: 1 / -1; }
.field-label { font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; }

.dkp-input-element { background: #020420; border: 1px solid #1e293b; color: #ffffff; padding: 0.45rem 0.7rem; border-radius: 6px; font-size: 0.82rem; outline: none; width: 100%; box-sizing: border-box; transition: border-color 0.2s; }
.dkp-input-element:focus { border-color: #00dc82; }

.editor-body-box { 
  border: 1px solid #1e293b; 
  border-radius: 8px; 
  background: #020420;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.toolbar-bar { 
  display: flex; 
  flex-direction: column; 
  background: #0b1120; 
  border-bottom: 1px solid #1e293b; 
  flex-shrink: 0;
  z-index: 10;
}
@media (min-width: 768px) {
  .toolbar-bar { flex-direction: row; justify-content: flex-start; align-items: center; padding: 0.3rem 0.5rem; gap: 0.65rem; }
}

.textarea-container, .preview-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto; 
  box-sizing: border-box;
}

.preview-container { padding: 1rem; background: #050814; }
.markdown-textarea { 
  width: 100%; height: 100%; background: transparent; color: #f8fafc; padding: 1rem; 
  border: none; outline: none; resize: none; font-family: monospace; font-size: 0.88rem; 
  line-height: 1.6; box-sizing: border-box; 
}

.zen-mode-active {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  z-index: 999999 !important; border-radius: 0; border: none; background: #050814; 
  display: flex; flex-direction: column;
}
.zen-mode-active .toolbar-bar { flex-shrink: 0; position: sticky; top: 0; z-index: 100; width: 100%; }
.zen-mode-active .textarea-container, 
.zen-mode-active .preview-container { height: calc(100vh - 55px); overflow-y: auto; flex-grow: 1; }
.zen-mode-active .markdown-textarea,
.zen-mode-active .dkp-preview-content { max-width: 800px; margin: 0 auto; }

.tab-switch-group { display: flex; gap: 0.2rem; padding: 0.2rem; background: #020420; border-bottom: 1px solid #1e293b; flex-shrink: 0; }
@media (min-width: 768px) { .tab-switch-group { border-bottom: none; padding: 0; background: transparent; } }
.tab-toggle-btn { background: transparent; border: 1px solid transparent; color: #64748b; padding: 0.25rem 0.5rem; border-radius: 5px; font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease; text-transform: uppercase; }
.tab-toggle-btn:hover { color: #cbd5e1; }
.tab-toggle-btn.active { background: #1e293b; color: #00dc82; border: 1px solid #334155; }
.formatting-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem; padding: 0.2rem 0; }
.zen-mode-active .formatting-tools { flex-wrap: nowrap; }
.tool-group { display: flex; gap: 0.1rem; background: #020420; padding: 0.1rem; border-radius: 5px; border: 1px solid #1e293b; }
.tool-divider { width: 1px; height: 14px; background: #334155; margin: 0 0.1rem; }
.tool-icon-btn { background: transparent; border: 1px solid transparent; color: #94a3b8; min-width: 20px; height: 24px; padding: 0 0.2rem; border-radius: 4px; font-size: 0.72rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.1s ease; }
.tool-icon-btn:hover { background: #1e293b; color: #e2e8f0; }
.tool-icon-btn.text-emerald-400 { color: #00dc82; } 
.preview-empty { color: #64748b; font-style: italic; }

:deep(.dkp-h1) { font-size: 1.6rem; font-weight: 900; color: #ffffff; margin-top: 1rem; margin-bottom: 0.5rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.25rem;}
:deep(.dkp-h2) { font-size: 1.3rem; font-weight: 800; color: #ffffff; margin-top: 0.8rem; margin-bottom: 0.4rem; }
:deep(.dkp-h3) { font-size: 1rem; font-weight: 700; color: #00dc82; margin-top: 0.7rem; margin-bottom: 0.3rem; }
:deep(.dkp-quote) { border-left: 3px solid #00dc82; padding-left: 0.7rem; color: #94a3b8; font-style: italic; margin: 0.6rem 0; background: rgba(0, 220, 130, 0.05); }
:deep(.dkp-link) { color: #38bdf8; text-decoration: underline; text-underline-offset: 2px;}
:deep(.dkp-hr) { border: none; height: 1px; background-color: #334155; margin: 1.2rem 0; }
:deep(.dkp-table-wrapper) { overflow-x: auto; margin: 0.8rem 0; border-radius: 6px; border: 1px solid #1e293b; }
:deep(.dkp-table) { width: 100%; border-collapse: collapse; text-align: left; background: #090d16; font-size: 0.82rem;}
:deep(.dkp-table td) { padding: 0.6rem 0.85rem; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
</style>