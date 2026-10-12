<!-- app/components/blog/DkpTagInput.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits(['update:modelValue'])

const inputTag = ref('')
const isFocused = ref(false)
const globalTags = ref<string[]>([
  'Nuxt4', 'Nuxt3', 'Ollama', 'Qdrant', 'RAG', 'Python', 'Docker', 'Kubernetes', 
  'GCP', 'Security', 'Vault', 'TypeScript', 'Vue3', 'PostgreSQL', 'Drizzle', 'AI', 'LLM'
])

// Proviamo a caricare i tag dinamici dal database se l'endpoint esiste
onMounted(async () => {
  try {
    const res: any = await $fetch('/api/blog/tags')
    const data = res?.success ? res.data : (Array.isArray(res) ? res : [])
    if (data.length > 0) {
      globalTags.value = Array.from(new Set([...globalTags.value, ...data]))
    }
  } catch (e) {
    // Fallback sui tag predefiniti se l'endpoint non risponde
  }
})

const suggestedTags = computed(() => {
  const query = inputTag.value.toLowerCase().trim()
  return globalTags.value.filter(
    (t) => t.toLowerCase().includes(query) && !props.modelValue.includes(t)
  ).slice(0, 8)
})

function handleBlur() {
  setTimeout(() => {
    isFocused.value = false
  }, 250)
}

function addTag(tagToAdd?: string) {
  const raw = tagToAdd || inputTag.value
  const tagsList = raw.split(/[,;]+/).map(t => t.trim().replace(/^#/, '')).filter(Boolean)
  
  const updated = [...props.modelValue]
  for (const t of tagsList) {
    if (t && !updated.includes(t)) {
      updated.push(t)
    }
  }
  
  emit('update:modelValue', updated)
  inputTag.value = ''
  isFocused.value = false
}

function removeTag(index: number) {
  const updated = [...props.modelValue]
  updated.splice(index, 1)
  emit('update:modelValue', updated)
}
</script>

<template>
  <div class="tag-input-container">
    <!-- Tag Inseriti -->
    <div v-if="modelValue && modelValue.length > 0" class="tags-pills-wrap">
      <span v-for="(tag, idx) in modelValue" :key="idx" class="tag-pill">
        #{{ tag }}
        <button type="button" @click="removeTag(idx)" class="tag-remove-btn">×</button>
      </span>
    </div>

    <!-- Input e Tasto Aggiungi -->
    <div class="input-action-row">
      <input 
        v-model="inputTag" 
        type="text" 
        class="dkp-input-custom" 
        placeholder="Es. Nuxt4, Security, Ollama (digita per suggerimenti)..." 
        @keydown.enter.prevent="addTag()"
        @focus="isFocused = true"
        @blur="handleBlur"
      />
      <button type="button" @click="addTag()" class="dkp-btn-tag-add">
        + Aggiungi
      </button>
    </div>

    <!-- Dropdown Suggerimenti -->
    <div v-if="isFocused && suggestedTags.length > 0" class="suggest-dropdown">
      <div class="suggest-header">💡 Tag Disponibili (Autosuggest)</div>
      <button 
        v-for="suggest in suggestedTags" 
        :key="suggest" 
        type="button" 
        @mousedown.prevent="addTag(suggest)" 
        class="suggest-item"
      >
        <span>#{{ suggest }}</span>
        <span class="suggest-badge">+ Seleziona</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.tag-input-container { position: relative; display: flex; flex-direction: column; gap: 0.5rem; }
.tags-pills-wrap { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.tag-pill { display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(0, 220, 130, 0.12); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.78rem; font-weight: 700; }
.tag-remove-btn { background: transparent; border: none; color: #ef4444; font-weight: 900; cursor: pointer; padding: 0; font-size: 0.9rem; line-height: 1; }
.input-action-row { display: flex; gap: 0.5rem; }
.dkp-input-custom { flex: 1; background: #020420; border: 1px solid #1e293b; color: #ffffff; padding: 0.65rem 0.85rem; border-radius: 6px; font-size: 0.88rem; outline: none; }
.dkp-input-custom:focus { border-color: #00dc82; }
.dkp-btn-tag-add { background: #1e293b; color: #38bdf8; border: 1px solid #334155; padding: 0.65rem 1rem; border-radius: 6px; font-size: 0.8rem; font-weight: 800; cursor: pointer; white-space: nowrap; }
.dkp-btn-tag-add:hover { background: rgba(56, 189, 248, 0.2); border-color: #38bdf8; color: #ffffff; }
.suggest-dropdown { position: absolute; left: 0; right: 0; top: 100%; margin-top: 0.25rem; background: #090d16; border: 1px solid #1e293b; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 100; max-height: 200px; overflow-y: auto; }
.suggest-header { padding: 0.4rem 0.75rem; font-size: 0.65rem; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #1e293b; }
.suggest-item { width: 100%; text-align: left; padding: 0.5rem 0.75rem; background: transparent; border: none; color: #cbd5e1; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.suggest-item:hover { background: rgba(0, 220, 130, 0.1); color: #00dc82; }
.suggest-badge { font-size: 0.7rem; color: #64748b; }
</style>