<!-- app/components/blog/DkpEditor.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
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

// --- NUOVO: Stato Zen Mode ---
const isZenMode = ref(false)

function toggleZenMode() {
  isZenMode.value = !isZenMode.value
  
  // Blocca lo scroll del body quando si è in Zen Mode (opzionale ma consigliato per evitare scorrimenti doppi)
  if (isZenMode.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

// Assicuriamoci di sbloccare il body se il componente viene distrutto
onUnmounted(() => {
  document.body.style.overflow = ''
})
// ------------------------------

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

// NUOVA FUNZIONE: Formattazione intelligente per le liste (singole o multiple)
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
    // Se l'utente ha selezionato più righe, le formattiamo tutte insieme!
    const lines = selectedText.split('\n')
    newText = lines.map((line, index) => {
      // Pulisce la riga se era già una lista, così non facciamo doppioni (es. "- - Ciao")
      const cleanLine = line.replace(/^(\s*)(\d+\.|-)\s+/, '$1')
      return type === 'number' ? `${index + 1}. ${cleanLine}` : `- ${cleanLine}`
    }).join('\n')
  } else {
    // Nessun testo selezionato: prepariamo la lista
    newText = type === 'number' ? '1. ' : '- '
  }

  content.value = `${before}${newText}${after}`
  syncToParent()

  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(start, start + newText.length)
  }, 0)
}

