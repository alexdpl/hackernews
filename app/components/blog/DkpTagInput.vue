<!-- app/components/blog/DkpTagInput.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string[]
  extraTags?: string[]
  placeholder?: string
}>(), {
  modelValue: () => [],
  extraTags: () => [],
  placeholder: 'Es. pure-sql, nuxt-4, blockchain-vault, security (digita per suggerimenti)...'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const inputTag = ref('')
const isFocused = ref(false)

const CURATED_TECH_TAGS: string[] = [
  'pure-sql', 'blockchain-vault', 'sha-256', 'merkle-tree', 'proof-of-code', 'audit-log',
  'nuxt-4', 'vue-3', 'typescript', 'javascript', 'nitro', 'vite', 'tailwind-css', 'ssr',
  'postgresql', 'neon-db', 'sql', 'database', 'indexing', 'query-tuning', 'migrations',
  'sentinel-ai', 'ai-nexus', 'llm', 'rag', 'ollama', 'qdrant', 'embeddings', 'agents',
  'linux', 'kernel', 'rust', 'go', 'python', 'c', 'cpp', 'bash', 'zsh', 'powershell',
  'docker', 'kubernetes', 'devops', 'devsecops', 'ci-cd', 'github-actions', 'gcp', 'cloud-run',
  'security', 'zero-trust', 'owasp', 'cryptography', 'auth', 'jwt', 'rate-limiting', 'waf',
  'prismjs', 'markdown', 'rich-editor', 'ui-ux', 'accessibility', 'seo', 'schema-org',
  'api', 'rest-api', 'webhooks', 'sdk', 'performance', 'caching', 'observability', 'logging',
  'open-source', 'architecture', 'microservices', 'monolith', 'testing', 'debugging', 'git'
]

const globalTags = ref<string[]>([...CURATED_TECH_TAGS])

function normalizeTag(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
}

function mergeTags(incoming: unknown[]) {
  const existingSet = new Set(globalTags.value.map((t) => normalizeTag(t)))
  const merged = [...globalTags.value]

  for (const item of incoming || []) {
    if (typeof item === 'string') {
      const clean = normalizeTag(item)
      if (clean && !existingSet.has(clean)) {
        existingSet.add(clean)
        merged.push(clean)
      }
    } else if (item && typeof item === 'object') {
      const candidate = normalizeTag((item as any).name || (item as any).tag || (item as any).slug || '')
      if (candidate && !existingSet.has(candidate)) {
        existingSet.add(candidate)
        merged.push(candidate)
      }
    }
  }

  globalTags.value = merged
}

onMounted(async () => {
  if (props.extraTags?.length) {
    mergeTags(props.extraTags)
  }

  // 1. Tag dal blog
  try {
    const blogRes: any = await $fetch('/api/blog/tags')
    const blogData = blogRes?.success ? blogRes.data : (Array.isArray(blogRes) ? blogRes : [])
    if (Array.isArray(blogData) && blogData.length > 0) {
      mergeTags(blogData)
    }
  } catch {
    // Fallback silenzioso
  }

  // 2. Popolamento autosuggest dai tag esistenti nei thread dei Nodes
  try {
    const postsRes: any = await $fetch('/api/nodes/posts', {
      query: { limit: 100 }
    })
    const postsList = Array.isArray(postsRes?.posts)
      ? postsRes.posts
      : (Array.isArray(postsRes?.data) ? postsRes.data : [])

    const extractedFromThreads: string[] = []
    for (const post of postsList) {
      if (Array.isArray(post?.tags)) {
        extractedFromThreads.push(...post.tags)
      } else if (typeof post?.tags === 'string' && post.tags.trim()) {
        extractedFromThreads.push(...post.tags.split(','))
      }
    }

    if (extractedFromThreads.length > 0) {
      mergeTags(extractedFromThreads)
    }
  } catch {
    // Fallback silenzioso
  }
})

const normalizedSelectedSet = computed(() => {
  return new Set((props.modelValue || []).map((t) => normalizeTag(t)))
})

const suggestedTags = computed(() => {
  const query = normalizeTag(inputTag.value)
  return globalTags.value
    .filter((t) => {
      const norm = normalizeTag(t)
      if (!norm || normalizedSelectedSet.value.has(norm)) return false
      return !query || norm.includes(query)
    })
    .slice(0, 10)
})

function handleBlur() {
  setTimeout(() => {
    isFocused.value = false
  }, 220)
}

function addTag(tagToAdd?: string) {
  const raw = tagToAdd ?? inputTag.value
  const parts = String(raw)
    .split(/[,;]+/)
    .map((t) => normalizeTag(t))
    .filter(Boolean)

  const updated = [...(props.modelValue || [])]
  const seen = new Set(updated.map((t) => normalizeTag(t)))

  for (const part of parts) {
    if (!seen.has(part)) {
      seen.add(part)
      updated.push(part)
    }
  }

  emit('update:modelValue', updated)
  inputTag.value = ''
}

function removeTag(index: number) {
  const updated = [...(props.modelValue || [])]
  updated.splice(index, 1)
  emit('update:modelValue', updated)
}
</script>

<template>
  <div class="tag-input-container">
    <div v-if="modelValue && modelValue.length > 0" class="tags-pills-wrap">
      <span v-for="(tag, idx) in modelValue" :key="`${tag}-${idx}`" class="tag-pill">
        #{{ normalizeTag(tag) }}
        <button type="button" @click="removeTag(idx)" class="tag-remove-btn" aria-label="Rimuovi tag">&times;</button>
      </span>
    </div>

    <div class="input-action-row">
      <input
        v-model="inputTag"
        type="text"
        class="dkp-input-custom"
        :placeholder="placeholder"
        @keydown.enter.prevent="addTag()"
        @keydown.,.prevent="addTag()"
        @focus="isFocused = true"
        @blur="handleBlur"
      />
      <button type="button" @click="addTag()" class="dkp-btn-tag-add">
        + Aggiungi
      </button>
    </div>

    <div v-if="isFocused && suggestedTags.length > 0" class="suggest-dropdown">
      <div class="suggest-header">Tag Suggeriti (Thread &amp; Ecosistema DKP)</div>
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
.tag-pill { display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(56, 189, 248, 0.12); color: #67e8f9; border: 1px solid rgba(56, 189, 248, 0.35); padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.78rem; font-weight: 700; }
.tag-remove-btn { background: transparent; border: none; color: #f87171; font-weight: 900; cursor: pointer; padding: 0; font-size: 0.9rem; line-height: 1; }
.input-action-row { display: flex; gap: 0.5rem; }
.dkp-input-custom { flex: 1; background: #020420; border: 1px solid #1e293b; color: #ffffff; padding: 0.65rem 0.85rem; border-radius: 6px; font-size: 0.88rem; outline: none; }
.dkp-input-custom:focus { border-color: #22d3ee; }
.dkp-btn-tag-add { background: #081224; color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); padding: 0.65rem 1rem; border-radius: 6px; font-size: 0.8rem; font-weight: 800; cursor: pointer; white-space: nowrap; }
.dkp-btn-tag-add:hover { background: rgba(56, 189, 248, 0.2); border-color: #22d3ee; color: #ffffff; }
.suggest-dropdown { position: absolute; left: 0; right: 0; top: 100%; margin-top: 0.25rem; background: #090d16; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.55); z-index: 100; max-height: 220px; overflow-y: auto; }
.suggest-header { padding: 0.4rem 0.75rem; font-size: 0.65rem; font-weight: 800; color: #7dd3fc; text-transform: uppercase; border-bottom: 1px solid #1e293b; }
.suggest-item { width: 100%; text-align: left; padding: 0.5rem 0.75rem; background: transparent; border: none; color: #cbd5e1; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.suggest-item:hover { background: rgba(34, 211, 238, 0.12); color: #67e8f9; }
.suggest-badge { font-size: 0.7rem; color: #64748b; }
</style>