// NUOVA FUNZIONE: Autocompilazione liste quando si preme INVIO
function handleEnter(e: KeyboardEvent) {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const textBeforeCursor = content.value.substring(0, start)
  const lines = textBeforeCursor.split('\n')
  const lastLine = lines[lines.length - 1] // Prendiamo l'ultima riga scritta
  
  // Controlliamo con regex se l'ultima riga è una lista numerata o puntata
  const numberMatch = lastLine.match(/^(\s*)(\d+)\.\s+(.*)$/)
  const bulletMatch = lastLine.match(/^(\s*)-\s+(.*)$/)
  
  if (numberMatch || bulletMatch) {
    e.preventDefault() // Blocca l'invio standard
    
    const spaces = numberMatch ? numberMatch[1] : bulletMatch![1]
    const textContent = numberMatch ? numberMatch[3] : bulletMatch![2]
    
    // Se l'utente ha premuto Invio su una riga vuota, USCIAMO DALLA LISTA
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
    
    // Altrimenti, CONTINUIAMO LA LISTA in automatico
    let prefix = ''
    if (numberMatch) {
      const currentNum = parseInt(numberMatch[2], 10)
      prefix = `\n${spaces}${currentNum + 1}. ` // Incrementa il numero (es. da 1. a 2.)
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

const parsedContent = computed(() => {
  if (!content.value) return '<p class="preview-empty">Inizia a scrivere per vedere la preview in tempo reale...</p>'
  
  // 1. Escape base
  let html = content.value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  // 2. Ripristiniamo l'html custom
  html = html.replace(/&lt;div class='dkp-custom-html'&gt;/g, "<div class='dkp-custom-html'>")
  html = html.replace(/&lt;\/div&gt;/g, "</div>")

  // 3. Parser Tabelle
  html = html.replace(/^\|(.+)\|$/gm, (match, p1) => {
    const cells = p1.split('|').map(c => c.trim())
    if (cells.every(c => /^:?-+:?$/.test(c))) return '' 
    const rowHtml = cells.map(c => `<td>${c}</td>`).join('')
    return `<tr>${rowHtml}</tr>`
  })
  html = html.replace(/(<tr>.*?<\/tr>[\s\n\r]*)+/g, (match) => {
    const cleanRows = match.replace(/[\n\r]+/g, '') 
    return `<div class="dkp-table-wrapper"><table class="dkp-table"><tbody>${cleanRows}</tbody></table></div>`
  })

  // 4. Parser Blocchi Codice Avanzato (Rileva il linguaggio)
  // Cerca: ```linguaggio (opzionale) \n codice \n ```
  html = html.replace(/```([a-zA-Z0-9+#-]*)\r?\n([\s\S]*?)```/g, (match, lang, code) => {
    const languageClass = lang ? `language-${lang.toLowerCase()}` : 'language-none';
    const languageLabel = lang ? `<div class="dkp-code-header"><span>${lang}</span><button class="dkp-copy-btn">📋</button></div>` : '';
    return `<div class="dkp-code-wrapper">${languageLabel}<pre class="dkp-code-block ${languageClass}"><code class="${languageClass}">${code}</code></pre></div>`;
  });

  // 5. Inline Code (Parola nel quadrato) e Formattazione Base
  html = html
    .replace(/`([^`\n]+)`/g, '<code class="dkp-inline-code">$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
    .replace(/\*(.*?)\*/g, '<em>$1</em>') 
    .replace(/~~(.*?)~~/g, '<del>$1</del>') 
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="dkp-link" target="_blank">$1</a>') 

  // 6. Parser Titoli e Blockquote
  html = html
    .replace(/^# (.*?)\r?$/gm, '<h1 class="dkp-h1">$1</h1>')
    .replace(/^## (.*?)\r?$/gm, '<h2 class="dkp-h2">$1</h2>')
    .replace(/^### (.*?)\r?$/gm, '<h3 class="dkp-h3">$1</h3>')
    .replace(/^&gt; (.*?)\r?$/gm, '<blockquote class="dkp-quote">$1</blockquote>')
    .replace(/^---$/gm, '<hr class="dkp-hr" />')

  // 7. Parser Liste (Livello 1 e Livello 2)
  // Prima processiamo il livello 2 (spazio + punto)
  html = html.replace(/^[ \t]+- (.*?)\r?$/gm, '<li class="dkp-li-nested">$1</li>')
  html = html.replace(/^[ \t]+[0-9]+\. (.*?)\r?$/gm, '<li class="dkp-li-nested dkp-li-num">$1</li>')
  
  // Poi il livello 1
  html = html.replace(/^- (.*?)\r?$/gm, '<ul><li class="dkp-li-main">$1</li></ul>')
  html = html.replace(/^[0-9]+\. (.*?)\r?$/gm, '<ol><li class="dkp-li-main">$1</li></ol>')
  
  // Uniamo liste contigue per evitare ul/ul multipli (anche se ci sono nested in mezzo)
  html = html.replace(/<\/ul>\s*(<li class="dkp-li-nested[^>]*>.*?<\/li>\s*)*<ul>/g, (match) => {
      // Togliamo i tag di chiusura/apertura ul e lasciamo gli li interni
      return match.replace(/<\/ul>\s*/, '').replace(/<ul>/, '');
  });
  html = html.replace(/<\/ol>\s*(<li class="dkp-li-nested[^>]*>.*?<\/li>\s*)*<ol>/g, (match) => {
      return match.replace(/<\/ol>\s*/, '').replace(/<ol>/, '');
  });

  // 8. Gestione Finale degli "A Capo"
  let lines = html.split(/\r?\n/);
  let parsedHtml = '';
  let inCodeBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
     let line = lines[i];
     
     if (line.includes('<div class="dkp-code-wrapper">')) inCodeBlock = true;
     if (line.includes('</div>') && inCodeBlock && !line.includes('<div class="dkp-code-header">')) inCodeBlock = false;

     if (inCodeBlock || /^<(h[1-6]|pre|div|table|ul|ol|blockquote|hr|li)/.test(line.trim())) {
        parsedHtml += line + '\n'; // Manteniamo i \n originali nei blocchi di codice
     } else if (line.trim() === '' || /^<\/(div|table|ul|ol|blockquote)>/.test(line.trim())) {
         parsedHtml += line + '\n';
     } else {
        parsedHtml += line + (i < lines.length - 1 ? '<br />' : '');
     }
  }

  parsedHtml = parsedHtml
      .replace(/(<\/h[1-6]>)<br \/>/g, '$1') 
      .replace(/(<\/pre>)<br \/>/g, '$1')
      .replace(/(<\/div>)<br \/>/g, '$1');

  return parsedHtml
})

// === SUPER-TRIGGER PER PRISM ===
// Guarda sia i cambiamenti del testo, sia i cambi di Tab!
watch([parsedContent, activeTab], async () => {
  await nextTick();
  if (typeof window !== 'undefined' && window.Prism) {
    window.Prism.highlightAll();
  }
});

// Assicuriamoci che parta anche appena il componente viene caricato
onMounted(async () => {
  await nextTick();
  if (typeof window !== 'undefined' && window.Prism) {
    window.Prism.highlightAll();
  }
});
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

    <!-- Area Markdown & Preview (Con classe condizionale per Zen Mode) -->
    <div :class="['editor-body-box', { 'zen-mode-active': isZenMode }]">
      
      <!-- Toolbar Estesa -->
      <div class="toolbar-bar">
        
        <!-- Controlli Tab -->
        <div class="tab-switch-group">
          <button 
            type="button"
            @click="activeTab = 'write'" 
            :class="['tab-toggle-btn', activeTab === 'write' ? 'active' : '']"
          >
            ✏️ Editor
          </button>
          <button 
            type="button"
            @click="activeTab = 'preview'" 
            :class="['tab-toggle-btn', activeTab === 'preview' ? 'active' : '']"
          >
            👁️ Preview
          </button>
        </div>

        <!-- Bottoni Formattazione -->
        <div v-show="activeTab === 'write'" class="formatting-tools">
          
          <div class="tool-group">
            <button type="button" @click="insertFormatting('# ')" class="tool-icon-btn" title="Titolo 1">H1</button>
            <button type="button" @click="insertFormatting('## ')" class="tool-icon-btn" title="Titolo 2">H2</button>
            <button type="button" @click="insertFormatting('### ')" class="tool-icon-btn" title="Titolo 3">H3</button>
          </div>
          
          <div class="tool-divider"></div>
          
          <div class="tool-group">
            <button type="button" @click="insertFormatting('**', '**')" class="tool-icon-btn font-bold" title="Grassetto (Ctrl+B)">B</button>
            <button type="button" @click="insertFormatting('*', '*')" class="tool-icon-btn italic" title="Corsivo (Ctrl+I)">I</button>
            <button type="button" @click="insertFormatting('~~', '~~')" class="tool-icon-btn strikethrough" title="Barrato">S</button>
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
            <button type="button" @click="insertFormatting('\n| Intestazione 1 | Intestazione 2 |\n|---|---|\n| Cella 1 | Cella 2 |\n', '')" class="tool-icon-btn text-emerald-400" title="Inserisci Tabella">⊞</button>
            <button type="button" @click="insertFormatting('\n<div class=\'dkp-custom-html\'>\n  ', '\n</div>\n')" class="tool-icon-btn text-emerald-400" title="Inserisci Tag HTML">&lt;/&gt;</button>
          </div>

          <div class="tool-divider"></div>

          <div class="tool-group">
            <button type="button" @click="insertFormatting('`', '`')" class="tool-icon-btn code-font" title="Codice Inline">`</button>
            <button type="button" @click="insertFormatting('\n```\n', '\n```\n')" class="tool-icon-btn code-font" title="Blocco Codice">{ }</button>
          <!-- TASTO ZEN MODE -->
            <button type="button" @click="toggleZenMode" :class="['tool-icon-btn text-emerald-400', { 'text-emerald-400': isZenMode }]" :title="isZenMode ? 'Esci da Zen Mode' : 'Zen Mode (Fullscreen)'"> {{ isZenMode ? '↙️' : '🗖' }}</button>
          </div>
        </div>
      </div>

      <!-- Textarea Markdown (Altezza riportata a valori normali) -->
      <div v-show="activeTab === 'write'" class="textarea-container">
        <textarea 
          ref="textareaRef"
          v-model="content" 
          class="markdown-textarea"
          placeholder="Inizia a scrivere il tuo articolo professionale qui..."
          @keydown.enter="handleEnter"
        ></textarea>
      </div>

      <!-- Area Live Preview (Altezza riportata a valori normali) -->
      <div v-show="activeTab === 'preview'" class="preview-container">
        <div class="dkp-preview-content" v-html="parsedContent"></div>
      </div>
      
    </div>
  </div>
</template>

<style scoped>

/* --- INLINE CODE (Parola nel quadrato) --- */
:deep(.dkp-inline-code) { 
  background-color: rgba(30, 41, 59, 0.8); /* Colore scuro stile terminale */
  color: #e2e8f0; /* Testo chiaro */
  padding: 0.2rem 0.4rem; 
  border-radius: 6px; 
  font-family: 'Fira Code', Consolas, monospace; 
  font-size: 0.85rem; 
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* --- LISTE E NIDIFICAZIONI --- */
:deep(.dkp-preview-content ul), :deep(.dkp-preview-content ol) { 
  padding-left: 1.5rem; 
  margin: 0.8rem 0; 
  color: #cbd5e1;
}
:deep(.dkp-preview-content ul) { list-style-type: none; }
:deep(.dkp-preview-content ol) { list-style-type: decimal; }

/* Lista Principale (Cerchio vuoto o normale) */
:deep(.dkp-li-main) { 
  margin-bottom: 0.4rem; 
  position: relative;
}
:deep(ul > .dkp-li-main::before) {
  content: '○'; /* Cerchio vuoto stile DKP */
  color: #38bdf8;
  position: absolute;
  left: -1.2rem;
  top: 0;
  font-weight: bold;
}

/* Lista Nidificata (Spazio + Punto) */
:deep(.dkp-li-nested) { 
  margin-left: 1.5rem; /* Rientro per la nidificazione */
  margin-bottom: 0.3rem; 
  color: #94a3b8; /* Colore leggermente più tenue */
  position: relative;
}
:deep(ul > .dkp-li-nested:not(.dkp-li-num)::before) {
  content: '▪'; /* Quadratino o trattino per il sub-elenco */
  color: #00dc82;
  position: absolute;
  left: -1.2rem;
  top: 0;
}

/* --- BLOCCHI DI CODICE PRO (Con Header) --- */
:deep(.dkp-code-wrapper) {
  background: #0d1117; /* Sfondo scuro github-style */
  border: 1px solid #1e293b;
  border-radius: 8px;
  overflow: hidden;
  margin: 1.2rem 0;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
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
:deep(.dkp-copy-btn:hover) {
  color: #00dc82;
}

:deep(.dkp-code-block) { 
  padding: 1rem; 
  margin: 0;
  overflow-x: auto; 
}
:deep(.dkp-code-block code) {
  font-family: 'Fira Code', 'Courier New', Courier, monospace; 
  color: #c9d1d9; /* Testo default chiaro */
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Basic Syntax Highlighting Fallback (Se non usi librerie esterne) */
:deep(.dkp-code-block code span.keyword) { color: #ff7b72; }
:deep(.dkp-code-block code span.string) { color: #a5d6ff; }
:deep(.dkp-code-block code span.function) { color: #d2a8ff; }
:deep(.dkp-code-block code span.comment) { color: #8b949e; font-style: italic; }

/* WRAPPER PRINCIPALE CON SCROLL (Abbassato il max-height per far vedere i bottoni inferiori) */
.dkp-editor-wrapper { 
  display: flex; 
  flex-direction: column; 
  gap: 1rem; 
  width: 100%; 
  max-height: 67vh; /* Ridotto per mostrare chiaramente pulsanti e badge sotto */
  overflow-y: auto; 
  padding-right: 10px; 
  box-sizing: border-box;
}

.editor-fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
@media (max-width: 650px) { .editor-fields-grid { grid-template-columns: 1fr; } }
.field-group { display: flex; flex-direction: column; gap: 0.4rem; }
.field-group.full-width { grid-column: 1 / -1; }
.field-label { font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; }

.dkp-input-element { background: #020420; border: 1px solid #1e293b; color: #ffffff; padding: 0.65rem 0.85rem; border-radius: 6px; font-size: 0.88rem; outline: none; width: 100%; box-sizing: border-box; transition: border-color 0.2s; }
.dkp-input-element:focus { border-color: #00dc82; }

/* 
  BLOCCO EDITOR (Stato Normale)
*/
.editor-body-box { 
  border: 1px solid #1e293b; 
  border-radius: 8px; 
  overflow: hidden; 
  background: #020420;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease; /* Transizione morbida per l'apertura Zen Mode */
}

/* 
  🚀 ZEN MODE ATTIVA (Fullscreen)
  Sovrascrive lo stile del box per farlo diventare a tutto schermo
*/
.zen-mode-active {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999; /* Sopra tutto il resto (navbar, modali, badge) */
  border-radius: 0;
  border: none;
  background: #050814; /* Sfondo un po' più scuro e "focus" */
}

/* TOOLBAR */
.toolbar-bar { 
  display: flex; 
  flex-direction: column; 
  background: #0b1120; 
  border-bottom: 1px solid #1e293b; 
}
@media (min-width: 768px) {
  .toolbar-bar {
    flex-direction: row; 
    justify-content: space-between;
    padding: 0.3rem 0.4rem;
  }
}

.tab-switch-group { 
  display: flex; 
  gap: 0.2rem; 
  padding: 0.3rem; 
  background: #020420; 
  border-bottom: 1px solid #1e293b;
}
@media (min-width: 768px) {
  .tab-switch-group { border-bottom: none; padding: 0; background: transparent; }
}

.tab-toggle-btn { 
  background: transparent; 
  border: 1px solid transparent; 
  color: #64748b; 
  padding: 0.3rem 0.6rem; 
  border-radius: 6px; 
  font-size: 0.75rem; 
  font-weight: 700; 
  cursor: pointer; 
  transition: all 0.2s ease; 
  text-transform: uppercase;
}
.tab-toggle-btn:hover { color: #cbd5e1; }
.tab-toggle-btn.active { background: #1e293b; color: #00dc82; border: 1px solid #334155; }

/* GRUPPI DI STRUMENTI */
.formatting-tools { 
  display: flex; 
  flex-wrap: wrap; 
  align-items: center; 
  padding: 0.3rem;
  gap: 0.15rem;
}

.tool-group {
  display: flex;
  gap: 0.1rem; 
  background: #020420;
  padding: 0.15rem;
  border-radius: 6px;
  border: 1px solid #1e293b;
}

.tool-divider { width: 1px; height: 16px; background: #334155; margin: 0 0.15rem; }

/* PULSANTI PRO */
.tool-icon-btn { 
  background: transparent; 
  border: 1px solid transparent; 
  color: #94a3b8; 
  min-width: 22px; 
  height: 26px; 
  padding: 0 0.25rem; 
  border-radius: 4px; 
  font-size: 0.75rem; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  transition: all 0.1s ease; 
}
.tool-icon-btn:hover { background: #1e293b; color: #e2e8f0; }
.tool-icon-btn:active { background: rgba(0, 220, 130, 0.2); color: #00dc82; transform: scale(0.95); }
.tool-icon-btn.text-emerald-400 { color: #00dc82; } /* Per evidenziare quando è attivo */

.tool-icon-btn.font-bold { font-weight: 900; }
.tool-icon-btn.italic { font-style: italic; font-family: serif;}
.tool-icon-btn.strikethrough { text-decoration: line-through; }
.tool-icon-btn.code-font { font-family: monospace; font-weight: bold; }
.tool-icon-btn.symbol-btn { font-size: 0.85rem; font-weight: 800; }

/* 
  CONTENITORI TESTO/PREVIEW 
  Stato Normale: 250px per non nascondere i bottoni
*/
.textarea-container, .preview-container {
  height: 250px; 
  overflow-y: auto; 
  box-sizing: border-box;
}

/* 
  CONTENITORI TESTO/PREVIEW (Zen Mode Attiva)
  Prendono tutta l'altezza rimanente (100vh - toolbar)
*/
.zen-mode-active .textarea-container, 
.zen-mode-active .preview-container {
  height: calc(100vh - 45px); /* Calcola l'altezza togliendo lo spazio della toolbar (circa 45px) */
}
/* Allarghiamo il testo al centro in Zen Mode per renderlo più leggibile e simile a un foglio */
.zen-mode-active .markdown-textarea,
.zen-mode-active .dkp-preview-content {
  max-width: 800px;
  margin: 0 auto;
}


.preview-container { padding: 1.25rem; background: #050814; }
.markdown-textarea { 
  width: 100%; height: 100%; background: transparent; color: #f8fafc; padding: 1.25rem; 
  border: none; outline: none; resize: none; font-family: monospace; font-size: 0.9rem; 
  line-height: 1.7; box-sizing: border-box; overflow: hidden; 
}

.preview-empty { color: #64748b; font-style: italic; }

/* STILI PREVIEW MARKDOWN */
:deep(.dkp-h1) { font-size: 1.8rem; font-weight: 900; color: #ffffff; margin-top: 1.2rem; margin-bottom: 0.6rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.3rem;}
:deep(.dkp-h2) { font-size: 1.4rem; font-weight: 800; color: #ffffff; margin-top: 1rem; margin-bottom: 0.5rem; }
:deep(.dkp-h3) { font-size: 1.1rem; font-weight: 700; color: #00dc82; margin-top: 0.8rem; margin-bottom: 0.4rem; }
:deep(.dkp-quote) { border-left: 3px solid #00dc82; padding-left: 0.8rem; color: #94a3b8; font-style: italic; margin: 0.8rem 0; background: rgba(0, 220, 130, 0.05); padding-top: 0.2rem; padding-bottom: 0.2rem;}
:deep(.dkp-inline-code) { background: #1e293b; color: #38bdf8; padding: 0.15rem 0.4rem; border-radius: 4px; font-family: monospace; font-size: 0.82rem; }
:deep(.dkp-code-block) { background: #020420; border: 1px solid #1e293b; padding: 0.8rem; border-radius: 6px; font-family: monospace; color: #e2e8f0; overflow-x: auto; margin: 0.8rem 0; }
:deep(.dkp-link) { color: #38bdf8; text-decoration: underline; text-underline-offset: 2px;}
:deep(.dkp-link:hover) { color: #00dc82;}
:deep(.dkp-hr) { border: none; height: 1px; background-color: #334155; margin: 1.5rem 0; }

:deep(.dkp-preview-content ul) { padding-left: 1.5rem; margin: 0.8rem 0; list-style-type: disc; color: #cbd5e1;}
:deep(.dkp-preview-content ol) { padding-left: 1.5rem; margin: 0.8rem 0; color: #cbd5e1;}
:deep(.dkp-preview-content li) { margin-bottom: 0.3rem; }

:deep(.dkp-table-wrapper) { overflow-x: auto; margin: 1rem 0; border-radius: 8px; border: 1px solid #1e293b; }
:deep(.dkp-table) { width: 100%; border-collapse: collapse; text-align: left; background: #090d16; font-size: 0.85rem;}
:deep(.dkp-table td) { padding: 0.75rem 1rem; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
:deep(.dkp-table tr:first-child td) { background: #020420; color: #00dc82; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;}
:deep(.dkp-table tr:last-child td) { border-bottom: none; }
</style>